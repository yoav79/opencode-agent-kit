# Backlog

Features, mejoras y correcciones pendientes organizadas por agente/área.

## Formato

- **P:** Prioridad (alta, media, baja)
- **E:** Esfuerzo estimado (S, M, L, XL)
- **A:** Área (agente, comando, template, tool, script, docs)

---

## <span style="color:#155724">&#x2713; Done</span>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Templates de documento por fase (software-architect)

Creados 12 templates en `templates/software-architect/doc-templates/`
con secciones obligatorias, condicionales y checklist. El agente los lee
desde el directorio global y los usa como estructura base.

- Implementado en: `600b7fc`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Validador determinista validate-blueprint.mjs (software-architect)

Creado `templates/software-architect/tools/validate-blueprint.mjs`.
Verifica: existencia de 12 docs, headings vs templates, consistencia
estado/fase, puertas de aprobación, ADRs, orphan docs, IDs únicos REQ-*.

- Implementado en: `282402a`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Project-state.schema.json (software-architect)

Creado `templates/software-architect/project-state.schema.json`.
Schema JSON Schema draft 2020-12 para validar project-state.json.
Cubre: project, phases, confirmed, documents, architecture, modules,
integrations, entities, risks, assumptions y más.

- Implementado en: `3241aa7`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Workflow paths relativas → absolutas (software-architect)

`workflow.md` cambiado de `docs/XX.md` a `.devflow/software-architect/docs/XX.md`.

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Document.path eliminado (software-architect)

Eliminado `path` de cada entrada en `project-state.json.documents`.
Actualizado schema y validador para computar rutas desde un mapping fijo.

- Implementado en: `28bf30c`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 6 — Corrección integral de coherencia (software-architect)

Deadlock contractual de fase 11 eliminado: blueprint-compiler opera por modo
(technical-requirements/software-blueprint). Fase 14 unificada en drafts/ y
ya no compite entre docs/, drafts/ y review/. Permisos del agente restringidos
a .devflow/software-architect/**. Validador corregido con mapping
docKey→phaseKey y llamadas async completas. Migración v1→v2 corregida (fases
4/11, currentPhase inteligente, timestamp tool, rename explícito de docs).
Nuevos tests de migración real y consistency docKey→phaseKey. README, scripts,
scaffold y contratos alineados.

- Implementado en (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 5 — Cierre (software-architect)

Migración v1→v2 definida (política + script). Tests end-to-end con 3 fixtures
(valid-v2, missing-docs, blocked-review) y 7 tests pasando. init-software-
architect.md, README.md y scaffold sincronizados. Sin referencias v1
operativas en el repositorio.

- **5a.** `templates/software-architect/migration/v1-to-v2-policy.md` + `tools/migrate-v1-to-v2.mjs`
- **5b.** `tests/fixtures/software-architect/` + `tests/test-software-architect.sh`
- **5c.** `opencode/commands/init-software-architect.md` + `README.md`
- Implementado en: `3aa0a4b`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 4 — Validación y reglas (software-architect)

validate-blueprint.mjs actualizado a v2: mappings de 14 phases/docs, gates
8/12/14, schemaVersion 2, nueva validación cruzada de secciones de datos.
Workflow.md regla 7 + agente regla 19: subagentes escriben en drafts/, solo
el orquestador promueve a docs/.

- **4a.** `templates/software-architect/tools/validate-blueprint.mjs`
- **4b.** `templates/software-architect/workflow.md` + `opencode/agents/software-architect.md`
- Implementado en: `024b5a0`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 3 — Agentes (software-architect)

software-architect refactorizado como orquestador con delegación genérica a
subagentes. Creados blueprint-compiler (subagente temp 0) y comando
/compile-blueprint. consistency-reviewer actualizado a docs v2, sin
dependencias circulares ni references a documents.*.path.

- **3a.** `opencode/agents/software-architect.md` — orquestador con delegación
- **3b.** `opencode/agents/blueprint-compiler.md` + `opencode/commands/compile-blueprint.md`
- **3c.** `opencode/agents/consistency-reviewer.md` + `opencode/commands/review-consistency.md`
- Implementado en: `b299f5d`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 2 — Datos y templates (software-architect)

project-state actualizado a schemaVersion 2 con 14 fases, 14 documentos y
5 nuevas secciones de datos. Templates de documento creados/renombrados
para los 14 artefactos del workflow v2. Scaffold y tests actualizados con
directorio `review/`.

- **2a.** `templates/software-architect/project-state.json` + `project-state.schema.json`
- **2b.** 14 templates en `templates/software-architect/doc-templates/`
- **2c.** `scaffold.json` (review/ en dirs) + `test-scripts.sh` (≥14 phases check)
- Implementado en: `fde4110`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 1 — Cimientos (software-architect)

Workflow v2 definido con tabla canónica de 14 fases, tipos, entregables,
gates y dependencias. Contratos de interfaz para blueprint-compiler y
consistency-reviewer publicados.

- **1a.** `templates/software-architect/workflow.md` — 14 fases v2
- **1b.** `templates/software-architect/contracts/blueprint-compiler.md`
- **1b.** `templates/software-architect/contracts/consistency-reviewer.md`
- Implementado en: `1cdccc3`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Integración de consistency-reviewer con fase 11 (software-architect)

`software-architect` ahora invoca automáticamente al `consistency-reviewer`
al llegar a la fase 11. Si el veredicto es `BLOCKED`, no avanza a la fase 12.
Se agregó `task: allow` y un procedimiento especial para la fase 11 en el
agente, más condición de salida en `workflow.md`.

- Implementado en: `a43953c`

</div>

---

## task-planner

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Unificar ruta de templates

`task-planner` usa `$CONFIG_DIR/task-planner/templates/` mientras que
`software-architect` y `context-builder` usan
`$CONFIG_DIR/templates/<agente>/`. Unificar.

- **P:** media | **E:** S | **A:** agente, script

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Subagente para blueprint_consolidation (fase 3)

Crear un subagente determinista (temp 0) para la generación de contratos
semánticos y requirements.json. Aislar esta lógica densa del agente
principal permite reducir pasos y errores.

- **P:** alta | **E:** M | **A:** agente

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Subagente para epic_decomposition (fase 8)

Crear un subagente que descomponga una épica por invocación. El task-planner
lo invoca N veces (una por épica). Reduce la carga del agente principal y
permite procesar épicas en paralelo.

- **P:** alta | **E:** L | **A:** agente

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Duplicate agent definition

`opencode/agents/task-planner.md` y `templates/task-planner/task-planner.md`
son dos versiones del mismo agente con permisos diferentes. Eliminar o
sincronizar para evitar desviación.

- **P:** media | **E:** S | **A:** agente

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Readiness.json version mismatch (3.4 vs 3.5)

El template `readiness.json` declara `"version": "3.4"` pero
`validate-plan.mjs` usa `VALIDATOR_VERSION = "3.5"`. Unificar.

- **P:** media | **E:** S | **A:** template, tool

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Project-state.schema.json para task-planner

Crear un schema JSON para `project-state.json` del task-planner, similar
al que ya tiene `software-architect`. La estructura es compleja
(approvals, artifacts, progress, 20+ contadores).

- **P:** media | **E:** S | **A:** template

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Template task-planner.md sin shared timestamp tool

`templates/task-planner/task-planner.md` no incluye
`"node $HOME/.config/opencode/templates/shared/tools/timestamp.mjs *": allow`
mientras que los otros agentes ya lo tienen. Agregarlo.

- **P:** media | **E:** S | **A:** agente

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### build-epic-graph.mjs sin tests

`validate-plan.mjs` y `update-timestamps.mjs` tienen archivos `.test.mjs`.
`build-epic-graph.mjs` no.

- **P:** baja | **E:** M | **A:** tool, test

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### SEMANTIC-CONTRACT.md en inglés

Único archivo en inglés en todo el repositorio. Pasarlo a español o
eliminarlo si su contenido ya está cubierto en el workflow.

- **P:** baja | **E:** S | **A:** docs

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### validate-plan.mjs refactor

5071 líneas en un solo archivo. Dividir en módulos separados por
dominio de validación (semántica, dependencias, capacidades, etc.).

- **P:** baja | **E:** XL | **A:** tool

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### task-planner.md copiado al proyecto

`scaffold.json` incluye `task-planner.md` en `files`, copiando 1080
líneas del agente al proyecto como `.devflow/task-planner/task-planner.md`.
Evaluar si es necesario o si se puede eliminar del scaffold.

- **P:** baja | **E:** S | **A:** template

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Falta task: allow en task-planner

Actualmente `task: deny`. Si vamos a crear subagentes para fases 3 y 8,
necesita `task: allow`. También permitiría invocar al consistency-reviewer
u otros validadores externos.

- **P:** media | **E:** S | **A:** agente

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Init command con versiones hardcodeadas

`init-task-planner.md` tiene un contrato de 10 versiones (schemaVersion,
workflowVersion, validatorVersion, epicGraphVersion, timestampToolVersion,
etc.) que debe coincidir manualmente con los templates. No hay verificación
automática de que las versiones del comando coincidan con las plantillas.

- **P:** media | **E:** S | **A:** comando, tool

</div>

---

## next-task

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Hacer que mode: primary funcione sin comando

Actualmente `next-task` se invoca únicamente mediante comandos
(`/select-next-task`, `/prepare-task-run`). Debería poder invocarse
directamente como agente primario.

- **P:** media | **E:** S | **A:** agente, comando

</div>

---

## context-builder

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Validador determinista validate-execution-context.mjs

Similar a `validate-next-task.mjs`. Debe verificar que
`execution-context.json` cumple su schema, los hashes coinciden, y el
prompt Markdown es consistente con el JSON.

- **P:** media | **E:** M | **A:** template, tool

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Revisar permisos de read

`context-builder` tiene `"*": allow` en read. Sería más seguro
restringirlo a `.devflow/` y archivos de repo necesarios (manifiestos,
git).

- **P:** baja | **E:** M | **A:** agente

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Patrón `**` en permisos

OpenCode no soporta `**` (globstar). Se cambió a `*` en la última
revisión. Verificar que `*` alcanza para los templates.

- **P:** media | **E:** S | **A:** agente

</div>

---

## consistency-reviewer

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Reporte con schema JSON

Además del reporte Markdown, producir un `review-report.json` con schema
validable para que herramientas externas puedan procesar los hallazgos.

- **P:** baja | **E:** S | **A:** template

</div>

---

## general (multi-agente)

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Integración con DevFlow real

Los artefactos se generan en `.devflow/` pero no hay un conector que
envíe las tareas a un sistema DevFlow real. `task-plan.json` y los
archivos en `tasks/` son el contrato de salida, pero falta el paso de
publicación.

- **P:** alta | **E:** XL | **A:** agente, tool

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Agregar test para validate-next-task.mjs

`validate-plan.mjs` y `update-timestamps.mjs` tienen tests.
`validate-next-task.mjs` no.

- **P:** media | **E:** M | **A:** tool, test

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Normalizar nombres de clasificaciones

`next-task` usa `TASK_SELECTED`, `NO_READY_TASK`, etc. `context-builder`
usa `READY`, `PLAN_DEFECT`, etc. `consistency-reviewer` usa `BLOCKING`,
`WARNING`, `INFO`. Definir un vocabulario compartido entre agentes de
ejecución y revisión.

- **P:** baja | **E:** S | **A:** agente

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### README: documentar schemas y contratos

Los schemas JSON (`execution-state.schema.json`,
`task-selection.schema.json`, `execution-context.schema.json`) no están
documentados. Incluir un diagrama de contratos.

- **P:** baja | **E:** M | **A:** docs

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Modo dry-run para init-*

Los comandos `/init-*` modifican archivos sin confirmación. Soportar un
flag `--dry-run` para mostrar qué harían sin escribirlo.

- **P:** baja | **E:** M | **A:** comando

</div>

---

## scripts

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### generate-scaffold.sh: rutas hardcodeadas

El script tiene valores fijos en el mapa `scaffolds`. No detecta
automáticamente nuevos agentes agregados al directorio `templates/`.

- **P:** baja | **E:** S | **A:** script

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### create-project.sh: directory con ruta anidada

`scaffold.json` usa `".devflow/execution"` como `directory`.
`create-project.sh` crea `project_path / dir_name`. Con rutas anidadas
funciona porque usa `mkdir -p`, pero verificar que el `AGENTS.md` y
`project-state.json` se generan en la ubicación correcta.

- **P:** baja | **E:** S | **A:** script

</div>
