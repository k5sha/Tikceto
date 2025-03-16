package main

import (
	"github.com/k5sha/Tikceto/internal/auth"
	"github.com/k5sha/Tikceto/internal/db"
	"github.com/k5sha/Tikceto/internal/env"
	"github.com/k5sha/Tikceto/internal/mailer"
	"github.com/k5sha/Tikceto/internal/store"
	_ "github.com/lib/pq"
	"go.uber.org/zap"
	"time"
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
		apiURL:      env.GetString("EXTERNAL_URL", "localhost:8080"),
		frontendURL: env.GetString("FRONTEND_URL", "http://localhost:5173"),
		env:         env.GetString("ENV", "development"),
		db: dbConfig{
			addr:         env.GetString("DB_ADDR", "postgres://admin:adminpassword@localhost:5432/tikceto?sslmode=disable"),
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
			fromEmail: env.GetString("MAIL_FROM_EMAIL", "hello@demomailtrap.com"),
			mailTrap: mailTrapConfig{
				apiKey: env.GetString("MAILTRAP_API_KEY", ""),
			},
		},
	}

	// Logger
	logger := zap.Must(zap.NewProduction()).Sugar()

	// Database
	db, err := db.New(cfg.db.addr, cfg.db.maxOpenConns, cfg.db.maxIdleConns, cfg.db.maxIdleTime)
	if err != nil {
		logger.Fatal(err)
	}

	defer db.Close()
	logger.Info("database connection pool established")

	store := store.NewStorage(db)

	// Mailer
	mailer, err := mailer.NewMockMailer("123", cfg.mail.fromEmail)
	if err != nil {
		logger.Fatal(err)
	}

	// Auth
	jwtAuthenticator := auth.NewJWTAuthenticator(cfg.auth.token.secret, cfg.auth.token.iss, cfg.auth.token.iss)

	// Application
	app := &application{
		authenticator: jwtAuthenticator,
		config:        cfg,
		store:         store,
		logger:        logger,
		mailer:        mailer,
	}

	// Routing
	mux := app.mount()

	logger.Fatal(app.run(mux))
}
