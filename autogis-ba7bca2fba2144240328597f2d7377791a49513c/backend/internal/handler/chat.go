package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gmt061/autogis-backend/internal/domain"
	apperrors "github.com/gmt061/autogis-backend/internal/pkg/errors"
	"github.com/gmt061/autogis-backend/internal/realtime"
	"github.com/gmt061/autogis-backend/internal/usecase"
)

type ChatHandler struct {
	chatUseCase *usecase.ChatUseCase
	hub         *realtime.Hub
}

func NewChatHandler(chatUseCase *usecase.ChatUseCase, hub *realtime.Hub) *ChatHandler {
	return &ChatHandler{
		chatUseCase: chatUseCase,
		hub:         hub,
	}
}

func (h *ChatHandler) GetOrderChat(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return
	}

	orderID := c.Param("orderId")
	updatedMessages, err := h.chatUseCase.MarkMessagesAsRead(c.Request.Context(), orderID, userID.(string))
	if err == nil {
		chat, getErr := h.chatUseCase.GetOrderChat(c.Request.Context(), userID.(string), orderID)
		for _, msg := range updatedMessages {
			if getErr == nil && chat != nil && chat.Order != nil {
				h.hub.EmitMessageStatusUpdated(
					[]string{chat.Order.CustomerID, chat.Order.ProviderID},
					orderID,
					msg.ID,
					domain.ChatMessageStatusRead,
				)
			}
		}
	}

	resp, err := h.chatUseCase.GetOrderChat(c.Request.Context(), userID.(string), orderID)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			c.JSON(appErr.Status, appErr)
			return
		}
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServer)
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *ChatHandler) GetUnreadCounts(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return
	}

	counts, err := h.chatUseCase.GetUnreadCounts(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServer)
		return
	}

	c.JSON(http.StatusOK, counts)
}

func (h *ChatHandler) SendOrderMessage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return
	}

	orderID := c.Param("orderId")
	var req domain.SendOrderMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	msg, order, err := h.chatUseCase.SendOrderMessage(c.Request.Context(), userID.(string), orderID, req.Message)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			c.JSON(appErr.Status, appErr)
			return
		}
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServer)
		return
	}

	recipientID := order.CustomerID
	if recipientID == userID.(string) {
		recipientID = order.ProviderID
	}

	if h.hub.IsUserInOrderRoom(recipientID, orderID) {
		msg.Status = domain.ChatMessageStatusRead
		_ = h.chatUseCase.UpdateMessageStatus(c.Request.Context(), msg.ID, domain.ChatMessageStatusRead)
	} else if h.hub.IsUserOnline(recipientID) {
		msg.Status = domain.ChatMessageStatusDelivered
		_ = h.chatUseCase.UpdateMessageStatus(c.Request.Context(), msg.ID, domain.ChatMessageStatusDelivered)
	}

	userIDs := []string{order.CustomerID, order.ProviderID}
	h.hub.EmitNewOrderMessage(userIDs, orderID, msg)
	h.hub.EmitMessageStatusUpdated(userIDs, orderID, msg.ID, msg.Status)

	c.JSON(http.StatusCreated, msg)
}
