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

### Fase 6 — Corrección integral de coherencia (software-architect)

Deadlock contractual de fase 11 eliminado: blueprint-compiler opera por modo
(technical-requirements/software-blueprint). Fase 14 unificada en drafts/ y
ya no compite entre docs/, drafts/ y review/. Permisos del agente restringidos
a .devflow/software-architect/**. Validador corregido con mapping
docKey→phaseKey y llamadas async completas. Migración v1→v2 corregida (fases
4/11, currentPhase inteligente, timestamp tool, rename explícito de docs).
Nuevos tests de migración real y consistency docKey→phaseKey. README, scripts,
scaffold y contratos alineados.

- Implementado en (este commit)

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 5 — Cierre (software-architect)

Migración v1→v2 definida (política + script). Tests end-to-end con 3 fixtures
(valid-v2, missing-docs, blocked-review) y 7 tests pasando. init-software-
architect.md, README.md y scaffold sincronizados. Sin referencias v1
operativas en el repositorio.

- **5a.** `templates/software-architect/migration/v1-to-v2-policy.md` + `tools/migrate-v1-to-v2.mjs`
- **5b.** `tests/fixtures/software-architect/` + `tests/test-software-architect.sh`
- **5c.** `opencode/commands/init-software-architect.md` + `README.md`
- Implementado en: `3aa0a4b`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 4 — Validación y reglas (software-architect)

validate-blueprint.mjs actualizado a v2: mappings de 14 phases/docs, gates
8/12/14, schemaVersion 2, nueva validación cruzada de secciones de datos.
Workflow.md regla 7 + agente regla 19: subagentes escriben en drafts/, solo
el orquestador promueve a docs/.

- **4a.** `templates/software-architect/tools/validate-blueprint.mjs`
- **4b.** `templates/software-architect/workflow.md` + `opencode/agents/software-architect.md`
- Implementado en: `024b5a0`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 3 — Agentes (software-architect)

software-architect refactorizado como orquestador con delegación genérica a
subagentes. Creados blueprint-compiler (subagente temp 0) y comando
/compile-blueprint. consistency-reviewer actualizado a docs v2, sin
dependencias circulares ni references a documents.*.path.

- **3a.** `opencode/agents/software-architect.md` — orquestador con delegación
- **3b.** `opencode/agents/blueprint-compiler.md` + `opencode/commands/compile-blueprint.md`
- **3c.** `opencode/agents/consistency-reviewer.md` + `opencode/commands/review-consistency.md`
- Implementado en: `b299f5d`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 2 — Datos y templates (software-architect)

project-state actualizado a schemaVersion 2 con 14 fases, 14 documentos y
5 nuevas secciones de datos. Templates de documento creados/renombrados
para los 14 artefactos del workflow v2. Scaffold y tests actualizados con
directorio `review/`.

- **2a.** `templates/software-architect/project-state.json` + `project-state.schema.json`
- **2b.** 14 templates en `templates/software-architect/doc-templates/`
- **2c.** `scaffold.json` (review/ en dirs) + `test-scripts.sh` (≥14 phases check)
- Implementado en: `fde4110`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Fase 1 — Cimientos (software-architect)

Workflow v2 definido con tabla canónica de 14 fases, tipos, entregables,
gates y dependencias. Contratos de interfaz para blueprint-compiler y
consistency-reviewer publicados.

- **1a.** `templates/software-architect/workflow.md` — 14 fases v2
- **1b.** `templates/software-architect/contracts/blueprint-compiler.md`
- **1b.** `templates/software-architect/contracts/consistency-reviewer.md`
- Implementado en: `1cdccc3`

</div>

<div style="background:#d4edda; border-left:4px solid #28a745; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### Integración de consistency-reviewer con fase 11 (software-architect)

`software-architect` ahora invoca automáticamente al `consistency-reviewer`
al llegar a la fase 11. Si el veredicto es `BLOCKED`, no avanza a la fase 12.
Se agregó `task: allow` y un procedimiento especial para la fase 11 en el
agente, más condición de salida en `workflow.md`.

- Implementado en: `a43953c`

</div>

---

## software-architect

<div style="background:#f5c6cb; border-left:4px solid #bd2130; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Crítico] `/init-software-architect` no puede ejecutar su propia inicialización

El comando debe crear directorios y copiar plantillas, pero el agente deniega
todo `bash` salvo dos comandos Node y solo permite editar dentro de
`.devflow/software-architect/**`. No puede ejecutar `mkdir` ni `cp`, ni crear
directorios vacíos como `archive/` o `decisions/`.

- **P:** crítica | **E:** M | **A:** agente, comando, permisos
- **Referencias:** `opencode/commands/init-software-architect.md:54-76`,
  `opencode/agents/software-architect.md:6-22`
- **Criterio de salida:** el agente puede inicializar y reparar de forma segura
  toda la estructura declarada sin obtener permisos de escritura fuera de
  `.devflow/software-architect/`.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] El flujo recomendado deja timestamps en null

`create-project.sh` copia `project-state.json` y después recomienda ejecutar
`/init-software-architect`. El comando solo inicializa timestamps cuando él
mismo crea el estado, por lo que `createdAt`, `updatedAt` y
`changeLog[0].date` permanecen en `null` en el flujo recomendado.

- **P:** alta | **E:** S | **A:** comando, script, estado
- **Referencias:** `scripts/create-project.sh:102-128`,
  `scripts/create-project.sh:139-144`,
  `opencode/commands/init-software-architect.md:79-87`
- **Criterio de salida:** cualquier estado recién creado recibe timestamps
  deterministas exactamente una vez, independientemente del punto de entrada.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] El gate humano final contradice el comportamiento del agente

Workflow y comando exigen aprobación humana explícita en fase 14, pero el
agente declara terminado el blueprint inmediatamente cuando el revisor devuelve
`APPROVED`. Falta solicitar y registrar la aprobación humana final.

- **P:** alta | **E:** S | **A:** agente, workflow, estado
- **Referencias:** `templates/software-architect/workflow.md:40-47`,
  `opencode/commands/init-software-architect.md:117-123`,
  `opencode/agents/software-architect.md:140-146`
- **Criterio de salida:** el veredicto técnico habilita la solicitud del gate,
  pero solo la aprobación explícita del usuario completa la fase 14.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] Invocación de subagentes ambigua o no ejecutable

El agente ordena usar `task`, pero después describe nombres de slash commands
como `compile-blueprint technical-requirements` y `review-consistency`. `task`
debe seleccionar explícitamente el subagente y proporcionarle un prompt; no
ejecuta automáticamente un slash command.

- **P:** alta | **E:** S | **A:** agente, contratos, comandos
- **Referencias:** `opencode/agents/software-architect.md:127-135`
- **Criterio de salida:** cada delegación define subagente, prompt, modo,
  inputs esperados y códigos de retorno sin depender de semántica implícita.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] project-state no almacena toda la información exigida

El agente exige registrar cada decisión confirmada y 17 atributos por módulo,
pero el schema de módulos prohíbe propiedades adicionales y omite reglas de
negocio, notificaciones, reportes, criterios de aceptación y clasificación
MVP. También faltan secciones estructuradas para roadmap, privacidad, backups,
mantenibilidad y requisitos de despliegue.

- **P:** alta | **E:** L | **A:** agente, schema, estado, templates
- **Referencias:** `opencode/agents/software-architect.md:62`,
  `opencode/agents/software-architect.md:106`,
  `opencode/agents/software-architect.md:161-177`,
  `templates/software-architect/project-state.schema.json:283-309`
- **Criterio de salida:** toda información que el agente debe registrar tiene
  representación válida y trazable en `project-state.json` y su schema.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] El JSON Schema distribuido nunca se aplica

El comando copia `project-state.schema.json`, pero `validate-blueprint.mjs` no
lo carga y realiza validaciones manuales parciales. Además, el schema permite
un objeto `phases` vacío y hace opcionales secciones que el agente considera
canónicas.

- **P:** alta | **E:** M | **A:** schema, validator, test
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs:510-537`,
  `templates/software-architect/project-state.schema.json:8-14`,
  `templates/software-architect/project-state.schema.json:126-159`
- **Criterio de salida:** el validador aplica el schema distribuido y el schema
  exige todas las fases y secciones canónicas del estado v2.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] El validador acepta documentos obligatorios no registrados

La validación recorre solo las entradas presentes en `state.documents`. Si se
elimina una clave obligatoria junto con su archivo, no detecta la ausencia;
solo fases 13 y 14 tienen comprobaciones especiales.

- **P:** alta | **E:** S | **A:** validator, test
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs:249-260`,
  `templates/software-architect/tools/validate-blueprint.mjs:263-279`,
  `templates/software-architect/tools/validate-blueprint.mjs:319-338`
- **Criterio de salida:** el validador exige exactamente las 14 claves de
  documentos y detecta claves faltantes aunque tampoco exista el archivo.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] La validación de gates acepta estados no aprobados

Para fases 8, 12 y 14 solo se rechazan `pending` e `in_progress`. Estados como
`blocked`, `waiting_for_user` o `needs_revision` pasan aunque no representan
aprobación humana.

- **P:** alta | **E:** S | **A:** validator, workflow, test
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs:371-383`
- **Criterio de salida:** cada gate se considera superado únicamente cuando su
  fase y documento están `approved` y existe evidencia de aprobación humana.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] La detección de IDs REQ duplicados no funciona con la plantilla

La plantilla oficial usa tablas con líneas como `| REQ-001 |`, pero el
validador busca IDs al comienzo exacto de la línea mediante `^REQ-`, por lo que
no encuentra requisitos dentro de tablas Markdown.

- **P:** alta | **E:** S | **A:** validator, template, test
- **Referencias:** `templates/software-architect/doc-templates/06-functional-requirements.md:7-9`,
  `templates/software-architect/tools/validate-blueprint.mjs:158-166`
- **Criterio de salida:** se detectan IDs válidos y duplicados en el formato de
  tabla oficial, con pruebas positivas y negativas.

</div>

<div style="background:#f8d7da; border-left:4px solid #dc3545; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Alto] La migración puede producir un proyecto v2 inválido

Las fases nuevas 4 y 11 se crean como `pending`, pero se preservan aprobaciones
posteriores de v1, `project.status` y un `currentPhase` calculado desde la fase
antigua. Un proyecto v1 completado puede terminar con fases 13/14 aprobadas y
fases 4/11 pendientes.

- **P:** alta | **E:** M | **A:** migración, estado, test
- **Referencias:** `templates/software-architect/tools/migrate-v1-to-v2.mjs:152-180`,
  `templates/software-architect/tools/migrate-v1-to-v2.mjs:186-240`
- **Criterio de salida:** la migración invalida o reabre fases dependientes,
  recalcula `currentPhase`/`project.status` y siempre produce una secuencia v2
  lógicamente consistente.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] La migración promete backups que no crea

Solo se respalda `project-state.json`. Los documentos se renombran sin copia,
pero el mensaje final afirma que todos los archivos originales tienen sufijo
`.v1`.

- **P:** media | **E:** S | **A:** migración, docs, test
- **Referencias:** `templates/software-architect/tools/migrate-v1-to-v2.mjs:148-150`,
  `templates/software-architect/tools/migrate-v1-to-v2.mjs:254-274`
- **Criterio de salida:** la herramienta crea los backups prometidos o comunica
  con precisión qué respalda y cómo revertir cada rename.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Soporte inconsistente de XDG_CONFIG_HOME

El instalador y parte del comando respetan XDG, pero agente, permisos bash,
timestamp y política de migración fijan `$HOME/.config`. Una instalación con
`XDG_CONFIG_HOME` personalizado rompe esas rutas.

- **P:** media | **E:** M | **A:** agente, comando, migración, docs
- **Referencias:** `scripts/install.sh:7`,
  `opencode/commands/init-software-architect.md:19-50`,
  `opencode/agents/software-architect.md:20-21`,
  `opencode/agents/software-architect.md:85`,
  `opencode/agents/software-architect.md:102`,
  `opencode/agents/software-architect.md:129`,
  `templates/software-architect/migration/v1-to-v2-policy.md:12`
- **Criterio de salida:** todas las rutas globales usan una única convención
  compatible con `XDG_CONFIG_HOME` y con el fallback `$HOME/.config`.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] El agente no puede explorar adecuadamente el proyecto

`glob` y `grep` están restringidos a `.devflow/software-architect/**`, pero el
comando ordena revisar información existente del proyecto. Puede leer rutas
conocidas, pero no descubrir estructura, código, documentación o configuración.

- **P:** media | **E:** S | **A:** agente, permisos
- **Referencias:** `opencode/agents/software-architect.md:12-17`,
  `opencode/commands/init-software-architect.md:105-108`
- **Criterio de salida:** el agente puede descubrir archivos del proyecto en
  solo lectura sin ampliar sus permisos de edición.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Rutas iniciales ambiguas

El agente indica leer `workflow.md` y `project-state.json` sin la ruta
`.devflow/software-architect/`, mientras el comando sí define las ubicaciones
completas.

- **P:** media | **E:** S | **A:** agente, docs
- **Referencias:** `opencode/agents/software-architect.md:41-44`,
  `opencode/commands/init-software-architect.md:41-44`
- **Criterio de salida:** todas las instrucciones usan rutas canónicas y no
  dependen del directorio actual implícito.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Fase 14 no tiene formato para el veredicto contractual

El contrato calcula resultados desde `BLOCKING` y `WARNING`, pero la plantilla
de fase 14 no contiene secciones de veredicto, severidad ni conteos.

- **P:** media | **E:** S | **A:** template, contrato, test
- **Referencias:** `templates/software-architect/contracts/consistency-reviewer.md:17-21`,
  `templates/software-architect/doc-templates/14-consistency-review.md:3-21`
- **Criterio de salida:** la plantilla representa hallazgos por severidad,
  conteos y un veredicto inequívoco compatible con el contrato.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Revisiones posteriores dejan documentos indebidamente aprobados

El workflow marca fases dependientes como `needs_revision`, pero los documentos
solo admiten `pending` o `approved`. El validador tampoco detecta un documento
`approved` cuya fase está `needs_revision`.

- **P:** media | **E:** M | **A:** workflow, schema, validator, test
- **Referencias:** `templates/software-architect/workflow.md:81-89`,
  `templates/software-architect/project-state.schema.json:438-447`
- **Criterio de salida:** fases y documentos modelan coherentemente la
  invalidación, revisión y nueva aprobación de artefactos dependientes.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] Reparación incompleta de inicializaciones parciales

Si `.devflow/software-architect/` ya existe, el comando solo asegura `docs/` y
`drafts/`; no restaura `archive/` ni `decisions/`.

- **P:** media | **E:** S | **A:** comando, test
- **Referencias:** `opencode/commands/init-software-architect.md:52-76`
- **Criterio de salida:** reinvocar el comando restaura de forma idempotente
  todos los archivos y directorios faltantes sin sobrescribir contenido.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] La migración no está conectada al comando de inicio

`/init-software-architect` no comprueba `schemaVersion` ni informa sobre la
política v1→v2. Puede intentar continuar un estado v1 usando workflow v2.

- **P:** media | **E:** S | **A:** comando, migración
- **Criterio de salida:** el inicio detecta v1, detiene el workflow v2 y ofrece
  instrucciones explícitas y no destructivas para migrar.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] generate-scaffold.sh no está alineado con el scaffold actual

El generador trataría `contracts/`, `doc-templates/` y `migration/` como
directorios del proyecto y copiaría tools, mientras el scaffold actual crea
solo directorios operativos. Regenerarlo produciría una estructura distinta e
incorrecta.

- **P:** media | **E:** M | **A:** script, scaffold, test
- **Referencias:** `scripts/generate-scaffold.sh:102-116`,
  `templates/software-architect/scaffold.json:3-13`
- **Criterio de salida:** regenerar el scaffold de software-architect produce
  exactamente la estructura operativa versionada.

</div>

<div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1em 1.2em; margin:0.8em 0; border-radius:6px;">

### [Medio] El validador no forma parte del cierre del agente

El agente tiene permiso para ejecutarlo, pero ninguna instrucción obliga a
usarlo antes de declarar terminado el blueprint. Además, el validador exige
todos los documentos aunque estén `pending`, por lo que no está definido en
qué momentos intermedios puede utilizarse.

- **P:** media | **E:** M | **A:** agente, workflow, validator, test
- **Referencias:** `templates/software-architect/tools/validate-blueprint.mjs:263-279`
- **Criterio de salida:** el workflow define cuándo ejecutar validación parcial
  y final, y la finalización requiere una ejecución exitosa registrada.

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
