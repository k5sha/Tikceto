package main

func main() {
	cfg := config{
		addr: "0.0.0.0:3000",
	}

	app := &application{
		config: cfg,
	}

	mux := app.mount()
	err := app.run(mux)
	if err != nil {
		panic(err)
	}
}
