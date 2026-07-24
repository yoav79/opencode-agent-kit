# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/) y el proyecto adherencia a [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Reemplazado subagente `requirements-analyst` por integracion directa en `software-architect`.
- Reemplazado subagente `architecture-reviewer` por workflow interno de validacion.
- Eliminadas skills separadas (`requirements-discovery`, `software-blueprint`, `architecture-review`); su contenido se integro en los agentes y workflow.
- Reemplazados comandos `new-blueprint`, `continue-blueprint`, `validate-blueprint` por `init-software-architect` y `init-task-planner`.
- Reemplazada plantilla `software-design-project/` por `software-architect/` y `task-planner/`.
- `install.sh` ahora tambien instala templates via symlinks.
- `validate.sh` actualizado para la nueva estructura de archivos.
- `test-scripts.sh` actualizado para verificar los nuevos agentes y comandos.
- Directorios de trabajo cambiados de `software-design/` y `task-planning/` a `.devflow/software-architect/` y `.devflow/task-planner/`.
- `next-task` cambiado de `mode: subagent` a `mode: primary`.
- README reescrito para reflejar la nueva arquitectura.

### Added

- **`templates/shared/tools/timestamp.mjs`** — Herramienta determinista compartida para timestamps. Todos los agentes deben usarla en lugar de escribir fechas manualmente.
- **Regla global en AGENTS.md** — Timestamps deterministas: prohibido escribir fechas manualmente, usar siempre `timestamp.mjs`.
- **`consistency-reviewer`** — Subagente que revisa la consistencia del Software Blueprint completo: estructura, cobertura, contradicciones y trazabilidad. Produce `review-report.md` con clasificación `BLOCKING`/`WARNING`/`INFO`.
- **`/review-consistency`** — Comando que ejecuta la revisión independiente de consistencia.
- **`context-builder`** — Subagente que prepara el contexto ejecutable de una tarea ya seleccionada: lee plan, artefactos, predecesores y repo; produce `execution-context.json` y `execution-prompt.md`.
- **`next-task`** — Agente determinista de selección de tareas, con contratos de estado/selección y validador `validate-next-task.mjs`. Comandos `/init-next-task`, `/select-next-task`, `/prepare-task-run`.
- **`task-planner`** — Agente de planificacion que transforma un blueprint aprobado en un plan completo de tareas para DevFlow. Workflow de 10 fases con validacion determinista.
- **`/init-software-architect`** — Comando que inicializa o continua el diseno de arquitectura con workflow de 12 fases y aprobaciones en puertas criticas.
- **`/init-task-planner`** — Comando que inicializa o continua la planificacion de tareas con contrato de version e integridad.
- **`/init-next-task`** — Comando que inicializa el espacio de ejecución (`.devflow/execution/`).
- **`/select-next-task`** — Comando que ejecuta la selección determinista de la siguiente tarea.
- **`/prepare-task-run`** — Comando que crea el directorio del run y registra la tarea en el estado de ejecución.
- **`/build-task-context`** — Comando que construye contexto para una tarea e intento explicitos.
- **`/build-next-task-context`** — Comando que construye contexto para la última tarea seleccionada en un solo paso.
- **`templates/software-architect/`** — Plantillas del agente de diseno: `project-state.json` (12 fases), `workflow.md`, y `doc-templates/` con templates para cada fase.
- **`templates/software-architect/tools/validate-blueprint.mjs`** — Validador determinista del Software Blueprint: verifica estructura, documentos, secciones, consistencia de aprobaciones y referencias.
- **`templates/task-planner/`** — Plantillas del agente de planificacion: 9 archivos JSON, `task-template.md`, workflow, y herramientas deterministas (`validate-plan.mjs`, `update-timestamps.mjs`, `build-epic-graph.mjs`).
- **`templates/next-task/`** — Contratos de ejecución: `execution-state.json`, `selection.json`, schemas, y `validate-next-task.mjs`.
- **`templates/context-builder/`** — Contratos de contexto: `context-build-request.schema.json`, `execution-context.schema.json`, templates, README.
- **`.gitignore`** — Archivos ignorados para builds, dependencias, IDE y entorno.

### Removed

- `opencode/agents/requirements-analyst.md` — Integrado en `software-architect`.
- `opencode/agents/architecture-reviewer.md` — Integrado en workflow de validacion.
- `opencode/skills/` — Directorio de skills eliminado; contenido integrado en agentes.
- `opencode/commands/new-blueprint.md` — Reemplazado por `init-software-architect`.
- `opencode/commands/continue-blueprint.md` — Reemplazado por `init-software-architect`.
- `opencode/commands/validate-blueprint.md` — Reemplazado por workflow interno.

## [0.1.0] — 2026-07-23

### Agregado

#### Agentes

- **`software-architect`** — Agente principal que convierte ideas incompletas en blueprints coherentes, trazables e implementables.
- **`requirements-analyst`** — Subagente de solo lectura para diagnostico de requisitos faltantes.
- **`architecture-reviewer`** — Subagente de solo lectura para revision independiente de arquitectura.

#### Skills

- **`requirements-discovery`** — Skill de 7 pasos para discovery.
- **`software-blueprint`** — Skill que produce 13 entregables de arquitectura.
- **`architecture-review`** — Skill de auditoria de 8 pasos.

#### Comandos

- **`/new-blueprint`** — Inicia un flujo de blueprint.
- **`/continue-blueprint`** — Reanuda un blueprint existente.
- **`/validate-blueprint`** — Audita un blueprint.

#### Reglas Compartidas

- **`general.md`**, **`git-policy.md`**, **`documentation-policy.md`**.

#### Plantilla de Proyecto

- **`software-design-project/`** — Scaffold con 5 fases.

#### Scripts

- **`install.sh`**, **`uninstall.sh`**, **`create-project.sh`**, **`validate.sh`**.

#### Infraestructura

- **`Makefile`**, **`tests/test-scripts.sh`**, **`opencode.example.json`**.
