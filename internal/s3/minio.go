package s3

import (
	"bytes"
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"path/filepath"
)

type minioClient struct {
	bucketName     string
	client         *minio.Client
	publicEndpoint string
	useSSL         bool
}

func NewMinioClient(endpoint, publicEndpoint, user, password, bucket string, ssl bool) (*minioClient, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(user, password, ""),
		Secure: ssl,
	})
	if err != nil {
		return nil, fmt.Errorf("minio init error: %w", err)
	}

	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("check bucket error: %w", err)
	}
	if !exists {
		err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("create bucket error: %w", err)
		}
	}

	return &minioClient{
		client:         client,
		bucketName:     bucket,
		publicEndpoint: publicEndpoint,
		useSSL:         ssl,
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

func (m *minioClient) GetOne(objectID string) (string, error) {
	fileURL := fmt.Sprintf("%s/%s/%s", m.publicEndpoint, m.bucketName, objectID)

	if m.useSSL {
		fileURL = "https://" + fileURL
	} else {
		fileURL = "http://" + fileURL
	}

	return fileURL, nil
}

func (m *minioClient) DeleteOne(ctx context.Context, objectID string) error {
	err := m.client.RemoveObject(ctx, m.bucketName, objectID, minio.RemoveObjectOptions{})
	if err != nil {
		return err
	}
	return nil
}
