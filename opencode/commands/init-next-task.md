---
description: Inicializa o continúa el espacio de ejecución de DevFlow para el proyecto actual
agent: next-task
subtask: false
---

Inicializa el espacio de ejecución de DevFlow para el proyecto ubicado en el
directorio actual usando el agente `next-task`.

## Objetivo

Preparar el directorio `.devflow/execution/` con el estado inicial de ejecución,
los contratos JSON Schema y el validador determinista, sin sobrescribir
información existente.

## Ubicación de plantillas

Las plantillas globales están en:

`${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/next-task/`

Archivos requeridos:

- `execution-state.json`
- `execution-state.schema.json`
- `task-selection.schema.json`
- `selection.json`
- `README.md`
- `tools/validate-next-task.mjs`

No reconstruyas estos archivos desde memoria ni desde contenido embebido en el
comando. Si una plantilla no existe, detén la inicialización e informa cuál
archivo falta.

## Instrucciones

1. Confirma que estás trabajando en la raíz del proyecto actual.

2. Define estas rutas conceptuales:

   - Directorio destino: `.devflow/execution/`
   - Estado destino: `.devflow/execution/execution-state.json`
   - Schema de estado:
     `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/next-task/execution-state.schema.json`
   - Schema de selección:
     `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/next-task/task-selection.schema.json`

3. Revisa si existe el directorio `.devflow/execution/`.

4. Si no existe, crea únicamente esta estructura:

   ```text
   .devflow/execution/
   ├── execution-state.json
   ├── execution-state.schema.json
   ├── task-selection.schema.json
   ├── selection.json
   ├── README.md
   ├── runs/
   └── tools/
       └── validate-next-task.mjs
   ```

5. Para inicializar archivos faltantes:

   - Crea `.devflow/execution/runs/` si no existe.
   - Crea `.devflow/execution/tools/` si no existe.
   - Si `.devflow/execution/execution-state.json` no existe, cópialo desde la
     plantilla global.
   - Si `.devflow/execution/execution-state.schema.json` no existe, cópialo
     desde la plantilla global.
   - Si `.devflow/execution/task-selection.schema.json` no existe, cópialo
     desde la plantilla global.
   - Si `.devflow/execution/selection.json` no existe, cópialo desde la
     plantilla global.
   - Si `.devflow/execution/README.md` no existe, cópialo desde la plantilla
     global.
   - Si `.devflow/execution/tools/validate-next-task.mjs` no existe, cópialo
     desde la plantilla global.
   - Nunca sobrescribas ninguno de estos archivos si ya existe.

6. Cuando se cree `.devflow/execution/execution-state.json` por primera vez:

   - Sustituye `project.id` por un slug derivado del nombre del proyecto.
   - Sustituye `project.planningVersion` por `1`.
   - Sustituye `timestamps.createdAt` y `timestamps.updatedAt` por la fecha
     actual en formato ISO 8601.
   - Conserva el resto de la estructura sin modificaciones.
   - Verifica que el resultado siga siendo JSON válido.

7. Si `.devflow/execution/` ya existe:

   - Lee `.devflow/execution/execution-state.json`.
   - Lee `.devflow/execution/selection.json`.
   - Identifica si el estado de ejecución está inicializado o en progreso.
   - No reinicies el estado.
   - No reemplaces archivos existentes.
   - Solo crea archivos faltantes.

8. Informa al terminar:

   - Si el espacio fue inicializado o reanudado.
   - Los archivos creados.
   - Los archivos existentes leídos.
   - El estado actual de ejecución.

## Notas

- Este comando solo prepara el espacio de ejecución. La selección de tareas
  se realiza invocando directamente al agente `next-task`.
- El plan de task-planner debe estar publicado antes de ejecutar el agente.
- Los schemas JSON son contratos inmutables; no los modifiques.

## Contexto adicional

$ARGUMENTS
