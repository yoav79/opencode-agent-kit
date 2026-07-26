---
description: Construye el contexto y prompt de ejecución para una tarea e intento explícitos en un run ya preparado
agent: context-builder
subtask: true
---

Construye el contexto de ejecución para una tarea e intento explícitos, dentro
de un run que ya fue preparado por `/prepare-task-run`.

## Entrada obligatoria

El argumento debe tener exactamente esta forma:

```json
{
  "taskId": "TASK-006",
  "attempt": 1
}
```

Ejemplo de uso:

```text
/build-task-context {"taskId":"TASK-006","attempt":1}
```

No selecciones una tarea, no uses la primera tarea pendiente y no sustituyas el
`taskId` recibido por el de `selection.json`.

## Flujo

1. Lee `.devflow/execution/execution-state.json`.
2. Lee `.devflow/task-planner/project-state.json` y los artefactos aprobados del plan.
3. Resuelve la ruta del run: `.devflow/execution/runs/<TASK-ID>/attempt-<NN>/`.
4. Confirma que el directorio del run existe. Si no: falla con `RUN_NOT_PREPARED`.
5. Lee `selection.json` dentro del directorio del run. Si no existe: falla con `RUN_NOT_PREPARED`.
6. Valida coherencia entre `taskId`, `attempt`, la reserva en `selection.json` y la entrada en `execution-state.json`.
   Si la tarea no está reservada o activa (`reserved`, `running`, `waiting_human`, `waiting_external`): falla con `RUN_NOT_RESERVED`.
   Si la evidencia no coincide con la tarea solicitada: falla con `SELECTION_TASK_MISMATCH`.
7. Lee la tarea indicada por `taskId`, predecesores, repo y demás fuentes.
8. Construye `execution-context.json` y `execution-prompt.md`.

## Precondiciones

Deben existir:

- `.devflow/execution/execution-state.json`;
- el directorio del intento creado por el orquestador;
- `selection.json` copiado dentro de ese intento;
- `.devflow/task-planner/project-state.json`;
- los artefactos aprobados del plan;
- la tarea indicada por `taskId`.

No uses `.devflow/execution/selection.json` como fallback. Si el directorio del
intento o su `selection.json` no existen, detente sin escribir: el orquestador
no preparó el run. Para otros defectos, genera los dos archivos con la
clasificación bloqueante correspondiente cuando el schema esté disponible.

## Salida

Para `TASK-006`, intento `1`, escribe solamente:

```text
.devflow/execution/runs/TASK-006/attempt-01/execution-context.json
.devflow/execution/runs/TASK-006/attempt-01/execution-prompt.md
```

El JSON es la fuente de verdad. El Markdown debe ser una proyección fiel del
JSON y debe bloquear explícitamente la implementación cuando la clasificación
no sea `READY`.

## Errores canónicos

| Código | Significado |
|--------|-------------|
| `RUN_NOT_PREPARED` | El directorio del run o su `selection.json` no existen. Ejecuta `/prepare-task-run` primero. |
| `RUN_NOT_RESERVED` | La tarea existe en el run pero no está reservada o activa en `execution-state.json`. |
| `SELECTION_TASK_MISMATCH` | La evidencia del run corresponde a otra tarea. |

## Argumentos

$ARGUMENTS
