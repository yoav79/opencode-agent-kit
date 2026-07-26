# Backlog

Features, mejoras y correcciones pendientes organizadas por prioridad.

## Formato

Cada item del backlog sigue esta estructura:

```
### [Prioridad] Título descriptivo
**[Área/Módulo]**

Descripción del problema o mejora.

- **P:** prioridad | **E:** esfuerzo | **A:** área
- **Referencias:** `path/to/file:line`, ...
- **Criterio de salida:** condiciones para considerar el item completado
- **Depende de:** ID de otro item o "Ninguna"
- **Completado en:** commit (solo para Done)
```

Prioridades: `[Crítico]` `[Alto]` `[Medio]` `[Bajo]`

| Prioridad | Background | Border |
|---|---|---|
| Crítico | `#f5c6cb` | `#bd2130` |
| Alto | `#f8d7da` | `#dc3545` |
| Medio | `#fff3cd` | `#ffc107` |
| Bajo | `#d1ecf1` | `#17a2b8` |
| Done | `#d4edda` | `#28a745` |

---



## Alto

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Subagente para blueprint_consolidation (fase 3)
**[task-planner]**

Crear un subagente determinista (temp 0) para la generación de contratos
semánticos y requirements.json. Aislar esta lógica densa del agente
principal permite reducir pasos y errores.

- **P:** alta | **E:** M | **A:** agente
- **Referencias:** `opencode/agents/task-planner.md`
- **Criterio de salida:** subagente determinista que genera contratos semánticos y requirements.json de forma aislada
- **Depende de:** Falta task: allow en task-planner

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Hecho] Subagente para epic_decomposition (fase 8)
**[task-planner]**

Se creó el subagente `epic-decomposer` que descompone una épica por
invocación. El task-planner lo invoca secuencialmente, una por épica,
promueve los drafts y mantiene el control de índices globales.

- **P:** alta | **E:** L | **A:** agente
- **Referencias:** `opencode/agents/epic-decomposer.md`
- **Completado en:** (anterior)

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Integración con DevFlow real
**[general]**

Los artefactos se generan en `.devflow/` pero no hay un conector que
envíe las tareas a un sistema DevFlow real. `task-plan.json` y los
archivos en `tasks/` son el contrato de salida, pero falta el paso de
publicación.

- **P:** alta | **E:** XL | **A:** agente, tool
- **Referencias:** `templates/task-planner/task-plan.json`
- **Criterio de salida:** existe un conector que publica tareas desde `.devflow/` hacia un sistema DevFlow real
- **Depende de:** Ninguna

</div>

---

## Medio



<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Hecho] task: allow habilitado en task-planner
**[task-planner]**

Se agregó `task: allow` al agente task-planner, permitiendo invocar
subagentes deterministas (epic-decomposer, blueprint-compiler, etc.).

- **P:** media | **E:** S | **A:** agente
- **Referencias:** `opencode/agents/task-planner.md`
- **Completado en:** (este commit)

</div>





<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Project-state.schema.json para task-planner
**[task-planner]**

Crear un schema JSON para `project-state.json` del task-planner, similar
al que ya tiene `software-architect`. La estructura es compleja
(approvals, artifacts, progress, 20+ contadores).

- **P:** media | **E:** S | **A:** template
- **Referencias:** `templates/task-planner/project-state.json`, `templates/software-architect/project-state.schema.json`
- **Criterio de salida:** schema JSON que valida la estructura completa del project-state de task-planner (approvals, artifacts, progress, contadores)
- **Depende de:** Ninguna

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Template task-planner.md sin shared timestamp tool
**[task-planner]**

`templates/task-planner/task-planner.md` no incluye
`"node $HOME/.config/opencode/templates/shared/tools/timestamp.mjs *": allow`
mientras que los otros agentes ya lo tienen. Agregarlo.

- **P:** media | **E:** S | **A:** agente
- **Referencias:** `templates/task-planner/task-planner.md`
- **Criterio de salida:** el template incluye el permiso para el shared timestamp tool
- **Depende de:** Ninguna

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Init command con versiones hardcodeadas
**[task-planner]**

`init-task-planner.md` tiene un contrato de 10 versiones (schemaVersion,
workflowVersion, validatorVersion, epicGraphVersion, timestampToolVersion,
etc.) que debe coincidir manualmente con los templates. No hay verificación
automática de que las versiones del comando coincidan con las plantillas.

- **P:** media | **E:** S | **A:** comando, tool
- **Referencias:** `opencode/commands/init-task-planner.md`
- **Criterio de salida:** existe verificación automática de que las versiones declaradas en el comando coinciden con las de los templates
- **Depende de:** Ninguna

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Hacer que mode: primary funcione sin comando
**[next-task]**

Actualmente `next-task` se invoca únicamente mediante comandos
(`/select-next-task`, `/prepare-task-run`). Debería poder invocarse
directamente como agente primario.

- **P:** media | **E:** S | **A:** agente, comando
- **Referencias:** `opencode/agents/next-task.md`
- **Criterio de salida:** next-task funciona como agente primario sin depender de slash commands
- **Depende de:** Ninguna

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Validador determinista validate-execution-context.mjs
**[context-builder]**

Similar a `validate-next-task.mjs`. Debe verificar que
`execution-context.json` cumple su schema, los hashes coinciden, y el
prompt Markdown es consistente con el JSON.

- **P:** media | **E:** M | **A:** template, tool
- **Referencias:** `templates/context-builder/execution-context.schema.json`, `templates/next-task/tools/validate-next-task.mjs`
- **Criterio de salida:** validador determinista que verifica schema, hashes y consistencia Markdown/JSON
- **Depende de:** Ninguna

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Patrón `**` en permisos
**[context-builder]**

OpenCode no soporta `**` (globstar). Se cambió a `*` en la última
revisión. Verificar que `*` alcanza para los templates.

- **P:** media | **E:** S | **A:** agente
- **Referencias:** `opencode/agents/context-builder.md`
- **Criterio de salida:** todos los patrones de permisos usan sintaxis compatible con OpenCode y cubren los templates necesarios
- **Depende de:** Ninguna

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Agregar test para validate-next-task.mjs
**[general]**

`validate-plan.mjs` y `update-timestamps.mjs` tienen tests.
`validate-next-task.mjs` no.

- **P:** media | **E:** M | **A:** tool, test
- **Referencias:** `templates/next-task/tools/validate-next-task.mjs`
- **Criterio de salida:** validate-next-task.mjs tiene archivo de test con cobertura de casos principales
- **Depende de:** Ninguna

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] generate-scaffold.sh no está alineado con el scaffold actual
**[scripts]**

El generador trataría `contracts/`, `doc-templates/` y `migration/` como
directorios del proyecto y copiaría tools, mientras el scaffold actual crea
solo directorios operativos. Regenerarlo produciría una estructura distinta e
incorrecta.

- **P:** media | **E:** M | **A:** script, scaffold, test
- **Referencias:** `scripts/generate-scaffold.sh:102-116`, `templates/software-architect/scaffold.json:3-13`
- **Criterio de salida:** regenerar el scaffold de software-architect produce exactamente la estructura operativa versionada
- **Depende de:** generate-scaffold.sh: rutas hardcodeadas

</div>

---

## Bajo

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] build-epic-graph.mjs sin tests
**[task-planner]**

`validate-plan.mjs` y `update-timestamps.mjs` tienen archivos `.test.mjs`.
`build-epic-graph.mjs` no.

- **P:** baja | **E:** M | **A:** tool, test
- **Referencias:** `templates/task-planner/tools/build-epic-graph.mjs`
- **Criterio de salida:** build-epic-graph.mjs tiene archivo .test.mjs con cobertura de casos principales
- **Depende de:** Ninguna

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] SEMANTIC-CONTRACT.md en inglés
**[task-planner]**

Único archivo en inglés en todo el repositorio. Pasarlo a español o
eliminarlo si su contenido ya está cubierto en el workflow.

- **P:** baja | **E:** S | **A:** docs
- **Referencias:** `templates/task-planner/SEMANTIC-CONTRACT.md`
- **Criterio de salida:** el archivo está en español o eliminado si es redundante
- **Depende de:** Ninguna

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] validate-plan.mjs refactor
**[task-planner]**

5071 líneas en un solo archivo. Dividir en módulos separados por
dominio de validación (semántica, dependencias, capacidades, etc.).

- **P:** baja | **E:** XL | **A:** tool
- **Referencias:** `templates/task-planner/tools/validate-plan.mjs`
- **Criterio de salida:** el validador está dividido en módulos por dominio con tests independientes
- **Depende de:** Ninguna

</div>



<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] Revisar permisos de read
**[context-builder]**

`context-builder` tiene `"*": allow` en read. Sería más seguro
restringirlo a `.devflow/` y archivos de repo necesarios (manifiestos,
git).

- **P:** baja | **E:** M | **A:** agente
- **Referencias:** `opencode/agents/context-builder.md`
- **Criterio de salida:** permisos de read restringidos a `.devflow/` y archivos de repo necesarios
- **Depende de:** Ninguna

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] Reporte con schema JSON
**[consistency-reviewer]**

Además del reporte Markdown, producir un `review-report.json` con schema
validable para que herramientas externas puedan procesar los hallazgos.

- **P:** baja | **E:** S | **A:** template
- **Referencias:** `opencode/agents/consistency-reviewer.md`
- **Criterio de salida:** el agente produce un review-report.json con schema validable junto al reporte Markdown
- **Depende de:** Ninguna

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] Normalizar nombres de clasificaciones
**[general]**

`next-task` usa `TASK_SELECTED`, `NO_READY_TASK`, etc. `context-builder`
usa `READY`, `PLAN_DEFECT`, etc. `consistency-reviewer` usa `BLOCKING`,
`WARNING`, `INFO`. Definir un vocabulario compartido entre agentes de
ejecución y revisión.

- **P:** baja | **E:** S | **A:** agente
- **Referencias:** `opencode/agents/next-task.md`, `opencode/agents/context-builder.md`, `opencode/agents/consistency-reviewer.md`
- **Criterio de salida:** vocabulario de clasificaciones documentado y compartido entre todos los agentes
- **Depende de:** Ninguna

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] README: documentar schemas y contratos
**[general]**

Los schemas JSON (`execution-state.schema.json`,
`task-selection.schema.json`, `execution-context.schema.json`) no están
documentados. Incluir un diagrama de contratos.

- **P:** baja | **E:** M | **A:** docs
- **Referencias:** `README.md`, `templates/context-builder/execution-state.schema.json`, `templates/next-task/task-selection.schema.json`, `templates/context-builder/execution-context.schema.json`
- **Criterio de salida:** README documenta los schemas JSON y los contratos entre agentes con diagrama incluido
- **Depende de:** Ninguna

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] Modo dry-run para init-*
**[general]**

Los comandos `/init-*` modifican archivos sin confirmación. Soportar un
flag `--dry-run` para mostrar qué harían sin escribirlo.

- **P:** baja | **E:** M | **A:** comando
- **Referencias:** `opencode/commands/init-software-architect.md`, `opencode/commands/init-task-planner.md`
- **Criterio de salida:** todos los comandos init-* soportan flag --dry-run que muestra cambios sin ejecutarlos
- **Depende de:** Ninguna

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] generate-scaffold.sh: rutas hardcodeadas
**[scripts]**

El script tiene valores fijos en el mapa `scaffolds`. No detecta
automáticamente nuevos agentes agregados al directorio `templates/`.

- **P:** baja | **E:** S | **A:** script
- **Referencias:** `scripts/generate-scaffold.sh:1-120`
- **Criterio de salida:** el script detecta automáticamente agentes en templates/ sin mapa hardcodeado
- **Depende de:** Ninguna

</div>

<div style="background:#d1ecf1; border-left:4px solid #17a2b8; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] create-project.sh: directory con ruta anidada
**[scripts]**

`scaffold.json` usa `".devflow/execution"` como `directory`.
`create-project.sh` crea `project_path / dir_name`. Con rutas anidadas
funciona porque usa `mkdir -p`, pero verificar que el `AGENTS.md` y
`project-state.json` se generan en la ubicación correcta.

- **P:** baja | **E:** S | **A:** script
- **Referencias:** `scripts/create-project.sh:1-150`
- **Criterio de salida:** create-project.sh maneja correctamente rutas anidadas en scaffold directories
- **Depende de:** Ninguna

</div>

---

## <span style="color:#155724">&#x2713; Done</span>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] El validador acepta documentos obligatorios no registrados
**[software-architect]**

La validación recorre solo las entradas presentes en `state.documents`. Si se
elimina una clave obligatoria junto con su archivo, no detecta la ausencia.

Corregido en `validate-blueprint.mjs:267-272`: nueva validación que verifica que
las 14 claves de `DOC_KEY_TO_FILENAME` existan en `state.documents`.

- **P:** alta | **E:** S | **A:** validator, test
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs:267-272`
- **Criterio de salida:** el validador exige exactamente las 14 claves de documentos y detecta claves faltantes aunque tampoco exista el archivo
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Validación de gates contradice el validador final
**[software-architect]**

El agente exigía ejecutar `validate-blueprint.mjs` antes de aprobar fases 8, 12
y 14, pero el validador exigía la existencia física de los 14 documentos. En
fases intermedias los documentos futuros no existen por diseño.

Corregido en `validate-blueprint.mjs` y `software-architect.md`: nuevo modo
`--gate 8|12|14` que valida solo documentos acumulados hasta la fase indicada.
El modo sin `--gate` conserva semántica de validador final.

- **P:** alta | **E:** M | **A:** agente, validator, test
- **Referencias:** `opencode/agents/software-architect.md:260-285`, `templates/software-architect/tools/validate-blueprint.mjs:174-211`, `templates/software-architect/tools/validate-blueprint.mjs:280-306`, `templates/software-architect/tools/validate-blueprint.mjs:531-554`
- **Criterio de salida:** los gates 8/12/14 pueden validarse sin exigir documentos futuros, y la validación final sigue exigiendo el blueprint completo
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Scaffold inicial incompatible con el schema real
**[software-architect]**

`project-state.json` usaba `null` en `privacy`, `backups`, `maintainability` y
`deploymentRequirements`, pero `project-state.schema.json` define esos campos
como `string`. El validador no lo detectaba porque no validaba tipos primitivos
completos del schema.

Corregido en `project-state.json` y `validate-blueprint.mjs`: el scaffold usa
strings vacíos donde el schema exige `string`, y `matchSchema` valida tipos
primitivos, `const`, `enum`, `oneOf`, arrays y objetos básicos.

- **P:** alta | **E:** M | **A:** scaffold, schema, validator, test
- **Referencias:** `templates/software-architect/project-state.json:120-145`, `templates/software-architect/project-state.schema.json:549-600`, `templates/software-architect/tools/validate-blueprint.mjs:319-436`
- **Criterio de salida:** el scaffold inicial cumple el schema real y el validador detecta incompatibilidades de tipo primitivas
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] La validación de gates acepta estados no aprobados
**[software-architect]**

Para fases 8, 12 y 14 solo se rechazan `pending` e `in_progress`. Estados como
`blocked`, `waiting_for_user` o `needs_revision` pasan aunque no representan
aprobación humana.

Corregido en `validate-blueprint.mjs:448-462`: exige `approved` tanto en fase
como en documento; rechaza cualquier otro estado.

- **P:** alta | **E:** S | **A:** validator, workflow, test
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs:448-462`
- **Criterio de salida:** cada gate se considera superado únicamente cuando su fase y documento están `approved` y existe evidencia de aprobación humana
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] La detección de IDs REQ duplicados no funciona con la plantilla
**[software-architect]**

La plantilla oficial usa tablas con líneas como `| REQ-001 |`, pero el
validador busca IDs al comienzo exacto de la línea mediante `^REQ-`.

Corregido en `validate-blueprint.mjs:166-172`: `markdownIds` usa regex sin
ancla `^` y con flag `g`, encontrando IDs en celdas de tabla.

- **P:** alta | **E:** S | **A:** validator, template, test
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs:166-172`
- **Criterio de salida:** se detectan IDs válidos y duplicados en el formato de tabla oficial, con pruebas positivas y negativas
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] La migración puede producir un proyecto v2 inválido
**[software-architect]**

Las fases nuevas 4 y 11 se crean como `pending`, pero se preservan aprobaciones
posteriores de v1. Documentos migrados pueden carecer de `approvedAt` y faltan
claves obligatorias.

Corregido en `migrate-v1-to-v2.mjs:162-172`: normaliza `approvedAt` (nunca
`undefined`), itera sobre las 14 claves de `DOC_KEY_TO_FILENAME`. Eliminada
constante `NEW_DOC_KEYS` (huérfana).

- **P:** alta | **E:** M | **A:** migración, estado, test
- **Referencias:** `templates/software-architect/tools/migrate-v1-to-v2.mjs:162-172`
- **Criterio de salida:** la migración invalida o reabre fases dependientes, recalcula `currentPhase`/`project.status` y siempre produce una secuencia v2 lógicamente consistente
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Estructura de llaves rota en validateDocExistence
**[software-architect]**

Las llaves de cierre `});` estaban 65 líneas después del bloque `if (!ok)`,
dejando `resolveSchemaPath`, `matchSchema` y todo el validador JSON Schema
atrapados dentro de un `.then()` callback. Causaba `resolveSchemaPath is not
defined` en tiempo de ejecución, impidiendo la validación JSON Schema.

Corregido en `validate-blueprint.mjs:275-292`: el bloque `checks.push(...)`
cierra correctamente y las funciones de schema validation quedan como
declaraciones de primer nivel.

- **P:** alta | **E:** M | **A:** validator
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs`
- **Criterio de salida:** todas las funciones de validación JSON Schema son accesibles en el ámbito correcto
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] matchSchema falla con esquemas propertyNames/patternProperties
**[software-architect]**

`matchSchema` asumía que todo esquema define `properties`. La definición de
`phases` usa `propertyNames` + `patternProperties` en lugar de `properties`,
causando que cada clave de fase se reporte como `SCHEMA_ADDITIONAL_PROP`.

Corregido en `validate-blueprint.mjs:305-318`: ahora verifica que `props` exista
antes de validar `additionalProperties`.

- **P:** alta | **E:** S | **A:** validator, schema
- **Referencias:** `templates/software-architect/project-state.schema.json:141-175`, `templates/software-architect/tools/validate-blueprint.mjs:305-318`
- **Criterio de salida:** el validador reconoce esquemas con propertyNames/patternProperties sin falsos positivos
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Invocación de subagentes ambigua o no ejecutable
**[software-architect]**

El agente ordena usar `task`, pero después describe nombres de slash commands
como `compile-blueprint technical-requirements` y `review-consistency`. `task`
debe seleccionar explícitamente el subagente y proporcionarle un prompt; no
ejecuta automáticamente un slash command.

Corregido en `opencode/agents/software-architect.md:134-139`: ahora cada
delegación especifica subagente, prompt con inputs requeridos según el
contrato, modo y ruta de salida esperada en drafts/.

- **P:** alta | **E:** S | **A:** agente, contratos, comandos
- **Referencias:** `opencode/agents/software-architect.md:134-139`
- **Criterio de salida:** cada delegación define subagente, prompt, modo, inputs esperados y códigos de retorno sin depender de semántica implícita
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] project-state no almacena toda la información exigida
**[software-architect]**

El agente exige registrar cada decisión confirmada y 17 atributos por módulo,
pero el schema de módulos prohíbe propiedades adicionales y omite reglas de
negocio, notificaciones, reportes, criterios de aceptación y clasificación
MVP. También faltan secciones estructuradas para roadmap, privacidad, backups,
mantenibilidad y requisitos de despliegue.

Corregido en `project-state.schema.json`: module ahora incluye businessRules,
notifications, reports, acceptanceCriteria, mvpClassification. Nuevas secciones
top-level: deliveryRoadmap, privacy, backups, maintainability,
deploymentRequirements. project-state.json template actualizado.

- **P:** alta | **E:** L | **A:** agente, schema, estado, templates
- **Referencias:** `templates/software-architect/project-state.schema.json:283-347`, `templates/software-architect/project-state.json:117-149`
- **Criterio de salida:** toda información que el agente debe registrar tiene representación válida y trazable en `project-state.json` y su schema
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] El JSON Schema distribuido nunca se aplica
**[software-architect]**

El comando copia `project-state.schema.json`, pero `validate-blueprint.mjs` no
lo carga y realiza validaciones manuales parciales. Además, el schema permite
un objeto `phases` vacío y hace opcionales secciones que el agente considera
canónicas.

Corregido: `validate-blueprint.mjs` ahora carga `project-state.schema.json` y
ejecuta `matchSchema()` validando required, additionalProperties y $ref contra
las definiciones del schema. Schema de phases ahora exige `minProperties: 14`.

- **P:** alta | **E:** M | **A:** schema, validator, test
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs:276-329`, `templates/software-architect/project-state.schema.json:129`
- **Criterio de salida:** el validador aplica el schema distribuido y el schema exige todas las fases y secciones canónicas del estado v2
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] El gate humano final contradice el comportamiento del agente
**[software-architect]**

Workflow y comando exigen aprobación humana explícita en fase 14, pero el
agente declara terminado el blueprint inmediatamente cuando el revisor devuelve
`APPROVED`. Falta solicitar y registrar la aprobación humana final.

Corregido en `opencode/agents/software-architect.md:146`: ahora solicita
aprobación humana explícita antes de cerrar fase 14.

- **P:** alta | **E:** S | **A:** agente, workflow, estado
- **Referencias:** `opencode/agents/software-architect.md:146`
- **Criterio de salida:** el veredicto técnico habilita la solicitud del gate, pero solo la aprobación explícita del usuario completa la fase 14
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Crítico] `/init-software-architect` no puede ejecutar su propia inicialización
**[software-architect]**

El comando debe crear directorios y copiar plantillas, pero el agente deniega
todo `bash` salvo dos comandos Node y solo permite editar dentro de
`.devflow/software-architect/**`. No puede ejecutar `mkdir` ni `cp`, ni crear
directorios vacíos como `archive/` o `decisions/`.

Se agregaron permisos `mkdir -p .devflow/software-architect/*` y
`cp * .devflow/software-architect/*` al agente.
Corregido en `opencode/agents/software-architect.md:20-23`.

- **P:** crítica | **E:** M | **A:** agente, comando, permisos
- **Referencias:** `opencode/agents/software-architect.md:20-23`
- **Criterio de salida:** el agente puede inicializar y reparar de forma segura toda la estructura declarada sin obtener permisos de escritura fuera de `.devflow/software-architect/`
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] El flujo recomendado deja timestamps en null
**[software-architect]**

`create-project.sh` copia `project-state.json` y después recomienda ejecutar
`/init-software-architect`. El comando ahora siempre verifica timestamps y los
asigna si están en `null`, sin necesidad de que él mismo haya creado el archivo.
Corregido en `opencode/commands/init-software-architect.md` paso 6.

- **P:** alta | **E:** S | **A:** comando, script, estado
- **Referencias:** `opencode/commands/init-software-architect.md:79-88`
- **Criterio de salida:** cualquier estado recién creado recibe timestamps deterministas exactamente una vez, independientemente del punto de entrada
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Templates de documento por fase
**[software-architect]**

Creados 12 templates en `templates/software-architect/doc-templates/`
con secciones obligatorias, condicionales y checklist. El agente los lee
desde el directorio global y los usa como estructura base.

- **P:** alta | **E:** L | **A:** template
- **Referencias:** `templates/software-architect/doc-templates/`
- **Criterio de salida:** 12 templates con secciones obligatorias, condicionales y checklist, legibles por el agente
- **Depende de:** Ninguna
- **Completado en:** `600b7fc`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Validador determinista validate-blueprint.mjs
**[software-architect]**

Creado `templates/software-architect/tools/validate-blueprint.mjs`.
Verifica: existencia de 12 docs, headings vs templates, consistencia
estado/fase, puertas de aprobación, ADRs, orphan docs, IDs únicos REQ-*.

- **P:** alta | **E:** L | **A:** tool
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs:1-537`
- **Criterio de salida:** validador determinista que verifica los 12 documentos, headings, estado/fase, gates, ADRs, orphan docs y IDs REQ únicos
- **Depende de:** Fase 1 — Cimientos (workflow v2 definido)
- **Completado en:** `282402a`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Project-state.schema.json
**[software-architect]**

Creado `templates/software-architect/project-state.schema.json`.
Schema JSON Schema draft 2020-12 para validar project-state.json.
Cubre: project, phases, confirmed, documents, architecture, modules,
integrations, entities, risks, assumptions y más.

- **P:** alta | **E:** M | **A:** template
- **Referencias:** `templates/software-architect/project-state.schema.json:1-447`
- **Criterio de salida:** schema JSON Schema draft 2020-12 que cubre todas las secciones del estado
- **Depende de:** Fase 2 — Datos y templates (project-state v2)
- **Completado en:** `3241aa7`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Workflow paths relativas → absolutas
**[software-architect]**

`workflow.md` cambiado de `docs/XX.md` a `.devflow/software-architect/docs/XX.md`.

- **P:** media | **E:** S | **A:** docs
- **Referencias:** `templates/software-architect/workflow.md`
- **Criterio de salida:** todas las rutas en workflow.md son absolutas y no dependen del directorio actual implícito
- **Depende de:** Fase 1 — Cimientos (workflow v2)
- **Completado en:** `1cdccc3` (incluido en Fase 1)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Document.path eliminado
**[software-architect]**

Eliminado `path` de cada entrada en `project-state.json.documents`.
Actualizado schema y validador para computar rutas desde un mapping fijo.

- **P:** media | **E:** M | **A:** agente, schema, tool
- **Referencias:** `templates/software-architect/project-state.json`, `templates/software-architect/project-state.schema.json`, `templates/software-architect/tools/validate-blueprint.mjs`
- **Criterio de salida:** el campo `path` no existe en documents; las rutas se computan desde mapping fijo
- **Depende de:** Project-state.schema.json, Validador determinista validate-blueprint.mjs
- **Completado en:** `28bf30c`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Fase 6 — Corrección integral de coherencia
**[software-architect]**

Deadlock contractual de fase 11 eliminado: blueprint-compiler opera por modo
(technical-requirements/software-blueprint). Fase 14 unificada en drafts/ y
ya no compite entre docs/, drafts/ y review/. Permisos del agente restringidos
a .devflow/software-architect/**. Validador corregido con mapping
docKey→phaseKey y llamadas async completas. Migración v1→v2 corregida (fases
4/11, currentPhase inteligente, timestamp tool, rename explícito de docs).
Nuevos tests de migración real y consistency docKey→phaseKey. README, scripts,
scaffold y contratos alineados.

- **P:** alta | **E:** XL | **A:** agente, workflow, validator, migración
- **Referencias:** `opencode/agents/software-architect.md`, `templates/software-architect/workflow.md`, `templates/software-architect/tools/validate-blueprint.mjs`, `templates/software-architect/tools/migrate-v1-to-v2.mjs`
- **Criterio de salida:** deadlock contractual resuelto, fase 14 unificada, migración v1→v2 corregida, tests pasando
- **Depende de:** Fase 5 — Cierre
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Fase 5 — Cierre
**[software-architect]**

Migración v1→v2 definida (política + script). Tests deterministas del validator
y migración con 3 fixtures (valid-v2, missing-docs, blocked-review) y 7 checks
pasando. init-software-architect.md, README.md y scaffold sincronizados. Sin
referencias v1 operativas en el repositorio.

- **P:** alta | **E:** L | **A:** migración, tool, test, docs
- **Referencias:** `templates/software-architect/migration/v1-to-v2-policy.md`, `templates/software-architect/tools/migrate-v1-to-v2.mjs`, `tests/fixtures/software-architect/`, `tests/test-software-architect-tools.sh`, `opencode/commands/init-software-architect.md`
- **Criterio de salida:** migración definida y testeada, 3 fixtures, 7 checks pasando, sin referencias v1
- **Depende de:** Fase 4 — Validación y reglas, Fase 3 — Agentes
- **Completado en:** `3aa0a4b`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Fase 4 — Validación y reglas
**[software-architect]**

validate-blueprint.mjs actualizado a v2: mappings de 14 phases/docs, gates
8/12/14, schemaVersion 2, nueva validación cruzada de secciones de datos.
Workflow.md regla 7 + agente regla 19: subagentes escriben en drafts/, solo
el orquestador promueve a docs/.

- **P:** alta | **E:** L | **A:** tool, workflow, agente
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs`, `templates/software-architect/workflow.md`, `opencode/agents/software-architect.md`
- **Criterio de salida:** validator v2 con 14 phases/docs mappings, gates 8/12/14, regla drafts/ → docs/ definida
- **Depende de:** Fase 3 — Agentes
- **Completado en:** `024b5a0`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Fase 3 — Agentes
**[software-architect]**

software-architect refactorizado como orquestador con delegación genérica a
subagentes. Creados blueprint-compiler (subagente temp 0) y comando
/compile-blueprint. consistency-reviewer actualizado a docs v2, sin
dependencias circulares ni references a documents.*.path.

- **P:** alta | **E:** XL | **A:** agente, comando
- **Referencias:** `opencode/agents/software-architect.md`, `opencode/agents/blueprint-compiler.md`, `opencode/commands/compile-blueprint.md`, `opencode/agents/consistency-reviewer.md`, `opencode/commands/review-consistency.md`
- **Criterio de salida:** orquestador con delegación genérica, blueprint-compiler y consistency-reviewer creados y funcionales
- **Depende de:** Fase 2 — Datos y templates
- **Completado en:** `b299f5d`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Fase 2 — Datos y templates
**[software-architect]**

project-state actualizado a schemaVersion 2 con 14 fases, 14 documentos y
5 nuevas secciones de datos. Templates de documento creados/renombrados
para los 14 artefactos del workflow v2. Scaffold y tests actualizados con
directorio `review/`.

- **P:** alta | **E:** L | **A:** template, schema, scaffold
- **Referencias:** `templates/software-architect/project-state.json`, `templates/software-architect/project-state.schema.json`, `templates/software-architect/doc-templates/`, `scaffold.json`, `test-scripts.sh`
- **Criterio de salida:** schemaVersion 2, 14 fases, 14 docs, 5 secciones de datos, scaffold con review/
- **Depende de:** Fase 1 — Cimientos
- **Completado en:** `fde4110`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Fase 1 — Cimientos
**[software-architect]**

Workflow v2 definido con tabla canónica de 14 fases, tipos, entregables,
gates y dependencias. Contratos de interfaz para blueprint-compiler y
consistency-reviewer publicados.

- **P:** alta | **E:** L | **A:** workflow, contratos
- **Referencias:** `templates/software-architect/workflow.md`, `templates/software-architect/contracts/blueprint-compiler.md`, `templates/software-architect/contracts/consistency-reviewer.md`
- **Criterio de salida:** tabla canónica de 14 fases con tipos, entregables, gates, dependencias; contratos de subagentes publicados
- **Depende de:** Ninguna
- **Completado en:** `1cdccc3`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Integración de consistency-reviewer con fase 11
**[software-architect]**

`software-architect` ahora invoca automáticamente al `consistency-reviewer`
al llegar a la fase 11. Si el veredicto es `BLOCKED`, no avanza a la fase 12.
Se agregó `task: allow` y un procedimiento especial para la fase 11 en el
agente, más condición de salida en `workflow.md`.

- **P:** alta | **E:** M | **A:** agente, workflow
- **Referencias:** `opencode/agents/software-architect.md:127-146`, `templates/software-architect/workflow.md`
- **Criterio de salida:** el agente invoca consistency-reviewer en fase 11, veredicto BLOCKED detiene avance a fase 12
- **Depende de:** Fase 3 — Agentes (consistency-reviewer creado)
- **Completado en:** `a43953c`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] La migración promete backups que no crea
**[software-architect]**

Solo se respalda `project-state.json`. Los documentos se renombran sin copia,
pero el mensaje final afirma que todos los archivos originales tienen sufijo
`.v1`.

Corregido en `migrate-v1-to-v2.mjs`: antes de renombrar cada documento,
se crea una copia `.<archivo>.md.v1`. Mensaje final preciso sobre qué se respaldó.

- **P:** media | **E:** S | **A:** migración, docs, test
- **Referencias:** `templates/software-architect/tools/migrate-v1-to-v2.mjs`
- **Criterio de salida:** la herramienta crea los backups prometidos o comunica con precisión qué respalda y cómo revertir cada rename
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Soporte inconsistente de XDG_CONFIG_HOME
**[software-architect]**

El instalador y parte del comando respetan XDG, pero agente, permisos bash,
timestamp y política de migración fijan `$HOME/.config`. Una instalación con
`XDG_CONFIG_HOME` personalizado rompe esas rutas.

Corregido en `software-architect.md` y `v1-to-v2-policy.md`: rutas humanas usan
`${XDG_CONFIG_HOME:-$HOME/.config}`. Permisos bash conservan `$HOME/.config`
(estándar OpenCode para patrones de shell).

- **P:** media | **E:** M | **A:** agente, comando, migración, docs
- **Referencias:** `opencode/agents/software-architect.md:85-87,104,131`, `templates/software-architect/migration/v1-to-v2-policy.md:12`
- **Criterio de salida:** todas las rutas globales usan una única convención compatible con `XDG_CONFIG_HOME` y con el fallback `$HOME/.config`
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] El agente no puede explorar adecuadamente el proyecto
**[software-architect]**

`glob` y `grep` están restringidos a `.devflow/software-architect/**`, pero el
comando ordena revisar información existente del proyecto. Puede leer rutas
conocidas, pero no descubrir estructura, código, documentación o configuración.

Corregido en `software-architect.md:12-17`: permisos `glob` y `grep` cambiados
a `"*": allow` (solo lectura, consistente con `read: allow` global).

- **P:** media | **E:** S | **A:** agente, permisos
- **Referencias:** `opencode/agents/software-architect.md:12-17`
- **Criterio de salida:** el agente puede descubrir archivos del proyecto en solo lectura sin ampliar sus permisos de edición
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Rutas iniciales ambiguas
**[software-architect]**

El agente indica leer `workflow.md` y `project-state.json` sin la ruta
`.devflow/software-architect/`, mientras el comando sí define las ubicaciones
completas.

Corregido en `software-architect.md:43-45`: instrucciones usan rutas canónicas
`.devflow/software-architect/workflow.md` y
`.devflow/software-architect/project-state.json`.

- **P:** media | **E:** S | **A:** agente, docs
- **Referencias:** `opencode/agents/software-architect.md:43-45`
- **Criterio de salida:** todas las instrucciones usan rutas canónicas y no dependen del directorio actual implícito
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Fase 14 no tiene formato para el veredicto contractual
**[software-architect]**

El contrato calcula resultados desde `BLOCKING` y `WARNING`, pero la plantilla
de fase 14 no contiene secciones de veredicto, severidad ni conteos.

Corregido en `14-consistency-review.md`: nuevas secciones Veredicto, Resumen de
hallazgos, BLOCKING/WARNING/INFO con conteos y checklist. Compatible con el
contrato de consistency-reviewer.

- **P:** media | **E:** S | **A:** template, contrato, test
- **Referencias:** `templates/software-architect/doc-templates/14-consistency-review.md`
- **Criterio de salida:** la plantilla representa hallazgos por severidad, conteos y un veredicto inequívoco compatible con el contrato
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Revisiones posteriores dejan documentos indebidamente aprobados
**[software-architect]**

El workflow marca fases dependientes como `needs_revision`, pero los documentos
solo admiten `pending` o `approved`. El validador tampoco detecta un documento
`approved` cuya fase está `needs_revision`.

Corregido en `project-state.schema.json` y `validate-blueprint.mjs`:
`needs_revision` añadido a `documentEntry.status`. Validación cruzada
`DOC_APPROVED_PHASE_NEEDS_REVISION`. Ambos bugs (6 y 9) resueltos en el mismo
commit, por lo que la dependencia ya no aplica.

- **P:** media | **E:** M | **A:** workflow, schema, validator, test
- **Referencias:** `templates/software-architect/project-state.schema.json:477`, `templates/software-architect/tools/validate-blueprint.mjs:89-91,413-415`
- **Criterio de salida:** fases y documentos modelan coherentemente la invalidación, revisión y nueva aprobación de artefactos dependientes
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Reparación incompleta de inicializaciones parciales
**[software-architect]**

Si `.devflow/software-architect/` ya existe, el comando solo asegura `docs/` y
`drafts/`; no restaura `archive/` ni `decisions/`.

Corregido en `init-software-architect.md:69-76`: paso 5 ahora crea `archive/` y
`decisions/` si faltan, además de `drafts/` y `docs/`.

- **P:** media | **E:** S | **A:** comando, test
- **Referencias:** `opencode/commands/init-software-architect.md:69-76`
- **Criterio de salida:** reinvocar el comando restaura de forma idempotente todos los archivos y directorios faltantes sin sobrescribir contenido
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] La migración no está conectada al comando de inicio
**[software-architect]**

`/init-software-architect` no comprueba `schemaVersion` ni informa sobre la
política v1→v2. Puede intentar continuar un estado v1 usando workflow v2.

Corregido en `init-software-architect.md:93-101`: paso 7 verifica `schemaVersion`
y si es 1, detiene el flujo y muestra instrucción para migrar.

- **P:** media | **E:** S | **A:** comando, migración
- **Referencias:** `opencode/commands/init-software-architect.md:93-101`
- **Criterio de salida:** el inicio detecta v1, detiene el workflow v2 y ofrece instrucciones explícitas y no destructivas para migrar
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] El validador no forma parte del cierre del agente
**[software-architect]**

El agente tiene permiso para ejecutarlo, pero ninguna instrucción obliga a
usarlo antes de declarar terminado el blueprint. Además, el validador exige
todos los documentos aunque estén `pending`, por lo que no está definido en
qué momentos intermedios puede utilizarse.

Corregido en `software-architect.md:226-249`: nueva sección "Validación
obligatoria" que exige ejecutar `validate-blueprint.mjs` con 0 errores antes de
declarar terminado el blueprint. Validación parcial antes de gates 8/12/14.
Dependencia resuelta (El JSON Schema distribuido nunca se aplica fue completado
en commit anterior).

- **P:** media | **E:** M | **A:** agente, workflow, validator, test
- **Referencias:** `opencode/agents/software-architect.md:226-249`
- **Criterio de salida:** el workflow define cuándo ejecutar validación parcial y final, y la finalización requiere una ejecución exitosa registrada
- **Depende de:** El JSON Schema distribuido nunca se aplica
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Unificar ruta de templates
**[task-planner]**

`task-planner` usaba `$CONFIG_DIR/task-planner/templates/` mientras que los
demás agentes usan `$CONFIG_DIR/templates/<agente>/`. Ahora todas las rutas
usan `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/templates/task-planner/`.

Corregido en `task-planner.md`: bash cp y external_directory migrados a la
nueva convención con soporte `XDG_CONFIG_HOME`.

- **P:** media | **E:** S | **A:** agente, script
- **Referencias:** `opencode/agents/task-planner.md`
- **Criterio de salida:** todos los agentes usan la misma convención de ruta para templates desde `$CONFIG_DIR/templates/<agente>/`
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Duplicate agent definition
**[task-planner]**

`templates/task-planner/task-planner.md` eliminado. La única definición
canónica es `opencode/agents/task-planner.md`.

- **P:** media | **E:** S | **A:** agente
- **Referencias:** `opencode/agents/task-planner.md`, `templates/task-planner/task-planner.md`
- **Criterio de salida:** existe una sola definición canónica del agente task-planner, o ambas versiones están sincronizadas
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Readiness.json version mismatch (3.4 vs 3.5)
**[task-planner]**

El template `readiness.json` declaraba `"version": "3.4"` pero el validador
usa `VALIDATOR_VERSION = "3.5"`. Ahora sincronizado a 3.5.

- **P:** media | **E:** S | **A:** template, tool
- **Referencias:** `templates/task-planner/readiness.json`, `templates/task-planner/tools/validate-plan.mjs`
- **Criterio de salida:** el template y el validador usan la misma versión
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Bajo] task-planner.md copiado al proyecto
**[task-planner]**

`scaffold.json` ya no incluye `task-planner.md` en `files`. El agente no se
copia al proyecto.

- **P:** baja | **E:** S | **A:** template
- **Referencias:** `templates/task-planner/scaffold.json`
- **Criterio de salida:** decisión documentada sobre si task-planner.md debe copiarse al proyecto o no
- **Depende de:** Ninguna
- **Completado en:** (este commit)

</div>
