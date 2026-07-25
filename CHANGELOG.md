# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/) y el
proyecto adhiere a [Semantic Versioning](https://semver.org/). No existen tags
de release; las secciones versionadas describen el estado del repositorio en
cada hito.

## [Unreleased]

### Added

- **BACKLOG.md** — Backlog organizado por agente, con prioridad, esfuerzo,
  área y criterios de salida. (e719e42)
- **14 items en software-architect** — Refactorización ordenada en 5 fases
  por cadena de dependencia: cimientos, datos/templates, agentes,
  validación/reglas y cierre. (e719e42)
- **2 items restantes en task-planner** — Completan la planificación del
  agente de planificación. (8e19dd9)
- **10 items en task-planner** — Plan de trabajo para el agente de
  planificación. (73e29d4)

### Changed

- **BACKLOG.md reordenado** — items de software-architect reorganizados por
  cadena de dependencia (5 fases). (este commit)
- **CHANGELOG sincronizado** — descripciones corregidas y commits faltantes
  agregados. (este commit)
- **Workflow v2 (14 fases)** — Tabla canónica en `workflow.md` con tipos,
  entregables, gates y dependencias. (1cdccc3)
- **Contratos de subagentes** — `contracts/blueprint-compiler.md` y
  `contracts/consistency-reviewer.md` con inputs, outputs y return codes.
  (1cdccc3)
- **Fase 2: Datos y templates** — project-state schema v2 con 14 fases,
  14 documentos y 5 secciones nuevas. Templates v2 creados/renombrados.
  Scaffold con `review/` y tests actualizados. (fde4110)

## [0.1.0] — Estado inicial del repositorio

### Added

#### Agentes

- **`software-architect`** — Agente principal que convierte ideas
  incompletas en blueprints coherentes, trazables e implementables.
- **`requirements-analyst`** — Subagente de solo lectura para diagnóstico
  de requisitos faltantes.
- **`architecture-reviewer`** — Subagente de solo lectura para revisión
  independiente de arquitectura.
- **`consistency-reviewer`** — Subagente determinista que revisa
  consistencia del Software Blueprint. (0ed14cc)
- **`context-builder`** — Subagente que prepara contexto ejecutable de una
  tarea. (ec348d0, 398a509)
- **`next-task`** — Agente determinista de selección de tareas.
  (1e19e0a, 8742282)
- **`task-planner`** — Agente de planificación que transforma un blueprint
  en tareas DevFlow. (51bb221)

#### Comandos

- **`/init-software-architect`** — Inicializa o continúa el diseño de
  arquitectura con workflow de 12 fases. (1e19e0a)
- **`/init-task-planner`** — Inicializa o continúa la planificación.
- **`/init-next-task`** — Inicializa espacio de ejecución. (1e19e0a)
- **`/select-next-task`** — Selección determinista de la siguiente tarea.
  (8742282)
- **`/prepare-task-run`** — Crea directorio del run y registra tarea.
  (a27b1e6)
- **`/build-task-context`** — Construye contexto para tarea explícita.
- **`/build-next-task-context`** — Construye contexto para última tarea
  seleccionada. (ebd61df)
- **`/review-consistency`** — Revisión independiente de consistencia.
  (0ed14cc)

#### Templates y herramientas

- **`templates/shared/tools/timestamp.mjs`** — Herramienta determinista
  compartida para timestamps. (faccc5d)
- **`templates/software-architect/`** — project-state.json (12 fases),
  workflow.md, doc-templates/ (12 templates). (600b7fc, 0ed88a7)
- **`templates/software-architect/tools/validate-blueprint.mjs`** —
  Validador determinista del Software Blueprint. (282402a)
- **`templates/software-architect/project-state.schema.json`** — Schema
  formal para project-state.json. (3241aa7)
- **`templates/task-planner/`** — 9 archivos JSON, task-template.md,
  workflow, validate-plan.mjs, update-timestamps.mjs,
  build-epic-graph.mjs.
- **`templates/next-task/`** — execution-state.json, selection.json,
  schemas, validate-next-task.mjs.
- **`templates/context-builder/`** — Schemas de contexto, templates, README.

#### Scripts

- **`install.sh`** — Instala agentes, comandos y templates via symlinks.
- **`uninstall.sh`** — Revierte la instalación.
- **`create-project.sh`** — Crea proyectos desde scaffold.json.
- **`validate.sh`** — Validación estructural del repositorio.
- **`generate-scaffold.sh`** — Genera scaffold.json desde templates.
  (28b3f57, cd68241)

#### Reglas Compartidas

- **`general.md`**, **`git-policy.md`**, **`documentation-policy.md`**.

#### Infraestructura

- **Makefile**, **tests/test-scripts.sh**, **opencode.example.json**,
  **.gitignore**, **LICENSE**, **CONTRIBUTING.md**.

### Changed

- **Estructura del repositorio** — Agentes, comandos y plantillas movidos
  a `opencode/` y `templates/`. Directorios de trabajo cambiados a
  `.devflow/[agente]/`. (0b6b924, 51bb221)
- **`install.sh`** — Ahora instala templates via symlinks.
- **`validate.sh`** — Validación de estructura, JSON, frontmatter y
  consistencia.
- **`test-scripts.sh`** — Verifica symlinks, creación de proyectos y estado
  inicial.
- **README reescrito** — Documenta arquitectura actual con todos los
  agentes, comandos y estructura. (92b85dd)
- **`workflow.md`** — Paths cambiados de relativos a absolutos
  (`.devflow/software-architect/docs/`). (28bf30c)
- **`project-state.json.documents.path`** — Eliminado; las rutas se
  computan desde un mapping fijo. (28bf30c)
- **BACKLOG.md** — Creado con items iniciales y formato color-coded.
  (7a13121, 92b85dd)
- **`consistency-reviewer` integrado en fase 11** — software-architect lo
  invoca automáticamente; veredicto BLOCKED impide avanzar. (a43953c)
- **`next-task`** — Cambiado de `mode: subagent` a `mode: primary`.
- **README, CHANGELOG y BACKLOG** — Creados y actualizados. (92b85dd)

### Removed

- `opencode/agents/requirements-analyst.md` — Eliminado (no integrado en
  otro agente).
- `opencode/agents/architecture-reviewer.md` — Eliminado; reemplazado por
  `consistency-reviewer`.
- `opencode/skills/` — Directorio de skills eliminado.
- `opencode/commands/new-blueprint.md` — Reemplazado por
  `init-software-architect`.
- `opencode/commands/continue-blueprint.md` — Reemplazado por
  `init-software-architect`.
- `opencode/commands/validate-blueprint.md` — Sin reemplazo directo.
