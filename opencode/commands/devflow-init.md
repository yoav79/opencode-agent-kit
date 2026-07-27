---
description: Instala packages de DevFlow usando el instalador centralizado (`devflow init <package>`)
agent: general
subtask: true
---

Instala packages de DevFlow en el proyecto actual usando el instalador centralizado.

Este comando es la interfaz canónica de instalación. Delega exclusivamente en
el CLI `bin/devflow.mjs` del repositorio `opencode-agent-kit`.

## Uso

```text
/devflow-init <package>
/devflow-init {"package":"<package>"}
```

## Packages disponibles

| Package | Descripción |
|---------|-------------|
| `shared-runtime` | Herramientas compartidas de runtime |
| `software-architect` | Espacio de trabajo del Software Architect |
| `task-planner` | Espacio de trabajo del Task Planner |
| `next-task` | Contratos de selección determinista |
| `execution` | Estado mutable y herramientas de orquestación |
| `context-builder` | Schemas y templates de contexto ejecutable |

Metapackages:

| Metapackage | Incluye |
|-------------|---------|
| `planning-stack` | shared-runtime, software-architect, task-planner |
| `execution-stack` | shared-runtime, next-task, execution, context-builder |
| `all` | planning-stack + execution-stack |

## Instrucciones

1. Confirma que estás trabajando en la raíz del proyecto actual.
2. Determina el package solicitado.
3. Ejecuta exclusivamente:
   ```bash
   node <RUTA_REPO>/bin/devflow.mjs init <package>
   ```
4. No copies archivos manualmente.
5. No crees directorios manualmente.
6. No ejecutes migraciones.
7. Presenta el resultado JSON producido por el CLI.
8. Si el resultado contiene errores, preséntalos textualmente.

## Notas

- Este comando no modifica archivos existentes.
- Los archivos mutables (`selection.json`, `execution-state.json`) nunca se
  sobrescriben si ya existen.
- Los archivos managed modificados generan un CONFLICT que requiere intervención
  humana.
- Los comandos legacy `/init-software-architect`, `/init-task-planner`,
  `/init-execution` y `/init-next-task` siguen funcionando como wrappers que
  delegan a este instalador.

## Contexto adicional

$ARGUMENTS
