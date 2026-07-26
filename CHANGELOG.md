# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/) y el
proyecto adhiere a [Semantic Versioning](https://semver.org/). No existen tags
de release; las secciones versionadas describen el estado del repositorio en
cada hito.

## [Unreleased]

### Added

- **permission-policy.test.mjs** — Tests para `task: allow` en task-planner,
  `mode: subagent` en epic-decomposer, y restricción de drafts/. (este commit)
- **BACKLOG.md** — Backlog organizado por agente, con prioridad, esfuerzo,
  área y criterios de salida. (e719e42)
- **14 items en software-architect** — Refactorización ordenada en 5 fases
  por cadena de dependencia: cimientos, datos/templates, agentes,
  validación/reglas y cierre. (e719e42)
- **backendBinding en contrato semántico** — Campo obligatorio añadido a
  contratos, behaviors y template de tarea. (este commit)

### Changed

- **`next-task` como selector puro** — Permisos reducidos a lectura canónica y
  escritura exclusiva de `.devflow/execution/selection.json`. `/select-next-task`
  sigue siendo el único comando asociado; `/init-next-task` y
  `/prepare-task-run` quedan temporalmente en `general` hasta crear un
  orquestador/script dedicado. (este commit)
- **`next-task` como subagente** — `next-task` vuelve a `mode: subagent` y sus
  comandos se ejecutan como `subtask: true`; la selección queda accesible solo
  mediante slash commands. (este commit)
- **Fixture workflow.md sincronizado** — Alineado con el template principal:
  principio 29 (drafts/), sección drafts/ en documentos, y fase 8 con modelo
  híbrido task-planner/epic-decomposer. (este commit)
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
- **Fase 3: Agentes** — software-architect como orquestador con delegación
  genérica. blueprint-compiler (subagent + /compile-blueprint). consistency-
  reviewer actualizado a docs v2 sin dependencias circulares. (b299f5d)
- **Fase 4: Validación y reglas** — validate-blueprint.mjs actualizado a v2
  con mappings 14 phases/docs, gates 8/12/14, schemaVersion 2 y validación
  cruzada de secciones. Reglas de drafts vs docs en workflow.md y agente.
  (024b5a0)
- **Fase 5: Cierre** — Migración v1→v2 (política + script). Tests
  deterministas de validator y migración con 3 fixtures y 7 checks.
  init-software-architect, README y scaffold
  sincronizados. Sin v1 references operativas. (3aa0a4b)
- **Fase 6: Corrección integral de coherencia** — Deadlock fase 11 eliminado
  (blueprint-compiler por modo). Fase 14 unificada en drafts/. Permisos
  restringidos a .devflow/architecture/**. Validator corregido con mapping
  docKey→phaseKey y await. Migración v1→v2 corregida. 15 tests. README,
  scripts, scaffold y contratos alineados. (este commit)
- **Taxonomía de tests** — Suite de software-architect renombrada como tests
  deterministas de herramientas; `make test` ejecuta ambas suites. Alcance y
  exclusiones de runtime documentados en `tests/README.md`. (este commit)
- **Rutas de templates unificadas** — task-planner migrado de
  `$CONFIG_DIR/task-planner/templates/` a
  `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/task-planner/`
  consistente con los demás agentes. `external_directory` con 3 formas
  redundantes (`$HOME/.config`, `$XDG_CONFIG_HOME`, `${...}`).
  (este commit)
- **Permisos edit restringidos** — task-planner pasa de `edit: allow` global
  a solo `.devflow/task-planner/**`. (este commit)
- **Readiness.json version 3.5** — Sincronizado con el validador. (este commit)
- **epic-plan.json schemaVersion 4** — Actualizado en workflow.md. (este commit)

### Removed

- **`templates/task-planner/task-planner.md`** — Definición duplicada del
  agente; la canónica está en `opencode/agents/task-planner.md`. (este commit)
- **`SEMANTIC-CONTRACT.md` y `task-planner.md` del scaffold** — Ya no se
  copian al proyecto. (este commit)

### Fixed

- **required_paths de next-task** — `scripts/validate.sh` ahora incluye
  `templates/next-task/tools/touch-execution-state.mjs`, alineando el listado
  requerido con los runtime tools detectados. (este commit)
- **Validación parcial por gates 8/12/14** — `validate-blueprint.mjs` ahora
  soporta `--gate 8|12|14`, validando solo documentos acumulados hasta esa
  fase. El agente usa ese modo antes de solicitar aprobación humana y mantiene
  el modo sin flags como validador final. (este commit)
- **Schema aplicado a tipos primitivos** — `matchSchema` ahora valida tipos
  primitivos, `const`, `enum`, `oneOf`, arrays y objetos básicos; el scaffold
  inicial reemplaza `null` por strings vacíos donde el schema exige `string`.
  (este commit)
- **Backups de documentos en migración** — `migrate-v1-to-v2.mjs` ahora copia
  cada documento a `.md.v1` antes de renombrarlo. Mensaje final preciso sobre
  qué se respaldó. (este commit)
- **XDG_CONFIG_HOME consistente** — `software-architect.md` y `v1-to-v2-policy.md`
  usan `${XDG_CONFIG_HOME:-$HOME/.config}` en lugar de `$HOME/.config` fijo.
  (este commit)
- **Glob/grep permisivos para descubrimiento** — `software-architect.md` ahora
  permite `glob` y `grep` en todo el proyecto (solo lectura), no solo en
  `.devflow/software-architect/**`. (este commit)
- **Rutas canónicas en inicio del agente** — `software-architect.md` instruye
  leer `.devflow/software-architect/workflow.md` y `project-state.json` con
  ruta completa. (este commit)
- **Template fase 14 con veredicto contractual** — Secciones de Veredicto,
  Resumen de hallazgos, BLOCKING/WARNING/INFO, conteos y checklist. Compatible
  con el contrato de consistency-reviewer. (este commit)
- **needs_revision en documentos** — `project-state.schema.json` y validador
  ahora admiten `needs_revision` como estado de documento. Validación cruzada
  detecta documento `approved` con fase `needs_revision`. (este commit)
- **archive/ y decisions/ en init** — `init-software-architect.md` ahora crea
  `archive/` y `decisions/` si faltan al re-inicializar. (este commit)
- **Init detecta schemaVersion v1** — `init-software-architect.md` ahora
  verifica `schemaVersion` y ofrece instrucción de migración si es v1. (este commit)
- **Validación obligatoria en cierre del agente** — `software-architect.md`
  exige ejecutar `validate-blueprint.mjs` con 0 errores antes de declarar
  terminado el blueprint, y validación parcial antes de gates 8/12/14. (este commit)

- **Validador exige 14 documentos** — Nueva validación que verifica que todas las
  claves de `DOC_KEY_TO_FILENAME` existan en `state.documents`, incluso cuando
  el archivo físico tampoco existe. (este commit)
- **Gates de aprobación 8/12/14** — `validateApprovalGates` ahora exige
  `approved` tanto en fase como en documento; rechaza cualquier otro estado
  (`blocked`, `waiting_for_user`, `needs_revision`). (este commit)
- **Detección de REQ IDs en tablas** — `markdownIds` usa regex sin ancla `^` y
  con flag `g`, encontrando IDs en celdas de tabla Markdown (`| REQ-001 |`).
  (este commit)
- **Migración v1→v2 produce estado válido** — Normaliza `approvedAt` (nunca
  `undefined`), itera sobre las 14 claves de `DOC_KEY_TO_FILENAME`. Eliminada
  constante `NEW_DOC_KEYS` (huérfana). (este commit)
- **Estructura de llaves rota en validateDocExistence** — Las llaves de cierre
  `});` estaban 65 líneas después, atrapando `resolveSchemaPath` y todo el
  validador JSON Schema dentro de un `.then()` callback. Ahora las funciones
  de schema son declaraciones de primer nivel. (este commit)
- **matchSchema compatible con propertyNames** — `matchSchema` ahora verifica
  que `props` exista antes de validar `additionalProperties`, permitiendo
  definiciones como `phases` que usan `propertyNames`/`patternProperties`.
  (este commit)
- **external_directory multi-regla** — `task-planner.md` ahora autoriza
  `$HOME/.config`, `$XDG_CONFIG_HOME` y `${XDG_CONFIG_HOME:-$HOME/.config}`
  para templates globales, eliminando la dependencia de una ruta fija.
  (este commit)

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
