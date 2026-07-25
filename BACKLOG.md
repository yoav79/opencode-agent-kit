# Backlog

Features, mejoras y correcciones pendientes organizadas por agente/área.

## Formato

- **P:** Prioridad (alta, media, baja)
- **E:** Esfuerzo estimado (S, M, L, XL)
- **A:** Área (agente, comando, template, tool, script, docs)

---

## <span style="color:#155724">&#x2713; Done</span>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Templates de documento por fase (software-architect)

Creados 12 templates en `templates/software-architect/doc-templates/`
con secciones obligatorias, condicionales y checklist. El agente los lee
desde el directorio global y los usa como estructura base.

- Implementado en: `600b7fc`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Validador determinista validate-blueprint.mjs (software-architect)

Creado `templates/software-architect/tools/validate-blueprint.mjs`.
Verifica: existencia de 12 docs, headings vs templates, consistencia
estado/fase, puertas de aprobación, ADRs, orphan docs, IDs únicos REQ-*.

- Implementado en: `282402a`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Project-state.schema.json (software-architect)

Creado `templates/software-architect/project-state.schema.json`.
Schema JSON Schema draft 2020-12 para validar project-state.json.
Cubre: project, phases, confirmed, documents, architecture, modules,
integrations, entities, risks, assumptions y más.

- Implementado en: `3241aa7`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Workflow paths relativas → absolutas (software-architect)

`workflow.md` cambiado de `docs/XX.md` a `.devflow/software-architect/docs/XX.md`.

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Document.path eliminado (software-architect)

Eliminado `path` de cada entrada en `project-state.json.documents`.
Actualizado schema y validador para computar rutas desde un mapping fijo.

- Implementado en: `28bf30c`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Integración de consistency-reviewer con fase 11 (software-architect)

`software-architect` ahora invoca automáticamente al `consistency-reviewer`
al llegar a la fase 11. Si el veredicto es `BLOCKED`, no avanza a la fase 12.
Se agregó `task: allow` y un procedimiento especial para la fase 11 en el
agente, más condición de salida en `workflow.md`.

- Implementado en: pendiente de commit

</div>

---

## software-architect

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Definir contrato canónico del workflow v2

Formalizar las 14 fases, sus nombres, entradas, entregables, dependencias,
aprobaciones y criterios de salida. La aprobación final debe ser un gate de la
última fase, no una fase adicional sin artefacto.

- **P:** alta | **E:** M | **A:** workflow, docs
- **Criterio de salida:** existe una tabla canónica que sirve como única
  referencia para estado, schema, scaffold, agentes y validador.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Refactorizar project-state a schemaVersion 2

Actualizar `project-state.json` y `project-state.schema.json` con las nuevas
fases, documentos, estados y datos estructurados para Product Requirements,
Application Flow, UI/UX Brief, Backend Schema y Technical Requirements.

- **P:** alta | **E:** L | **A:** template, schema
- **Criterio de salida:** el estado inicial valida contra el schema y ambos
  representan exactamente el contrato canónico de 14 fases.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Crear templates de documentos del workflow v2

Crear o reemplazar los templates para Product Requirements, Application Flow,
UI/UX Brief, Backend Schema, Technical Requirements, Consistency Review y el
Software Blueprint consolidado. Ajustar los templates existentes al nuevo
orden y contrato de trazabilidad.

- **P:** alta | **E:** L | **A:** template
- **Criterio de salida:** cada fase tiene un template con entradas, secciones
  obligatorias, checklist y entregable inequívoco.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Refactorizar software-architect como orquestador

Conservar en el agente principal la entrevista, continuidad conversacional,
gestión de decisiones, actualización del estado, aprobaciones y delegación.
Extraer la compilación semántica y mantener una única autoridad sobre
`project-state.json`.

- **P:** alta | **E:** L | **A:** agente
- **Criterio de salida:** el agente principal es la única interfaz con el
  usuario y el único componente que cambia fases, aprobaciones y estado.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Definir contrato de interfaz para subagentes

Antes de construir compilador y revisor, formalizar un contrato escrito que
defina para cada uno: documentos de entrada, formato de salida, códigos de
retorno (`GENERATED`/`BLOCKED`), límite de permisos, y qué zonas del sistema
de archivos puede modificar. Esto evita contratos incompatibles entre
componentes.

- **P:** alta | **E:** S | **A:** workflow, docs
- **Criterio de salida:** existe un documento de interfaz que sirve como
  especificación para construir ambos subagentes sin ambigüedad.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Crear subagente blueprint-compiler y comando /compile-blueprint

Crear un subagente con temperatura `0` que lea documentos aprobados y genere
los drafts de `11-technical-requirements.md` y `SOFTWARE-BLUEPRINT.md`. Debe
responder con `GENERATED` o `BLOCKED`, sin interactuar con el usuario,
modificar documentos fuente ni actualizar el estado.
Crear también el comando `/compile-blueprint` para invocación independiente
y pruebas, análogo a `/review-consistency`.

- **P:** alta | **E:** M | **A:** agente, comando
- **Criterio de salida:** el compilador solo escribe en los drafts autorizados,
  se bloquea cuando faltan entradas, y el comando permite probarlo sin el
  agente principal.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Corregir consistency-reviewer para el workflow v2

Mover la revisión después de generar el Blueprint candidato y eliminar sus
precondiciones circulares. No debe exigir su propio documento de salida ni
usar `documents.*.path`, campo eliminado del estado. Debe revisar documentos
aprobados y el Blueprint candidato sin modificar fuentes.

- **P:** alta | **E:** M | **A:** agente, comando
- **Criterio de salida:** un veredicto `BLOCKED` impide la aprobación final y
  el revisor no depende de artefactos que todavía no pueden existir.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Actualizar validate-blueprint.mjs para workflow v2

Actualizar fases, mappings, documentos, gates y reglas de trazabilidad.
Validar relaciones entre Product Requirements, Application Flow, requisitos
funcionales, Backend Schema, arquitectura y Technical Requirements.

- **P:** alta | **E:** L | **A:** tool, test
- **Criterio de salida:** el validador acepta un fixture v2 completo, rechaza
  fixtures inconsistentes y no conserva mappings del workflow v1.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Agregar pruebas end-to-end del software-architect

Cubrir inicialización, reanudación, aprobación pendiente, compilador
bloqueado, revisión con warnings, revisión bloqueada y aprobación final.
Incluir pruebas de permisos para confirmar que los subagentes no modifican
estado ni documentos fuente.

- **P:** alta | **E:** L | **A:** test
- **Criterio de salida:** el workflow completo y sus gates se verifican con
  fixtures reproducibles sin requerir una conversación real.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Definir migración de proyectos schemaVersion 1

Definir si los proyectos existentes con 12 fases se migrarán a v2 o si el
nuevo workflow aplicará solo a proyectos nuevos. Si se implementa migración,
debe preservar decisiones, aprobaciones y documentos sin reinterpretarlos
silenciosamente.

- **P:** media | **E:** M | **A:** tool, schema, docs
- **Criterio de salida:** existe una política explícita y, cuando corresponda,
  una migración v1 a v2 validable y reversible.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Agregar directorio `review/` al scaffold

Actualmente el revisor crea `review/` manualmente si no existe. Debe ser
parte de los directorios explícitos del scaffold junto con `drafts/`,
`decisions/` y `archive/`.

- **P:** media | **E:** S | **A:** template, script
- **Criterio de salida:** el scaffold lista `review` en `dirs`, el comando
  init lo crea, y `test-scripts.sh` lo verifica.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Documentar política de drafts vs docs en workflow v2

Establecer regla explícita: el compilador y el revisor escriben únicamente en
`drafts/`; el agente principal promueve a `docs/` solo después de aprobación
humana o veredicto satisfactorio. El workflow y el agente deben reflejar esto
sin ambigüedad.

- **P:** media | **E:** S | **A:** workflow, docs
- **Criterio de salida:** existe una regla en workflow.md y en el agente
  principal que prohíbe escribir en `docs/` sin autorización explícita.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Sincronizar comando, scaffold y documentación con workflow v2

Actualizar `init-software-architect.md`, `scaffold.json`, `README.md`,
`CHANGELOG.md`, instalación y pruebas de symlinks. Corregir todas las
referencias al workflow de 12 fases y las diferencias de configuración del
agente.

- **P:** media | **E:** M | **A:** comando, template, script, docs
- **Criterio de salida:** búsquedas y validaciones no encuentran referencias
  operativas al workflow v1 fuera de la documentación histórica.

</div>

---

## task-planner

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Unificar ruta de templates

`task-planner` usa `$CONFIG_DIR/task-planner/templates/` mientras que
`software-architect` y `context-builder` usan
`$CONFIG_DIR/templates/<agente>/`. Unificar.

- **P:** media | **E:** S | **A:** agente, script

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Subagente para blueprint_consolidation (fase 3)

Crear un subagente determinista (temp 0) para la generación de contratos
semánticos y requirements.json. Aislar esta lógica densa del agente
principal permite reducir pasos y errores.

- **P:** alta | **E:** M | **A:** agente

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Subagente para epic_decomposition (fase 8)

Crear un subagente que descomponga una épica por invocación. El task-planner
lo invoca N veces (una por épica). Reduce la carga del agente principal y
permite procesar épicas en paralelo.

- **P:** alta | **E:** L | **A:** agente

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Duplicate agent definition

`opencode/agents/task-planner.md` y `templates/task-planner/task-planner.md`
son dos versiones del mismo agente con permisos diferentes. Eliminar o
sincronizar para evitar desviación.

- **P:** media | **E:** S | **A:** agente

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Readiness.json version mismatch (3.4 vs 3.5)

El template `readiness.json` declara `"version": "3.4"` pero
`validate-plan.mjs` usa `VALIDATOR_VERSION = "3.5"`. Unificar.

- **P:** media | **E:** S | **A:** template, tool

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Project-state.schema.json para task-planner

Crear un schema JSON para `project-state.json` del task-planner, similar
al que ya tiene `software-architect`. La estructura es compleja
(approvals, artifacts, progress, 20+ contadores).

- **P:** media | **E:** S | **A:** template

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Template task-planner.md sin shared timestamp tool

`templates/task-planner/task-planner.md` no incluye
`"node $HOME/.config/opencode/templates/shared/tools/timestamp.mjs *": allow`
mientras que los otros agentes ya lo tienen. Agregarlo.

- **P:** media | **E:** S | **A:** agente

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### build-epic-graph.mjs sin tests

`validate-plan.mjs` y `update-timestamps.mjs` tienen archivos `.test.mjs`.
`build-epic-graph.mjs` no.

- **P:** baja | **E:** M | **A:** tool, test

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### SEMANTIC-CONTRACT.md en inglés

Único archivo en inglés en todo el repositorio. Pasarlo a español o
eliminarlo si su contenido ya está cubierto en el workflow.

- **P:** baja | **E:** S | **A:** docs

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### validate-plan.mjs refactor

5071 líneas en un solo archivo. Dividir en módulos separados por
dominio de validación (semántica, dependencias, capacidades, etc.).

- **P:** baja | **E:** XL | **A:** tool

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### task-planner.md copiado al proyecto

`scaffold.json` incluye `task-planner.md` en `files`, copiando 1080
líneas del agente al proyecto como `.devflow/task-planner/task-planner.md`.
Evaluar si es necesario o si se puede eliminar del scaffold.

- **P:** baja | **E:** S | **A:** template

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Falta task: allow en task-planner

Actualmente `task: deny`. Si vamos a crear subagentes para fases 3 y 8,
necesita `task: allow`. También permitiría invocar al consistency-reviewer
u otros validadores externos.

- **P:** media | **E:** S | **A:** agente

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Init command con versiones hardcodeadas

`init-task-planner.md` tiene un contrato de 10 versiones (schemaVersion,
workflowVersion, validatorVersion, epicGraphVersion, timestampToolVersion,
etc.) que debe coincidir manualmente con los templates. No hay verificación
automática de que las versiones del comando coincidan con las plantillas.

- **P:** media | **E:** S | **A:** comando, tool

</div>

---

## next-task

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Hacer que mode: primary funcione sin comando

Actualmente `next-task` se invoca únicamente mediante comandos
(`/select-next-task`, `/prepare-task-run`). Debería poder invocarse
directamente como agente primario.

- **P:** media | **E:** S | **A:** agente, comando

</div>

---

## context-builder

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Validador determinista validate-execution-context.mjs

Similar a `validate-next-task.mjs`. Debe verificar que
`execution-context.json` cumple su schema, los hashes coinciden, y el
prompt Markdown es consistente con el JSON.

- **P:** media | **E:** M | **A:** template, tool

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Revisar permisos de read

`context-builder` tiene `"*": allow` en read. Sería más seguro
restringirlo a `.devflow/` y archivos de repo necesarios (manifiestos,
git).

- **P:** baja | **E:** M | **A:** agente

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Patrón `**` en permisos

OpenCode no soporta `**` (globstar). Se cambió a `*` en la última
revisión. Verificar que `*` alcanza para los templates.

- **P:** media | **E:** S | **A:** agente

</div>

---

## consistency-reviewer

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Reporte con schema JSON

Además del reporte Markdown, producir un `review-report.json` con schema
validable para que herramientas externas puedan procesar los hallazgos.

- **P:** baja | **E:** S | **A:** template

</div>

---

## general (multi-agente)

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Integración con DevFlow real

Los artefactos se generan en `.devflow/` pero no hay un conector que
envíe las tareas a un sistema DevFlow real. `task-plan.json` y los
archivos en `tasks/` son el contrato de salida, pero falta el paso de
publicación.

- **P:** alta | **E:** XL | **A:** agente, tool

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Agregar test para validate-next-task.mjs

`validate-plan.mjs` y `update-timestamps.mjs` tienen tests.
`validate-next-task.mjs` no.

- **P:** media | **E:** M | **A:** tool, test

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Normalizar nombres de clasificaciones

`next-task` usa `TASK_SELECTED`, `NO_READY_TASK`, etc. `context-builder`
usa `READY`, `PLAN_DEFECT`, etc. `consistency-reviewer` usa `BLOCKING`,
`WARNING`, `INFO`. Definir un vocabulario compartido entre agentes de
ejecución y revisión.

- **P:** baja | **E:** S | **A:** agente

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### README: documentar schemas y contratos

Los schemas JSON (`execution-state.schema.json`,
`task-selection.schema.json`, `execution-context.schema.json`) no están
documentados. Incluir un diagrama de contratos.

- **P:** baja | **E:** M | **A:** docs

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Modo dry-run para init-*

Los comandos `/init-*` modifican archivos sin confirmación. Soportar un
flag `--dry-run` para mostrar qué harían sin escribirlo.

- **P:** baja | **E:** M | **A:** comando

</div>

---

## scripts

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### generate-scaffold.sh: rutas hardcodeadas

El script tiene valores fijos en el mapa `scaffolds`. No detecta
automáticamente nuevos agentes agregados al directorio `templates/`.

- **P:** baja | **E:** S | **A:** script

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### create-project.sh: directory con ruta anidada

`scaffold.json` usa `".devflow/execution"` como `directory`.
`create-project.sh` crea `project_path / dir_name`. Con rutas anidadas
funciona porque usa `mkdir -p`, pero verificar que el `AGENTS.md` y
`project-state.json` se generan en la ubicación correcta.

- **P:** baja | **E:** S | **A:** script

</div>
