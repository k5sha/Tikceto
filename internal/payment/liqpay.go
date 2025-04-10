package payment

import (
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"github.com/liqpay/go-sdk"
	"log"
)

type LiqPayPaymentService struct {
	publicKey   string
	privateKey  string
	frontendURL string
	serverURL   string
}

func NewLiqPayPaymentService(publicKey, privateKey, frontendURL, serverURL string) (*LiqPayPaymentService, error) {
	if publicKey == "" || privateKey == "" || frontendURL == "" {
		return nil, fmt.Errorf("API keys required")
	}
	return &LiqPayPaymentService{
		publicKey:   publicKey,
		privateKey:  privateKey,
		frontendURL: frontendURL,
		serverURL:   serverURL,
	}, nil
}

func (s *LiqPayPaymentService) CreatePayment(payment PaymentRequest) (*PaymentResponse, error) {
	c := liqpay.New(s.publicKey, s.privateKey, nil)

	request := map[string]interface{}{
		"action":         "payment_prepare",
		"action_payment": "pay",
		"version":        3,
		"public_key":     s.publicKey,
		"amount":         payment.Amount,
		"currency":       payment.Currency,
		"description":    payment.Description,
		"order_id":       payment.OrderId,
		"sandbox":        1,
		"result_url":     s.frontendURL + payment.OrderId,
		"server_url":     s.serverURL,
	}

	resp, err := c.Send("request", request)
	if err != nil {
		return nil, err
	}

	if resp["result"] != "ok" {
		return nil, fmt.Errorf("Liqpay API error: %s", resp["err"])
	}

	urlCheckout, _ := resp["url_checkout"].(string)

	return &PaymentResponse{
		OrderId: payment.OrderId,
		Status:  "pending",
		Url:     urlCheckout,
	}, nil
}

func (s *LiqPayPaymentService) ValidatePayment(orderID string) (*string, error) {
	c := liqpay.New(s.publicKey, s.privateKey, nil)

	resp, err := c.Send("request", map[string]interface{}{
		"action":   "status",
		"version":  3,
		"order_id": orderID,
	})
	log.Println(resp)
	if err != nil {
		return nil, err
	}

	status, _ := resp["err_code"].(string)
	return &status, nil
}

func (s *LiqPayPaymentService) GenerateSignature(data string) string {
	signatureSource := s.privateKey + data + s.privateKey

	hash := sha1.New()
	hash.Write([]byte(signatureSource))
	hashBytes := hash.Sum(nil)

	signature := base64.StdEncoding.EncodeToString(hashBytes)
	return signature
}
