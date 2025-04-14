package payment

type PaymentRequest struct {
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	Description string  `json:"description"`
	OrderId     string  `json:"order_id"`
}

type PaymentResponse struct {
	OrderId string `json:"order_id"`
	Status  string `json:"status"`
	Url     string `json:"url"`
}

type Client interface {
	CreatePayment(payment PaymentRequest) (*PaymentResponse, error)
	GenerateSignature(data string) string
}
