---
description: Instala los contratos de selección determinista de next-task en el espacio de ejecución. Para el estado mutable y herramientas de orquestación, usa /init-execution.
agent: general
subtask: true
---

Instala los contratos de selección determinista (`selection.json`,
`task-selection.schema.json`, `select-next-task.mjs`,
`validate-next-task.mjs`) en `.devflow/execution/`.

Este comando no instala el estado mutable de ejecución ni herramientas de
orquestación. Usa `/init-execution` para eso.

## Requisito

Debe existir `.devflow/execution/`. Si no existe, ejecuta `/init-execution`
primero o este comando creará únicamente el directorio base.

## Ubicación de plantillas

Las plantillas globales están en:

`${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/next-task/`

Archivos requeridos:

- `task-selection.schema.json`
- `selection.json`
- `README.md`
- `tools/select-next-task.mjs`
- `tools/validate-next-task.mjs`

No reconstruyas estos archivos desde memoria ni desde contenido embebido en el
comando. Si una plantilla no existe, detén la inicialización e informa cuál
archivo falta.

## Instrucciones

1. Confirma que estás trabajando en la raíz del proyecto actual.

2. Verifica que existe el directorio `.devflow/execution/`. Si no existe,
   créalo.

3. Para inicializar archivos faltantes:

   - Crea `.devflow/execution/tools/` si no existe.
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
   - Sugerencia: si el estado de ejecución no está inicializado, ejecuta
     `/init-execution`.

## Notas

- Este comando instala únicamente los artefactos del template `next-task`.
- Para inicializar el estado mutable y las herramientas de orquestación
  (`execution-state.json`, `touch-execution-state.mjs`, `runs/`), usa
  `/init-execution`.
- Lee y escribe archivos, no ejecuta herramientas.

## Contexto adicional

$ARGUMENTS
