---
description: Construye contexto para la última tarea seleccionada, delegando en /build-task-context solo si el run ya está preparado
agent: context-builder
subtask: true
---

Wrapper de solo lectura que localiza la última tarea seleccionada y, si el run
ya fue preparado por `/prepare-task-run`, delega en `/build-task-context`.

## Instrucciones

1. Lee `.devflow/execution/selection.json`.

2. Si no existe, informa que debes ejecutar `/select-next-task` primero y
   detente.

3. Si `classification != TASK_SELECTED`, informa la clasificación y detente.

4. Lee `.devflow/execution/execution-state.json`.

5. Determina el `taskId` desde `selection.selectedTaskId`.

6. Busca en `execution-state.tasks[]` una entrada para ese `taskId`. Si no
   existe o su estado no es `reserved`, `running`, `waiting_human` o
   `waiting_external`, informa que primero debe ejecutarse:

   ```text
   /prepare-task-run
   ```

   y detente sin modificar archivos.

7. Determina el `attempt` a partir de la reserva existente. Busca en
   `.devflow/execution/runs/<TASK-ID>/` los directorios `attempt-*` y
   resuelve el intento preparado. Si existe más de un intento o la resolución
   es ambigua (múltiples directorios con `selection.json` válido), falla
   explícitamente con `AMBIGUOUS_ATTEMPT` sin elegir silenciosamente.

8. Si no existe ningún intento preparado, informa:

   ```text
   /prepare-task-run
   ```

   y detente sin modificar archivos.

9. Verifica que exista `.devflow/execution/runs/<TASK-ID>/attempt-<NN>/selection.json`
   y que su contenido coincida con la selección global actual. Si no coincide,
   informa `RUN_CONFLICT` y detente.

10. Una vez resuelto el `taskId` y `attempt`, procede exactamente como
    `/build-task-context` con esos valores: lee el `selection.json` del run
    (no el global), los artefactos del plan, predecesores, repo, etc.

11. Escribe `execution-context.json` y `execution-prompt.md` en el directorio
    del intento.

12. Informa la tarea, intento y clasificación resultante.

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
| `AMBIGUOUS_ATTEMPT` | Existen múltiples intentos preparados y la resolución es ambigua. |
| `RUN_CONFLICT` | La evidencia del run no coincide con la selección global. |

## Notas

- Este comando no ejecuta, simula ni reemplaza `/prepare-task-run`. Si el run
  no está preparado, se detiene y pide ejecutar `/prepare-task-run`.
- No modifica `execution-state.json`, no crea directorios, no copia
  `selection.json`, no reserva tareas, no incrementa intentos ni ejecuta
  transiciones de estado.
- El flujo canónico completo es:
  `/select-next-task` → `/prepare-task-run` → `/build-task-context`

## Contexto adicional

$ARGUMENTS
