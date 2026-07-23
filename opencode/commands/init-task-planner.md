---
description: Inicializa o continúa el proceso de planificación de software del proyecto actual
agent: task-planner
subtask: false
---

Inicializa o continúa el proceso del Task Planner para el proyecto ubicado en el
directorio actual.

## Contrato de versión

Este comando inicializa únicamente proyectos compatibles con:

```text
project-state.schemaVersion = 3
planner.workflowVersion = 7
planner.validatorVersion = 3.5
planner.epicGraphVersion = 1.0
planner.timestampToolVersion = 1.0
semantic-contract.schemaVersion = 1
requirements.schemaVersion = 3
capability-map.schemaVersion = 3
epic-plan.schemaVersion = 4
task-plan.schemaVersion = 4
```

No mezcles archivos de versiones anteriores con estas plantillas.

## Plantillas oficiales

Utiliza estas plantillas como fuente de verdad.

- Workflow:

  @$HOME/.config/opencode/task-planner/templates/workflow.md

- Estado inicial:

  @$HOME/.config/opencode/task-planner/templates/project-state.json

- Decisiones:

  @$HOME/.config/opencode/task-planner/templates/decisions.json

- Contrato semántico:

  @$HOME/.config/opencode/task-planner/templates/semantic-contract.json

- Requisitos:

  @$HOME/.config/opencode/task-planner/templates/requirements.json

- Mapa de capacidades:

  @$HOME/.config/opencode/task-planner/templates/capability-map.json

- Índice de épicas:

  @$HOME/.config/opencode/task-planner/templates/epic-plan.json

- Readiness:

  @$HOME/.config/opencode/task-planner/templates/readiness.json

- Índice de tareas:

  @$HOME/.config/opencode/task-planner/templates/task-plan.json

- Plantilla de tarea:

  @$HOME/.config/opencode/task-planner/templates/task-template.md

- Validador determinista:

  @$HOME/.config/opencode/task-planner/templates/tools/validate-plan.mjs

- Actualizador determinista de fechas:

  @$HOME/.config/opencode/task-planner/templates/tools/update-timestamps.mjs

- Constructor determinista del grafo de épicas:

  @$HOME/.config/opencode/task-planner/templates/tools/build-epic-graph.mjs

## Objetivo

Preparar o reanudar el espacio de trabajo del Task Planner sin sobrescribir
información existente, sin reiniciar fases completadas, sin mezclar contratos de
versiones incompatibles y sin crear artefactos derivados antes de tiempo.

## Estructura inicial

La estructura inicial válida es:

```text
task-planning/
├── project-state.json
├── workflow.md
├── decisions.json
├── semantic-contract.json
├── requirements.json
├── capability-map.json
├── epic-plan.json
├── readiness.json
├── task-plan.json
├── task-template.md
├── epics/
├── tasks/
└── tools/
    ├── validate-plan.mjs
    └── update-timestamps.mjs
```

No crees durante la inicialización:

```text
task-planning/SOFTWARE-BLUEPRINT-RESOLVED.md
task-planning/construction-strategy.md
task-planning/validation-report.md
```

Esos archivos son artefactos derivados y deben generarse únicamente en la fase
que les corresponde.


## Inicialización por Bash autorizada

Para un proyecto nuevo usa exactamente:

```bash
mkdir -p task-planning task-planning/epics task-planning/tasks task-planning/tools
cp -n $HOME/.config/opencode/task-planner/templates/project-state.json task-planning/project-state.json
cp -n $HOME/.config/opencode/task-planner/templates/workflow.md task-planning/workflow.md
cp -n $HOME/.config/opencode/task-planner/templates/decisions.json task-planning/decisions.json
cp -n $HOME/.config/opencode/task-planner/templates/semantic-contract.json task-planning/semantic-contract.json
cp -n $HOME/.config/opencode/task-planner/templates/requirements.json task-planning/requirements.json
cp -n $HOME/.config/opencode/task-planner/templates/capability-map.json task-planning/capability-map.json
cp -n $HOME/.config/opencode/task-planner/templates/epic-plan.json task-planning/epic-plan.json
cp -n $HOME/.config/opencode/task-planner/templates/readiness.json task-planning/readiness.json
cp -n $HOME/.config/opencode/task-planner/templates/task-plan.json task-planning/task-plan.json
cp -n $HOME/.config/opencode/task-planner/templates/task-template.md task-planning/task-template.md
cp -n $HOME/.config/opencode/task-planner/templates/tools/validate-plan.mjs task-planning/tools/validate-plan.mjs
cp -n $HOME/.config/opencode/task-planner/templates/tools/update-timestamps.mjs task-planning/tools/update-timestamps.mjs
cp -n $HOME/.config/opencode/task-planner/templates/tools/build-epic-graph.mjs task-planning/tools/build-epic-graph.mjs
node task-planning/tools/update-timestamps.mjs bootstrap
```

No retires `-n`. Cualquier copia distinta debe solicitar aprobación.

## Protocolo obligatorio

### 1. Confirmar la raíz

Confirma que estás trabajando en la raíz del proyecto actual.

No inicialices dentro de:

- `task-planning/`;
- un subdirectorio del proyecto;
- el directorio global de plantillas;
- un repositorio distinto al solicitado.

### 2. Verificar las plantillas globales antes de escribir

Antes de crear o modificar cualquier archivo del proyecto:

1. comprueba que existen todas las plantillas oficiales listadas arriba;
2. comprueba en las plantillas globales:
   - `project-state.json.schemaVersion = 3`;
   - `project-state.json.planner.workflowVersion = 7`;
   - `project-state.json.planner.validatorVersion = 3.5`;
   - `project-state.json.planner.epicGraphVersion = 1.0`;
   - `project-state.json.planner.timestampToolVersion = 1.0`;
   - `semantic-contract.json.schemaVersion = 1`;
   - `requirements.json.schemaVersion = 3`;
   - `capability-map.json.schemaVersion = 3`;
   - `epic-plan.json.schemaVersion = 4`;
   - `task-plan.json.schemaVersion = 4`;
3. confirma que el workflow global declara versión `7`;
4. confirma que el validador global existe;
5. si falta una plantilla o una versión no coincide:
   - informa la ruta y el valor encontrado;
   - no inventes contenido;
   - no escribas archivos en el proyecto;
   - detén la inicialización.

### 3. Determinar si es inicialización o reanudación

Revisa si existe `task-planning/`.

#### Caso A — `task-planning/` no existe

Inicializa un proyecto nuevo:

1. crea `task-planning/`;
2. crea `task-planning/epics/`;
3. crea `task-planning/tasks/`;
4. crea `task-planning/tools/`;
5. crea cada archivo inicial usando exactamente su plantilla oficial;
6. copia el validador oficial como `task-planning/tools/validate-plan.mjs`;
7. copia el actualizador oficial como `task-planning/tools/update-timestamps.mjs`;
8. ejecuta `node task-planning/tools/update-timestamps.mjs bootstrap`;
9. no agregues registros de ejemplo;
10. no ejecutes el validador.

#### Caso B — `task-planning/` ya existe

No crees ni reemplaces ningún archivo todavía.

Primero:

1. comprueba si existe `task-planning/project-state.json`;
2. si no existe y el directorio contiene cualquier artefacto o archivo previo:
   - no crees un estado nuevo;
   - marca la situación como recuperación o migración requerida;
   - informa los archivos encontrados;
   - detén el proceso;
3. si no existe y el directorio está efectivamente vacío, puede tratarse como una
   inicialización nueva;
4. si existe, léelo antes de cualquier escritura;
5. si `workflow.status = completed`:
   - no crees archivos faltantes;
   - no reemplaces plantillas;
   - no modifiques artefactos;
   - informa que la planificación está finalizada;
   - detén el proceso;
6. comprueba:
   - `schemaVersion = 3`;
   - `planner.workflowVersion = 7`;
   - `planner.validatorVersion = 3.5`;
   - `planner.epicGraphVersion = 1.0`;
   - `planner.timestampToolVersion = 1.0`;
7. si cualquiera no coincide:
   - no copies plantillas v6 dentro del proyecto;
   - no modifiques archivos existentes;
   - informa que el proyecto requiere una migración explícita;
   - detén el proceso;
8. comprueba que las rutas de `artifacts` sean compatibles con las plantillas
   oficiales;
9. lee `task-planning/workflow.md`, si existe, y confirma que corresponde al
   workflow versión `7`;
10. solo después de completar estas comprobaciones, crea los archivos iniciales
    faltantes permitidos.
11. por cada JSON faltante creado, ejecuta `node task-planning/tools/update-timestamps.mjs touch <archivo>`; nunca uses `bootstrap` sobre una reanudación con artefactos existentes.

### 4. Archivos iniciales permitidos

En un proyecto nuevo o en una reanudación compatible, pueden crearse cuando
falten:

- `task-planning/project-state.json`;
- `task-planning/workflow.md`;
- `task-planning/decisions.json`;
- `task-planning/semantic-contract.json`;
- `task-planning/requirements.json`;
- `task-planning/capability-map.json`;
- `task-planning/epic-plan.json`;
- `task-planning/readiness.json`;
- `task-planning/task-plan.json`;
- `task-planning/task-template.md`;
- `task-planning/tools/validate-plan.mjs`;
- `task-planning/tools/update-timestamps.mjs`.

Cada archivo faltante debe crearse exclusivamente desde su plantilla oficial.

No copies al proyecto:

- `tools/validate-plan.test.mjs`;
- `tools/fixtures/`;
- `SEMANTIC-CONTRACT.md`.

Esos archivos pertenecen a la instalación global y a sus pruebas, no al espacio
operativo de cada proyecto.

### 5. Reglas de no sobrescritura

Durante una reanudación compatible:

- crea únicamente directorios o archivos iniciales que falten;
- no reemplaces archivos existentes;
- no vacíes archivos existentes;
- no reinicies contadores;
- no reemplaces decisiones confirmadas;
- no cambies contratos semánticos generados, aprobados o validados;
- no cambies aprobaciones registradas;
- no elimines épicas ni tareas;
- no regreses de fase salvo que el workflow lo exija;
- no cambies versiones para forzar compatibilidad;
- no marques un artefacto como generado, aprobado o validado solo por crearlo.

No borres ni sobrescribas contenido de:

- `task-planning/decisions.json`;
- `task-planning/semantic-contract.json`;
- `task-planning/requirements.json`;
- `task-planning/capability-map.json`;
- `task-planning/epic-plan.json`;
- `task-planning/task-plan.json`;
- `task-planning/epics/`;
- `task-planning/tasks/`.

### 6. Verificación posterior a la copia

Después de crear archivos iniciales:

1. vuelve a leer `task-planning/project-state.json`;
2. confirma que conserva:
   - `schemaVersion = 3`;
   - `planner.workflowVersion = 7`;
   - `planner.validatorVersion = 3.5`;
   - `planner.epicGraphVersion = 1.0`;
   - `planner.timestampToolVersion = 1.0`;
3. confirma que existen las rutas iniciales declaradas en
   `project-state.json.artifacts`;
4. confirma que:
   - `semantic-contract.json.status = initialized`;
   - `requirements.json.status = initialized`;
   - `capability-map.json.status = initialized`;
   - `epic-plan.json.status = initialized`;
   - `task-plan.json.status = initialized`;
5. confirma que no se crearon artefactos derivados;
6. confirma que los JSON administrados contienen timestamps y contentHash válidos;
7. no ejecutes todavía `validate-plan.mjs`.

### 7. Reanudar desde el estado persistido

Después de inicializar o reanudar:

- identifica `workflow.phase`;
- identifica `workflow.status`;
- identifica `workflow.resumeFrom`;
- identifica `workflow.currentDecisionId`;
- identifica `workflow.currentEpicId`;
- identifica `workflow.pendingUserAction`;
- identifica `workflow.blocker`;
- continúa exclusivamente desde el estado persistido.

No reinicies el proceso ni repitas fases aprobadas.

### 8. Reglas para `blueprint_analysis`

Si la fase actual es `blueprint_analysis`:

- localiza el Software Blueprint fuente registrado;
- revisa la información existente;
- no inventes respuestas;
- identifica contradicciones, ambigüedades y omisiones;
- registra únicamente hallazgos propios de la fase;
- no generes todavía `semantic-contract.json`;
- no generes estrategia;
- no generes capacidades;
- no generes épicas;
- no generes tareas.

La identidad semántica se genera únicamente durante
`blueprint_consolidation`.

### 9. Puertas de aprobación humana

Respeta las dos puertas de aprobación:

1. en `blueprint_approval`, la aprobación cubre como una unidad:
   - `SOFTWARE-BLUEPRINT-RESOLVED.md`;
   - `semantic-contract.json`;
   - `requirements.json`;
2. en `plan_approval`, la aprobación cubre el plan validado completo.

No interpretes silencio, ausencia de respuesta o una recomendación como
aprobación.

### 10. Ejecución del validador

No ejecutes:

```text
node task-planning/tools/validate-plan.mjs
```

durante la inicialización ni antes de `plan_validation`.

El validador solo puede ejecutarse:

- durante `plan_validation`; o
- cuando el usuario solicite expresamente una prueba diagnóstica.

### 11. Restricciones generales

- No modifiques código fuente, pruebas, dependencias ni configuración del
  producto.
- No ejecutes DevFlow.
- No hagas commits ni crees ramas.
- No inventes fechas.
- No uses una plantilla aproximada.
- No mezcles archivos v2 y v3.

## Reporte obligatorio

Antes de terminar esta ejecución, informa:

- si el espacio fue inicializado, reanudado, bloqueado o requiere migración;
- la fase actual;
- el estado actual;
- el punto de reanudación;
- los directorios creados;
- los archivos creados;
- los archivos existentes leídos;
- los archivos faltantes;
- las versiones detectadas;
- las decisiones pendientes;
- la siguiente aprobación requerida;
- cualquier incompatibilidad de versión;
- si se evitó una escritura por protección de integridad.

## Restricción de integridad

Crear un archivo faltante desde una plantilla no significa que el artefacto haya
sido generado, evaluado, validado, aprobado o publicado.

Los archivos inicializados deben conservar su estado `initialized` hasta que la
fase correspondiente actualice su contenido.

No cambies `project-state.json` a `completed` durante la inicialización.

## Contexto adicional

$ARGUMENTS
