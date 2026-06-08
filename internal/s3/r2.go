package s3

import (
	"bytes"
	"context"
	"fmt"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type r2Client struct {
	bucketName     string
	client         *s3.Client
	publicEndpoint string
}

func NewR2Client(ctx context.Context, accountID, accessKeyID, secretAccessKey, bucket, publicEndpoint string) (*r2Client, error) {
	r2Endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(r2Endpoint)
	})

	return &r2Client{
		client:         client,
		bucketName:     bucket,
		publicEndpoint: publicEndpoint,
	}, nil
}

func (r *r2Client) CreateOne(ctx context.Context, file FileDataType) (string, error) {
	objectID := uuid.New().String() + filepath.Ext(file.FileName)

	_, err := r.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(objectID),
		Body:   bytes.NewReader(file.Data),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload object to R2: %w", err)
	}

	return objectID, nil
}

func (r *r2Client) GetOne(objectID string) (string, error) {
	fileURL := fmt.Sprintf("%s/%s", r.publicEndpoint, objectID)
	return fileURL, nil
}

func (r *r2Client) DeleteOne(ctx context.Context, objectID string) error {
	_, err := r.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(objectID),
	})
	if err != nil {
		return fmt.Errorf("failed to delete object from R2: %w", err)
	}

	return nil
}
