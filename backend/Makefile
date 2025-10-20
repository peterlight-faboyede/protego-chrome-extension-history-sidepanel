.PHONY: build up down restart logs shell test test-verbose test-unit test-integration coverage coverage-report clean db-shell

# Build docker images
build:
	docker compose build

# Start all services
up:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Restart all services
restart:
	docker compose restart

# View logs
logs:
	docker compose logs -f

# View API logs only
logs-api:
	docker compose logs -f api

# View DB logs only
logs-db:
	docker compose logs -f db

# Open shell in API container (fresh build)
shell:
	docker compose run --rm --build api bash

# Open PostgreSQL shell (starts DB if needed)
db-shell:
	docker compose run --rm db psql -U postgres -d history_db

# Run all tests (builds fresh, tears down after)
test:
	docker compose run --rm --build api pytest
	docker compose down

# Run tests with verbose output
test-verbose:
	docker compose run --rm --build api pytest -vv -s
	docker compose down

# Run unit tests only
test-unit:
	docker compose run --rm --build api pytest tests/unit/ -v
	docker compose down

# Run integration tests only
test-integration:
	docker compose run --rm --build api pytest tests/integration/ -v
	docker compose down

# Run tests with coverage
coverage:
	docker compose run --rm --build api pytest --cov=. --cov-report=html --cov-report=term-missing
	docker compose down

# Run coverage and open report
coverage-report:
	docker compose run --rm --build api pytest --cov=. --cov-report=html --cov-report=term-missing
	docker compose down
	echo "Coverage report generated. Open htmlcov/index.html to view."

# Clean test artifacts
clean:
	docker compose run --rm api sh -c "rm -rf .pytest_cache htmlcov .coverage"
	docker compose run --rm api sh -c "find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true"
	docker compose run --rm api sh -c "find . -type f -name '*.pyc' -delete"
	docker compose down

# Clean local artifacts (if any)
clean-local:
	rm -rf .pytest_cache htmlcov .coverage
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

# Remove all containers, volumes, and images
clean-all:
	docker compose down -v --rmi all

# Run database migrations (fresh build)
migrate:
	docker compose run --rm --build api alembic upgrade head
	docker compose down

# Create new migration (fresh build)
migration:
	@read -p "Enter migration message: " msg; \
	docker compose run --rm --build api alembic revision --autogenerate -m "$$msg"
	docker compose down

# Show container status
ps:
	docker compose ps

# Rebuild and restart services
rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

