---
description: Construye contexto para la última tarea seleccionada por /select-next-task, sin necesidad de escribir taskId manualmente
agent: context-builder
subtask: true
---

Construye el contexto de ejecución para la última tarea seleccionada. Lee
`selection.json` para obtener el `taskId` y determina el número de intento
desde `execution-state.json`. No requiere escribir el `taskId` manualmente.

## Instrucciones

1. Lee `.devflow/execution/selection.json`.

2. Si no existe, informa que debes ejecutar `/select-next-task` primero y
   detente.

3. Si `classification != TASK_SELECTED`, informa la clasificación y detente.

4. Lee `.devflow/execution/execution-state.json`.

5. Determina el `taskId` desde `selection.selectedTaskId` y el `attempt`
   desde la cantidad de intentos existentes en `execution-state.tasks` para
   esa tarea, más uno. Si no existe entrada, `attempt = 1`.

6. Convierte el intento a nombre con mínimo dos dígitos (ej: `1` → `attempt-01`).

7. Verifica que exista `.devflow/execution/runs/<TASK-ID>/attempt-<NN>/selection.json`.
   Si no existe:
   - Crea el directorio del intento.
   - Copia `.devflow/execution/selection.json` al run como evidencia.
   - Agrega o actualiza la entrada de la tarea en
     `execution-state.json.tasks[]` con `status: reserved`, incrementa
     `revision`, y luego actualiza timestamps con:
     ```
      node $HOME/.config/opencode/templates/execution/tools/touch-execution-state.mjs .devflow/execution/execution-state.json
     ```

8. Continúa con el proceso normal de construcción de contexto usando el
   `taskId` y `attempt` resueltos. Lee el `selection.json` del run (no el
   global), los artefactos del plan, predecesores, repo, etc.

9. Escribe `execution-context.json` y `execution-prompt.md` en el directorio
   del intento.

10. Informa la tarea, intento y clasificación resultante.

## Salida

Para la tarea y el intento resueltos, escribe:

```text
.devflow/execution/runs/<TASK-ID>/attempt-<NN>/execution-context.json
.devflow/execution/runs/<TASK-ID>/attempt-<NN>/execution-prompt.md
```

## Notas

- Este comando automatiza lo que de otro modo sería:
  `/select-next-task` + `/prepare-task-run {...}` + `/build-task-context {...}`
- Si ya existe un run preparado para la tarea, lo reutiliza.
- No modifiques `selection.json` global ni otros artefactos.

## Contexto adicional

$ARGUMENTS
