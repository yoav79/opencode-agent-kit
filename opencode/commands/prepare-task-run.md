---
description: Prepara un run de ejecución: crea el directorio y registra la tarea en el estado de ejecución
agent: next-task
subtask: true
---

Prepara un run de ejecución para una tarea ya seleccionada. Crea el directorio
del intento, copia la selección como evidencia y registra la tarea en
`execution-state.json`.

Este comando es el paso entre `/select-next-task` y `/build-task-context`.

## Entrada obligatoria

El argumento debe tener exactamente esta forma:

```json
{
  "taskId": "TASK-006",
  "attempt": 1
}
```

Ejemplo:

```text
/prepare-task-run {"taskId":"TASK-006","attempt":1}
```

## Instrucciones

1. Valida la entrada: deben existir `taskId` (patrón `TASK-*`) y `attempt`
   (entero >= 1). Sin propiedades adicionales.

2. Convierte el intento a un nombre con mínimo dos dígitos:

   - `1` → `attempt-01`
   - `9` → `attempt-09`
   - `10` → `attempt-10`

3. Lee `.devflow/execution/selection.json`.

   - Si no existe, detente: ejecuta `/select-next-task` primero.
   - Si `classification != TASK_SELECTED`, detén e informa la clasificación.
   - Si `selectedTaskId` no equivale numéricamente al `taskId` recibido,
     detén e informa el mismatch.

4. Lee `.devflow/execution/execution-state.json`.

5. Crea el directorio del intento:

   ```
   .devflow/execution/runs/<TASK-ID>/attempt-<NN>/
   ```

   Si ya existe, verifica que `execution-state.json` tenga una entrada para
   esa tarea. Si la tiene, el run ya fue preparado — informa y termina.

6. Copia la selección como evidencia inmutable:

   ```
   cp .devflow/execution/selection.json .devflow/execution/runs/<TASK-ID>/attempt-<NN>/selection.json
   ```

7. Actualiza `execution-state.json`:

   - Agrega o actualiza la entrada de la tarea en `tasks[]`:
     ```json
     {
       "taskId": "<TASK-ID>",
       "status": "reserved",
       "attemptCount": 0,
       "maxAttempts": "<policy.defaultMaxAttempts>",
       "activeRunId": null,
       "reservation": null,
       "blocker": null,
       "lastResult": null,
       "updatedAt": null
     }
     ```
   - Incrementa `revision` en 1.
   - Después de escribir el JSON, ejecuta:
     ```
     node $HOME/.config/opencode/templates/next-task/tools/touch-execution-state.mjs .devflow/execution/execution-state.json
     ```
   - No escribas fechas manualmente. El timestamp tool actualiza `updatedAt`
     sin agregar `timestamps.contentHash`.

8. Verifica que el directorio existe y contiene `selection.json`.

9. Informa:

   - Tarea e intento preparados.
   - Ruta del run.
   - Nueva revision del estado.

## Notas

- Este comando no selecciona la tarea. Usa `/select-next-task` primero.
- Este comando no construye el contexto. Usa `/build-task-context` después.
- No modifiques `selection.json` global ni otros artefactos del plan.

## Contexto adicional

$ARGUMENTS
