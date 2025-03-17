package s3

import "context"

type FileDataType struct {
	FileName string
	Data     []byte
}

type Client interface {
	CreateOne(ctx context.Context, file FileDataType) (string, error)
	GetOne(ctx context.Context, objectID string) (string, error)
	DeleteOne(ctx context.Context, objectID string) error
}
