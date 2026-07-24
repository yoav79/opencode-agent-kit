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

### Integración de consistency-reviewer con fase 11 (software-architect)

`software-architect` ahora invoca automáticamente al `consistency-reviewer`
al llegar a la fase 11. Si el veredicto es `BLOCKED`, no avanza a la fase 12.
Se agregó `task: allow` y un procedimiento especial para la fase 11 en el
agente, más condición de salida en `workflow.md`.

- Implementado en: pendiente de commit

</div>

---

## software-architect

---

## task-planner

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Unificar ruta de templates

`task-planner` usa `$CONFIG_DIR/task-planner/templates/` mientras que
`software-architect` y `context-builder` usan
`$CONFIG_DIR/templates/<agente>/`. Unificar.

- **P:** media | **E:** S | **A:** agente, script

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

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Integración con fase 11 del software-architect

El `software-architect` debe invocar automáticamente al
`consistency-reviewer` al llegar a la fase 11 y no avanzar si el
veredicto es `BLOCKED`.

- **P:** alta | **E:** M | **A:** agente

</div>

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
