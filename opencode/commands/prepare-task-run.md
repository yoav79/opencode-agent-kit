---
description: Prepara un run de ejecución: crea el directorio y registra la tarea en el estado de ejecución
agent: general
subtask: true
---

Prepara un run de ejecución para la tarea actualmente seleccionada. Lee
`selection.json` como fuente de verdad, crea el directorio del intento, copia
la selección como evidencia y registra la reserva en `execution-state.json`.

Este comando no usa `next-task`; queda pendiente moverlo a un orquestador de
ejecución, run-preparer o script determinista dedicado.

Este comando es el paso entre `/select-next-task` y `/build-task-context`.

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

3. Lee `.devflow/execution/selection.json`.

   - Si no existe, informa `SELECTION_NOT_FOUND`.
   - Si `classification != TASK_SELECTED`, informa `SELECTION_NOT_TASK_SELECTED`.
   - Si `selectedTaskId` es `null`, informa `SELECTION_NOT_TASK_SELECTED`.

4. Lee `.devflow/execution/execution-state.json`.

5. Si el argumento incluye `attempt`, usa exactamente ese número.

6. Si no incluye `attempt`, resuélvelo de forma determinista desde
   `.devflow/execution/runs/<TASK-ID>/`:

   - si no hay intentos existentes: `attempt = 1`;
   - si los hay: `attempt = max(existing) + 1`.

7. Convierte el intento a un nombre con mínimo dos dígitos:

   - `1` → `attempt-01`
   - `9` → `attempt-09`
   - `10` → `attempt-10`

8. Si el `attempt` explícito ya existe en
   `.devflow/execution/runs/<TASK-ID>/attempt-<NN>/selection.json` y la
   evidencia es idéntica a la selección global actual:

   - no crees otro intento;
   - no vuelvas a reservar;
   - devuelve el mismo resultado `prepared`.

   Si el directorio existe pero la evidencia difiere, informa `RUN_CONFLICT`.

9. Antes de reservar, exige que
   `selection.sourceSnapshot.executionStateRevision == execution-state.revision`.

   Si no coincide, no crees el run, no toques el estado e informa
   `STALE_SELECTION`.

10. Ejecuta el tool local del proyecto, no reimplementes la lógica a mano:

    ```bash
    node .devflow/execution/tools/prepare-task-run.mjs [--attempt N]
    ```

11. El tool debe crear, cuando corresponda:

    ```
    .devflow/execution/runs/<TASK-ID>/attempt-<NN>/
    ```

12. El tool debe copiar la selección global como evidencia inmutable:

    ```
    .devflow/execution/runs/<TASK-ID>/attempt-<NN>/selection.json
    ```

13. El tool debe actualizar `execution-state.json` así:

   - agrega o actualiza la entrada de la tarea en `tasks[]`;
   - `status: "reserved"`;
   - `attemptCount`: no se incrementa en esta fase de reserva;
   - `maxAttempts`: conserva el existente o usa `policy.defaultMaxAttempts`;
   - `activeRunId: null`;
   - `reservation`: persistida con `stateRevision` igual a
     `selection.sourceSnapshot.executionStateRevision`;
   - `updatedAt: null`.

   Ejemplo mínimo:

      ```json
      {
        "taskId": "<TASK-ID>",
        "status": "reserved",
        "attemptCount": 0,
        "maxAttempts": "<policy.defaultMaxAttempts>",
        "activeRunId": null,
        "reservation": {
          "token": "<RUN-PATH>",
          "reservedAt": "<timestamp-oficial>",
          "stateRevision": "<selection.sourceSnapshot.executionStateRevision>"
        },
        "blocker": null,
        "lastResult": null,
        "updatedAt": null
      }
      ```

   - incrementa `revision` en `1`;
   - obtiene el timestamp con el tool oficial compartido, no escribas fechas manualmente;
   - después de escribir el JSON, actualiza timestamps con el tool oficial de execution:

      ```
      node .devflow/execution/tools/touch-execution-state.mjs .devflow/execution/execution-state.json <fecha-iso>
      ```

14. Verifica que el directorio existe y contiene `selection.json`.

15. Informa solo:

   - `taskId`
   - `attempt`
   - `runPath`
   - `newRevision`
   - `status: prepared`

## Notas

- Este comando no selecciona la tarea. Usa `/select-next-task` primero.
- Este comando no construye el contexto. Usa `/build-task-context` después.
- No modifiques `selection.json` global ni otros artefactos del plan.
- Reserva no es ejecución: `attemptCount` aumenta después, cuando el run
  realmente empieza o termina, no durante `prepare`.

## Contexto adicional

$ARGUMENTS
