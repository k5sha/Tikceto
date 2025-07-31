# Build stage
FROM golang:1.23.3 as builder

WORKDIR /app
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o api cmd/api/*.go

FROM debian:bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/api .

COPY cmd/migrate/migrations ./cmd/migrate/migrations

EXPOSE 8080

CMD ["./api"]
