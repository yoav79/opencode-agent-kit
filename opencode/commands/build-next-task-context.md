---
description: Construye contexto para la última tarea seleccionada, delegando en /build-task-context solo si el run ya está preparado
agent: context-builder
subtask: true
---

Wrapper de solo lectura que localiza la última tarea seleccionada, resuelve el
run activo exclusivamente desde el estado canónico persistido y, si el run ya
fue preparado por `/prepare-task-run`, delega en `/build-task-context`.

## Instrucciones

1. Lee `.devflow/execution/selection.json`.

2. Si no existe, informa que debes ejecutar `/select-next-task` primero y
   detente.

3. Si `classification != TASK_SELECTED`, informa la clasificación y detente.

4. Lee `.devflow/execution/execution-state.json`.

5. Determina el `taskId` exactamente desde `selection.selectedTaskId`.

6. Busca en `execution-state.tasks[]` exactamente una entrada canónica para ese
   `taskId` (sin ambigüedad por formas equivalentes como `TASK-6` y
   `TASK-006`). Si falta o existen duplicados para la misma identidad, falla con
   `EXECUTION_STATE_INVALID`.

7. Resuelve el run activo solamente desde la entrada de estado canónica:

   - Si `status = reserved`, usa `tasks[].reservation.token`.
   - Si `status` es `running`, `waiting_human` o `waiting_external`, usa
     `tasks[].activeRunId`.
   - No uses directorios históricos, conteos del historial de intentos,
     reconstrucciones retrospectivas ni ninguna otra fuente implícita.

8. Si el estado no contiene una reserva o un run activo persistidos, informa
   que primero debe ejecutarse:

   ```text
   /prepare-task-run
   ```

   y detente sin modificar archivos.

9. Valida el token persistido:

   - permanece dentro de `.devflow/execution/runs/`;
   - corresponde al mismo `taskId`;
   - contiene un `attempt` válido;
   - apunta al run canónico `.devflow/execution/runs/<TASK-ID>/attempt-<NN>`.

    Si el token no cumple el contrato estructural de `execution-state.json`,
    falla con `EXECUTION_STATE_INVALID`. Si supera esa validación pero no
    resuelve el run canónico esperado, falla con `RUN_TOKEN_INVALID`.

10. Verifica que exista `.devflow/execution/runs/<TASK-ID>/attempt-<NN>/selection.json`
    y que su contenido coincida exactamente con la selección global actual. Si
    falta evidencia: falla con `RUN_NOT_PREPARED`. Si la evidencia no coincide:
    falla con `RUN_CONFLICT`.

11. Una vez resuelto el `taskId` y `attempt`, procede exactamente como
     `/build-task-context` con esos valores: lee el `selection.json` del run
     (no el global), los artefactos del plan, predecesores, repo, etc.

12. Delega en:

    ```text
    /build-task-context {"taskId":"<TASK-ID>","attempt":<N>}
    ```

13. Informa la tarea, intento y clasificación resultante.

## Salida

Para la tarea y el intento resueltos, escribe:

```text
.devflow/execution/runs/<TASK-ID>/attempt-<NN>/execution-context.json
.devflow/execution/runs/<TASK-ID>/attempt-<NN>/execution-prompt.md
```

## Errores canónicos

| Código | Significado |
|--------|-------------|
| `SELECTION_NOT_FOUND` | No existe `.devflow/execution/selection.json`. Ejecuta `/select-next-task`. |
| `SELECTION_NOT_TASK_SELECTED` | La selección global no está en estado `TASK_SELECTED`. |
| `RUN_NOT_PREPARED` | La tarea no tiene un run preparado. Ejecuta `/prepare-task-run` primero. |
| `EXECUTION_STATE_INVALID` | `execution-state.json` no resuelve exactamente una entrada canónica para la tarea seleccionada o contiene un token persistido inválido según su contrato estructural. |
| `RUN_TOKEN_INVALID` | El token persistido pasó la validación estructural, pero no resuelve el run canónico esperado. |
| `RUN_CONFLICT` | La evidencia del run no coincide con la selección global. |

## Notas

- Este comando no ejecuta, simula ni reemplaza `/prepare-task-run`. Si el run
  no está preparado, se detiene y pide ejecutar `/prepare-task-run`.
- Los intentos históricos no participan en la resolución. El intento activo se
  toma únicamente del token persistido en `execution-state.json`.
- No modifica `execution-state.json`, no crea directorios, no copia
  `selection.json`, no reserva tareas, no incrementa intentos ni ejecuta
  transiciones de estado.
- El flujo canónico completo es:
  `/select-next-task` → `/prepare-task-run` → `/build-task-context`

## Contexto adicional

$ARGUMENTS
