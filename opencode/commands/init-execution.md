---
description: Inicializa el espacio de ejecución de DevFlow (`.devflow/execution/`) con estado mutable, contratos y herramientas de orquestación
agent: general
subtask: true
---

Inicializa el espacio de ejecución de DevFlow para el proyecto ubicado en el
directorio actual. Este comando instala el runtime de orquestación, el estado
mutable de ejecución y el helper puro compartido que consume ese runtime.

Para verificar la instalación, comprueba las rutas listadas abajo. El gate
`validate-next-task.mjs` solo aplica después de ejecutar `/init-next-task`.

## Objetivo

Preparar el directorio `.devflow/execution/` con el estado inicial de ejecución,
los contratos JSON Schema y todas las herramientas locales que necesita el
runtime de orquestación, sin sobrescribir información existente.

## Ubicación de plantillas

Las plantillas globales están en:

- `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/execution/` (estado mutable y herramientas de orquestación)
- `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/shared/` (helper puro compartido)

## Runtime instalado

Estas rutas operativas deben coincidir exactamente con
`templates/execution/scaffold.json`:

- `.devflow/execution/README.md`
- `.devflow/execution/execution-state.json`
- `.devflow/execution/execution-state.schema.json`
- `.devflow/execution/transition-journal.schema.json`
- `.devflow/execution/tools/execution-contract-helpers.mjs`
- `.devflow/execution/tools/execution-transition-engine.mjs`
- `.devflow/execution/tools/migrate-execution-state-v1-to-v2.mjs`
- `.devflow/execution/tools/prepare-task-run.mjs`
- `.devflow/execution/tools/touch-execution-state.mjs`

## Dependencia compartida instalada por /init-execution

- `.devflow/shared/tools/devflow-runtime-helpers.mjs`

## Directorios instalados

- `.devflow/execution/runs/`
- `.devflow/execution/tools/`
- `.devflow/shared/tools/`

No reconstruyas estos archivos desde memoria ni desde contenido embebido en el
comando. Si una plantilla no existe, detén la inicialización e informa la ruta
exacta que falta dentro de `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/execution/` o
`${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/shared/`.

## Dependencia de next-task

`/init-execution` no instala los contratos de selección. Antes de ejecutar
`/prepare-task-run`, deben existir estas rutas instaladas por `/init-next-task`:

- `.devflow/execution/selection.json`
- `.devflow/execution/task-selection.schema.json`
- `.devflow/execution/tools/select-next-task.mjs`
- `.devflow/execution/tools/validate-next-task.mjs`

## Instrucciones

1. Confirma que estás trabajando en la raíz del proyecto actual.

2. Define estas rutas conceptuales:

   - Directorio destino: `.devflow/execution/`
   - Estado destino: `.devflow/execution/execution-state.json`
   - Schema de estado:
     `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/execution/execution-state.schema.json`

3. Revisa si existe el directorio `.devflow/execution/`.

4. Revisa si existe el directorio `.devflow/shared/tools/`.

5. Si no existe, crea únicamente esta estructura:

   ```text
     .devflow/execution/
    ├── README.md
    ├── execution-state.json
    ├── execution-state.schema.json
    ├── transition-journal.schema.json
    ├── runs/
    └── tools/
         ├── execution-contract-helpers.mjs
         ├── execution-transition-engine.mjs
         ├── migrate-execution-state-v1-to-v2.mjs
         ├── prepare-task-run.mjs
         └── touch-execution-state.mjs
     .devflow/shared/
     └── tools/
         └── devflow-runtime-helpers.mjs
     ```

6. Antes de copiar, verifica que exista cada plantilla obligatoria de la lista
   `Runtime instalado` y de la dependencia compartida. Si falta alguna, detén la ejecución e informa la ruta
   exacta de la plantilla ausente.

7. Para inicializar archivos faltantes:

     - Crea `.devflow/execution/runs/` si no existe.
     - Crea `.devflow/execution/tools/` si no existe.
     - Crea `.devflow/shared/tools/` si no existe.
     - Si `.devflow/shared/tools/devflow-runtime-helpers.mjs` no existe,
       cópialo desde la plantilla global compartida.
     - Si `.devflow/execution/README.md` no existe, cópialo desde la plantilla
       global.
    - Si `.devflow/execution/execution-state.json` no existe, cópialo desde la
      plantilla global.
    - Si `.devflow/execution/execution-state.schema.json` no existe, cópialo
      desde la plantilla global.
    - Si `.devflow/execution/transition-journal.schema.json` no existe,
      cópialo desde la plantilla global.
    - Si `.devflow/execution/tools/execution-contract-helpers.mjs` no existe,
      cópialo desde la plantilla global.
     - Si `.devflow/execution/tools/execution-transition-engine.mjs` no existe,
       cópialo desde la plantilla global.
     - Si `.devflow/execution/tools/migrate-execution-state-v1-to-v2.mjs` no
       existe, cópialo desde la plantilla global.
     - Si `.devflow/execution/tools/prepare-task-run.mjs` no existe, cópialo
       desde la plantilla global.
    - Si `.devflow/execution/tools/touch-execution-state.mjs` no existe,
      cópialo desde la plantilla global.
    - Nunca sobrescribas ninguno de estos archivos si ya existe.

8. Cuando se cree `.devflow/execution/execution-state.json` por primera vez:

   - Sustituye `project.id` por un slug derivado del nombre del proyecto.
   - Sustituye `project.planningVersion` por `1`.
   - Conserva el resto de la estructura sin modificaciones.
   - Después de escribir el JSON, ejecuta:
     ```
      node ${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/execution/tools/touch-execution-state.mjs .devflow/execution/execution-state.json
     ```
   - No escribas fechas manualmente. El timestamp tool actualiza `createdAt` y
     `updatedAt` sin agregar `timestamps.contentHash`.

9. Si `.devflow/execution/` ya existe:

    - Lee `.devflow/execution/execution-state.json`.
    - Identifica si el estado de ejecución está inicializado o en progreso.
    - Si detectas `schemaVersion = 1` con `engine.name = next-task`, no lo
      migres silenciosamente. Informa que debe ejecutarse:

      ```text
      node .devflow/execution/tools/migrate-execution-state-v1-to-v2.mjs .devflow/execution/execution-state.json
      ```

      antes de usar este runtime.
    - No reinicies el estado.
     - No reemplaces archivos existentes.
     - Si falta cualquier archivo del runtime, créalo sin tocar los demás.

10. Informa al terminar:

    - Si el espacio fue inicializado desde cero o reanudado parcialmente.
    - Los directorios creados.
    - Los archivos creados.
    - Los archivos existentes preservados.
    - El estado actual de ejecución.
    - Si todavía faltan los contratos de `next-task` para poder ejecutar
      `/prepare-task-run`.

## Notas

- Este comando solo prepara el runtime de ejecución. La selección de tareas se
  realiza con `/select-next-task`.
- Los contratos de selección (`selection.json`, `task-selection.schema.json`,
  `select-next-task.mjs`, `validate-next-task.mjs`) se instalan por separado
  mediante `/init-next-task`.
- El helper compartido `.devflow/shared/tools/devflow-runtime-helpers.mjs` es
  una dependencia explícita del runtime y no debe depender del orden accidental
  de inicialización.

## Contexto adicional

$ARGUMENTS
