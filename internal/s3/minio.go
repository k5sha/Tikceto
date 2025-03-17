package s3

import (
	"bytes"
	"context"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"path/filepath"
	"time"
)

type minioClient struct {
	bucketName string
	client     *minio.Client
}

func NewMinioClient(endpoint, user, password, bucket string, ssl bool) (*minioClient, error) {
	ctx := context.Background()

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(user, password, ""),
		Secure: ssl,
	})
	if err != nil {
		return nil, err
	}

	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, err
	}
	if !exists {
		err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, err
		}
	}

	return &minioClient{
		client:     client,
		bucketName: bucket,
	}, nil
}

func (m *minioClient) CreateOne(ctx context.Context, file FileDataType) (string, error) {
	objectID := uuid.New().String() + filepath.Ext(file.FileName)

	reader := bytes.NewReader(file.Data)

	_, err := m.client.PutObject(ctx, m.bucketName, objectID, reader, int64(len(file.Data)), minio.PutObjectOptions{})
	if err != nil {
		return "", err
	}

	return objectID, nil
}

func (m *minioClient) GetOne(ctx context.Context, objectID string) (string, error) {
	url, err := m.client.PresignedGetObject(ctx, m.bucketName, objectID, time.Second*24*60*60, nil)
	if err != nil {
		return "", err
	}

	return url.String(), nil
}

func (m *minioClient) DeleteOne(ctx context.Context, objectID string) error {
	err := m.client.RemoveObject(ctx, m.bucketName, objectID, minio.RemoveObjectOptions{})
	if err != nil {
		return err
	}
	return nil
}
