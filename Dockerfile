FROM golang:1.23.3 as builder

RUN apt-get update && apt-get upgrade -y

WORKDIR /app
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o api cmd/api/*.go

FROM debian:bullseye-slim

WORKDIR /app

RUN groupadd -r tikceto && useradd -r -g tikceto tikceto

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/api .

COPY cmd/migrate/migrations ./cmd/migrate/migrations

USER tikceto

EXPOSE 8080

CMD ["./api"]
