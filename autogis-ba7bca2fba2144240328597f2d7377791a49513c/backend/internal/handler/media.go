package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/gmt061/autogis-backend/internal/domain"
	apperrors "github.com/gmt061/autogis-backend/internal/pkg/errors"
	"github.com/gmt061/autogis-backend/internal/usecase"
)

// MediaHandler handles all /api/v1/media/* endpoints.
type MediaHandler struct {
	uc        *usecase.MediaUseCase
	validator *validator.Validate
}

// NewMediaHandler creates a MediaHandler.
func NewMediaHandler(uc *usecase.MediaUseCase) *MediaHandler {
	return &MediaHandler{
		uc:        uc,
		validator: validator.New(),
	}
}

// CreateUploadIntent godoc
// POST /api/v1/media/upload-intent
// Validates the request, generates a pre-signed S3 PUT URL and persists the intent.
func (h *MediaHandler) CreateUploadIntent(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req domain.UploadIntentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректное тело запроса"})
		return
	}
	if err := h.validator.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации", "details": err.Error()})
		return
	}

	resp, err := h.uc.CreateUploadIntent(c.Request.Context(), userID, &req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

// ConfirmUpload godoc
// POST /api/v1/media/confirm-upload
// Verifies the object exists in S3 and enqueues the processing job.
func (h *MediaHandler) ConfirmUpload(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	var req domain.ConfirmUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректное тело запроса"})
		return
	}
	if err := h.validator.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка валидации", "details": err.Error()})
		return
	}

	resp, err := h.uc.ConfirmUpload(c.Request.Context(), userID, &req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetAsset godoc
// GET /api/v1/media/assets/:assetId
// Returns a single asset with URLs. Used for polling processing status.
func (h *MediaHandler) GetAsset(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	assetID := c.Param("assetId")
	resp, err := h.uc.GetAsset(c.Request.Context(), userID, assetID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetAssetsByEntity godoc
// GET /api/v1/media/:entityType/:entityId
// Lists all ready/processing assets for an entity. Требует аутентификации.
// Для приватных типов сущностей (object) доступ разрешён только владельцу.
func (h *MediaHandler) GetAssetsByEntity(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	entityType := c.Param("entityType")
	entityID := c.Param("entityId")

	resp, err := h.uc.GetAssetsByEntity(c.Request.Context(), userID, entityType, entityID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

// DeleteAsset godoc
// DELETE /api/v1/media/assets/:assetId
// Soft-deletes an asset. Hard delete happens asynchronously after 7 days.
func (h *MediaHandler) DeleteAsset(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		return
	}

	assetID := c.Param("assetId")
	if err := h.uc.DeleteAsset(c.Request.Context(), userID, assetID); err != nil {
		h.handleError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// ─── helpers ──────────────────────────────────────────────────────────────────

// getUserID extracts user_id from the Gin context (set by JWT middleware).
// Writes 401 and returns false if missing.
func getUserID(c *gin.Context) (string, bool) {
	v, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, apperrors.ErrUnauthorized)
		return "", false
	}
	return v.(string), true
}

func (h *MediaHandler) handleError(c *gin.Context, err error) {
	if appErr, ok := err.(*apperrors.AppError); ok {
		c.JSON(appErr.Status, appErr)
		return
	}
	c.JSON(http.StatusInternalServerError, apperrors.ErrInternalServer)
}
