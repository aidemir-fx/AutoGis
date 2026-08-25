package repository

import (
	"context"

	"github.com/gmt061/autogis-backend/internal/domain"
	"gorm.io/gorm"
)

type ChatMessageRepositoryImpl struct {
	db *gorm.DB
}

func NewChatMessageRepository(db *gorm.DB) ChatMessageRepository {
	return &ChatMessageRepositoryImpl{db: db}
}

func (r *ChatMessageRepositoryImpl) Create(ctx context.Context, message *domain.ChatMessage) error {
	return r.db.WithContext(ctx).Create(message).Error
}

func (r *ChatMessageRepositoryImpl) GetByOrderID(ctx context.Context, orderID string) ([]*domain.ChatMessage, error) {
	var messages []*domain.ChatMessage
	err := r.db.WithContext(ctx).
		Preload("Sender").
		Where("order_id = ?", orderID).
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}

func (r *ChatMessageRepositoryImpl) UpdateStatus(ctx context.Context, id string, status domain.ChatMessageStatus) error {
	return r.db.WithContext(ctx).
		Model(&domain.ChatMessage{}).
		Where("id = ?", id).
		Update("status", status).Error
}

func (r *ChatMessageRepositoryImpl) GetUnreadCountsByUser(ctx context.Context, userID string) ([]domain.UnreadOrderCount, error) {
	type row struct {
		OrderID string
		Count   int64
	}
	var rows []row
	err := r.db.WithContext(ctx).
		Model(&domain.ChatMessage{}).
		Select("chat_messages.order_id, COUNT(*) as count").
		Joins("JOIN orders ON orders.id = chat_messages.order_id").
		Where("(orders.customer_id = ? OR orders.provider_id = ?)", userID, userID).
		Where("chat_messages.sender_id != ?", userID).
		Where("chat_messages.status != ?", domain.ChatMessageStatusRead).
		Group("chat_messages.order_id").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make([]domain.UnreadOrderCount, 0, len(rows))
	for _, r := range rows {
		result = append(result, domain.UnreadOrderCount{OrderID: r.OrderID, Count: r.Count})
	}
	return result, nil
}

func (r *ChatMessageRepositoryImpl) UpdateStatusByOrderAndSender(
	ctx context.Context,
	orderID, senderID string,
	fromStatuses []domain.ChatMessageStatus,
	toStatus domain.ChatMessageStatus,
) ([]*domain.ChatMessage, error) {
	if len(fromStatuses) == 0 {
		return []*domain.ChatMessage{}, nil
	}

	var updated []*domain.ChatMessage
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.
			Model(&domain.ChatMessage{}).
			Where("order_id = ? AND sender_id = ? AND status IN ?", orderID, senderID, fromStatuses).
			Update("status", toStatus).Error; err != nil {
			return err
		}

		return tx.
			Preload("Sender").
			Where("order_id = ? AND sender_id = ? AND status = ?", orderID, senderID, toStatus).
			Order("created_at ASC").
			Find(&updated).Error
	})
	if err != nil {
		return nil, err
	}

	return updated, nil
}
