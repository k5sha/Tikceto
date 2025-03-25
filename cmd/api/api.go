package main

import (
	"context"
	"errors"
	"fmt"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/k5sha/Tikceto/docs"
	"github.com/k5sha/Tikceto/internal/auth"
	"github.com/k5sha/Tikceto/internal/env"
	"github.com/k5sha/Tikceto/internal/mailer"
	"github.com/k5sha/Tikceto/internal/s3"
	"github.com/k5sha/Tikceto/internal/store"
	httpSwagger "github.com/swaggo/http-swagger/v2"
	"go.uber.org/zap"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type application struct {
	config        config
	store         store.Storage
	authenticator auth.Authenticator
	mailer        mailer.Client
	logger        *zap.SugaredLogger
	s3            s3.Client
}

type config struct {
	addr        string
	apiURL      string
	auth        authConfig
	mail        mailConfig
	frontendURL string
	env         string
	db          dbConfig
	s3          s3Config
}

type dbConfig struct {
	addr         string
	maxOpenConns int
	maxIdleConns int
	maxIdleTime  time.Duration
}

type authConfig struct {
	basic basicConfig
	token tokenConfig
}

type basicConfig struct {
	username string
	password string
}

type tokenConfig struct {
	secret string
	exp    time.Duration
	iss    string
}

type mailConfig struct {
	exp       time.Duration
	fromEmail string
	mailTrap  mailTrapConfig
}

type mailTrapConfig struct {
	apiKey string
}

type s3Config struct {
	bucketName string
	minio      minioConfig
}

type minioConfig struct {
	user     string
	password string
	ssl      bool
	endpoint string
}

func (app *application) mount() *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{env.GetString("CORS_ALLOWED_ORIGIN", "http://localhost:5174")},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	r.Route("/v1", func(r chi.Router) {
		r.Get("/health", app.healthCheckHandler)

		// Swagger
		docsURL := fmt.Sprintf("%s/swagger/doc.json", app.config.addr)
		r.Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL(docsURL)))

		// Static
		r.Handle("/static/*", app.secureImageServer("./static"))

		r.Route("/rooms", func(r chi.Router) {
			r.Post("/", app.createRoomHandler)

			r.Route("/{roomID}", func(r chi.Router) {
				r.Use(app.roomsContextMiddleware)

				r.Get("/", app.getRoomHandler)
				r.Delete("/", app.deleteRoomHandler)
				r.Patch("/", app.updateRoomHandler)

			})
		})

		r.Route("/movies", func(r chi.Router) {
			r.Post("/", app.createMovieHandler)

			r.Route("/{movieID}", func(r chi.Router) {
				r.Use(app.moviesContextMiddleware)

				r.Get("/", app.getMovieHandler)
				r.Delete("/", app.deleteMovieHandler)
				r.Patch("/", app.updateMovieHandler)

			})
		})

		r.Route("/sessions", func(r chi.Router) {
			r.Post("/", app.createSessionHandler)

			r.Get("/movie/{movieID}", app.getSessionsByMovieHandler)

			r.Route("/{sessionID}", func(r chi.Router) {
				r.Use(app.sessionsContextMiddleware)

				r.Get("/", app.getSessionHandler)
				r.Delete("/", app.deleteSessionHandler)
				r.Patch("/", app.updateSessionHandler)

			})
		})

		r.Route("/seats", func(r chi.Router) {
			r.Post("/", app.createSeatHandler)

			r.Route("/{seatID}", func(r chi.Router) {
				r.Use(app.seatsContextMiddleware)

				r.Get("/", app.getSeatHandler)
				r.Delete("/", app.deleteSeatHandler)
				r.Patch("/", app.updateSeatHandler)

			})
		})

		r.Route("/tickets", func(r chi.Router) {
			r.Post("/", app.createTicketHandler)

			r.Route("/{ticketID}", func(r chi.Router) {
				r.Use(app.ticketContextMiddleware)

				r.Get("/", app.getTicketHandler)
				r.Delete("/", app.deleteTicketHandler)
				r.Patch("/", app.updateTicketHandler)

			})
		})

		r.Route("/users", func(r chi.Router) {
			r.Put("/activate/{token}", app.activateUserHandler)
		})

		r.Route("/authentication", func(r chi.Router) {
			r.Post("/user", app.registerUserHandler)
			r.Post("/token", app.createTokenHandler)
		})
	})
	return r
}

func (app *application) run(mux *chi.Mux) error {

	// Docs
	docs.SwaggerInfo.Version = version
	docs.SwaggerInfo.Host = app.config.apiURL
	docs.SwaggerInfo.BasePath = "/v1"

	// Create server object
	srv := &http.Server{
		Addr:         app.config.addr,
		Handler:      mux,
		WriteTimeout: 30 * time.Second,
		ReadTimeout:  10 * time.Second,
		IdleTimeout:  time.Minute,
	}

	// Graceful shutdown
	shutdown := make(chan error)

	go func() {
		quit := make(chan os.Signal, 1)

		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		s := <-quit

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		app.logger.Infow("shutting down server", "signal", s.String())

		shutdown <- srv.Shutdown(ctx)
	}()

	app.logger.Infow("server has started", "addr", app.config.addr, "env", app.config.env)

	err := srv.ListenAndServe()
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	err = <-shutdown
	if err != nil {
		return err
	}

	app.logger.Infow("server has stopped", "env", app.config.env)

	return nil
}
