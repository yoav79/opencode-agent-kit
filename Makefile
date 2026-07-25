.PHONY: help validate test test-repository test-software-architect-tools test-task-planner-tools install uninstall dry-run publish

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

test: validate test-repository test-software-architect-tools test-task-planner-tools ## Ejecuta todas las pruebas deterministas

test-repository: ## Prueba instalación, scaffold y desinstalación
	./tests/test-scripts.sh

test-software-architect-tools: ## Prueba validator, migración y fixtures de software-architect
	./tests/test-software-architect-tools.sh

test-task-planner-tools: ## Prueba determinista de tools de task-planner (permisos, timestamps, validación)
	node --test templates/task-planner/tools/*.test.mjs

install: ## Instala agentes, skills y comandos en ~/.config/opencode
	./scripts/install.sh

uninstall: ## Elimina symlinks instalados de ~/.config/opencode
	./scripts/uninstall.sh

dry-run: ## Muestra que se instalaria sin modificar nada
	./scripts/install.sh --dry-run

publish: ## Publica el blueprint completo a docs/software-architect/
	./scripts/publish-blueprint.sh .
