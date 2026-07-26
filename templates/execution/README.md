# Execution Runtime

Este template instala el estado mutable de ejecución y las herramientas de
orquestación. Es compartido por el scheduler, el ejecutor, el reviewer y el
orquestador de DevFlow.

## Ubicación en el proyecto

El contenido se copia a:

```text
.devflow/execution/
├── execution-state.json
├── execution-state.schema.json
└── tools/
    └── touch-execution-state.mjs
```

El directorio `runs/` contiene la evidencia de cada intento de ejecución y es
creado y administrado únicamente por el orquestador.

## Archivos

### `execution-state.json`

Estado canónico y mutable de la ejecución. Es la única fuente de verdad para el
progreso de tareas, reservas, intentos y bloqueos. Solo el orquestador debe
modificarlo.

Campos principales:

- `schemaVersion` — siempre `1`
- `engine` — nombre y versión del contrato (`next-task`, `1.0`)
- `project` — identificador y versión de planificación
- `revision` — contador monotónico incrementado en cada modificación
- `status` — `initialized`, `active`, `paused`, `completed`, `failed`
- `policy` — `defaultMaxAttempts` y `maxConcurrentTasks`
- `tasks[]` — arreglo de estados de tareas individuales
- `timestamps` — `createdAt` y `updatedAt`

### `execution-state.schema.json`

Contrato JSON Schema Draft 2020-12 que valida la estructura de
`execution-state.json`. Inmutable durante una ejecución.

### `tools/touch-execution-state.mjs`

Herramienta determinista que actualiza `timestamps.createdAt` y
`timestamps.updatedAt` en `execution-state.json`.

Uso:

```bash
node tools/touch-execution-state.mjs .devflow/execution/execution-state.json
```

No calcula ni modifica `timestamps.contentHash`.

## Propiedad de los archivos

- `execution-state.json`: mutable únicamente por el orquestador.
- `*.schema.json`: contratos inmutables durante una ejecución.
- `runs/`: creado y administrado únicamente por el orquestador.
- `tools/touch-execution-state.mjs`: herramienta determinista, no modificable.
