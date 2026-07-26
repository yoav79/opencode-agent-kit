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
│  │  blueprint-compiler  │◄──────│  compile-blueprint    │        │
│  │  consistency-reviewer│◄──────│  review-consistency   │        │
│  │  task-planner        │◄──────│  init-task-planner    │        │
│  │  epic-decomposer     │       │  publish-blueprint    │        │
│  │  next-task           │◄──────│  select-next-task     │        │
│  │  context-builder     │◄──────│  build-task-context   │        │
│  └──────────────────────┘       └──────────────────────┘        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Shared Rules                          │   │
│  │   general.md | git-policy.md | documentation-policy.md   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Templates                             │   │
│  │   software-architect/ | task-planner/ | next-task/ | context-builder/ | shared/ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Proyecto Destino                            │
│  .devflow/software-architect/                                    │
│  ├── project-state.json  (maquina de estados)                   │
│  ├── project-state.schema.json  (contrato JSON)                 │
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
│  ├── decisions.json                                             │
│  ├── readiness.json                                             │
│  ├── capability-map.json                                        │
│  ├── epic-plan.json                                             │
│  ├── task-plan.json                                             │
│  ├── task-template.md                                           │
│  ├── drafts/                                                    │
│  ├── epics/                                                     │
│  ├── tasks/                                                     │
│  └── tools/         (validador y actualizador determinista)     │
│                                                                  │
│  .devflow/execution/                                             │
│  ├── execution-state.json  (estado mutable del orquestador)     │
│  ├── selection.json        (salida de Next Task Agent)          │
│  ├── execution-context.schema.json  (contrato de contexto)      │
│  ├── context-build-request.schema.json                          │
│  ├── tools/validate-next-task.mjs                               │
│  └── runs/                 (evidencia creada por orquestador)    │
│      └── TASK-XXX/attempt-NN/                                   │
│          ├── selection.json    (evidencia de la reserva)        │
│          ├── execution-context.json                             │
│          └── execution-prompt.md                                │
└─────────────────────────────────────────────────────────────────┘
```

## Agentes

### `software-architect` — Agente de Diseno

Convierte una idea incompleta en un blueprint coherente, trazable y listo para ejecucion. Workflow de 14 fases con documentos aprobados en puertas criticas.

- **Modo:** primary
- **Temperatura:** 0.2
- **Fases del workflow:**
  1. Discovery — Problema, usuarios, contexto
  2. Product Requirements — Vision, propuesta de valor, MVP (requiere aprobacion)
  3. Application Flow — Actores, journeys, estados, excepciones
  4. UI/UX Brief — Design system, devices, accesibilidad
  5. Module Catalog — Modulos, responsabilidades, dependencias
  6. Functional Requirements — Requisitos trazables con criterios de aceptacion
  7. Backend Schema — Entidades, APIs, almacenamiento, datos sensibles
  8. Solution Architecture — Alternativas, estilo, principios (gate)
  9. Technology Stack — Stack seleccionado con justificacion
  10. Security & NFR — Seguridad, rendimiento, disponibilidad
  11. Technical Requirements — Performance, compliance, monitoring (sintesis)
  12. Delivery Roadmap — MVP, epicas, fases, despliegue (gate)
  13. Software Blueprint — Documento consolidado (sintesis)
  14. Consistency Review — Revision final, veredicto (gate final)

**Permisos:** Edición restringida a `.devflow/software-architect/`. Puede ejecutar el validador determinista y el timestamp tool. **No puede** hacer `git commit` ni `git push`.

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

**Permisos:** Puede editar archivos en `.devflow/task-planner/`. Solo ejecuta herramientas de planificacion Node deterministas autorizadas. No ejecuta codigo del producto, no hace commits ni modifica el producto.

### `next-task` — Selector de Siguiente Tarea

Consume el plan aprobado y el estado de ejecución para seleccionar exactamente
una tarea mediante reglas deterministas. Puede ser reemplazado por un scheduler
sin cambiar los contratos.

- **Modo:** subagent
- **Temperatura:** 0
- **Entrada:** `.devflow/task-planner/*.json` y `.devflow/execution/execution-state.json`
- **Salida:** `.devflow/execution/selection.json`
- **Gate:** `.devflow/execution/tools/validate-next-task.mjs`

Permisos: Solo lectura sobre planificación y estado de ejecución. Escribe
`selection.json` y `execution-state.json`.

### `context-builder` — Constructor de Contexto de Ejecución

Toma una tarea ya seleccionada y prepara el contexto ejecutable para un
intento. Lee el plan, los artefactos, los predecesores y el repositorio, y
produce un JSON estructurado más un prompt Markdown listo para el ejecutor.

- **Modo:** subagent
- **Temperatura:** 0.1
- **Entrada:** `taskId` + `attempt` via argumento; lee plan, estado y repo
- **Salida:** `execution-context.json` + `execution-prompt.md` en el directorio
  del intento

Permisos: Solo lectura sobre planificación, ejecución y repo. Escribe
únicamente en el directorio del intento. No selecciona tareas ni ejecuta
código.

### `consistency-reviewer` — Revisor de Consistencia

Examina el Software Blueprint completo de forma independiente y produce
un reporte estructurado con hallazgos clasificados por gravedad. Es
invocado por `software-architect` en la fase 14 y puede ejecutarse
manualmente.

- **Modo:** subagent
- **Temperatura:** 0
- **Entrada:** `.devflow/software-architect/docs/` (solo lectura, docs 1-13)
- **Salida:** `.devflow/software-architect/drafts/14-consistency-review.md` (promovido a docs/ solo tras veredicto APPROVED y aprobación humana final)

Permisos: Solo lectura sobre los documentos fuente. Solo escribe en drafts/.

## Comandos

| Comando | Agente | Descripcion |
|---------|--------|-------------|
| `/init-software-architect` | software-architect | Inicializa o continua el diseno de arquitectura del proyecto |
| `/compile-blueprint` | blueprint-compiler | Compila drafts de Technical Requirements o Software Blueprint |
| `/publish-blueprint` | software-architect | Publica el blueprint aprobado hacia `docs/software-architect/` |
| `/review-consistency` | consistency-reviewer | Revisa la consistencia del Software Blueprint completo |
| `/init-task-planner` | task-planner | Inicializa o continua la planificacion de tareas del proyecto |
| `/init-next-task` | next-task | Inicializa el espacio de ejecucion (`.devflow/execution/`) |
| `/select-next-task` | next-task | Selecciona la siguiente tarea disponible |
| `/prepare-task-run` | next-task | Crea el directorio del run y registra la tarea en el estado |
| `/build-task-context` | context-builder | Construye contexto para una tarea e intento explicitos |
| `/build-next-task-context` | context-builder | Construye contexto para la ultima tarea seleccionada (auto) |

## Estructura del Repositorio

```text
opencode-agent-kit/
├── opencode/
│   ├── agents/                    # Definiciones de agentes (.md + frontmatter YAML)
│   │   ├── software-architect.md
│   │   ├── blueprint-compiler.md
│   │   ├── consistency-reviewer.md
│   │   ├── task-planner.md
│   │   ├── epic-decomposer.md
│   │   ├── next-task.md
│   │   └── context-builder.md
│   ├── commands/                  # Comandos slash (.md)
│   │   ├── init-software-architect.md
│   │   ├── compile-blueprint.md
│   │   ├── publish-blueprint.md
│   │   ├── review-consistency.md
│   │   ├── init-task-planner.md
│   │   ├── init-next-task.md
│   │   ├── select-next-task.md
│   │   ├── prepare-task-run.md
│   │   ├── build-task-context.md
│   │   └── build-next-task-context.md
│   ├── rules/                     # Reglas compartidas (.md)
│   │   ├── general.md
│   │   ├── git-policy.md
│   │   └── documentation-policy.md
│   ├── AGENTS.md                  # Reglas globales para todos los agentes
│   └── opencode.example.json      # Configuracion de ejemplo
├── templates/
│   ├── shared/
│   │   └── tools/
│   │       └── timestamp.mjs
│   ├── software-architect/        # Plantillas del agente de diseno
│   │   ├── project-state.json
│   │   ├── project-state.schema.json
│   │   ├── workflow.md
│   │   ├── scaffold.json
│   │   ├── doc-templates/
│   │   ├── contracts/
│   │   ├── migration/
│   │   └── tools/
│   ├── task-planner/              # Plantillas del agente de planificacion
│   │   ├── project-state.json
│   │   ├── workflow.md
│   │   ├── semantic-contract.json
│   │   ├── requirements.json
│   │   ├── decisions.json
│   │   ├── readiness.json
│   │   ├── capability-map.json
│   │   ├── epic-plan.json
│   │   ├── task-plan.json
│   │   ├── task-template.md
│   │   ├── scaffold.json
│   │   ├── SEMANTIC-CONTRACT.md
│   │   ├── contracts/
│   │   └── tools/                 # Herramientas deterministas y tests
│   │       ├── assemble-capability-map.mjs
│   │       ├── assemble-epic-task-batch.mjs
│   │       ├── build-epic-graph.mjs
│   │       ├── render-task-markdown.mjs
│   │       ├── reserve-task-ids.mjs
│   │       ├── update-timestamps.mjs
│   │       ├── validate-capability-map.mjs
│   │       ├── validate-epic-batch.mjs
│   │       ├── validate-plan.mjs
│   │       ├── *.test.mjs
│   │       └── fixtures/
│   ├── next-task/                 # Contratos y gate de selección
│   │   ├── execution-state.json
│   │   ├── selection.json
│   │   ├── *.schema.json
│   │   └── tools/validate-next-task.mjs
│   └── context-builder/           # Contratos de contexto de ejecución
│       ├── README.md
│       ├── context-build-request.schema.json
│       ├── execution-context.schema.json
│       ├── execution-context.template.json
│       ├── execution-prompt.template.md
│       └── scaffold.json
├── scripts/
│   ├── install.sh                 # Instalacion global via symlinks
│   ├── uninstall.sh               # Desinstalacion segura
│   ├── create-project.sh          # Crea scaffold en un proyecto destino
│   ├── generate-scaffold.sh        # Regenera scaffold.json desde templates
│   ├── publish-blueprint.sh        # Publica blueprint completo a docs/
│   └── validate.sh                # Validacion de integridad del repositorio
├── tests/
│   ├── README.md                  # Taxonomia y limites de cobertura
│   ├── fixtures/software-architect/ # Estados reproducibles
│   ├── test-scripts.sh            # Integracion determinista del repositorio
│   └── test-software-architect-tools.sh # Validator y migracion
├── examples/                      # Ejemplos sanitizados
├── .gitignore
└── Makefile                       # Targets de validacion, tests e instalacion
```

## Instalacion

### Requisitos

- [OpenCode](https://opencode.ai) instalado y configurado
- Bash
- Python 3 (para validacion)
- Node.js (para las herramientas deterministas de task-planner y next-task)

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

#### 3. Execution (Task Selection & Context)

Una vez que el plan está publicado, inicializa el espacio de ejecución y
selecciona la primera tarea:

```
/init-next-task
/select-next-task
/prepare-task-run {"taskId":"TASK-006","attempt":1}
/build-task-context {"taskId":"TASK-006","attempt":1}
```

O en un solo paso:

```
/select-next-task
/build-next-task-context
```

El flujo completo:

1. `/init-next-task` — Crea `.devflow/execution/` con estado y contratos
2. `/select-next-task` — Evalúa el plan y selecciona una tarea
3. `/prepare-task-run` — Crea el directorio del run, copia evidencia,
   registra la tarea en el estado de ejecución
4. `/build-task-context` — Construye `execution-context.json` y
   `execution-prompt.md` con el alcance, criterios, predecesores y contexto
   técnico del repositorio

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

Las suites actuales prueban scripts y herramientas deterministas. No inician
OpenCode ni validan conversaciones, permisos en runtime, slash commands,
delegación con `task` o gates humanos.

```bash
make test
```

Ejecución separada:

```bash
make test-repository
make test-software-architect-tools
make test-task-planner-tools
```

- `test-repository` verifica instalación, scaffold y desinstalación.
- `test-software-architect-tools` verifica validator, migración y fixtures de
  estado reproducibles.
- `test-task-planner-tools` verifica herramientas deterministas de task-planner.

La taxonomía completa y los límites de cobertura están en
[`tests/README.md`](tests/README.md).

## Principios del Repositorio

1. **Los agentes definen roles y autoridad.** Cada agente tiene un alcance claro y permisos minimos.
2. **Los comandos inician flujos repetibles.** Cada comando tiene un agente asignado y un proposito definido.
3. **Los resultados de cada proyecto no se guardan en este repositorio.** Cada proyecto mantiene sus propios `.devflow/software-architect/`, `.devflow/task-planner/` y `.devflow/execution/`.
4. **Ningun agente puede hacer `git commit` o `git push`** sin cambiar explicitamente su politica.
5. **Los borradores nunca se eliminan.** Se promueven a docs o se mueven a archive.
6. **`project-state.json` es la unica fuente de verdad** para el progreso del workflow.
7. **Las decisiones arquitectonicas se registran como ADRs** en `decisions/`.
8. **El validador determinista es la unica forma de declarar un plan validado.** No se confia en revision narrativa.

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md) para instrucciones sobre como contribuir al repositorio.

## Licencia

[MIT](LICENSE) — Copyright (c) 2026
