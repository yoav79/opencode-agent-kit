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
- README reescrito para reflejar la nueva arquitectura.

### Added

- **`task-planner`** — Agente de planificacion que transforma un blueprint aprobado en un plan completo de tareas para DevFlow. Workflow de 10 fases con validacion determinista.
- **`/init-software-architect`** — Comando que inicializa o continua el diseno de arquitectura con workflow de 12 fases y aprobaciones en puertas criticas.
- **`/init-task-planner`** — Comando que inicializa o continua la planificacion de tareas con contrato de version e integridad.
- **`templates/software-architect/`** — Plantillas del agente de diseno: `project-state.json` (12 fases) y `workflow.md`.
- **`templates/task-planner/`** — Plantillas del agente de planificacion: 9 archivos JSON, `task-template.md`, workflow, y herramientas deterministas (`validate-plan.mjs`, `update-timestamps.mjs`, `build-epic-graph.mjs`).
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
