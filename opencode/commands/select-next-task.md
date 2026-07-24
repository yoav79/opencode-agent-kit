---
description: Selecciona la siguiente tarea ejecutable de DevFlow mediante reglas deterministas
agent: next-task
subtask: false
---

Selecciona exactamente una tarea ejecutable de DevFlow evaluando el plan
publicado y el estado actual de ejecución.

## Requisitos

- El plan de task-planner debe estar publicado (`.devflow/task-planner/`).
- El espacio de ejecución debe estar inicializado (`.devflow/execution/`).
- Usa `/init-next-task` si el espacio de ejecución no existe.

## Instrucciones

1. Confirma que estás trabajando en la raíz del proyecto actual.

2. Verifica que existe `.devflow/execution/execution-state.json`.
   Si no existe, informa que debes ejecutar `/init-next-task` primero y detente.

3. Lee los archivos de entrada autorizados y aplica el orden de evaluación
   definido en el contrato del agente.

4. Escribe `.devflow/execution/selection.json` con el resultado.

5. Responde únicamente con la clasificación resultante.

## Contexto adicional

$ARGUMENTS
