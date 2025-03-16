include .envrc
MIGRATIONS_PATH = ./cmd/migrate/migrations

.PHONY: migrations
migrations:
	@if [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "Error: please specify a name for the migration."; \
		exit 1; \
	fi
	@migrate create -seq -ext sql -dir $(MIGRATIONS_PATH) $(filter-out $@,$(MAKECMDGOALS))

.PHONY: migrate-up
migrate-up:
	@migrate -path=$(MIGRATIONS_PATH) -database=$(DB_ADDR) up

.PHONY: migrate-down
migrate-down:
	@migrate -path=$(MIGRATIONS_PATH) -database=$(DB_ADDR) down $(filter-out $@,$(MAKECMDGOALS))

.PHONY: gen-docs
gen-docs:
	@swag init -g ./api/main.go -d ./cmd,./internal && swag fmt

# Allow make to treat additional arguments as variables
%:
	@: