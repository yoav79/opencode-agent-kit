# Epic Decomposer — Contrato de interfaz

## Invocación
- `task` desde `task-planner` en fase `epic_decomposition`
- Modo: subagent | Temperatura: 0

## Inputs requeridos

El task-planner debe proveer los siguientes inputs en el prompt de invocación:

| Input | Ruta |
|-------|------|
| `currentEpicId` | Identificador de la épica a descomponer |
| Archivo de la épica actual | `.devflow/task-planner/epics/<EPIC-ID>.md` |
| Capacidades de la épica | Las entradas de `capability-map.json` cuyo `ownerEpicId = currentEpicId` |
| Contrato semántico | `.devflow/task-planner/semantic-contract.json` |
| Requisitos | `.devflow/task-planner/requirements.json` |
| Blueprint resuelto | `.devflow/task-planner/SOFTWARE-BLUEPRINT-RESOLVED.md` |
| Estrategia de construcción | `.devflow/task-planner/construction-strategy.md` |
| Decisiones | `.devflow/task-planner/decisions.json` |
| Plan de tareas existente | `.devflow/task-planner/task-plan.json` |
| Mapa preasignado | `capabilityId -> taskId` para mantener identidades estables entre invocaciones |

## Outputs

Todos los outputs se escriben dentro de `.devflow/task-planner/drafts/`:

| Output | Descripción |
|--------|-------------|
| `drafts/TASK-<ID>.md` | Un archivo Markdown por tarea generada |
| `drafts/<EPIC-ID>.task-plan.partial.json` | Fragmento de `task-plan.json` con las tareas de esta épica (array `tasks`) |
| `drafts/<EPIC-ID>.result.json` | Resumen estructurado para que el orquestador promueva: `{ epicId, createdTaskIds, capabilityAssignments: { [capabilityId]: taskId }, epicUpdates: { taskIds, decomposed } }` |

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
- No decidir dependencias entre épicas ni modificar el grafo de épicas
- No invocar herramientas `bash`, `task`, `webfetch` ni `websearch`

## Criterios de bloqueo

- El archivo `<EPIC-ID>.md` no existe en `epics/`
- `currentEpicId` no existe en `epic-plan.json`
- Las capacidades asignadas a la épica no existen en `capability-map.json`
- `semantic-contract.json` no está en estado `approved`
- Falta uno o más inputs requeridos
- Contradicción explícita entre dos o más inputs
- La épica ya está marcada como `decomposed = true`

## Responsabilidad del orquestador

El task-planner (orquestador) es responsable de:

1. Proveer todos los inputs requeridos
2. Leer `result.json` después de `GENERATED`
3. Promover cada `TASK-*.md` de `drafts/` a `tasks/`
4. Fusionar `task-plan.partial.json` en `task-plan.json`
5. Actualizar `epic-plan.json` (taskIds, decomposed)
6. Actualizar `capability-map.json` (ownerTaskId)
7. Actualizar `project-state.json`
8. Ejecutar `build-epic-graph.mjs` tras cada promoción
9. Manejar `BLOCKED` informando al usuario
