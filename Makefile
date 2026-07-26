.PHONY: help validate test test-repository test-software-architect-tools test-task-planner-tools test-next-task-tools test-execution-tools test-agent-contracts install uninstall dry-run publish

.DEFAULT_GOAL := help

help: ## Muestra esta ayuda
	@echo "OpenCode Agent Kit"
	@echo ""
	@echo "Uso: make <target>"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

validate: ## Valida integridad del repositorio (JSON, frontmatter, nombres, cobertura de tests)
	./scripts/validate.sh

test: validate test-repository test-software-architect-tools test-task-planner-tools test-next-task-tools test-execution-tools test-agent-contracts ## Ejecuta todas las pruebas deterministas

test-repository: ## Prueba instalación, scaffold y desinstalación
	./tests/test-scripts.sh

test-software-architect-tools: ## Prueba validator, migración y fixtures de software-architect
	./tests/test-software-architect-tools.sh

test-task-planner-tools: ## Prueba determinista de tools de task-planner (permisos, timestamps, validación)
	node --test templates/task-planner/tools/*.test.mjs

test-next-task-tools: ## Verifica sintaxis de las herramientas de next-task
	for f in templates/next-task/tools/*.mjs; do node --check "$$f" || exit 1; done

test-execution-tools: ## Prueba el motor de transiciones de ejecución (prepare-task-run, execution-transition-engine)
	node --test templates/execution/tools/prepare-task-run.test.mjs templates/execution/tools/execution-transition-engine.test.mjs

test-agent-contracts: ## Prueba contratos de permisos de agentes (context-builder, build-next-task-context)
	node --test templates/execution/tools/contractual-tests.test.mjs

install: ## Instala agentes, skills y comandos en ~/.config/opencode
	./scripts/install.sh

uninstall: ## Elimina symlinks instalados de ~/.config/opencode
	./scripts/uninstall.sh

dry-run: ## Muestra que se instalaria sin modificar nada
	./scripts/install.sh --dry-run

publish: ## Publica el blueprint completo a docs/software-architect/
	./scripts/publish-blueprint.sh .
