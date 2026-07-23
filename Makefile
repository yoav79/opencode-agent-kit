.PHONY: help validate test install uninstall dry-run

.DEFAULT_GOAL := help

help: ## Muestra esta ayuda
	@echo "OpenCode Agent Kit"
	@echo ""
	@echo "Uso: make <target>"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

validate: ## Valida integridad del repositorio (JSON, frontmatter, nombres)
	./scripts/validate.sh

test: validate ## Ejecuta tests de integracion
	./tests/test-scripts.sh

install: ## Instala agentes, skills y comandos en ~/.config/opencode
	./scripts/install.sh

uninstall: ## Elimina symlinks instalados de ~/.config/opencode
	./scripts/uninstall.sh

dry-run: ## Muestra que se instalaria sin modificar nada
	./scripts/install.sh --dry-run
