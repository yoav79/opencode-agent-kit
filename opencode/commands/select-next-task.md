---
description: Selecciona la siguiente tarea ejecutable de DevFlow mediante el selector determinista select-next-task.mjs
agent: next-task
subtask: true
---

Selecciona exactamente una tarea ejecutable de DevFlow evaluando el plan
publicado y el estado actual de ejecución mediante el selector determinista.

## Requisitos

- El plan de task-planner debe estar publicado (`.devflow/task-planner/`).
- El espacio de ejecución debe estar inicializado (`.devflow/execution/`).

## Instrucciones

1. Confirma que estás trabajando en la raíz del proyecto actual.

2. Verifica que existe `.devflow/execution/execution-state.json`.
   Si no existe, informa que debes inicializar el espacio de ejecución primero
   y detente.

3. Ejecuta el selector determinista:

   ```bash
   node .devflow/execution/tools/select-next-task.mjs
   ```

4. Responde únicamente con la clasificación resultante.

## Contexto adicional

$ARGUMENTS
