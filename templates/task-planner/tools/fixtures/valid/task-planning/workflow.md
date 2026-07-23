# Workflow de Task Planner

## Versión

- Workflow: `7`
- Fases: `10`
- Alcance: planificación inicial de tareas para DevFlow

---

# Propósito

Definir el proceso obligatorio para transformar un Software Blueprint aprobado
en un plan completo, consistente, trazable y ejecutable de solicitudes de tareas
para DevFlow.

Este workflow controla:

- las fases del proceso;
- los artefactos producidos;
- las condiciones de avance;
- las aprobaciones humanas;
- la estrategia de construcción;
- la propiedad de capacidades;
- la generación de épicas;
- el grafo determinista de dependencias y waves;
- la descomposición de épicas en tareas;
- la validación del plan;
- la publicación final.

Task Planner no puede omitir fases, mezclar responsabilidades de fases distintas
ni avanzar cuando no se cumplen sus condiciones de salida.

---

# Principios del proceso

1. El blueprint original nunca se modifica.
2. No se generan artefactos de planificación mientras existan decisiones bloqueantes.
3. Las decisiones humanas se registran antes de incorporarse al blueprint.
4. El blueprint resuelto conserva identificadores estables de requisitos y funciones.
5. `semantic-contract.json` es la identidad funcional canónica aprobada.
6. `requirements.json` es el catálogo estructurado de requisitos y behaviors.
7. Blueprint, contrato semántico y requirements se generan desde un mismo inventario
   y se aprueban como una unidad.
8. Ninguna fase posterior puede reinterpretar la identidad semántica aprobada.
9. La estrategia se define antes de generar capacidades y épicas.
10. Una capacidad funcional implementa exactamente un behavior principal.
11. Cada capacidad planificada tiene una sola épica propietaria y una sola tarea
    propietaria.
12. La agrupación predeterminada de épicas es por requisito; una división requiere
    una decisión humana confirmada y `splitReason`.
13. Una tarea funcional conserva exactamente los behaviors y semanticKeys de su
    capacidad creada.
14. Cada behavior MVP confirmado tiene trazabilidad a capacidad, tarea, alcance y
    criterio de aceptación.
15. Los requisitos post-MVP no forman parte del plan inicial.
16. Las tareas incluyen sus propias pruebas.
17. No se permite una tarea general cuando existen incrementos verificables
    independientes.
18. Los modelos y migraciones se introducen incrementalmente.
19. Las relaciones entre épicas y las execution waves se derivan mediante `task-planning/tools/build-epic-graph.mjs`.
20. La validación determinista se realiza mediante `task-planning/tools/validate-plan.mjs`.
21. Las fechas y hashes de JSON se registran exclusivamente mediante `task-planning/tools/update-timestamps.mjs`; el LLM no escribe fechas.
22. Task Planner no puede declarar manualmente que el plan pasó la validación.
23. `readiness.json` y `validation-report.md` son salidas del validador.
24. El proceso termina únicamente después de validar y aprobar el plan final.
25. Esta versión no incluye ejecución, seguimiento ni replanificación.
26. Todo archivo generado permanece dentro de `task-planning/`.
27. Los artefactos y `project-state.json` permanecen sincronizados.
28. Ningún estado `completed`, `passed` o `published` se registra como intención
    provisional.

---

# Archivos del proceso

## Entradas

### `AGENTS.md`

Contiene reglas generales del proyecto y convenciones que Task Planner debe
respetar.

### Software Blueprint fuente

Documento original aprobado que describe el sistema.

La ubicación exacta debe registrarse en `task-planning/project-state.json`.

El blueprint fuente es inmutable.

---

## Archivos de estado

### `task-planning/project-state.json`

Registra:

- proyecto;
- blueprint fuente;
- versión del workflow;
- fase actual;
- estado general;
- progreso;
- aprobaciones;
- bloqueos;
- artefactos;
- épica actual durante la descomposición;
- fechas de actualización.

### `task-planning/decisions.json`

Registra:

- decisiones detectadas;
- severidad;
- estado;
- opciones;
- resolución humana;
- justificación;
- consecuencias;
- restricciones resultantes;
- requisitos y secciones afectadas.

### `task-planning/semantic-contract.json`

Contiene la identidad semántica canónica de cada función atómica confirmada:

- `behaviorId`;
- `semanticKey`;
- `sourceFunctionId`;
- `requirementId`;
- `operation`;
- `outcome`;
- `sourceSection`;
- `sourceItem`;
- `scope`.

Se genera en `blueprint_consolidation`, se aprueba junto con el blueprint y no
puede reinterpretarse en fases posteriores.

### `task-planning/requirements.json`

Contiene el catálogo estructurado de requisitos.

Es la fuente única para:

- identificadores de requisitos;
- clasificación MVP, post-MVP y fuera de alcance;
- conteo de requisitos;
- referencias desde capacidades, épicas y tareas;
- inventario de behaviors atómicos;
- funciones agregadas o ambiguas pendientes de resolución.

### `task-planning/readiness.json`

Registra el resultado de la última ejecución del validador determinista.

Task Planner no puede establecer manualmente su estado en `passed`.

### `task-planning/capability-map.json`

Contiene:

- inventario de capacidades;
- origen;
- propietario lógico;
- épica propietaria;
- tarea propietaria;
- capacidades requeridas;
- consumidores.

### `task-planning/epic-plan.json`

Contiene:

- índice de épicas;
- capacidades asignadas;
- requisitos relacionados;
- dependencias;
- tareas derivadas;
- estado de descomposición.

### `task-planning/task-plan.json`

Contiene:

- índice de tareas;
- épica propietaria;
- dependencias;
- capacidades creadas;
- capacidades consumidas;
- cobertura estructurada de requisitos.


### `task-planning/tools/update-timestamps.mjs`

Herramienta determinista de reloj y huella de contenido. Registra fechas ISO UTC obtenidas del sistema, preserva `createdAt`, actualiza `updatedAt`, registra aprobaciones y cierre, y calcula `contentHash`.

Debe ejecutarse después de crear o modificar cualquier JSON administrado.

### `task-planning/tools/validate-plan.mjs`

Validador determinista del plan.

Solo puede escribir:

- `task-planning/readiness.json`;
- `task-planning/validation-report.md`.

Debe devolver:

- código `0` cuando no existen errores bloqueantes;
- código distinto de `0` cuando el plan es inválido.

---

## Documentos generados

### `task-planning/SOFTWARE-BLUEPRINT-RESOLVED.md`

Versión consolidada del blueprint original con las decisiones confirmadas.

No reemplaza ni modifica el blueprint fuente.

### `task-planning/construction-strategy.md`

Describe cómo se construirá, integrará y validará progresivamente el sistema.

### `task-planning/epics/*.md`

Una épica por archivo.

Las épicas representan resultados amplios y descomponibles. No son solicitudes
ejecutables por DevFlow.

### `task-planning/tasks/*.md`

Una solicitud de tarea ejecutable por DevFlow por archivo.

### `task-planning/validation-report.md`

Registra los controles realizados durante la validación final, los errores
detectados y las correcciones aplicadas antes de la publicación.

---

# Estados generales

El proceso puede tener uno de estos estados:

- `in_progress`
- `awaiting_user`
- `blocked`
- `completed`

## `in_progress`

Task Planner puede continuar trabajando sin intervención humana inmediata.

## `awaiting_user`

El proceso requiere una decisión o aprobación explícita del usuario.

## `blocked`

Existe un problema que impide continuar y que no puede resolverse con la
información disponible.

## `completed`

El blueprint resuelto fue aprobado, la estrategia fue definida, las capacidades
fueron asignadas, las épicas fueron descompuestas, el plan pasó la validación y
el usuario aprobó el plan final.

---

# Fases

El proceso tiene diez fases obligatorias:

1. `blueprint_analysis`
2. `decision_resolution`
3. `blueprint_consolidation`
4. `blueprint_approval`
5. `construction_strategy`
6. `capability_mapping`
7. `epic_generation`
8. `epic_decomposition`
9. `plan_validation`
10. `plan_approval`

El proceso solo puede avanzar en ese orden, salvo los regresos explícitamente
permitidos por este workflow.

Cada fase debe definir y respetar:

- entradas permitidas;
- acciones obligatorias;
- acciones prohibidas;
- artefactos de salida;
- condición de salida;
- condición de bloqueo;
- transiciones permitidas.

---

# Fase 1 — Blueprint Analysis

## Objetivo

Leer el Software Blueprint completo y determinar si contiene información
suficiente y consistente para iniciar la planificación.

## Estado inicial

- fase: `blueprint_analysis`
- estado: `in_progress`

## Entradas permitidas

- `AGENTS.md`;
- blueprint fuente;
- `task-planning/project-state.json`;
- `task-planning/decisions.json`;
- artefactos existentes de una sesión anterior.

## Acciones obligatorias

1. Leer `AGENTS.md`.
2. Leer `task-planning/project-state.json`.
3. Leer `task-planning/decisions.json`.
4. Localizar el blueprint fuente registrado.
5. Leer el blueprint completo.
6. Auditar independientemente:

   - propósito;
   - alcance;
   - fuera de alcance;
   - actores;
   - procesos;
   - módulos;
   - requisitos funcionales;
   - requisitos no funcionales;
   - entidades;
   - integraciones;
   - arquitectura;
   - topología;
   - modelo de despliegue;
   - propiedad de usuarios;
   - propiedad de tenants;
   - propiedad de sesiones;
   - sujeto de las suscripciones;
   - propiedad y aislamiento de datos;
   - límite del API Gateway;
   - responsabilidades de integraciones externas;
   - reintentos e idempotencia;
   - restricciones;
   - dependencias;
   - prioridades;
   - MVP;
   - post-MVP.

7. Detectar y clasificar:

   - decisiones confirmadas;
   - contradicciones;
   - ambigüedades;
   - omisiones bloqueantes;
   - supuestos explícitos;
   - decisiones de implementación.

8. Actualizar los contadores reales de decisiones.

## Acciones prohibidas

- generar estrategia de construcción;
- generar capacidades;
- generar épicas;
- generar tareas;
- modificar el blueprint fuente;
- presentar preguntas de implementación;
- resolver decisiones bloqueantes mediante inferencias;
- aceptar como evidencia suficiente la autoevaluación del blueprint.

## Entregables

Actualizar:

- `task-planning/project-state.json`;
- `task-planning/decisions.json`.

## Condición de salida A

Si existen decisiones bloqueantes:

- cambiar fase a `decision_resolution`;
- cambiar estado a `awaiting_user`;
- seleccionar la decisión bloqueante de mayor impacto.

## Condición de salida B

Si no existen decisiones bloqueantes:

- cambiar fase a `blueprint_consolidation`;
- cambiar estado a `in_progress`.

## Condición de bloqueo

Usar `blocked` cuando:

- el blueprint no existe;
- el blueprint no puede leerse;
- el documento no corresponde a un Software Blueprint;
- falta información esencial y no puede formularse una decisión concreta;
- existen archivos de estado corruptos o incompatibles.

---

# Fase 2 — Decision Resolution

## Objetivo

Resolver todas las decisiones que cambian materialmente la arquitectura, el
alcance, los datos, las integraciones, la seguridad o la planificación.

## Estado inicial

- fase: `decision_resolution`
- estado: `awaiting_user`

## Entradas permitidas

- blueprint fuente;
- `task-planning/decisions.json`;
- `task-planning/project-state.json`;
- respuestas explícitas del usuario.

## Acciones obligatorias

1. Ordenar las decisiones pendientes por impacto.
2. Seleccionar una sola decisión bloqueante.
3. Explicar:

   - qué falta o se contradice;
   - por qué afecta el plan;
   - cuáles son las opciones reales;
   - qué consecuencias tiene cada opción;
   - cuál es la recomendación, cuando esté sustentada.

4. Solicitar una decisión explícita.
5. Esperar la respuesta del usuario.
6. Registrar únicamente la opción confirmada.
7. Registrar:

   - justificación;
   - consecuencias;
   - restricciones;
   - requisitos afectados;
   - secciones afectadas;
   - origen humano.

8. Revisar si la resolución:

   - cierra otras decisiones;
   - crea una nueva decisión;
   - contradice una decisión previa.

9. Actualizar los archivos de estado.
10. Continuar con la siguiente decisión bloqueante.

## Acciones prohibidas

- considerar una recomendación como aprobación;
- registrar una respuesta ambigua como resuelta;
- cambiar decisiones confirmadas sin autorización;
- presentar varias decisiones independientes en una sola pregunta;
- preguntar detalles que corresponden al Supervisor de DevFlow;
- generar estrategia, capacidades, épicas o tareas.

## Entregables

Actualizar:

- `task-planning/decisions.json`;
- `task-planning/project-state.json`.

## Condición de permanencia

Mientras exista al menos una decisión bloqueante pendiente:

- mantener fase `decision_resolution`;
- mantener estado `awaiting_user`.

## Condición de salida

Cuando:

- no existan decisiones bloqueantes pendientes;
- las decisiones confirmadas sean compatibles;
- no existan contradicciones críticas abiertas;

entonces:

- cambiar fase a `blueprint_consolidation`;
- cambiar estado a `in_progress`.

## Condición de bloqueo

Cambiar a `blocked` cuando:

- dos decisiones confirmadas entren en conflicto;
- una respuesta invalide una restricción previamente aprobada;
- no exista una opción coherente con el objetivo del sistema;
- el usuario decida posponer una decisión indispensable.

---

# Fase 3 — Blueprint Consolidation

## Objetivo

Crear una versión autónoma del blueprint y producir desde un mismo inventario
funcional el contrato semántico canónico y el catálogo de requisitos.

## Estado inicial

- fase: `blueprint_consolidation`
- estado: `in_progress`

## Entradas permitidas

- blueprint fuente;
- `task-planning/decisions.json`;
- `task-planning/project-state.json`.

## Acciones obligatorias

1. Consolidar el blueprint y decisiones confirmadas.
2. Extraer cada función explícita.
3. Clasificar cada función como `atomic`, `aggregate`, `ambiguous`,
   `cross_cutting`, `informational`, `out_of_scope` o `duplicate`.
4. Resolver antes de avanzar cualquier función MVP `aggregate` o `ambiguous`.
5. Asignar a cada función atómica confirmada:
   - `sourceFunctionId`;
   - `behaviorId`;
   - `semanticKey`;
   - `requirementId`;
   - `operation`;
   - `outcome`;
   - `sourceSection`;
   - `sourceItem`;
   - `scope`.
6. Incorporar `Function ID`, operación y resultado observable en el blueprint
   resuelto.
7. Generar `task-planning/semantic-contract.json` con `schemaVersion = 1`.
8. Generar `task-planning/requirements.json` con `schemaVersion = 3`.
9. Copiar los campos semánticos de cada contrato al behavior correspondiente sin
   modificaciones.
10. Confirmar igualdad exacta de contratos y behaviors.
11. Confirmar unicidad de IDs y `semanticKey`.
12. Calcular contadores reales y sincronizar `project-state.json`.

## Reglas obligatorias

- El contrato se genera desde el blueprint resuelto, nunca desde artefactos
  posteriores.
- Un contrato corresponde a una sola función atómica y un solo behavior.
- No se usan IDs posicionales como identidad semántica.
- Ninguna fase posterior puede cambiar la semántica aprobada.

## Acciones prohibidas

- inventar funciones para completar cobertura;
- generar contratos para funciones no resueltas;
- generar capacidades, épicas o tareas;
- crear `semantic-contract.json` desde `requirements.json` como fuente circular.

## Entregables

- `task-planning/SOFTWARE-BLUEPRINT-RESOLVED.md`;
- `task-planning/semantic-contract.json`;
- `task-planning/requirements.json`;
- `task-planning/project-state.json`.

Al terminar:

- `semantic-contract.json.status = generated`;
- `requirements.json.status = generated`;
- ambos artefactos figuran como `generated` en el estado.

## Condición de salida

Solo avanza cuando cada función atómica confirmada tiene exactamente un contrato
y un behavior idéntico, y no existe ninguna función MVP sin resolver.

Entonces:

- cambiar fase a `blueprint_approval`;
- cambiar estado a `awaiting_user`;
- solicitar aprobación conjunta.

## Condición de bloqueo

Regresar a `decision_resolution` cuando una identidad funcional no pueda fijarse
sin decisión humana.

---

# Fase 4 — Blueprint Approval

## Objetivo

Obtener aprobación humana conjunta de:

- `SOFTWARE-BLUEPRINT-RESOLVED.md`;
- `semantic-contract.json`;
- `requirements.json`.

## Estado inicial

- fase: `blueprint_approval`
- estado: `awaiting_user`

## Presentación obligatoria

Mostrar funciones fuente, IDs semánticos, behaviors, funciones no resueltas,
cambios materiales y riesgos residuales.

## Si el usuario aprueba

1. Registrar la aprobación humana.
2. Establecer `semantic-contract.json.status = approved`.
3. Establecer `progress.semanticContractApproved = true`.
4. Actualizar `artifacts.semanticContract.status = approved`.
5. No modificar blueprint, contrato o requirements sin invalidar la aprobación.
6. Cambiar fase a `construction_strategy` y estado a `in_progress`.

## Si solicita cambios

Regresar a `blueprint_consolidation` o `decision_resolution` e invalidar el
contrato y todos los artefactos derivados afectados.

## Si rechaza

Cambiar a `blocked` y no continuar.

## Acciones prohibidas

- considerar silencio como aprobación;
- aprobar solo uno de los tres artefactos;
- comenzar construcción con contrato semántico no aprobado.

---

# Fase 5 — Construction Strategy

## Objetivo

Definir cómo se construirá e integrará progresivamente el sistema antes de
agrupar el trabajo en épicas.

## Estado inicial

- fase: `construction_strategy`
- estado: `in_progress`

## Precondiciones

Deben cumplirse todas:

- blueprint resuelto existente;
- blueprint resuelto aprobado;
- contrato semántico aprobado;
- cero decisiones bloqueantes pendientes;
- cero contradicciones críticas abiertas;
- alcance MVP identificado;
- requisitos no funcionales identificados.

## Entradas permitidas

- blueprint resuelto;
- `task-planning/semantic-contract.json`;
- `task-planning/requirements.json`;
- decisiones confirmadas;
- reglas generales del proyecto;
- información explícita sobre el estado inicial del repositorio.

## Acciones obligatorias

1. Determinar el punto de partida conocido del repositorio.
2. Declarar cualquier dato del repositorio que todavía sea desconocido.
3. Definir cómo se inicializa o consume el producto, paquete o servicio.
4. Definir el contrato público de configuración necesario.
5. Definir cómo se integra con la aplicación host.
6. Definir cómo se entregan y aplican migraciones.
7. Definir cómo se publican o exponen contratos públicos.
8. Definir los incrementos verticales de construcción.
9. Identificar habilitadores técnicos que no corresponden directamente a un
   requisito funcional.
10. Definir la disposición de cada requisito no funcional:

    - incluido en MVP;
    - satisfecho por infraestructura externa;
    - diferido a post-MVP;
    - requiere decisión.

11. Definir qué prueba o evidencia demuestra cada incremento.
12. Identificar los prerrequisitos de cada incremento.
13. Generar `task-planning/construction-strategy.md`.
14. Actualizar el estado del proyecto.

## Reglas obligatorias

- La estrategia debe describir resultados construibles, no una lista de capas.
- Debe existir al menos un incremento que demuestre integración real con una
  aplicación consumidora cuando el producto sea una librería o paquete.
- No se puede asumir que el repositorio ya tiene build, test, lint, configuración
  o integración con el host si el blueprint no lo afirma.
- No se puede fijar un detalle interno que dependa de inspeccionar el repositorio.
- No se puede proponer un esquema de datos global completo como primer paso por
  conveniencia.
- Los modelos y migraciones deben introducirse según las capacidades que los
  requieren.
- Los requisitos no funcionales no pueden desaparecer silenciosamente.

## Acciones prohibidas

- generar archivos de épica;
- generar archivos de tarea;
- asignar todavía una tarea propietaria a una capacidad;
- inventar nombres concretos de archivos, clases, funciones o endpoints;
- convertir preferencias técnicas en decisiones confirmadas.

## Entregables

Crear o actualizar:

- `task-planning/construction-strategy.md`;
- `task-planning/project-state.json`.

## Condición de salida

La fase termina cuando la estrategia:

- cubre el inicio del proyecto o integración con el repositorio existente;
- define incrementos verticales;
- explica configuración, host, persistencia y migraciones cuando aplican;
- clasifica los requisitos no funcionales;
- no contiene decisiones bloqueantes ocultas;
- puede utilizarse para ordenar capacidades.

Entonces:

- cambiar fase a `capability_mapping`;
- mantener estado `in_progress`.

## Condición de bloqueo

Regresar a `decision_resolution` cuando la estrategia revele una decisión que
cambie materialmente:

- arquitectura;
- propiedad de datos;
- modelo de despliegue;
- seguridad;
- billing;
- integración externa;
- alcance MVP.

Usar `blocked` cuando no pueda formularse una decisión concreta.

---

# Fase 6 — Capability Mapping

## Objetivo

Construir capacidades observables conservando exactamente la identidad del
contrato semántico.

## Estado inicial

- fase: `capability_mapping`
- estado: `in_progress`

## Entradas permitidas

- blueprint resuelto;
- `semantic-contract.json` aprobado;
- `requirements.json`;
- decisiones confirmadas;
- estrategia de construcción.

## Acciones obligatorias

1. Generar `capability-map.json` con `schemaVersion = 3`.
2. Para cada capacidad `functional` planificada seleccionar exactamente un
   contrato semántico.
3. Copiar:
   - `behaviorIds = [contract.behaviorId]`;
   - `semanticKeys = [contract.semanticKey]`;
   - `requirementIds` incluyendo `contract.requirementId`.
4. Para capacidades no funcionales usar arrays semánticos vacíos.
5. Asignar un `logicalOwner`.
6. Mantener `ownerEpicId = null` y `ownerTaskId = null`.
7. Detectar duplicaciones, consumidores sin proveedor y capacidades sin contrato.
8. Actualizar contadores desde el mapa real.

## Reglas obligatorias

- Una capacidad funcional representa un solo behavior.
- Un behavior MVP tiene exactamente una capacidad funcional propietaria.
- No se reescribe `semanticKey`, `operation`, `outcome` ni `sourceFunctionId`.
- No se crean capacidades CRUD o agrupaciones separables.

## Acciones prohibidas

- generar tareas;
- asignar propietarios de épica o tarea;
- crear semántica nueva;
- asociar un behavior a varias capacidades funcionales.

## Entregables

- `task-planning/capability-map.json`;
- `task-planning/project-state.json`.

## Condición de salida

Todas las capacidades funcionales tienen un contrato exacto y cada behavior MVP
tiene una sola capacidad propietaria.

Entonces avanzar a `epic_generation`.

---

# Fase 7 — Epic Generation

## Objetivo

Agrupar capacidades planificadas en incrementos funcionales coherentes, usando
`requirementId` como agrupación predeterminada y evitando una épica por behavior.

## Estado inicial

- fase: `epic_generation`
- estado: `in_progress`

## Entradas permitidas

- blueprint resuelto;
- `task-planning/semantic-contract.json`;
- `task-planning/requirements.json`;
- decisiones confirmadas;
- estrategia de construcción;
- mapa de capacidades.

## Contrato estructurado de épicas

`epic-plan.json` debe usar `schemaVersion = 3`.

Cada épica registra:

- `id`;
- `title`;
- `file`;
- `incrementId`;
- `dependencyIds`;
- `capabilityIds`;
- `behaviorIds`;
- `requirementIds`;
- `decisionIds`;
- `splitReason`;
- `taskIds`;
- `decomposed`.

`splitReason` es `null` cuando el requisito no está dividido.

Cuando existe una división, tiene esta forma:

```json
{
  "type": "independent_delivery",
  "description": "Justificación concreta y verificable de la división.",
  "decisionId": "DEC-..."
}
```

Tipos permitidos:

- `independent_delivery`;
- `distinct_actor`;
- `distinct_surface`;
- `deployment_boundary`;
- `dependency_boundary`;
- `task_count_limit`;
- `enabling_foundation`.

## Acciones obligatorias

1. Obtener todos los behaviors MVP confirmados.
2. Agruparlos primero por `requirementId`.
3. Crear una sola épica candidata por requisito.
4. Incorporar en esa épica todas las capacidades funcionales de sus behaviors.
5. Incorporar las capacidades habilitadoras compartidas en la primera épica
   funcional que las necesita, salvo una división aprobada de tipo
   `enabling_foundation`.
6. Inicializar `taskIds = []` y `decomposed = false`.
7. Asignar exactamente un `ownerEpicId` a cada capacidad `planned`.
8. Conservar `ownerTaskId = null`.
9. Registrar en `behaviorIds` exactamente la unión de behaviors de las capacidades
   funcionales de la épica.
10. Confirmar que cada behavior MVP pertenece a exactamente una épica.
11. Confirmar igualdad exacta entre las capacidades `planned` y la unión de
    `capabilityIds` de todas las épicas.
12. Definir dependencias únicamente entre incrementos reales.
13. Confirmar que no existen ciclos.
14. Crear un archivo por épica dentro de `task-planning/epics/`.
15. Generar `task-planning/epic-plan.json`.
16. Actualizar el estado del proyecto desde los artefactos reales.

## División excepcional de requisitos

Un requisito puede aparecer en varias épicas únicamente cuando:

1. existe una decisión humana confirmada;
2. cada épica dividida contiene `splitReason`;
3. `splitReason.decisionId` existe y está incluido en `decisionIds`;
4. el tipo de división pertenece a la lista permitida;
5. los behaviors siguen perteneciendo a exactamente una épica.

Sin esas condiciones, dividir un requisito es un error bloqueante.

## Reglas obligatorias

- La agrupación predeterminada es una épica por requisito, no por behavior.
- Una épica puede contener varios behaviors y capacidades relacionadas.
- Un behavior MVP pertenece a exactamente una épica.
- Una capacidad `planned` pertenece a exactamente una épica propietaria.
- Una épica consumidora no reclama propiedad de una capacidad ajena.
- Capacidades `preexisting` o `external` no requieren épica propietaria salvo que
  exista trabajo planificado para integrarlas.
- Toda referencia a requisito, behavior y decisión debe existir.
- El índice y los archivos deben coincidir exactamente.

## Acciones prohibidas

- crear una épica por cada behavior por defecto;
- dividir un requisito sin una decisión humana confirmada;
- inventar un `splitReason` después de generar la división;
- crear archivos dentro de `task-planning/tasks/`;
- asignar `ownerTaskId`;
- marcar una épica como descompuesta;
- declarar que una épica es indivisible;
- publicar una épica como tarea ejecutable;
- duplicar propiedad de capacidades o behaviors.

## Entregables

Crear o actualizar:

- `task-planning/epics/*.md`;
- `task-planning/epic-plan.json`;
- `task-planning/capability-map.json`;
- `task-planning/project-state.json`.

Al terminar correctamente:

- `epic-plan.json.status = generated`;
- `epicsGenerated = epic-plan.json.epics.length`;
- todas las capacidades `planned` tienen `ownerEpicId`;
- todas las capacidades `planned` mantienen `ownerTaskId = null`;
- todos los behaviors MVP pertenecen a exactamente una épica.

## Condición de salida

La fase termina cuando:

- la unión de capacidades de las épicas coincide exactamente con las capacidades
  `planned`;
- la unión de behaviors de las épicas coincide exactamente con los behaviors MVP;
- cada capacidad y behavior tiene una sola épica propietaria;
- todo requisito dividido cuenta con una decisión y `splitReason` válidos;
- las dependencias son válidas y no existen ciclos.

---

# Fase 8 — Epic Decomposition

## Objetivo

Descomponer una épica por vez en tareas ejecutables que preserven exactamente la
identidad semántica de sus capacidades.

## Estado inicial

- fase: `epic_decomposition`
- estado: `in_progress`

## Entradas permitidas

- épica actual;
- capacidades creadas y consumidas;
- `semantic-contract.json` aprobado;
- `requirements.json`;
- blueprint resuelto;
- decisiones y estrategia.

## Proceso obligatorio por épica

1. Leer la épica, capacidades y contratos relacionados.
2. Crear una tarea por capacidad principal.
3. Para cada tarea funcional copiar:
   - `behaviorIds` de la capacidad creada;
   - `semanticKeys` de la capacidad creada;
   - los mismos `behaviorIds` a `requirementCoverage`.
4. Crear el Markdown con `SCOPE-*`, `AC-*` y `## Contrato semántico`.
5. En el bloque semántico copiar `behaviorIds`, `semanticKeys` y
   `sourceFunctionIds` derivados del contrato.
6. Confirmar igualdad exacta entre tarea, capacidad, cobertura y Markdown.
7. Asignar `ownerTaskId`, actualizar índices y contadores.
8. Marcar la épica como descompuesta solo al completar todas sus capacidades.

## Estructura de `task-plan.json`

Debe usar `schemaVersion = 4`. Cada tarea incluye:

- `id`;
- `title`;
- `file`;
- `epicId`;
- `type`;
- `dependencyIds`;
- `createsCapabilityIds`;
- `consumesCapabilityIds`;
- `behaviorIds`;
- `semanticKeys`;
- `requirementCoverage`.

## Estructura del Markdown

Cada tarea contiene:

- `## Objetivo`;
- `## Alcance`;
- `## Fuera de alcance`;
- `## Criterios de aceptación`;
- `## Pruebas`;
- `## Contrato semántico`.

El bloque semántico obligatorio es JSON válido.

## Condiciones de rechazo

Una tarea es inválida si su behavior o semanticKey difiere de su capacidad, su
cobertura o su contrato; si combina resultados separables; o si obliga al
Supervisor a inventar reglas.

## Entregables

- `task-planning/tasks/*.md`;
- `task-planning/task-plan.json`;
- `task-planning/epic-plan.json`;
- `task-planning/capability-map.json`;
- `task-planning/project-state.json`.

## Condición de salida

Solo avanzar a `plan_validation` cuando todas las tareas preserven la cadena:

```text
contrato semántico = behavior = capacidad = tarea = cobertura = Markdown
```

---

# Regla transversal — Sincronización de artefactos

Los artefactos y `task-planning/project-state.json` deben permanecer sincronizados. Después de cada modificación JSON debe ejecutarse el actualizador de timestamps y hash.

Después de crear o modificar cualquiera de estos artefactos:

- `task-planning/SOFTWARE-BLUEPRINT-RESOLVED.md`;
- `task-planning/semantic-contract.json`;
- `task-planning/requirements.json`;
- `task-planning/construction-strategy.md`;
- `task-planning/capability-map.json`;
- `task-planning/epic-plan.json`;
- `task-planning/epics/*.md`;
- `task-planning/task-plan.json`;
- `task-planning/tasks/*.md`;

Task Planner debe actualizar inmediatamente su estado correspondiente dentro de
`project-state.json`.

`readiness.json` y `validation-report.md` son administrados únicamente por
`validate-plan.mjs`.

La existencia de un archivo no es suficiente para considerarlo generado,
validado, aprobado o publicado.

Los contadores deben calcularse así:

```text
semanticContractsDetected =
semantic-contract.json.contracts.length

mvpRequirementsDetected =
requirements.json requirements con scope = mvp

mvpFunctionsDetected =
behaviors MVP + unresolvedFunctions MVP

mvpFunctionsAtomic =
behaviors con scope = mvp

mvpFunctionsUnresolved =
unresolvedFunctions con scope = mvp

mvpBehaviorsDetected =
behaviors MVP confirmados

mvpBehaviorsCovered =
behaviors MVP confirmados con cobertura válida en tareas

capabilitiesMapped =
capability-map.json.capabilities.length

epicsGenerated =
epic-plan.json.epics.length

epicsDecomposed =
epic-plan.json epics con decomposed = true

tasksGenerated =
task-plan.json.tasks.length
```

No deben estimarse ni incrementarse manualmente.

---

# Fase 9 — Plan Validation

## Objetivo

Validar mediante controles deterministas y revisión adversarial que requisitos,
capacidades, épicas y tareas forman un plan consistente.

## Estado inicial

- fase: `plan_validation`
- estado: `in_progress`

## Relectura obligatoria

Antes de ejecutar el validador, volver a leer:

1. `task-planning/project-state.json`;
2. `task-planning/decisions.json`;
3. `task-planning/SOFTWARE-BLUEPRINT-RESOLVED.md`;
4. `task-planning/semantic-contract.json`;
5. `task-planning/requirements.json`;
6. `task-planning/construction-strategy.md`;
7. `task-planning/capability-map.json`;
8. `task-planning/epic-plan.json`;
9. todos los archivos dentro de `task-planning/epics/`;
10. `task-planning/task-plan.json`;
11. todos los archivos dentro de `task-planning/tasks/`;
12. `task-planning/tools/validate-plan.mjs`.

La validación debe tratar el plan como producido por un tercero.

## Preparación obligatoria

Antes de ejecutar el validador:

1. recalcular todos los contadores desde los artefactos;
2. persistir esos contadores en `project-state.json`;
3. confirmar que:
   - `semantic-contract.json.status = approved` o `validated`;
   - `requirements.json.status = generated` o `validated`;
   - `capability-map.json.status = generated` o `validated`;
   - `epic-plan.json.status = generated` o `validated`;
   - `task-plan.json.status = in_progress` o `validated`;
4. confirmar que la fase persistida sigue siendo `plan_validation`;
5. confirmar que no existen decisiones bloqueantes pendientes.

## Ejecución obligatoria

Ejecutar exactamente:

```bash
node task-planning/tools/validate-plan.mjs
```

No se permite sustituir este comando por una evaluación narrativa.

El comando:

- devuelve código `0` si pasa;
- devuelve código distinto de `0` si falla;
- escribe `task-planning/readiness.json`;
- escribe `task-planning/validation-report.md`.

Task Planner no puede editar manualmente esos dos archivos para cambiar el
resultado.

## Validaciones deterministas mínimas

El validador comprueba:

- archivos obligatorios;
- JSON válido;
- estados permitidos;
- identificadores únicos;
- requisitos presentes en el blueprint resuelto;
- referencias de requisitos y decisiones;
- capacidades demasiado amplias;
- propietario lógico;
- una sola épica propietaria por capacidad;
- una sola tarea propietaria por capacidad;
- capacidades creadas y consumidas;
- dependencias y ciclos;
- correspondencia de índices y archivos;
- épicas descompuestas;
- correspondencia entre `epicId` y `taskIds`;
- existencia de secciones obligatorias en tareas;
- IDs `SCOPE-*` y `AC-*`;
- cobertura semántica de behaviors MVP;
- behaviors sin fuente o duplicados;
- funciones MVP agregadas o ambiguas sin resolver;
- exclusión de requisitos no MVP;
- contadores de `project-state.json`;
- coherencia de publicación y aprobación.

## Revisión adversarial adicional

Después de la ejecución determinista, revisar las cuestiones semánticas que no
pueden reducirse completamente a estructura:

### Estrategia

- ¿Los incrementos son verticales y verificables?
- ¿Los NFR tienen responsable, mecanismo y evidencia?
- ¿Existe una decisión material oculta?

### Capacidades

- ¿Cada capacidad representa realmente un solo comportamiento?
- ¿El propietario lógico es coherente?
- ¿Existe una capacidad transversal duplicada?

### Épicas

- ¿Cada épica representa un resultado amplio coherente?
- ¿Oculta capacidades propiedad de otra épica?
- ¿Sus dependencias son reales?

### Tareas

- ¿Es una sola tarea?
- ¿Puede dividirse?
- ¿Incluye reglas sin origen?
- ¿Obliga a inventar reglas?
- ¿Mezcla resultados independientes?
- ¿Sus criterios son binarios?
- ¿Las pruebas pertenecen a la capacidad?
- ¿Introduce detalles no confirmados?

Si la revisión semántica detecta un problema real, no debe alterarse manualmente
el resultado del validador. Debe registrarse la corrección en el artefacto
responsable, regresar a la fase correspondiente y ejecutar nuevamente el
validador.

## Si el validador falla

Cuando el comando devuelve código distinto de `0`:

1. no modificar `readiness.json` ni `validation-report.md`;
2. leer ambos archivos;
3. mantener:
   - `planValidated = false`;
   - `planPublished = false`;
4. establecer en `project-state.json`:
   - `artifacts.readiness.status = failed`;
   - `artifacts.validationReport.status = generated`;
   - `workflow.status = in_progress`;
5. identificar la fase más temprana responsable;
6. regresar a:
   - `epic_decomposition` para tareas, cobertura o dependencias;
   - `epic_generation` para asignación o dependencias de épicas;
   - `capability_mapping` para capacidades;
   - `construction_strategy` para orden o habilitadores;
   - `blueprint_consolidation` para requisitos;
   - `decision_resolution` para decisiones materiales;
7. corregir;
8. recalcular contadores;
9. volver a ejecutar el validador.

Si no es posible corregir con la información disponible:

- cambiar estado a `blocked`;
- registrar la causa;
- no publicar.

## Si el validador pasa

Cuando el comando devuelve `0` y `readiness.json.status = passed`:

1. comprobar que `blockingIssues` esté vacío;
2. actualizar:
   - `semantic-contract.json.status = validated`;
   - `requirements.json.status = validated`;
   - `capability-map.json.status = validated`;
   - `epic-plan.json.status = validated`;
   - `task-plan.json.status = validated`;
3. actualizar en `project-state.json`:
   - `progress.planValidated = true`;
   - `progress.planPublished = false`;
   - `progress.capabilityMapValidated = true`;
   - contadores reales;
   - `artifacts.semanticContract.status = validated`;
   - `artifacts.requirements.status = validated`;
   - `artifacts.capabilityMap.status = validated`;
   - `artifacts.epicPlan.status = validated`;
   - `artifacts.taskPlan.status = validated`;
   - `artifacts.readiness.status = passed`;
   - `artifacts.validationReport.status = generated`;
   - `artifacts.epicsDirectory.status = populated`;
   - `artifacts.tasksDirectory.status = populated`;
4. ejecutar nuevamente el validador;
5. confirmar otra vez:
   - código `0`;
   - `readiness.status = passed`;
   - cero errores bloqueantes;
6. cambiar:
   - `workflow.phase = plan_approval`;
   - `workflow.status = awaiting_user`;
7. solicitar aprobación final.

El proceso no puede cambiar a `completed` durante esta fase.

## Condición de salida

Solo puede avanzar a `plan_approval` cuando:

- la última ejecución del validador devolvió código `0`;
- `readiness.json.status = passed`;
- `blockingIssues` está vacío;
- todos los índices estructurados están `validated`;
- `planValidated = true`;
- `planPublished = false`.

---

# Fase 10 — Plan Approval

## Objetivo

Obtener aprobación humana explícita del plan validado antes de publicarlo y
cerrar la planificación inicial.

## Estado inicial

- fase: `plan_approval`
- estado: `awaiting_user`

## Precondiciones

Deben cumplirse todas:

- última ejecución del validador con código `0`;
- `readiness.json.status = passed`;
- `semantic-contract.json.status = validated`;
- `requirements.json.status = validated`;
- `capability-map.json.status = validated`;
- `epic-plan.json.status = validated`;
- `task-plan.json.status = validated`;
- `planValidated = true`;
- `planPublished = false`;
- no existen decisiones bloqueantes;
- los índices coinciden con los archivos.

## Presentación obligatoria

Mostrar:

- resumen de estrategia;
- número y títulos de épicas;
- número de tareas;
- cobertura de requisitos MVP;
- disposición de NFR;
- decisiones incorporadas;
- riesgos residuales;
- advertencias;
- ubicación de artefactos.

Solicitar:

- aprobar;
- solicitar cambios;
- rechazar.

Antes de solicitar por primera vez:

1. ejecutar `node task-planning/tools/update-timestamps.mjs approval-requested finalPlan`;
2. establecer `workflow.pendingUserAction = final_plan_approval`;
3. actualizar `project-state.json` mediante `update-timestamps.mjs touch`;
4. no volver a registrar `requestedAt` en reanudaciones posteriores.

## Si el usuario aprueba

Actualizar, en este orden:

1. `task-plan.json.status = published`.
2. `epic-plan.json.status = published`.
3. Ejecutar `node task-planning/tools/update-timestamps.mjs approval-resolved finalPlan approved user`.
4. Establecer:
   - `progress.planPublished = true`;
   - `progress.finalPlanApproved = true`;
   - `artifacts.taskPlan.status = published`;
   - `artifacts.epicPlan.status = published`;
   - `workflow.pendingUserAction = null`.
5. Mantener:
   - `workflow.phase = plan_approval`.
6. Ejecutar nuevamente:

```bash
node task-planning/tools/validate-plan.mjs
```

7. Si devuelve código distinto de `0`:
   - no marcar `completed`;
   - revertir `planPublished` a `false`;
   - devolver índices a `validated`;
   - mantener la aprobación registrada pero marcar el cierre como fallido;
   - regresar a `plan_validation`.
8. Si devuelve código `0`:
   - confirmar `readiness.status = passed`;
   - confirmar cero errores;
   - establecer `workflow.status = completed`;
   - registrar `completedAt` con una fecha real;
   - volver a leer todos los artefactos;
   - verificar invariantes finales.

## Si el usuario solicita cambios

Clasificar y regresar a la fase más temprana responsable:

- tarea → `epic_decomposition`;
- épica → `epic_generation`;
- propiedad de capacidad → `capability_mapping`;
- estrategia → `construction_strategy`;
- requisito documental → `blueprint_consolidation`;
- decisión o alcance → `decision_resolution`.

En todos los casos:

- invalidar `planValidated`;
- invalidar `planPublished`;
- establecer los índices derivados en estado no validado;
- establecer `readiness.status` mediante una nueva ejecución del validador, no
  mediante edición manual;
- registrar el motivo;
- invalidar únicamente los artefactos derivados afectados.

## Si el usuario rechaza

- cambiar estado a `blocked`;
- registrar el motivo;
- no publicar.

## Acciones prohibidas

- considerar el silencio como aprobación;
- aprobar parcialmente;
- editar manualmente `readiness.json` para forzar `passed`;
- modificar artefactos aprobados sin invalidar la aprobación;
- marcar `completed` antes de la validación final posterior a publicación;
- inventar fechas.

## Condición de salida

El proceso termina cuando:

- el usuario aprobó explícitamente;
- `task-plan.json.status = published`;
- `epic-plan.json.status = published`;
- la ejecución final del validador devolvió código `0`;
- `readiness.json.status = passed`;
- `planValidated = true`;
- `planPublished = true`;
- `finalPlanApproved = true`;
- `workflow.status = completed`;
- todas las invariantes finales se cumplen.

---

# Transiciones permitidas

```text
blueprint_analysis
    ├── decision_resolution
    ├── blueprint_consolidation
    └── blocked

decision_resolution
    ├── decision_resolution
    ├── blueprint_consolidation
    └── blocked

blueprint_consolidation
    ├── blueprint_approval
    ├── decision_resolution
    └── blocked

blueprint_approval
    ├── construction_strategy
    ├── blueprint_consolidation
    ├── decision_resolution
    └── blocked

construction_strategy
    ├── capability_mapping
    ├── decision_resolution
    └── blocked

capability_mapping
    ├── epic_generation
    ├── construction_strategy
    ├── decision_resolution
    └── blocked

epic_generation
    ├── epic_decomposition
    ├── capability_mapping
    ├── construction_strategy
    ├── decision_resolution
    └── blocked

epic_decomposition
    ├── epic_decomposition
    ├── plan_validation
    ├── epic_generation
    ├── capability_mapping
    ├── construction_strategy
    ├── decision_resolution
    └── blocked

plan_validation
    ├── plan_approval
    ├── epic_decomposition
    ├── epic_generation
    ├── capability_mapping
    ├── construction_strategy
    ├── blueprint_consolidation
    ├── decision_resolution
    └── blocked

plan_approval
    ├── completed
    ├── epic_decomposition
    ├── epic_generation
    ├── capability_mapping
    ├── construction_strategy
    ├── blueprint_consolidation
    ├── decision_resolution
    └── blocked
```

No se permiten otras transiciones.

---

# Reanudación de sesiones

Al iniciar una nueva sesión:

1. Leer `task-planning/project-state.json`.
2. Confirmar versión del workflow, fase y estado.
3. Verificar que los artefactos declarados existan.
4. Leer únicamente los archivos necesarios para la fase actual.
5. Continuar desde el último punto persistido.
6. No repetir fases aprobadas.
7. No volver a formular decisiones resueltas.
8. No regenerar épicas o tareas ya validadas salvo que una transición de regreso
   las haya invalidado explícitamente.
9. Si el proceso está `completed`, no modificar artefactos.

Si el estado es `awaiting_user`, volver a presentar únicamente:

- la decisión pendiente actual;
- la aprobación del blueprint; o
- la aprobación del plan.

Si la fase es `epic_decomposition`, reanudar desde `currentEpicId`.

Si el estado es `blocked`, explicar:

- causa del bloqueo;
- información necesaria;
- acción mínima para desbloquearlo.

---

# Invariantes finales

Antes de registrar `completed`, deben cumplirse simultáneamente:

1. El blueprint resuelto está aprobado.
2. `semantic-contract.json.status = validated`.
3. `semanticContractApproved = true`.
4. `semanticContractsDetected` coincide con los contratos reales.
5. Cada behavior coincide exactamente con su contrato semántico.
6. Cada behavior MVP tiene exactamente una capacidad funcional propietaria.
7. Cada tarea funcional coincide con su capacidad, cobertura y bloque Markdown.
8. No existen decisiones bloqueantes pendientes.
9. `requirements.json.status = validated`.
10. Cada requisito referenciado existe en `requirements.json`.
11. Existe `construction-strategy.md`.
12. `capability-map.json.status = validated`.
13. Cada capacidad `planned` tiene propietario lógico válido.
14. Cada capacidad `planned` tiene exactamente una épica propietaria.
15. Cada capacidad `planned` tiene exactamente una tarea propietaria.
16. `epic-plan.json.status = published`.
17. Cada épica registrada tiene exactamente un archivo.
18. Ningún archivo de épica queda fuera del índice.
19. Todas las épicas están descompuestas.
21. `task-plan.json.status = published`.
22. Cada tarea registrada tiene exactamente un archivo.
23. Ningún archivo de tarea queda fuera del índice.
24. Cada tarea funcional o habilitadora crea exactamente una capacidad principal.
25. `tasksGenerated` coincide con `task-plan.json.tasks.length`.
26. `epicsGenerated` coincide con `epic-plan.json.epics.length`.
27. `capabilitiesMapped` coincide con `capability-map.json.capabilities.length`.
28. `mvpRequirementsDetected` y `mvpRequirementsCovered` coinciden con el catálogo.
28. `mvpBehaviorsDetected` y `mvpBehaviorsCovered` coinciden con la cobertura real.
29. `mvpFunctionsUnresolved = 0`.
30. La última ejecución de `validate-plan.mjs` devolvió código `0`.
31. `readiness.json.status = passed`.
32. `readiness.json.blockingIssues` está vacío.
33. `planValidated = true`.
34. `planPublished = true`.
35. `finalPlanApproved = true`.
36. Ningún requisito post-MVP está cubierto por el plan.
37. No existen ciclos ni errores de validación.
38. Los estados de artefactos coinciden con sus contenidos reales.
39. El usuario aprobó explícitamente el plan final.
40. `workflow.phase = plan_approval`.
41. `workflow.status = completed`.
42. `completedAt` contiene una fecha real.

Si cualquier invariante falla, prevalece el estado más restrictivo y el proceso
no está terminado.

---

# Terminación

Después de terminar:

- Task Planner no ejecuta tareas;
- Task Planner no recibe resultados de DevFlow;
- Task Planner no modifica el plan;
- Task Planner no regenera tareas;
- Task Planner no reabre decisiones automáticamente.

Cualquier cambio posterior requiere un workflow de replanificación separado.
