# OpenCode Agent Kit

Repositorio base para versionar, instalar y mantener agentes reutilizables de OpenCode.

> **OpenCode Agent Kit** es un framework de proceso-as-codigo que convierte a un asistente de IA en un arquitecto de software disciplinado, siguiendo una metodologia de diseno estructurada, auditable y trazable con barreras de seguridad incorporadas.

## Objetivo

Separar claramente:

- La configuracion reusable de agentes, comandos y plantillas.
- Las reglas compartidas.
- Los artefactos generados dentro de cada proyecto.

Esto permite instalar el mismo conjunto de agentes y metodologia de diseno en multiples proyectos, manteniendo cada proyecto independiente con sus propios artefactos y decisiones.

## Arquitectura del Sistema

```text
┌─────────────────────────────────────────────────────────────────┐
│                       OpenCode Agent Kit                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐       ┌──────────────────────┐        │
│  │       Agents         │       │      Commands         │        │
│  │                      │       │                       │        │
│  │  software-architect  │◄──────│  init-software-       │        │
│  │  task-planner        │◄──────│  init-task-planner    │        │
│  └──────────────────────┘       └──────────────────────┘        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Shared Rules                          │   │
│  │   general.md | git-policy.md | documentation-policy.md   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Templates                             │   │
│  │   software-architect/  |  task-planner/                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Proyecto Destino                            │
│  .devflow/software-architect/                                    │
│  ├── project-state.json  (maquina de estados)                   │
│  ├── workflow.md         (criterios de salida por fase)         │
│  ├── decisions/         (Architecture Decision Records)         │
│  ├── docs/              (documentos aprobados)                  │
│  ├── drafts/            (borradores en progreso)                │
│  └── archive/           (documentos reemplazados)               │
│                                                                  │
│  .devflow/task-planner/                                          │
│  ├── project-state.json  (estado del plan de tareas)            │
│  ├── workflow.md         (fases de planificacion)               │
│  ├── semantic-contract.json                                     │
│  ├── requirements.json                                          │
│  ├── capability-map.json                                        │
│  ├── epic-plan.json                                             │
│  ├── task-plan.json                                             │
│  ├── epics/                                                     │
│  ├── tasks/                                                     │
│  └── tools/         (validador y actualizador determinista)     │
└─────────────────────────────────────────────────────────────────┘
```

## Agentes

### `software-architect` — Agente de Diseno

Convierte una idea incompleta en un blueprint coherente, trazable y listo para ejecucion. Workflow de 12 fases con documentos aprobados en puertas criticas.

- **Modo:** primary
- **Temperatura:** 0.1 (near-determinista)
- **Fases del workflow:**
  1. Discovery — Problema, usuarios, contexto
  2. Executive Definition — Vision, solucion propuesta (requiere aprobacion)
  3. Users and Processes — Actores, procesos, excepciones
  4. Module Catalog — Modulos, responsabilidades, dependencias (requiere aprobacion)
  5. Functional Requirements — Requisitos trazables con criterios de aceptacion
  6. Data and Integrations — Entidades, datos sensibles, sistemas externos
  7. Architecture — Alternativas, estilo, principios (requiere aprobacion)
  8. Technology Stack — Stack seleccionado con justificacion
  9. Security and NFR — Seguridad, rendimiento, disponibilidad
  10. Delivery Roadmap — MVP, epicas, fases, despliegue (requiere aprobacion)
  11. Consistency Review — Contradicciones, omisiones
  12. Final Document — Blueprint consolidado

**Permisos:** Puede editar archivos en `.devflow/software-architect/`. **No puede** hacer `git commit` ni `git push`.

### `task-planner` — Agente de Planificacion

Transforma un Software Blueprint aprobado en un plan completo de tareas para DevFlow. Workflow de 10 fases con validacion determinista.

- **Modo:** primary
- **Temperatura:** 0.2
- **Fases del workflow:**
  1. Blueprint Analysis — Audita el blueprint completo
  2. Decision Resolution — Resuelve decisiones bloqueantes (una por turno)
  3. Blueprint Consolidation — Combina blueprint y decisiones, genera contratos semanticos
  4. Blueprint Approval — Solicita aprobacion humana del blueprint resuelto
  5. Construction Strategy — Define como se construira el sistema
  6. Capability Mapping — Inventario de capacidades funcionales y habilitadoras
  7. Epic Generation — Agrupa capacidades en epicas por incremento
  8. Epic Decomposition — Descompone epicas en tareas ejecutables
  9. Plan Validation — Ejecuta validador determinista
  10. Plan Approval — Solicita aprobacion humana del plan final

**Permisos:** Puede editar archivos en `.devflow/task-planner/`. **No puede** ejecutar codigo, hacer commits, ni modificar el producto.

## Comandos

| Comando | Agente | Descripcion |
|---------|--------|-------------|
| `/init-software-architect` | software-architect | Inicializa o continua el diseno de arquitectura del proyecto |
| `/init-task-planner` | task-planner | Inicializa o continua la planificacion de tareas del proyecto |

## Estructura del Repositorio

```text
opencode-agent-kit/
├── opencode/
│   ├── agents/                    # Definiciones de agentes (.md + frontmatter YAML)
│   │   ├── software-architect.md
│   │   └── task-planner.md
│   ├── commands/                  # Comandos slash (.md)
│   │   ├── init-software-architect.md
│   │   └── init-task-planner.md
│   ├── rules/                     # Reglas compartidas (.md)
│   │   ├── general.md
│   │   ├── git-policy.md
│   │   └── documentation-policy.md
│   ├── AGENTS.md                  # Reglas globales para todos los agentes
│   └── opencode.example.json      # Configuracion de ejemplo
├── templates/
│   ├── software-architect/        # Plantillas del agente de diseno
│   │   ├── project-state.json
│   │   └── workflow.md
│   └── task-planner/              # Plantillas del agente de planificacion
│       ├── project-state.json
│       ├── workflow.md
│       ├── semantic-contract.json
│       ├── requirements.json
│       ├── capability-map.json
│       ├── epic-plan.json
│       ├── task-plan.json
│       ├── task-template.md
│       └── tools/                 # Validador y actualizador determinista
├── scripts/
│   ├── install.sh                 # Instalacion global via symlinks
│   ├── uninstall.sh               # Desinstalacion segura
│   ├── create-project.sh          # Crea scaffold en un proyecto destino
│   └── validate.sh                # Validacion de integridad del repositorio
├── tests/
│   └── test-scripts.sh            # Tests de integracion
├── examples/                      # Ejemplos sanitizados
├── .gitignore
└── Makefile                       # Targets: help, validate, test, install, dry-run
```

## Instalacion

### Requisitos

- [OpenCode](https://opencode.ai) instalado y configurado
- Bash
- Python 3 (para validacion)
- Node.js (para las herramientas deterministas del task-planner)

### Instalacion Global

El instalador crea enlaces simbolicos individuales en `~/.config/opencode`. No modifica credenciales, proveedores, modelos ni tu `opencode.json`.

```bash
./scripts/install.sh
```

Para instalar tambien las reglas globales de ejemplo:

```bash
./scripts/install.sh --with-global-rules
```

Para revisar sin modificar nada:

```bash
./scripts/install.sh --dry-run
```

Para forzar sobreescritura en caso de conflictos:

```bash
./scripts/install.sh --force
```

### Desinstalacion

```bash
./scripts/uninstall.sh
```

Solo elimina symlinks que apunten a este repositorio. No elimina archivos creados por el usuario.

### Configuracion de OpenCode

Copia `opencode/opencode.example.json` a tu configuracion de OpenCode y ajusta segun necesites:

```bash
cp opencode/opencode.example.json ~/.config/opencode/opencode.json
```

## Uso

### Flujo de Trabajo

#### 1. Software Design (Bluepritting)

Inicializa el proceso de diseno para el proyecto:

```
/init-software-architect
```

El agente:
- Verifica o crea `.devflow/software-architect/` con `project-state.json` y `workflow.md`
- Lee el estado actual y continua desde la fase pendiente
- Genera documentos por fase con aprobacion en puertas criticas

#### 2. Task Planning

Una vez aprobado el blueprint, inicializa la planificacion:

```
/init-task-planner
```

El agente:
- Verifica o crea `.devflow/task-planner/` con todos los archivos iniciales
- Analiza el blueprint y resuelve decisiones pendientes
- Genera capacidades, epicas y tareas con validacion determinista
- Produce un plan validado listo para DevFlow

### Validacion del Repositorio

```bash
./scripts/validate.sh
```

Valida:
- Todos los archivos requeridos existen
- JSON valido en todos los archivos
- Frontmatter obligatorio en agentes y comandos
- Versiones correctas en templates
- Permisos basicos y referencias internas

### Tests

```bash
make test
# o directamente:
./tests/test-scripts.sh
```

## Principios del Repositorio

1. **Los agentes definen roles y autoridad.** Cada agente tiene un alcance claro y permisos minimos.
2. **Los comandos inician flujos repetibles.** Cada comando tiene un agente asignado y un proposito definido.
3. **Los resultados de cada proyecto no se guardan en este repositorio.** Cada proyecto mantiene su propio `.devflow/software-architect/` y `.devflow/task-planner/`.
4. **Ningun agente puede hacer `git commit` o `git push`** sin cambiar explicitamente su politica.
5. **Los borradores nunca se eliminan.** Se promueven a docs o se mueven a archive.
6. **`project-state.json` es la unica fuente de verdad** para el progreso del workflow.
7. **Las decisiones arquitectonicas se registran como ADRs** en `decisions/`.
8. **El validador determinista es la unica forma de declarar un plan validado.** No se confia en revision narrativa.

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md) para instrucciones sobre como contribuir al repositorio.

## Licencia

[MIT](LICENSE) — Copyright (c) 2026
