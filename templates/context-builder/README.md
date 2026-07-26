# Context Builder

Este template instala los contratos y plantillas del dominio de contexto de
ejecución utilizado por `Context Builder Agent`.

## Ubicación en el proyecto

El contenido se copia a:

```text
.devflow/execution/
├── context-build-request.schema.json
├── execution-context.schema.json
├── execution-context.template.json
├── execution-prompt.template.md
└── tools/
    └── inspect-repository-context.mjs
```

La ubicación runtime es `.devflow/execution/` porque sus archivos serán
compartidos por el scheduler, el ejecutor, el reviewer y el orquestador.

## Política de lectura

`context-builder` ya no tiene `read: "*": allow` sobre el repositorio. La
lectura directa queda limitada a:

- `AGENTS.md`
- `.devflow/software-architect/**`
- `.devflow/task-planner/**`
- `.devflow/execution/**`
- `.devflow/memory/**`
- los contratos globales del propio template

Para el código y los archivos del producto debe usar
`tools/inspect-repository-context.mjs`, que:

- selecciona rutas explícitas;
- excluye patrones sensibles y directorios ruidosos;
- limita tamaño de lectura;
- redacta líneas con secretos;
- devuelve rutas y hashes estables;
- evita copiar archivos completos e irrelevantes al prompt.

## Contratos

- `context-build-request.schema.json` — esquema de la solicitud de entrada
  (`taskId` + `attempt`).
- `execution-context.schema.json` — esquema del JSON de contexto de ejecución.
- `execution-context.template.json` — plantilla inicial del contexto.
- `execution-prompt.template.md` — plantilla del prompt Markdown.
- `tools/inspect-repository-context.mjs` — inspección determinista del
  repositorio con exclusiones sensibles, límites de tamaño, hashes y preview
  redactado.

## Archivos generados por el agente

El agente `context-builder` solo escribe `execution-context.json` y
`execution-prompt.md` dentro de un run previamente preparado por
`/prepare-task-run`:

```text
.devflow/execution/runs/<TASK-ID>/attempt-<NN>/
├── execution-context.json
└── execution-prompt.md
```

Estos archivos son la entrada para el ejecutor de tareas. El agente no crea
directorios, no modifica `execution-state.json` y no modifica ningún
`selection.json`.
