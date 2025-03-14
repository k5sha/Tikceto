package main

import (
	"course_work/internal/env"
	"go.uber.org/zap"
)

const version = "0.0.1"

func main() {
	// Config
	cfg := config{
		addr: env.GetString("ADDR", ":8080"),
		env:  env.GetString("ENV", "development"),
	}

	// Logger
	logger := zap.Must(zap.NewProduction()).Sugar()

	// Application
	app := &application{
		config: cfg,
		logger: logger,
	}

	// Routing
	mux := app.mount()

	logger.Fatal(app.run(mux))
}
