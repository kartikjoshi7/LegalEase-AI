.PHONY: verify test-e2e preflight test-live

# Variables
BACKEND_DIR = backend
FRONTEND_DIR = frontend

# Cross-platform venv activation
ifeq ($(OS),Windows_NT)
    VENV_ACTIVATE = . $(BACKEND_DIR)/venv/Scripts/activate
else
    VENV_ACTIVATE = . $(BACKEND_DIR)/venv/bin/activate
endif

verify:
	@echo "Running verification pipeline..."
	@echo "1. Checking Python Backend..."
	@$(VENV_ACTIVATE) && cd $(BACKEND_DIR) && flake8 .
	@$(VENV_ACTIVATE) && cd $(BACKEND_DIR) && PYTHONPATH=. pytest --cov=.
	@echo "2. Checking Frontend..."
	@cd $(FRONTEND_DIR) && npm run lint && npm run build
	@echo "Verification complete!"

test-e2e:
	@echo "Running E2E tests with Playwright..."
	@cd $(FRONTEND_DIR) && npx playwright test

preflight:
	@echo "Running preflight checks..."
	@bash scripts/preflight.sh

test-live:
	@echo "Running live integration tests against Gemini..."
	@$(VENV_ACTIVATE) && cd $(BACKEND_DIR) && PYTHONPATH=. pytest -m live -v
