package main

import (
	"os"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/k5sha/Tikceto/internal/auth"
	"github.com/k5sha/Tikceto/internal/db"
	"github.com/k5sha/Tikceto/internal/env"
	"github.com/k5sha/Tikceto/internal/mailer"
	"github.com/k5sha/Tikceto/internal/payment"
	"github.com/k5sha/Tikceto/internal/s3"
	"github.com/k5sha/Tikceto/internal/store"
	_ "github.com/lib/pq"
	"go.uber.org/zap"
)

const version = "0.0.1"

//	@title			Tikceto
//	@description	API for Tikceto
//	@termsOfService	http://swagger.io/terms/

//	@contact.name	API Support
//	@contact.url	http://www.swagger.io/support
//	@contact.email	support@swagger.io

//	@license.name	Apache 2.0
//	@license.url	http://www.apache.org/licenses/LICENSE-2.0.html

//	@securityDefinitions.apikey	ApiKeyAuth
//	@in							header
//	@name						Authorization
//	@description				Use the Authorization header with a Bearer token to authenticate API requests.

func main() {
	// Config
	cfg := config{
		addr:        env.GetString("ADDR", ":8080"),
		apiURL:      env.GetString("EXTERNAL_URL", "192.168.0.171:8080"),
		frontendURL: env.GetString("FRONTEND_URL", "http://192.168.0.171:5173"),
		env:         env.GetString("ENV", "development"),
		db: dbConfig{
			addr:         env.GetString("DB_ADDR", "postgres://admin:adminpassword@db:5432/tikceto?sslmode=disable"),
			maxIdleConns: env.GetInt("DB_MAX_IDLE_CONNS", 30),
			maxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			maxIdleTime:  env.GetDuration("DB_MAX_IDLE_TIME", 5*time.Minute),
		},
		auth: authConfig{
			basic: basicConfig{
				username: env.GetString("AUTH_BASIC_USERNAME", "admin"),
				password: env.GetString("AUTH_BASIC_PASSWORD", "admin"),
			},
			token: tokenConfig{
				secret: env.GetString("AUTH_TOKEN_SECRET", "secret"),
				exp:    env.GetDuration("AUTH_TOKEN_EXPIRATION", 3*24*time.Hour),
				iss:    env.GetString("AUTH_TOKEN_HOST", "blogo"),
			},
		},
		mail: mailConfig{
			exp:       env.GetDuration("MAIL_TOKEN_EXPIRATION", 1*time.Hour),
			fromEmail: env.GetString("MAIL_FROM_EMAIL", "ticketo149@gmail.com"),
			smtp: smtpConfig{
				username: env.GetString("SMTP_USERNAME", ""),
				password: env.GetString("SMTP_PASSWORD", ""),
				host:     env.GetString("SMTP_HOST", "smtp.gmail.com"),
				port:     env.GetInt("SMTP_PORT", 465),
			},
		},
		s3: s3Config{
			bucketName: env.GetString("S3_BUCKET_NAME", "tikceto"),
			minio: minioConfig{
				user:           env.GetString("MINIO_ROOT_USER", "admin"),
				password:       env.GetString("MINIO_ROOT_PASSWORD", "adminpassword"),
				endpoint:       env.GetString("MINIO_ENDPOINT", "minio:9000"),
				endpointPublic: env.GetString("MINIO_ENDPOINT_PUBLIC", "localhost/minio"),
				ssl:            env.GetBool("MINIO_SSL", false),
			},
		},
		payment: payConfig{
			pubKey:      env.GetString("PAYMENT_PUBLIC_KEY", ""),
			privateKey:  env.GetString("PAYMENT_PRIVATE_KEY", ""),
			frontendURL: env.GetString("PAYMENT_FRONTEND_URL", "http://192.168.0.171:5173/payment/complete/"),
			serverURL:   env.GetString("PAYMENT_SERVER_URL", "http://192.168.0.171/v1/payments/validate"),
		},
	}

	// Logger
	logger := zap.Must(zap.NewProduction()).Sugar()

	// Migration

	migrationsPath := "/app/cmd/migrate/migrations"

	if _, err := os.Stat(migrationsPath); os.IsNotExist(err) {
		logger.Fatalf("Migrations path does not exist: %s", migrationsPath)
	}

	sourceURL := "file://" + migrationsPath

	logger.Info("Starting DB migrations")
	logger.Infof("Using migrations path: %s", migrationsPath)

	dir, err := os.Getwd()
	if err != nil {
		logger.Fatalf("failed to get current working directory: %v", err)
	}
	logger.Infof("Current working dir: %s", dir)

	m, err := migrate.New(sourceURL, cfg.db.addr)
	if err != nil && migrate.ErrNoChange != err {
		logger.Errorf("Failed to create migrate instance: %v", err)
	}

	err = m.Up()
	if err != nil {
		logger.Fatalf("Migration failed: %v", err)
	}

	if err == migrate.ErrNoChange {
		logger.Error("No new migrations to run")
	} else {
		logger.Info("Migrations applied successfully")
	}

	// Database
	db, err := db.New(cfg.db.addr, cfg.db.maxOpenConns, cfg.db.maxIdleConns, cfg.db.maxIdleTime)
	if err != nil {
		logger.Fatal(err)
	}

	defer db.Close()
	logger.Info("database connection pool established")

	store := store.NewStorage(db)

	// Mailer
	mailer, err := mailer.NewSmtp(cfg.mail.smtp.host, cfg.mail.smtp.username, cfg.mail.smtp.password, cfg.mail.fromEmail, cfg.mail.smtp.port)
	if err != nil {
		logger.Fatal(err)
	}

	// Auth
	jwtAuthenticator := auth.NewJWTAuthenticator(cfg.auth.token.secret, cfg.auth.token.iss, cfg.auth.token.iss)

	// S3
	s3, err := s3.NewMinioClient(cfg.s3.minio.endpoint, cfg.s3.minio.endpointPublic, cfg.s3.minio.user, cfg.s3.minio.password, cfg.s3.bucketName, cfg.s3.minio.ssl)
	if err != nil {
		logger.Fatal(err)
	}

	// Payment
	payment, err := payment.NewLiqPayPaymentService(cfg.payment.pubKey, cfg.payment.privateKey, cfg.payment.frontendURL, cfg.payment.serverURL)
	if err != nil {
		logger.Fatal(err)
	}

	// Application
	app := &application{
		authenticator: jwtAuthenticator,
		config:        cfg,
		store:         store,
		logger:        logger,
		mailer:        mailer,
		s3:            s3,
		payment:       payment,
	}

	// Routing
	mux := app.mount()

	logger.Fatal(app.run(mux))
}
