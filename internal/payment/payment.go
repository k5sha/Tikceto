package payment

type PaymentRequest struct {
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	Description string  `json:"description"`
	OrderId     int64   `json:"order_id"`
}

type PaymentResponse struct {
	OrderId int64  `json:"order_id"`
	Status  string `json:"status"`
	Url     string `json:"url"`
}

type Client interface {
	CreatePayment(payment PaymentRequest) (*PaymentResponse, error)
	ValidatePayment(string) (*string, error)
}
