package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gmt061/autogis-backend/internal/domain"
	apperrors "github.com/gmt061/autogis-backend/internal/pkg/errors"
	"github.com/gmt061/autogis-backend/internal/usecase"
)

type OrderHandler struct {
	orderUseCase *usecase.OrderUseCase
}

func NewOrderHandler(orderUseCase *usecase.OrderUseCase) *OrderHandler {
	return &OrderHandler{
		orderUseCase: orderUseCase,
	}
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return
	}

	var req domain.CreateOrderRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	resp, err := h.orderUseCase.CreateOrder(c.Request.Context(), userID.(string), &req)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			c.JSON(appErr.Status, appErr)
			return
		}
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServer)
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *OrderHandler) GetOrder(c *gin.Context) {
	id := c.Param("id")
	actorID, actorRole, ok := getActor(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return
	}

	resp, err := h.orderUseCase.GetOrder(c.Request.Context(), id, actorID, actorRole)
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

func (h *OrderHandler) GetCustomerOrders(c *gin.Context) {
	customerID := c.Param("customerId")
	if !ensureSelfOrAdmin(c, customerID) {
		return
	}

	resp, err := h.orderUseCase.GetCustomerOrders(c.Request.Context(), customerID)
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

func (h *OrderHandler) GetMyCustomerOrders(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return
	}

	resp, err := h.orderUseCase.GetCustomerOrders(c.Request.Context(), userID.(string))
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

func (h *OrderHandler) GetProviderOrders(c *gin.Context) {
	providerID := c.Param("providerId")
	if !ensureSelfOrAdmin(c, providerID) {
		return
	}

	resp, err := h.orderUseCase.GetProviderOrders(c.Request.Context(), providerID)
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

func (h *OrderHandler) GetMyProviderOrders(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return
	}

	resp, err := h.orderUseCase.GetProviderOrders(c.Request.Context(), userID.(string))
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

func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	actorID, actorRole, ok := getActor(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return
	}

	var req domain.UpdateOrderStatusRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	resp, err := h.orderUseCase.UpdateOrderStatus(c.Request.Context(), id, actorID, actorRole, &req)
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

func (h *OrderHandler) DeleteOrder(c *gin.Context) {
	id := c.Param("id")
	actorID, actorRole, ok := getActor(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return
	}

	err := h.orderUseCase.DeleteOrder(c.Request.Context(), id, actorID, actorRole)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			c.JSON(appErr.Status, appErr)
			return
		}
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServer)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// SearchHandler
type SearchHandler struct {
	searchUseCase       *usecase.SearchUseCase
	activityTypeUseCase *usecase.ActivityTypeUseCase
	reviewUseCase       *usecase.ReviewUseCase
}

func NewSearchHandler(
	searchUseCase *usecase.SearchUseCase,
	activityTypeUseCase *usecase.ActivityTypeUseCase,
	reviewUseCase *usecase.ReviewUseCase,
) *SearchHandler {
	return &SearchHandler{
		searchUseCase:       searchUseCase,
		activityTypeUseCase: activityTypeUseCase,
		reviewUseCase:       reviewUseCase,
	}
}

func (h *SearchHandler) FindCombinedProviders(c *gin.Context) {
	var filter domain.SearchFilter

	if err := c.ShouldBindJSON(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	resp, err := h.searchUseCase.FindCombinedProviders(c.Request.Context(), &filter)
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

func (h *SearchHandler) GetActivityTypes(c *gin.Context) {
	resp, err := h.activityTypeUseCase.GetActiveActivityTypes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServer)
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *SearchHandler) FindCombinedProvidersQuery(c *gin.Context) {
	// Parse query parameters
	latStr := c.Query("lat")
	lngStr := c.Query("lng")
	radiusStr := c.Query("radius")
	activityTypesStr := c.QueryArray("activityTypes")

	if latStr == "" || lngStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat and lng are required"})
		return
	}

	var lat, lng, radius float64
	var err error

	lat, err = strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lat"})
		return
	}
	if lat < -90 || lat > 90 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat must be between -90 and 90"})
		return
	}

	lng, err = strconv.ParseFloat(lngStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lng"})
		return
	}
	if lng < -180 || lng > 180 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lng must be between -180 and 180"})
		return
	}

	if radiusStr != "" {
		radius, err = strconv.ParseFloat(radiusStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid radius"})
			return
		}
	} else {
		radius = 10
	}
	if radius <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "radius must be greater than 0"})
		return
	}

	filter := &domain.SearchFilter{
		Lat:           lat,
		Lng:           lng,
		RadiusKm:      radius,
		ActivityTypes: activityTypesStr,
	}

	resp, err := h.searchUseCase.FindCombinedProviders(c.Request.Context(), filter)
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

func (h *SearchHandler) GetProviderByTypeAndID(c *gin.Context) {
	activityType := c.Param("activityType")
	id := c.Param("id")
	latStr := c.Query("lat")
	lngStr := c.Query("lng")

	var lat, lng *float64
	if latStr != "" && lngStr != "" {
		parsedLat, err := strconv.ParseFloat(latStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lat"})
			return
		}
		parsedLng, err := strconv.ParseFloat(lngStr, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lng"})
			return
		}
		lat = &parsedLat
		lng = &parsedLng
	}

	resp, err := h.searchUseCase.GetProviderByTypeAndID(
		c.Request.Context(),
		activityType,
		id,
		lat,
		lng,
	)
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

func (h *SearchHandler) CreateActivityType(c *gin.Context) {
	var req domain.CreateActivityTypeRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	resp, err := h.activityTypeUseCase.CreateActivityType(c.Request.Context(), &req)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			c.JSON(appErr.Status, appErr)
			return
		}
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServer)
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// ReviewHandler
type ReviewHandler struct {
	reviewUseCase *usecase.ReviewUseCase
}

func NewReviewHandler(reviewUseCase *usecase.ReviewUseCase) *ReviewHandler {
	return &ReviewHandler{
		reviewUseCase: reviewUseCase,
	}
}

func (h *ReviewHandler) CreateReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return
	}

	var req domain.CreateReviewRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	resp, err := h.reviewUseCase.CreateReview(c.Request.Context(), userID.(string), &req)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			c.JSON(appErr.Status, appErr)
			return
		}
		c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServer)
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *ReviewHandler) GetReviewsByToID(c *gin.Context) {
	toID := c.Param("toId")

	resp, err := h.reviewUseCase.GetReviewsByToID(c.Request.Context(), toID)
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
