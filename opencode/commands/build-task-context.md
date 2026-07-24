---
description: Construye el contexto y prompt de ejecución para una tarea e intento explícitos
agent: context-builder
subtask: true
---

Construye el contexto de ejecución usando exclusivamente la entrada JSON
proporcionada en `$ARGUMENTS`.

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

## Precondiciones

Deben existir:

- `.devflow/execution/execution-state.json`;
- una selección válida para la misma tarea;
- `.devflow/task-planner/project-state.json`;
- los artefactos aprobados del plan;
- la tarea indicada por `taskId`.

Si una precondición falla, genera los dos archivos del intento con la
clasificación bloqueante correspondiente cuando el schema de salida esté
disponible. No modifiques los artefactos fuente.

## Salida

Para `TASK-006`, intento `1`, escribe solamente:

```text
.devflow/execution/runs/TASK-006/attempt-01/execution-context.json
.devflow/execution/runs/TASK-006/attempt-01/execution-prompt.md
```

El JSON es la fuente de verdad. El Markdown debe ser una proyección fiel del
JSON y debe bloquear explícitamente la implementación cuando la clasificación
no sea `READY`.

## Argumentos

$ARGUMENTS
