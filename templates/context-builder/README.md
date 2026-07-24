# Context Builder

Este template instala los contratos y plantillas del dominio de contexto de
ejecución utilizado por `Context Builder Agent`.

## Ubicación en el proyecto

El contenido se copia a:

```text
.devflow/execution/
├── execution-context.schema.json
└── execution-context.template.json
└── execution-prompt.template.md
```

La ubicación runtime es `.devflow/execution/` porque sus archivos serán
compartidos por el scheduler, el ejecutor, el reviewer y el orquestador.

## Contratos

- `context-build-request.schema.json` — esquema de la solicitud de entrada
  (`taskId` + `attempt`).
- `execution-context.schema.json` — esquema del JSON de contexto de ejecución.
- `execution-context.template.json` — plantilla inicial del contexto.
- `execution-prompt.template.md` — plantilla del prompt Markdown.

## Archivos generados por el agente

El agente `context-builder` genera para cada intento:

```text
.devflow/execution/runs/<TASK-ID>/attempt-<NN>/
├── execution-context.json
└── execution-prompt.md
```

Estos archivos son la entrada para el ejecutor de tareas.
