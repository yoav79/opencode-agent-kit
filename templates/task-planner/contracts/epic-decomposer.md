# Epic Decomposer — Contrato de interfaz

## Invocación
- `task` desde `task-planner` en fase `epic_decomposition`
- Modo: subagent | Temperatura: 0

## Rol acotado

`epic-decomposer` es un subagente minimalista de enriquecimiento delegado.
Opera sobre una sola épica y consume un skeleton semántico ya ensamblado por el
principal y sus tools.

Sí hace:

- Leer la épica actual y su `task-batch.json`
- Redactar `drafts/TASK-<ID>.md` consistentes con el skeleton recibido
- Escribir `drafts/<EPIC-ID>.result.json`
- Devolver `GENERATED` o `BLOCKED`

No hace:

- Reservar IDs
- Componer semántica canónica
- Recalcular dependencias de épicas o `dependencyIds`
- Regenerar `task-plan.partial.json`
- Cambiar índices, estados o archivos globales

## Inputs requeridos

El task-planner debe proveer los siguientes inputs en el prompt de invocación:

| Input | Ruta |
|-------|------|
| `currentEpicId` | Identificador de la épica a descomponer |
| Archivo de la épica actual | `.devflow/task-planner/epics/<EPIC-ID>.md` |
| Skeleton semántico preconstruido | `.devflow/task-planner/drafts/<EPIC-ID>.task-batch.json` (behaviorIds, semanticKeys, requirementCoverage, IDs SCOPE-* y AC-* ya resueltos por `assemble-epic-task-batch.mjs`) |
| Capacidades de la épica | Las entradas de `capability-map.json` cuyo `ownerEpicId = currentEpicId` |
| Contrato semántico | `.devflow/task-planner/semantic-contract.json` |
| Requisitos | `.devflow/task-planner/requirements.json` |
| Blueprint resuelto | `.devflow/task-planner/SOFTWARE-BLUEPRINT-RESOLVED.md` |
| Estrategia de construcción | `.devflow/task-planner/construction-strategy.md` |
| Decisiones | `.devflow/task-planner/decisions.json` |
| Mapa preasignado | `capabilityId -> taskId` (persistido por `reserve-task-ids.mjs`) |

## Outputs delegados

Todos los outputs se escriben dentro de `.devflow/task-planner/drafts/`.

El archivo `task-plan.partial.json` ya fue generado por
`assemble-epic-task-batch.mjs` antes de la invocación del subagente. El
subagente no lo regenera ni lo modifica. Solo escribe los siguientes archivos:

| Output | Descripción |
|--------|-------------|
| `drafts/TASK-<ID>.md` | Un archivo Markdown por tarea. Copia `behaviorIds`, `semanticKeys`, `sourceFunctionIds` y `backendBindings` exactamente desde el skeleton del `task-batch.json` |
| `drafts/<EPIC-ID>.result.json` | Resumen estructurado delegado para que el orquestador promueva: `{ epicId, createdTaskIds, capabilityAssignments: { [capabilityId]: taskId }, epicUpdates: { taskIds, decomposed } }` |

## Return codes

- `GENERATED` — drafts creados en `.devflow/task-planner/drafts/`
- `BLOCKED` — faltan inputs, hay contradicciones, o la épica no puede descomponerse

## Estructura de cada Task Markdown

```
## Objetivo
## Alcance
## Fuera de alcance
## Criterios de aceptación
## Pruebas
## Contrato semántico
```

El bloque `## Contrato semántico` debe contener JSON válido con:

```json
{
  "behaviorIds": ["BEH-..."],
  "semanticKeys": ["..."],
  "sourceFunctionIds": ["FUN-..."],
  "backendBindings": ["..."]
}
```

Los IDs `SCOPE-*` y `AC-*` deben existir literalmente en el Markdown.

## Formato del result.json

```json
{
  "epicId": "EPIC-...",
  "status": "generated",
  "createdTaskIds": ["TASK-..."],
  "capabilityAssignments": {
    "CAP-...": "TASK-..."
  },
  "epicUpdates": {
    "taskIds": ["TASK-..."],
    "decomposed": true
  },
  "decomposedCapabilities": ["CAP-..."],
  "summary": {
    "totalTasks": 3,
    "functionalTasks": 2,
    "enablingTasks": 1
  }
}
```

## Prohibiciones

- No interactuar con el usuario
- No modificar `task-plan.json`, `epic-plan.json`, `capability-map.json`, `project-state.json`, `readiness.json`, ni `validation-report.md`
- No modificar archivos fuera de `.devflow/task-planner/drafts/`
- No aprobar fases ni cambiar estados
- No decidir dependencias entre épicas, no recalcular `dependencyIds` ni modificar el grafo de épicas
- No reservar IDs `TASK-*`, `SCOPE-*` o `AC-*`
- No recomponer `behaviorIds`, `semanticKeys` ni `requirementCoverage`
- No invocar herramientas `bash`, `task`, `webfetch` ni `websearch`

## Criterios de bloqueo

- El archivo `<EPIC-ID>.md` no existe en `epics/`
- Las capacidades asignadas a la épica no existen en `capability-map.json`
- `semantic-contract.json` no está en estado `approved`
- Falta uno o más inputs requeridos
- Contradicción explícita entre dos o más inputs
- La épica ya está marcada como `decomposed = true`

Las validaciones globales de existencia de la épica en `epic-plan.json` y de
consistencia del estado general del plan corresponden al task-planner
principal antes de delegar.

## Responsabilidad del orquestador

El task-planner (orquestador) es responsable de:

1. Ejecutar `reserve-task-ids.mjs` y `assemble-epic-task-batch.mjs` antes de invocar al subagente
2. Reservar los IDs y persistir el mapa `capabilityId -> taskId`
3. Componer la semántica canónica de la épica y congelarla en `task-batch.json`
4. Proveer todos los inputs requeridos, incluyendo el `task-batch.json`
5. Leer `result.json` después de `GENERATED`
6. Promover cada `TASK-*.md` de `drafts/` a `tasks/`
7. Fusionar `drafts/<EPIC-ID>.task-plan.partial.json` (pre-generado por la herramienta) en `task-plan.json`
8. Actualizar `epic-plan.json` (taskIds, decomposed)
9. Actualizar `capability-map.json` (ownerTaskId)
10. Recalcular dependencias e índices globales cuando corresponda
11. Actualizar `project-state.json`
12. Manejar `BLOCKED` informando al usuario

`build-epic-graph.mjs` no forma parte de la promoción por épica.
El orquestador lo ejecuta una sola vez al terminar la descomposición
completa de todas las épicas, no tras cada promoción individual.
