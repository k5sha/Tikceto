package mailer

import (
	"bytes"
	"errors"
	"fmt"
	"gopkg.in/gomail.v2"
	"html/template"
	"time"
)

type MailtrapMailer struct {
	fromEmail string
	apiKey    string
}

func NewMailtrap(apiKey, fromEmail string) (*MailtrapMailer, error) {
	if apiKey == "" {
		return nil, errors.New("api key is required")
	}

	return &MailtrapMailer{
		fromEmail: fromEmail,
		apiKey:    apiKey,
	}, nil
}

func (m *MailtrapMailer) Send(templateFile string, username, email string, data any, isSandbox bool) error {
	tmpl, err := template.ParseFS(FS, "templates/"+templateFile)
	if err != nil {
		return fmt.Errorf("error parsing template: %w", err)
	}

	subject := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(subject, "subject", data)
	if err != nil {
		return fmt.Errorf("error executing subject template: %w", err)
	}

	body := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(body, "body", data)
	if err != nil {
		return fmt.Errorf("error executing body template: %w", err)
	}

	msg := gomail.NewMessage()
	msg.SetHeader("From", m.fromEmail)
	msg.SetHeader("To", email)
	msg.SetHeader("Subject", subject.String())

	msg.SetBody("text/html", body.String())

	d := gomail.NewDialer("sandbox.smtp.mailtrap.io", 587, "5eefa7ba49feed", m.apiKey)

	var retryErr error
	for i := 0; i < maxRetries; i++ {
		err := d.DialAndSend(msg)
		if err != nil {
			retryErr = err
			time.Sleep(time.Duration(i+1) * time.Second)
			continue
		}

		return nil
	}

	return fmt.Errorf("failed to send email after %d attempts, error: %s", maxRetries, retryErr)
}
