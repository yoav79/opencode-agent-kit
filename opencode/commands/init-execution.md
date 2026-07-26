---
description: Inicializa el espacio de ejecución de DevFlow (`.devflow/execution/`) con estado mutable, contratos y herramientas de orquestación
agent: general
subtask: true
---

Inicializa el espacio de ejecución de DevFlow para el proyecto ubicado en el
directorio actual. Este comando instala exclusivamente archivos de
orquestación y estado mutable de ejecución.

Para verificar la instalación usa `validate-next-task.mjs`.

## Objetivo

Preparar el directorio `.devflow/execution/` con el estado inicial de ejecución,
los contratos JSON Schema y el validador determinista, sin sobrescribir
información existente.

## Ubicación de plantillas

Las plantillas globales están en:

- `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/execution/` (estado mutable y herramientas de orquestación)

Archivos requeridos:

- `execution-state.json`
- `execution-state.schema.json`
- `README.md`
- `tools/touch-execution-state.mjs`

No reconstruyas estos archivos desde memoria ni desde contenido embebido en el
comando. Si una plantilla no existe, detén la inicialización e informa cuál
archivo falta.

## Instrucciones

1. Confirma que estás trabajando en la raíz del proyecto actual.

2. Define estas rutas conceptuales:

   - Directorio destino: `.devflow/execution/`
   - Estado destino: `.devflow/execution/execution-state.json`
   - Schema de estado:
     `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/execution/execution-state.schema.json`

3. Revisa si existe el directorio `.devflow/execution/`.

4. Si no existe, crea únicamente esta estructura:

   ```text
   .devflow/execution/
   ├── execution-state.json
   ├── execution-state.schema.json
   ├── README.md
   ├── runs/
   └── tools/
       └── touch-execution-state.mjs
   ```

5. Para inicializar archivos faltantes:

   - Crea `.devflow/execution/runs/` si no existe.
   - Crea `.devflow/execution/tools/` si no existe.
   - Si `.devflow/execution/execution-state.json` no existe, cópialo desde la
     plantilla global.
   - Si `.devflow/execution/execution-state.schema.json` no existe, cópialo
     desde la plantilla global.
   - Si `.devflow/execution/README.md` no existe, cópialo desde la
     plantilla global.
   - Si `.devflow/execution/tools/touch-execution-state.mjs` no existe,
     cópialo desde la plantilla global.
   - Nunca sobrescribas ninguno de estos archivos si ya existe.

6. Cuando se cree `.devflow/execution/execution-state.json` por primera vez:

   - Sustituye `project.id` por un slug derivado del nombre del proyecto.
   - Sustituye `project.planningVersion` por `1`.
   - Conserva el resto de la estructura sin modificaciones.
   - Después de escribir el JSON, ejecuta:
     ```
     node $HOME/.config/opencode/templates/execution/tools/touch-execution-state.mjs .devflow/execution/execution-state.json
     ```
   - No escribas fechas manualmente. El timestamp tool actualiza `createdAt` y
     `updatedAt` sin agregar `timestamps.contentHash`.

7. Si `.devflow/execution/` ya existe:

   - Lee `.devflow/execution/execution-state.json`.
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
  se realiza con `/select-next-task`.
- Los contratos de selección (`selection.json`, `task-selection.schema.json`,
  `select-next-task.mjs`, `validate-next-task.mjs`) se instalan por separado
  mediante el template `next-task`.

## Contexto adicional

$ARGUMENTS
