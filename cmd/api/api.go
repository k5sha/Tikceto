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
	"github.com/k5sha/Tikceto/internal/payment"
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
	payment       payment.Client
	logger        *zap.SugaredLogger
	s3            s3.Client
}

type config struct {
	addr        string
	apiURL      string
	auth        authConfig
	mail        mailConfig
	payment     payConfig
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

type payConfig struct {
	pubKey      string
	privateKey  string
	frontendURL string
	serverURL   string
}
type mailTrapConfig struct {
	apiKey string
}

type s3Config struct {
	bucketName string
	minio      minioConfig
}

type minioConfig struct {
	user           string
	password       string
	ssl            bool
	endpoint       string
	endpointPublic string
}

func (app *application) mount() *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{env.GetString("CORS_ALLOWED_ORIGIN", "*")},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
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
		docsURL := fmt.Sprintf("%s/swagger/doc.json", app.config.apiURL)
		r.Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL(docsURL)))

		r.Route("/rooms", func(r chi.Router) {
			r.With(app.AuthTokenMiddleware()).Post("/", app.checkPermissions("admin", app.createRoomHandler))
			r.Get("/", app.getRoomsHandler)
			r.Route("/{roomID}", func(r chi.Router) {
				r.Use(app.roomsContextMiddleware)

				r.Get("/", app.getRoomHandler)

				r.Group(func(r chi.Router) {
					r.Use(app.AuthTokenMiddleware())

					r.Delete("/", app.checkPermissions("admin", app.deleteRoomHandler))
					r.Patch("/", app.checkPermissions("admin", app.updateRoomHandler))
				})

			})
		})

		r.Route("/movies", func(r chi.Router) {
			r.With(app.AuthTokenMiddleware()).Post("/", app.checkPermissions("admin", app.createMovieHandler))

			r.Get("/", app.getMoviesHandler)

			r.Route("/{movieID}", func(r chi.Router) {
				r.Use(app.moviesContextMiddleware)

				r.Get("/", app.getMovieHandler)

				r.Group(func(r chi.Router) {
					r.Use(app.AuthTokenMiddleware())
					r.Delete("/", app.checkPermissions("admin", app.deleteMovieHandler))
					r.Patch("/", app.checkPermissions("admin", app.updateMovieHandler))
				})

			})
		})

		r.Route("/sessions", func(r chi.Router) {
			r.With(app.AuthTokenMiddleware()).Post("/", app.checkPermissions("admin", app.createSessionHandler))

			r.Get("/movie/{movieID}", app.getSessionsByMovieHandler)

			r.Route("/{sessionID}", func(r chi.Router) {
				r.Use(app.sessionsContextMiddleware)

				r.Get("/", app.getSessionHandler)

				r.Group(func(r chi.Router) {
					r.Use(app.AuthTokenMiddleware())
					r.Delete("/", app.checkPermissions("admin", app.deleteSessionHandler))
					r.Patch("/", app.checkPermissions("admin", app.updateSessionHandler))
				})

			})
		})

		r.Route("/seats", func(r chi.Router) {
			r.With(app.AuthTokenMiddleware()).Post("/", app.checkPermissions("admin", app.createSeatHandler))
			r.Get("/session/{sessionID}", app.getSeatsBySessionHandler)

			r.Route("/{seatID}", func(r chi.Router) {
				r.Use(app.seatsContextMiddleware)

				r.Get("/", app.getSeatHandler)
				r.Group(func(r chi.Router) {
					r.Use(app.AuthTokenMiddleware())
					r.Delete("/", app.checkPermissions("admin", app.deleteSeatHandler))
					r.Patch("/", app.checkPermissions("admin", app.updateSeatHandler))
				})

			})
		})

		r.Route("/tickets", func(r chi.Router) {
			r.Group(func(r chi.Router) {
				r.Use(app.AuthTokenMiddleware())
				r.Post("/", app.checkPermissions("admin", app.createTicketHandler))
				r.Get("/my", app.getMyTicketsHandler)
				r.Get("/session/{sessionID}/seat/{seatID}", app.checkPermissions("admin", app.getTicketBySessionAndSeatHandler))
			})
			r.Route("/{ticketID}", func(r chi.Router) {
				r.Use(app.ticketContextMiddleware)

				r.Group(func(r chi.Router) {
					r.Use(app.AuthTokenMiddleware())
					r.Get("/", app.checkPermissions("admin", app.getTicketHandler))
					r.Delete("/", app.checkPermissions("admin", app.deleteTicketHandler))
					r.Patch("/", app.checkPermissions("admin", app.updateTicketHandler))
				})

			})
		})

		r.Route("/payments", func(r chi.Router) {
			r.With(app.AuthTokenMiddleware()).Post("/create", app.createPaymentHandler)
			r.Post("/validate", app.validatePaymentHandler)
		})

		r.Route("/users", func(r chi.Router) {
			r.With(app.AuthTokenMiddleware()).Get("/me", app.getCurrentUserHandler)
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
