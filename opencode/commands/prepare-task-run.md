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

## Dependencia de next-task

Antes de ejecutar el wrapper, deben existir estas rutas instaladas por
`/init-next-task`:

- `.devflow/execution/selection.json`
- `.devflow/execution/task-selection.schema.json`
- `.devflow/execution/tools/select-next-task.mjs`
- `.devflow/execution/tools/validate-next-task.mjs`

## Instrucciones

1. Valida la entrada:

   - sin argumentos; o
   - un objeto con exactamente una propiedad opcional `attempt`.

   Si `attempt` existe, debe ser un entero `>= 1`.
   Si aparece `taskId`, detén la ejecución.

2. Verifica que existen:

   - `.devflow/execution/tools/prepare-task-run.mjs`
   - `.devflow/execution/tools/execution-transition-engine.mjs`
   - `.devflow/execution/tools/execution-contract-helpers.mjs`
   - `.devflow/shared/tools/devflow-runtime-helpers.mjs`
   - todas las rutas listadas en `Dependencia de next-task`

   Si falta cualquiera, detén la ejecución e informa la ruta exacta faltante.

3. Ejecuta el tool local del proyecto, no reimplementes la lógica a mano:

   ```bash
   node .devflow/execution/tools/prepare-task-run.mjs [--attempt N]
   ```

4. El wrapper valida primero que el runtime de `next-task` esté instalado.
   Solo después delega en el motor transaccional que:

    - Lee `selection.json` como entrada no confiable y valida
      `classification === TASK_SELECTED`, `selectedTaskId` canónico y
      `sourceSnapshot.executionStateRevision` entero no negativo.
    - Adquiere un lock exclusivo entre procesos.
    - Relee `selection.json` y `execution-state.json` bajo lock.
    - Valida cualquier `transition-journal.json` contra
      `transition-journal.schema.json` y reglas canónicas adicionales.
    - Detecta y recupera transiciones incompletas solo si journal, evidencia,
      digest, revisión y estado son coherentes.
    - Si la revisión de la selección no coincide con el estado actual,
      responde `STALE_SELECTION` sin crear archivos.
    - Si la selección es inválida, responde `SELECTION_INVALID` sin mutar estado.
    - Si la evidencia del intento ya existe y coincide, responde
      `IDEMPOTENT` solo cuando estado, token, intento y evidencia coinciden.
    - Determina el número de intento: usa `--attempt` si se proporcionó,
      o `max(existing)+1` desde `runs/<TASK-ID>/`.
    - Crea el directorio `.devflow/execution/runs/<TASK-ID>/attempt-<NN>/`.
    - Copia `selection.json` como evidencia inmutable.
    - Actualiza `execution-state.json` (revision+1, reservation, timestamps).
    - Escribe journal, evidencia y estado mediante archivos temporales + rename atómico.
    - No limpia el journal antes de validar completamente path, digest,
      evidencia, token, revisiones y estado.
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
| `SELECTION_INVALID` | 1 | `selection.json` no es canónico o verificable |
| `STALE_SELECTION` | 1 | La selección ya no corresponde a la revisión actual |
| `RUN_CONFLICT` | 1 | Conflicto (tarea no reservable, evidencia diferente, etc.) |
| `JOURNAL_INVALID` | 1 | El journal existe pero no cumple el contrato |
| `JOURNAL_CONFLICT` | 1 | El journal es válido pero no es recuperable de forma segura |
| `LOCK_FAILED` / `LOCK_TIMEOUT` / `LOCK_INVALID` | 2 | Error interno o lock no utilizable |

## Notas

- Este comando no selecciona la tarea. Usa `/select-next-task` primero.
- Este comando no construye el contexto. Usa `/build-task-context` después.
- No modifiques `selection.json` global ni otros artefactos del plan.
- Reserva no es ejecución: `attemptCount` no se incrementa durante `prepare`.
- El wrapper debe fallar con error claro si faltan `selection.json`,
  `task-selection.schema.json` o las herramientas de selección.
- El motor asegura la liberación del lock incluso ante errores.
- El motor no puede recuperar una transición sin evidencia verificable o una
  intención verificable vía journal canónico.

## Contexto adicional

$ARGUMENTS
