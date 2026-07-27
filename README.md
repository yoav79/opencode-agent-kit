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
│  .devflow/shared/                                                │
│  └── tools/devflow-runtime-helpers.mjs  (helpers puros compartidos) │
│                                                                  │
│  .devflow/execution/                                             │
│  ├── README.md             (guía local del runtime compartido)   │
│  ├── execution-state.json  (estado mutable del orquestador)     │
│  ├── selection.json        (salida del selector determinista)   │
│  ├── task-selection.schema.json  (contrato de selección)        │
│  ├── transition-journal.json  (sidecar transaccional)           │
│  ├── transition-journal.schema.json  (contrato del journal)     │
│  ├── execution-context.schema.json  (contrato de contexto)      │
│  ├── context-build-request.schema.json                          │
│  ├── tools/execution-contract-helpers.mjs  (adaptador de contratos) │
│  ├── tools/execution-transition-engine.mjs  (dueño mutaciones)  │
│  ├── tools/migrate-execution-state-v1-to-v2.mjs (migración)     │
│  ├── tools/prepare-task-run.mjs  (wrapper CLI)                  │
│  ├── tools/touch-execution-state.mjs  (init timestamps)          │
│  ├── tools/select-next-task.mjs   (selector determinista)       │
│  ├── tools/validate-next-task.mjs (gate de validación)          │
│  ├── tools/inspect-repository-context.mjs (inspección segura)   │
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

### `next-task` — Wrapper del Selector Determinista

Wrapper operativo mínimo que invoca `select-next-task.mjs` para producir
`selection.json` mediante reglas deterministas. No contiene lógica de
selección; delega completamente en la herramienta.

- **Modo:** subagent
- **Temperatura:** 0
- **Entrada:** Solo verifica existencia de `execution-state.json`; el selector lee los archivos de planificación y estado directamente
- **Salida:** Clasificación producida por el selector determinista
- **Selector:** `.devflow/execution/tools/select-next-task.mjs`
- **Gate:** `.devflow/execution/tools/validate-next-task.mjs`

Permisos: Lectura mínima (`execution-state.json`). Ejecuta únicamente el
selector determinista vía bash. No lee, interpreta ni modifica `selection.json`
directamente. Sus helpers puros viven en `.devflow/shared/tools/` y no dependen
del runtime de mutación de `execution`.

### `context-builder` — Constructor de Contexto de Ejecución

Subagente que construye el contexto ejecutable de una tarea cuyo run ya fue
preparado por el orquestador. Lee el plan, los artefactos, los predecesores
y el repositorio, y produce un JSON estructurado más un prompt Markdown listo
para el ejecutor.

- **Modo:** subagent
- **Temperatura:** 0.1
- **Entrada:** `taskId` + `attempt` via argumento; lee plan, estado y repo
- **Salida:** `execution-context.json` + `execution-prompt.md` en el directorio
  del intento

Permisos: Solo lectura sobre planificación, ejecución y repo. Escribe
únicamente `execution-context.json` y `execution-prompt.md` en un run
previamente preparado. No selecciona tareas, no reserva tareas, no crea
directorios, no modifica `execution-state.json` ni ningún `selection.json`.
La lectura directa queda limitada a `AGENTS.md` y `.devflow/**`; para el
repositorio del producto debe usar `inspect-repository-context.mjs`.

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
| `/devflow-init` | general | Instalador centralizado: `devflow init <package>` instala paquetes de DevFlow con resolución de dependencias y lockfile |
| `/init-software-architect` | software-architect | *(legacy)* Wrapper que invoca `devflow init software-architect` |
| `/compile-blueprint` | blueprint-compiler | Compila drafts de Technical Requirements o Software Blueprint |
| `/publish-blueprint` | software-architect | Publica el blueprint aprobado hacia `docs/software-architect/` |
| `/review-consistency` | consistency-reviewer | Revisa la consistencia del Software Blueprint completo |
| `/init-task-planner` | task-planner | *(legacy)* Wrapper que invoca `devflow init task-planner` |
| `/devflow-init` | general | Instalador centralizado: `devflow init <package>` instala paquetes de DevFlow con resolución de dependencias y lockfile. Wrapper de `bin/devflow.mjs` |
| `/init-execution` | general | *(legacy)* Wrapper que invoca `devflow init execution` |
| `/init-next-task` | general | *(legacy)* Wrapper que invoca `devflow init next-task` |
| `/select-next-task` | next-task | Invoca el selector determinista `select-next-task.mjs` para producir `selection.json` |
| `/prepare-task-run` | general | Invoca el motor transaccional `execution-transition-engine.mjs` via `prepare-task-run.mjs` para reservar la tarea seleccionada |
| `/build-task-context` | context-builder | Construye contexto para una tarea e intento explicitos en un run ya preparado |
| `/build-next-task-context` | context-builder | Wrapper de solo lectura: resuelve el run activo desde `reservation.token` o `activeRunId` y delega a `/build-task-context` |

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
│   │   ├── devflow-init.md      # Canonical: invoca bin/devflow.mjs
│   │   ├── init-software-architect.md
│   │   ├── compile-blueprint.md
│   │   ├── publish-blueprint.md
│   │   ├── review-consistency.md
│   │   ├── init-task-planner.md
│   │   ├── init-execution.md
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
│   │   ├── scaffold.json
│   │   └── tools/
│   │       ├── devflow-runtime-helpers.mjs
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
│   ├── next-task/                 # Contratos, selector determinista y gate de selección
│   │   ├── README.md
│   │   ├── selection.json
│   │   ├── task-selection.schema.json
│   │   ├── scaffold.json
│   │   └── tools/
│   │       ├── select-next-task.mjs
│   │       └── validate-next-task.mjs
│   ├── execution/                 # Estado mutable de ejecución y herramientas de orquestación
│   │   ├── README.md
│   │   ├── execution-state.json
│   │   ├── execution-state.schema.json
│   │   ├── scaffold.json
│   │   └── tools/
│   │       ├── execution-contract-helpers.mjs
│   │       ├── execution-transition-engine.mjs
│   │       ├── prepare-task-run.mjs
│   │       └── touch-execution-state.mjs
│   └── context-builder/           # Contratos de contexto de ejecución
│       ├── README.md
│       ├── context-build-request.schema.json
│       ├── execution-context.schema.json
│       ├── execution-context.template.json
│       ├── execution-prompt.template.md
│       └── scaffold.json
├── bin/
│   └── devflow.mjs                 # CLI del instalador centralizado (init, audit)
├── packages/                       # Manifests de paquetes DevFlow
│   ├── all/
│   ├── shared-runtime/
│   ├── software-architect/
│   ├── task-planner/
│   ├── next-task/
│   ├── execution/
│   ├── context-builder/
│   ├── planning-stack/
│   └── execution-stack/
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
- Node.js (para las herramientas deterministas de task-planner, next-task y execution)

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

#### 3. Execution (Selector → Motor → Context Builder)

Una vez que el plan está publicado, inicializa el espacio de ejecución y
selecciona la primera tarea:

```
/init-execution
/init-next-task
/select-next-task
/prepare-task-run
/build-task-context {"taskId":"TASK-006","attempt":1}
```

`/build-next-task-context` es un wrapper de solo lectura que evita escribir
el `taskId` manualmente. Resuelve el run activo desde el token persistido del
estado canónico y solo funciona si el run ya fue preparado.

El flujo canónico:

1. `/devflow-init execution-stack` — Instala execution + next-task + shared-runtime con resolución de dependencias y lockfile
2. `/select-next-task` — Selector: invoca `select-next-task.mjs` para producir `selection.json`
4. `/prepare-task-run` — Motor de transición: valida la selección, crea el
   directorio del run, copia evidencia y registra la reserva en
   `execution-state.json`
5. `/build-task-context` — Context Builder: construye `execution-context.json` y
   `execution-prompt.md` con el alcance, criterios, predecesores y contexto
   técnico del repositorio

### Runtime instalado por `devflow init execution-stack`

El metapaquete `execution-stack` instala `shared-runtime`, `next-task` y
`execution` en orden topológico:

**shared-runtime:**
- `.devflow/shared/tools/devflow-runtime-helpers.mjs`

**execution:**
- `.devflow/execution/README.md`
- `.devflow/execution/execution-state.json`
- `.devflow/execution/execution-state.schema.json`
- `.devflow/execution/transition-journal.schema.json`
- `.devflow/execution/tools/execution-contract-helpers.mjs`
- `.devflow/execution/tools/execution-transition-engine.mjs`
- `.devflow/execution/tools/migrate-execution-state-v1-to-v2.mjs`
- `.devflow/execution/tools/prepare-task-run.mjs`
- `.devflow/execution/tools/touch-execution-state.mjs`

**next-task (dependencia de execution):**
- `.devflow/execution/selection.json`
- `.devflow/execution/task-selection.schema.json`
- `.devflow/execution/tools/select-next-task.mjs`
- `.devflow/execution/tools/validate-next-task.mjs`

El lockfile en `.devflow/devflow-lock.json` registra qué paquetes están
instalados, sus dependencias y los hashes de sus managed files.
`devflow audit` verifica la integridad de la instalación.

### Instalador centralizado (`devflow init`)

Los paquetes DevFlow se instalan mediante `bin/devflow.mjs`, invocado
normalmente a través del slash command `/devflow-init`:

```bash
node bin/devflow.mjs init <package>    # Instala un paquete y sus dependencias
node bin/devflow.mjs audit             # Verifica integridad de la instalación
node bin/devflow.mjs audit --fix       # Reinstala managed files faltantes
```

Paquetes disponibles: `shared-runtime`, `software-architect`, `task-planner`,
`next-task`, `execution`, `context-builder`, `planning-stack`, `execution-stack`,
`all`.

Cada paquete declara en `packages/<name>/manifest.json`:
- **Archivos managed** (code/schemas, verificados por hash)
- **Archivos mutables** (nunca sobrescritos)
- **Archivos seed** (creados solo si no existen)
- **Dependencias** de otros paquetes (resueltas topológicamente con detección
  de ciclos)
- **Ownership** exclusivo: un archivo pertenece a un solo paquete

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

Las suites actuales son deterministas: prueban scripts, herramientas y
contratos de archivos sin iniciar OpenCode ni depender de un modelo.

No inician OpenCode ni validan conversaciones, permisos en runtime, slash
commands, delegación con `task` o gates humanos. Tampoco existe una prueba
E2E de OpenCode completa.

```bash
make test
```

Ejecución separada:

```bash
make test-installer
make test-repository
make test-software-architect-tools
make test-task-planner-tools
make test-next-task-tools
make test-execution-tools
make test-agent-contracts
```

| Target | Cobertura |
|--------|-----------|
| `validate` | Integridad del repositorio (JSON, frontmatter, rutas requeridas, cobertura de tests) |
| `test-installer` | Instalador centralizado: 16 tests (instalación básica, idempotencia, shared directories, mutables vs managed, dependencias, lockfile, auditoría, errores CLI) |
| `test-repository` | Instalación por symlinks, creación de scaffold, simulación contractual de `/init-execution` + `/init-next-task` y desinstalación |
| `test-software-architect-tools` | Validador de blueprint, migración v1→v2, estados reproducibles, publish |
| `test-task-planner-tools` | Herramientas deterministas de task-planner (6 suites: permisos, timestamps, validación de plan, épicas, capacidades) |
| `test-next-task-tools` | Selector y gate de next-task con pruebas funcionales deterministas + `node --check` |
| `test-execution-tools` | Motor de transiciones de ejecución (prepare-task-run, execution-transition-engine) |
| `test-agent-contracts` | Contratos de permisos de agentes y resolución determinista de `build-next-task-context` |

La suite completa (`make test`) ejecuta `validate` primero, luego las 7 suites
de prueba en orden. Cualquier fallo en cualquier suite detiene la ejecución.

### Cobertura de runtime

El runtime de OpenCode que sí queda cubierto indirectamente:

- **Contratos de permisos:** se verifica que `context-builder.md` tenga
  `mode: subagent`, no edite `execution-state.json` ni `selection.json`, no
  tenga `mkdir`, y que `build-next-task-context.md` no instruya ejecutar
  `prepare-task-run`.
- **Transiciones de estado:** se prueba el motor transaccional
  `execution-transition-engine.mjs` con reserva, recuperación, concurrencia,
  lock, journal y fault injection.
- **Preparación de runs:** se prueba `prepare-task-run.mjs` como CLI real con
  fixture completo de `.devflow/execution/`.
- **Instalación real del runtime:** `test-scripts.sh` y `test-devflow-installer.sh`
  instalan templates globales en un directorio temporal, simulan `/init-execution`
  y `/init-next-task`, inicializan `execution-state.json`, ejecutan
  `prepare-task-run.mjs` y verifican lockfile, hashes e integridad.
- **Validación estructural:** `validate.sh` verifica que toda herramienta
  runtime tenga su ruta en `required_paths`, que todo frontmatter sea válido,
  y que ningún archivo `.test.mjs` quede fuera de `make test`.

### Lo que NO cubre `make test`

- Conversaciones completas de OpenCode con modelo.
- Ejecución de agentes, subagentes o delegación con `task`.
- Slash commands en runtime (solo se verifican contratos de archivos).
- Gates humanos, aprobación de fases o promoción de drafts.
- Comportamiento de OpenCode con configuraciones reales.
- Pruebas E2E del pipeline Diseño → Planificación → Ejecución.

Una futura suite de runtime debe vivir separada (por ejemplo,
`test-opencode-smoke.sh`) y debe instalar la configuración en un entorno
temporal, iniciar OpenCode y verificar comandos, permisos, subagentes y
gates humanos. Esa suite no debe presentarse como determinista ni mezclarse
con las pruebas actuales.

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
