package mailer

import (
	"errors"
	"fmt"
)

// MockMailer is a mock implementation for sending emails.
type MockMailer struct {
	fromEmail string
	apiKey    string
}

// NewMockMailer creates a new instance of MockMailer.
func NewMockMailer(apiKey, fromEmail string) (*MockMailer, error) {
	if apiKey == "" {
		return nil, errors.New("api key is required")
	}

	// Return a mock mailer with provided settings.
	return &MockMailer{
		fromEmail: fromEmail,
		apiKey:    apiKey,
	}, nil
}

// Send simulates sending an email by printing the email details.
func (m *MockMailer) Send(templateFile string, username, email string, data any, isSandbox bool) error {
	if templateFile == "" || username == "" || email == "" {
		return errors.New("templateFile, username, and email are required")
	}

	// Log email details (you can replace this with actual logic in real mailer)
	fmt.Printf("Sending email to: %s\n", email)
	fmt.Printf("From: %s\n", m.fromEmail)
	fmt.Printf("Template: %s\n", templateFile)
	fmt.Printf("Username: %s\n", username)
	fmt.Printf("Data: %v\n", data)

	// Returning a nil error to simulate a successful send (or you can simulate a failure)
	return nil
}
