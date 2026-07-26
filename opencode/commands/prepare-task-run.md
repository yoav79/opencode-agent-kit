---
description: Prepara un run de ejecución: crea el directorio y registra la tarea en el estado de ejecución
agent: general
subtask: true
---

Prepara un run de ejecución para la tarea actualmente seleccionada. El motor
transaccional lee `selection.json`, adquiere un lock exclusivo, valida el
estado, crea el directorio del intento, copia la selección como evidencia y
registra la reserva en `execution-state.json` mediante una transacción atómica.

Este comando es el paso entre `/select-next-task` y `/build-task-context`. No
selecciona tareas ni construye contexto.

## Entrada admitida

Sin argumentos:

```text
/prepare-task-run
```

Con argumento opcional:

```json
{
  "attempt": 2
}
```

No aceptes `taskId` ni otras propiedades.

Ejemplos:

```text
/prepare-task-run
/prepare-task-run {"attempt":2}
```

## Instrucciones

1. Valida la entrada:

   - sin argumentos; o
   - un objeto con exactamente una propiedad opcional `attempt`.

   Si `attempt` existe, debe ser un entero `>= 1`.
   Si aparece `taskId`, detén la ejecución.

2. Verifica que existe `.devflow/execution/tools/prepare-task-run.mjs`.

3. Ejecuta el tool local del proyecto, no reimplementes la lógica a mano:

   ```bash
   node .devflow/execution/tools/prepare-task-run.mjs [--attempt N]
   ```

4. El tool delega en el motor transaccional que:

   - Lee y valida `selection.json`.
   - Verifica `classification === TASK_SELECTED` y `selectedTaskId` presente.
   - Adquiere un lock exclusivo entre procesos.
   - Relee `execution-state.json` bajo lock.
   - Detecta y recupera transiciones incompletas (journal pendiente).
   - Si la revisión de la selección no coincide con el estado actual,
     responde `STALE_SELECTION` sin crear archivos.
   - Si la evidencia del intento ya existe y coincide, responde
     `IDEMPOTENT` sin modificar estado.
   - Determina el número de intento: usa `--attempt` si se proporcionó,
     o `max(existing)+1` desde `runs/<TASK-ID>/`.
   - Crea el directorio `.devflow/execution/runs/<TASK-ID>/attempt-<NN>/`.
   - Copia `selection.json` como evidencia inmutable.
   - Actualiza `execution-state.json` (revision+1, reservation, timestamps).
   - Todo mediante archivos temporales + rename atómico.
   - Libera el lock.

5. Informa el resultado canónico:

   ```json
   {
     "classification": "RUN_PREPARED",
     "taskId": "TASK-006",
     "attempt": 1,
     "runPath": ".devflow/execution/runs/TASK-006/attempt-01",
     "previousRevision": 4,
     "newRevision": 5,
     "recovered": false,
     "idempotent": false
   }
   ```

## Clasificaciones de salida

| Clasificación | Exit code | Significado |
|---|---|---|
| `RUN_PREPARED` | 0 | Run preparado exitosamente |
| `IDEMPOTENT` | 0 | El run ya estaba preparado, no se modificó nada |
| `RECOVERED` | 0 | Run recuperado desde journal incompleto |
| `STALE_SELECTION` | 1 | La selección ya no corresponde a la revisión actual |
| `RUN_CONFLICT` | 1 | Conflicto (tarea no reservable, evidencia diferente, etc.) |
| `LOCK_FAILED` / `LOCK_TIMEOUT` | 2 | Error interno, lock no disponible |

## Notas

- Este comando no selecciona la tarea. Usa `/select-next-task` primero.
- Este comando no construye el contexto. Usa `/build-task-context` después.
- No modifiques `selection.json` global ni otros artefactos del plan.
- Reserva no es ejecución: `attemptCount` no se incrementa durante `prepare`.
- El motor asegura la liberación del lock incluso ante errores.

## Contexto adicional

$ARGUMENTS
