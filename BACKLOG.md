# Backlog

Features, mejoras y correcciones pendientes para el OpenCode Agent Kit.

## Formato

- **P:** Prioridad (alta, media, baja)
- **E:** Esfuerzo estimado (S, M, L, XL)
- **A:** Área (agente, comando, template, tool, script, docs)

---

## Features

### Hacer que `next-task` mode: primary funcione sin comando

Actualmente `next-task` es `mode: primary` pero no se puede invocar directamente
sin un comando. Los comandos `/select-next-task` y `/prepare-task-run` existen
como puente, pero el agente no tiene un `/next-task` directo.

- **P:** media | **E:** S | **A:** agente, comando

### Validador determinista para context-builder

`next-task` tiene `validate-next-task.mjs`. `context-builder` debería tener
un `validate-execution-context.mjs` que verifique que `execution-context.json`
cumple su schema, que los hashes coinciden, y que el prompt Markdown es
consistente con el JSON.

- **P:** media | **E:** M | **A:** template, tool

### Esquema de validación para selection.json

`task-selection.schema.json` existe pero no hay un comando o script que valide
`selection.json` contra su schema de forma independiente. El validador
`validate-next-task.mjs` hace algunas comprobaciones pero no usa el schema.

- **P:** baja | **E:** S | **A:** tool

### Modo dry-run para comandos de inicialización

Los comandos `/init-*` modifican archivos sin confirmación. Sería útil que
soportaran un flag `--dry-run` para mostrar qué harían sin escribirlo.

- **P:** baja | **E:** M | **A:** comando

### Integración con DevFlow real

Actualmente los artefactos se generan en `.devflow/` pero no hay un conector
que envíe las tareas a un sistema DevFlow real. El `task-plan.json` y los
archivos en `tasks/` son el contrato de salida, pero falta el paso de
publicación.

- **P:** alta | **E:** XL | **A:** agente, tool

---

## Mejoras

### Unificar ruta de templates entre agentes

Actualmente `software-architect` y `context-builder` usan
`$CONFIG_DIR/templates/<agente>/` mientras que `task-planner` usa
`$CONFIG_DIR/<agente>/templates/`. Esto es inconsistente y confuso.

- **P:** media | **E:** S | **A:** agente, script

### Revisar permisos de `*: allow` en read

`context-builder` tiene `"*": allow` en read, lo que permite leer cualquier
archivo del proyecto. Sería más seguro restringirlo a `.devflow/` y archivos
de repo necesarios (manifiestos, git).

- **P:** baja | **E:** M | **A:** agente

### Agregar test para validate-next-task.mjs

`validate-plan.mjs` tiene tests (`validate-plan.test.mjs`),
`update-timestamps.mjs` también. `validate-next-task.mjs` no tiene tests.

- **P:** media | **E:** M | **A:** tool, test

### Normalizar nombres de clasificaciones

`next-task` usa `TASK_SELECTED`, `NO_READY_TASK`, etc. `context-builder` usa
`READY`, `PLAN_DEFECT`, etc. No hay un vocabulario compartido entre agentes
de ejecución.

- **P:** baja | **E:** S | **A:** agente

### README: documentar schemas y contratos

Los schemas JSON (`execution-state.schema.json`, `task-selection.schema.json`,
`execution-context.schema.json`) no están documentados en el README. Sería útil
incluir un diagrama de contratos.

- **P:** baja | **E:** M | **A:** docs

---

## Bugs / Correcciones

### context-builder: `**` en permisos puede no funcionar

OpenCode no soporta `**` (globstar) en patrones de permisos. Se cambió a `*`
en la última revisión, pero `*` solo coincide con archivos directos, no
subdirectorios. Si los templates tienen subdirectorios, no serán accesibles.

- **P:** media | **E:** S | **A:** agente

### create-project.sh: `directory` con ruta anidada

`scaffold.json` usa `".devflow/execution"` como `directory`, y
`create-project.sh` lo crea con `project_path / dir_name`. Pero si el directorio
tiene múltiples niveles (`.devflow/execution`), `mkdir -p` lo resuelve bien.
El problema es que el `AGENTS.md` y `project-state.json` se generan en
`project_path / dir_name`, lo que es correcto.

- **P:** baja | **E:** S | **A:** script

### scripts/generate-scaffold.sh: rutas no actualizadas

El script tiene hardcodeados los valores del mapa `scaffolds`. Si se agregan
nuevos agentes, el script no los detecta automáticamente.

- **P:** baja | **E:** S | **A:** script
