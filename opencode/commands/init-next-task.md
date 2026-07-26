---
description: Instala los contratos de selección determinista de next-task en el espacio de ejecución. Para el estado mutable y herramientas de orquestación, usa /init-execution.
agent: general
subtask: true
---

Instala los contratos de selección determinista (`selection.json`,
`task-selection.schema.json`, `select-next-task.mjs`,
`validate-next-task.mjs`) en `.devflow/execution/` y el helper compartido de
runtime en `.devflow/shared/tools/`.

Este comando no instala el estado mutable de ejecución ni herramientas de
orquestación. Usa `/init-execution` para eso cuando necesites
`execution-state.json` o `/prepare-task-run`.

## Requisitos

No requiere `/init-execution` para instalarse. Sí requiere las plantillas
globales de `next-task` y `shared` para poder copiar:

- `.devflow/execution/selection.json`
- `.devflow/execution/task-selection.schema.json`
- `.devflow/execution/tools/select-next-task.mjs`
- `.devflow/execution/tools/validate-next-task.mjs`
- `.devflow/shared/tools/devflow-runtime-helpers.mjs`

## Ubicación de plantillas

Las plantillas globales están en:

`${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/next-task/`

y el helper compartido en:

`${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/shared/`

Archivos requeridos:

- `task-selection.schema.json`
- `selection.json`
- `README.md`
- `tools/select-next-task.mjs`
- `tools/validate-next-task.mjs`
- `../shared/tools/devflow-runtime-helpers.mjs`

No reconstruyas estos archivos desde memoria ni desde contenido embebido en el
comando. Si una plantilla no existe, detén la inicialización e informa cuál
archivo falta.

## Instrucciones

1. Confirma que estás trabajando en la raíz del proyecto actual.

2. Verifica que existen estas plantillas globales:

   - `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/next-task/selection.json`
   - `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/next-task/task-selection.schema.json`
   - `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/next-task/tools/select-next-task.mjs`
   - `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/next-task/tools/validate-next-task.mjs`
   - `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/shared/tools/devflow-runtime-helpers.mjs`

   Si falta cualquiera, detén la ejecución e informa la ruta exacta.

3. Para inicializar archivos faltantes:

   - Crea `.devflow/execution/` si no existe.
   - Crea `.devflow/execution/tools/` si no existe.
   - Crea `.devflow/shared/tools/` si no existe.
   - Si `.devflow/shared/tools/devflow-runtime-helpers.mjs` no existe,
     cópialo desde la plantilla global compartida.
   - Si `.devflow/execution/task-selection.schema.json` no existe, cópialo
     desde la plantilla global.
   - Si `.devflow/execution/selection.json` no existe, cópialo desde la
     plantilla global.
   - Si `.devflow/execution/README.md` no existe, cópialo desde la
     plantilla global.
   - Si `.devflow/execution/tools/select-next-task.mjs` no existe, cópialo
     desde la plantilla global.
   - Si `.devflow/execution/tools/validate-next-task.mjs` no existe, cópialo
     desde la plantilla global.
   - Nunca sobrescribas ninguno de estos archivos si ya existe.

4. Informa al terminar:

   - Los archivos creados.
   - Los archivos existentes.
   - Sugerencia: si el estado de ejecución todavía no existe, ejecuta
     `/init-execution` antes de `/select-next-task`.

## Notas

- Este comando instala únicamente los artefactos del template `next-task`.
- También instala el helper puro compartido requerido por `next-task` bajo
  `.devflow/shared/tools/devflow-runtime-helpers.mjs`.
- Para inicializar el estado mutable y las herramientas de orquestación
  (`execution-state.json`, `execution-transition-engine.mjs`,
  `execution-contract-helpers.mjs`, `touch-execution-state.mjs`, `runs/`), usa
  `/init-execution`.
- Lee y escribe archivos, no ejecuta herramientas.

## Contexto adicional

$ARGUMENTS
