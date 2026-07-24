# Workflow de Task Planner

## Versión

- Workflow: `2`
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
- la descomposición de épicas en tareas;
- la validación del plan;
- la publicación final.

Task Planner no puede omitir fases, mezclar responsabilidades de fases distintas
ni avanzar cuando no se cumplen sus condiciones de salida.

---

# Principios del proceso

1. El blueprint original nunca se modifica.
2. No se generan artefactos de planificación mientras existan decisiones
   bloqueantes.
3. Las decisiones humanas se registran antes de incorporarse al blueprint.
4. El blueprint resuelto debe conservar identificadores estables de requisitos.
5. `requirements.json` es el catálogo estructurado y fuente única para contar y
   referenciar requisitos, funciones fuente y behaviors.
6. El blueprint resuelto debe ser aprobado antes de diseñar la construcción.
7. La estrategia de construcción se define antes de generar capacidades y épicas.
8. La propiedad de capacidades se define antes de generar tareas.
9. Las épicas no son tareas ejecutables de DevFlow.
10. Las tareas se generan por descomposición explícita de una épica.
11. Cada capacidad planificada tiene una sola épica propietaria y una sola tarea
    propietaria.
12. Una tarea puede consumir capacidades de otras tareas, pero no volver a
    implementarlas.
13. Cada behavior MVP confirmado debe tener trazabilidad semántica hacia una tarea,
    un elemento de alcance y un criterio de aceptación.
14. Los requisitos post-MVP no forman parte del plan inicial.
15. Las tareas deben incluir sus propias pruebas.
16. No se permite una tarea general que defina todo el esquema, todo el módulo o
    toda la integración cuando existen incrementos verificables independientes.
17. Los modelos y migraciones se introducen incrementalmente según las
    capacidades que los necesitan.
18. La validación estructural se realiza mediante
    `task-planning/tools/validate-plan.mjs`.
19. Task Planner no puede declarar manualmente que el plan pasó la validación.
20. `readiness.json` y `validation-report.md` son salidas del validador.
21. El proceso termina únicamente después de validar y aprobar el plan final.
22. Esta versión no incluye ejecución, seguimiento ni replanificación.
23. Todo archivo generado debe permanecer dentro de `task-planning/`.
24. Los artefactos y `project-state.json` deben permanecer sincronizados.
25. Ningún estado `completed`, `passed` o `published` puede registrarse como
    intención provisional.

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

Crear una versión autónoma y consistente del blueprint que incorpore todas las
decisiones confirmadas y producir el catálogo estructurado de requisitos.

## Estado inicial

- fase: `blueprint_consolidation`
- estado: `in_progress`

## Entradas permitidas

- blueprint fuente;
- `task-planning/decisions.json`;
- `task-planning/project-state.json`.

## Acciones obligatorias

1. Leer nuevamente el blueprint fuente y las decisiones.
2. Incorporar únicamente decisiones confirmadas.
3. Resolver en el documento las contradicciones cerradas.
4. Añadir las restricciones derivadas directamente de decisiones confirmadas.
5. Mantener o asignar identificadores estables a todos los requisitos que serán
   usados posteriormente.
6. Mantener separado:

   - MVP;
   - post-MVP;
   - fuera de alcance.

7. Referenciar la decisión que modificó cada definición relevante.
8. Generar `task-planning/SOFTWARE-BLUEPRINT-RESOLVED.md`.
9. Verificar que pueda entenderse sin consultar la conversación.
10. Extraer todos los requisitos identificables del blueprint resuelto.
11. Dentro de cada requisito, extraer cada función explícita descrita en tablas,
    listas o texto normativo funcional.
12. Clasificar cada función como `atomic`, `aggregate`, `ambiguous`,
    `cross_cutting`, `informational`, `out_of_scope` o `duplicate`.
13. Generar un behavior únicamente para cada función `atomic` confirmada.
14. Registrar las funciones `aggregate` o `ambiguous` en `unresolvedFunctions`;
    no descomponerlas usando conocimiento propio.
15. Generar `task-planning/requirements.json`.
16. Registrar para cada requisito:

    - `id`;
    - `title`;
    - `description`;
    - `scope`;
    - `sourceSection`;
    - `decisionIds`;
    - `confirmationStatus`;
    - `behaviors`;
    - `unresolvedFunctions`.

17. Registrar para cada behavior `id`, `operation`, `outcome`, `sourceSection`,
    `sourceItem`, `scope` y `confirmationStatus`.
18. Confirmar que cada behavior tiene una única función fuente y un resultado observable.
19. Confirmar que cada requisito de `requirements.json` aparece por ID dentro del
    blueprint resuelto.
20. Confirmar que no existen identificadores duplicados de requisitos ni behaviors.
21. Calcular desde el catálogo real:
    - `mvpRequirementsDetected`;
    - `mvpFunctionsDetected`;
    - `mvpFunctionsAtomic`;
    - `mvpFunctionsUnresolved`;
    - `mvpBehaviorsDetected`.
22. No avanzar mientras exista una función MVP `aggregate` o `ambiguous` sin resolver.
23. Actualizar el estado de los artefactos y del proyecto.

## Reglas obligatorias

- `requirements.json` es la fuente única para contar requisitos.
- `scope` solo puede ser:
  - `mvp`;
  - `post_mvp`;
  - `out_of_scope`.
- No se crean requisitos únicamente para completar una capacidad o tarea.
- Un requisito no puede aparecer en artefactos posteriores si no existe en
  `requirements.json`.
- La existencia de la plantilla no significa que el catálogo haya sido generado.

## Acciones prohibidas

- sobrescribir el blueprint original;
- inventar requisitos;
- eliminar requisitos silenciosamente;
- incorporar propuestas no confirmadas;
- reinterpretar decisiones humanas;
- generar estrategia, capacidades, épicas o tareas;
- calcular requisitos desde menciones dispersas en archivos posteriores.

## Entregables

Crear o actualizar:

- `task-planning/SOFTWARE-BLUEPRINT-RESOLVED.md`;
- `task-planning/requirements.json`;
- `task-planning/project-state.json`.

Al terminar correctamente:

- `requirements.json.status = generated`;
- `artifacts.requirements.status = generated`;
- `resolvedBlueprintCreated = true`;
- `mvpRequirementsDetected` coincide con el catálogo real.

## Condición de salida

Cuando:

- el blueprint resuelto exista;
- sea internamente consistente;
- incluya las decisiones confirmadas;
- conserve los identificadores de requisitos;
- `requirements.json` contenga exactamente los requisitos y funciones del documento;
- cada función atómica confirmada tenga exactamente un behavior;
- no existan funciones MVP agregadas o ambiguas sin resolver;
- no existan identificadores duplicados;
- no existan contradicciones críticas conocidas;

entonces:

- cambiar fase a `blueprint_approval`;
- cambiar estado a `awaiting_user`;
- presentar un resumen de cambios;
- solicitar aprobación explícita.

## Condición de bloqueo

Cambiar a `blocked` cuando durante la consolidación aparezca:

- una nueva contradicción bloqueante;
- una decisión registrada sin consecuencias suficientes;
- una sección crítica que no pueda consolidarse;
- un requisito que no pueda clasificarse sin una decisión material.

Cuando sea posible formular una decisión concreta, regresar a
`decision_resolution` en lugar de permanecer bloqueado.

---

# Fase 4 — Blueprint Approval

## Objetivo

Obtener aprobación humana explícita del blueprint resuelto antes de diseñar la
estrategia de construcción.

## Estado inicial

- fase: `blueprint_approval`
- estado: `awaiting_user`

## Presentación obligatoria

Mostrar:

- decisiones incorporadas;
- contradicciones corregidas;
- cambios materiales respecto al blueprint original;
- riesgos residuales;
- asuntos no bloqueantes;
- ubicación del blueprint resuelto.

Solicitar una de estas respuestas:

- aprobar;
- solicitar cambios;
- rechazar.

## Si el usuario aprueba

1. Registrar la aprobación humana.
2. No volver a modificar el blueprint resuelto sin invalidar la aprobación.
3. Cambiar fase a `construction_strategy`.
4. Cambiar estado a `in_progress`.

## Si el usuario solicita cambios

Clasificar el cambio:

### Cambio de decisión

- regresar a `decision_resolution`;
- reabrir solamente las decisiones afectadas.

### Corrección de consolidación

- regresar a `blueprint_consolidation`;
- conservar las decisiones confirmadas.

### Nuevo requisito

- registrar que el blueprint fuente y el resuelto dejaron de estar alineados;
- solicitar confirmación del nuevo requisito;
- regresar a `decision_resolution` cuando implique una decisión;
- regresar a `blueprint_consolidation` cuando sea una corrección documental.

## Si el usuario rechaza

- cambiar estado a `blocked`;
- registrar el motivo;
- no continuar.

## Acciones prohibidas

- considerar el silencio como aprobación;
- aceptar una aprobación parcial;
- comenzar `construction_strategy` sin aprobación explícita registrada.

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
- cero decisiones bloqueantes pendientes;
- cero contradicciones críticas abiertas;
- alcance MVP identificado;
- requisitos no funcionales identificados.

## Entradas permitidas

- blueprint resuelto;
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

Construir un inventario único de capacidades observables y definir qué
responsabilidad lógica implementa cada una.

## Estado inicial

- fase: `capability_mapping`
- estado: `in_progress`

## Entradas permitidas

- blueprint resuelto;
- `task-planning/requirements.json`;
- decisiones confirmadas;
- estrategia de construcción.

## Acciones obligatorias

1. Extraer todas las capacidades necesarias para el MVP.
2. Incluir capacidades:
   - funcionales;
   - habilitadoras;
   - no funcionales;
   - externas o preexistentes cuando deban consumirse.
3. Para cada capacidad registrar exactamente:

   - `id`;
   - `name`;
   - `result`;
   - `type`;
   - `implementationKind`;
   - `requirementIds`;
   - `decisionIds`;
   - `logicalOwner`;
   - `ownerEpicId`;
   - `ownerTaskId`;
   - `requiredCapabilityIds`;
   - `consumerCapabilityIds`;
   - `incrementId`;
   - `confirmationStatus`.

4. Asignar exactamente un `logicalOwner`.
5. Establecer durante esta fase:
   - `ownerEpicId = null`;
   - `ownerTaskId = null`.
6. Distinguir explícitamente:
   - definir contrato;
   - implementar capacidad;
   - integrar capacidad;
   - consumir capacidad.
7. Detectar capacidades duplicadas o demasiado amplias.
8. Detectar consumidores sin capacidad proveedora.
9. Detectar capacidades sin respaldo en requisitos, decisiones o estrategia.
10. Generar `task-planning/capability-map.json`.
11. Actualizar el estado del proyecto desde el número real de capacidades.

## Reglas obligatorias

- Una capacidad representa un solo comportamiento observable.
- Una capacidad `planned` debe poder ser propiedad de una sola tarea.
- Una capacidad no puede representar un CRUD completo.
- Una capacidad no puede combinar operaciones independientes de consulta,
  creación, actualización, eliminación, habilitación o deshabilitación.
- `logicalOwner` identifica un módulo o responsabilidad; nunca puede ser el ID de
  la propia capacidad.
- `type` solo puede ser:
  - `functional`;
  - `enabling`;
  - `non_functional`;
  - `external`.
- `implementationKind` solo puede ser:
  - `planned`;
  - `preexisting`;
  - `external`.
- Una capacidad tiene un solo propietario de implementación.
- Varias épicas o tareas pueden consumirla.
- Un consumidor no puede volver a implementarla.
- La misma integración transversal debe tener un único propietario.
- Toda referencia en `requirementIds` debe existir en `requirements.json`.
- Toda referencia en `decisionIds` debe existir en `decisions.json`.
- Una capacidad sin origen confirmado no puede registrarse como comportamiento
  de negocio.
- La existencia de la plantilla no significa que el mapa haya sido generado.

## Acciones prohibidas

- generar tareas;
- asignar `ownerEpicId` durante esta fase;
- asignar `ownerTaskId` durante esta fase;
- usar `owner` con el ID de la propia capacidad;
- crear capacidades llamadas `CRUD`, `gestión completa`, `administración
  completa` o equivalentes;
- asignar el mismo comportamiento a varios propietarios;
- inventar reglas para completar el mapa.

## Entregables

Crear o actualizar:

- `task-planning/capability-map.json`;
- `task-planning/project-state.json`.

Al terminar correctamente:

- `capability-map.json.status = generated`;
- `capabilitiesMapped = capability-map.json.capabilities.length`;
- `capabilityMapValidated = false`.

## Condición de salida

La fase termina cuando:

- todas las capacidades MVP están registradas;
- cada capacidad representa un solo comportamiento observable;
- cada capacidad tiene un propietario lógico válido;
- `ownerEpicId` y `ownerTaskId` son `null`;
- todos los consumidores tienen proveedor;
- no existen duplicaciones;
- no existen referencias de requisitos o decisiones inexistentes;
- no existen capacidades no confirmadas;
- no existen ciclos entre capacidades.

Entonces:

- cambiar fase a `epic_generation`;
- mantener estado `in_progress`.

## Condición de bloqueo

Regresar a:

- `construction_strategy` si falta un incremento o prerrequisito;
- `blueprint_consolidation` si el catálogo de requisitos es incorrecto;
- `decision_resolution` si falta una decisión material;
- `blocked` si el conflicto no puede formularse como decisión concreta.

---

# Fase 7 — Epic Generation

## Objetivo

Agrupar las capacidades planificadas en épicas ordenadas y asignar exactamente
una épica propietaria a cada capacidad.

## Estado inicial

- fase: `epic_generation`
- estado: `in_progress`

## Entradas permitidas

- blueprint resuelto;
- `task-planning/requirements.json`;
- decisiones confirmadas;
- estrategia de construcción;
- mapa de capacidades.

## Acciones obligatorias

1. Agrupar capacidades que contribuyen a un mismo resultado amplio.
2. Alinear las épicas con los incrementos de construcción.
3. Para cada épica registrar en `epic-plan.json`:

   - `id`;
   - `title`;
   - `file`;
   - `incrementId`;
   - `dependencyIds`;
   - `capabilityIds`;
   - `requirementIds`;
   - `decisionIds`;
   - `taskIds`;
   - `decomposed`.

4. Inicializar:
   - `taskIds = []`;
   - `decomposed = false`.
5. Asignar exactamente un `ownerEpicId` a cada capacidad `planned`.
6. Confirmar que `ownerEpicId` coincide con la épica que incluye la capacidad.
7. Confirmar igualdad exacta entre:
   - capacidades `planned` del mapa;
   - unión de `capabilityIds` de todas las épicas.
8. Confirmar que no existen:
   - capacidades faltantes;
   - capacidades duplicadas entre épicas;
   - capacidades no planificadas reclamadas por una épica.
9. Definir dependencias entre épicas únicamente por resultados necesarios.
10. Confirmar que no existen ciclos.
11. Crear un archivo por épica dentro de `task-planning/epics/`.
12. Generar `task-planning/epic-plan.json`.
13. Actualizar el estado del proyecto desde los artefactos reales.

## Reglas obligatorias

- Una épica puede contener varias capacidades relacionadas.
- Una épica no es una tarea de DevFlow.
- No se aplican criterios de atomicidad de tarea a una épica.
- Cada capacidad `planned` pertenece a exactamente una épica propietaria.
- Una épica consumidora no puede reclamar propiedad de una capacidad ajena.
- Las capacidades `preexisting` o `external` no requieren una épica propietaria,
  salvo que exista trabajo planificado para integrarlas.
- Toda referencia a requisito debe existir en `requirements.json`.
- Toda referencia a decisión debe existir en `decisions.json`.
- El índice y los archivos deben coincidir exactamente.

## Acciones prohibidas

- crear archivos dentro de `task-planning/tasks/`;
- asignar `ownerTaskId`;
- marcar una épica como descompuesta;
- declarar que una épica es indivisible;
- publicar una épica como tarea ejecutable;
- duplicar propiedad de capacidades.

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
- todas las capacidades `planned` mantienen `ownerTaskId = null`.

## Condición de salida

La fase termina cuando:

- la unión de capacidades de las épicas coincide exactamente con las capacidades
  `planned`;
- cada capacidad tiene una sola épica propietaria;
- todos los requisitos MVP están relacionados con al menos una épica;
- las dependencias son válidas;
- no existen ciclos;
- ninguna épica contiene decisiones bloqueantes ocultas;
- el índice coincide con los archivos reales.

Entonces:

- cambiar fase a `epic_decomposition`;
- mantener estado `in_progress`;
- establecer la primera épica pendiente como `currentEpicId`.

## Condición de bloqueo

Regresar a:

- `capability_mapping` si existe duplicación, capacidad demasiado amplia o falta
  de propiedad;
- `construction_strategy` si el orden de construcción es inviable;
- `blueprint_consolidation` si existe un requisito inválido;
- `decision_resolution` si aparece una decisión material.

---

# Fase 8 — Epic Decomposition

## Objetivo

Descomponer cada épica, una por una, en solicitudes de tareas ejecutables por un
solo ciclo de DevFlow y asignar una tarea propietaria a cada capacidad
planificada.

## Estado inicial

- fase: `epic_decomposition`
- estado: `in_progress`

## Precondiciones

Deben cumplirse todas:

- blueprint resuelto aprobado;
- `requirements.json.status = generated`;
- estrategia de construcción existente;
- `capability-map.json.status = generated`;
- `epic-plan.json.status = generated`;
- cero decisiones bloqueantes pendientes;
- cero ciclos entre épicas.

## Entradas permitidas

- una sola épica seleccionada mediante `currentEpicId`;
- capacidades propiedad de esa épica;
- capacidades proveedoras consumidas;
- tareas ya generadas de épicas anteriores;
- `requirements.json`;
- blueprint resuelto;
- decisiones confirmadas;
- estrategia de construcción.

## Proceso obligatorio por épica

1. Leer la épica actual y sus dependencias necesarias.
2. Identificar los resultados verificables que la componen.
3. Ordenar capacidades creadas y consumidas.
4. Proponer internamente tareas candidatas.
5. Aplicar la prueba de separación.
6. Asignar a cada tarea funcional o habilitadora exactamente una capacidad
   principal en `createsCapabilityIds`.
7. Registrar capacidades adicionales únicamente en `consumesCapabilityIds`.
8. Generar el archivo Markdown de cada tarea.
9. Registrar la tarea en `task-plan.json`.
10. Asignar `ownerTaskId` a la capacidad creada.
11. Agregar el ID de la tarea a `epic-plan.json.epics[].taskIds`.
12. Verificar cobertura completa de la épica.
13. Verificar que ninguna capacidad quedó sin tarea propietaria.
14. Verificar que ninguna capacidad fue creada por dos tareas.
15. Marcar la épica como `decomposed = true`.
16. Actualizar `epicsDecomposed`.
17. Avanzar a la siguiente épica pendiente.

No se deben descomponer todas las épicas como una sola operación mental.

## Estructura obligatoria en `task-plan.json`

Cada tarea debe registrar:

- `id`;
- `title`;
- `file`;
- `epicId`;
- `type`;
- `dependencyIds`;
- `createsCapabilityIds`;
- `consumesCapabilityIds`;
- `requirementCoverage`.

Cada entrada de `requirementCoverage` debe contener:

- `requirementId`;
- `scopeItemIds`;
- `acceptanceCriterionIds`;
- `behaviorIds`.

## Estructura obligatoria del Markdown

Cada archivo de tarea debe contener:

- `## Objetivo`;
- `## Alcance`;
- `## Fuera de alcance`;
- `## Criterios de aceptación`;
- `## Pruebas`;
- capacidades creadas;
- capacidades consumidas.

Cada elemento de alcance utilizado para cobertura debe tener ID estable:

```text
SCOPE-001
SCOPE-002
```

Cada criterio utilizado para cobertura debe tener ID estable:

```text
AC-001
AC-002
```

Los IDs declarados en `task-plan.json` deben existir literalmente en el archivo
Markdown correspondiente.

## Requisitos de cada tarea

Cada tarea debe:

1. Tener un único objetivo principal.
2. Producir un único resultado principal observable.
3. Poder aprobarse o rechazarse completamente.
4. Declarar contexto.
5. Declarar alcance.
6. Declarar fuera de alcance.
7. Incluir criterios de aceptación binarios.
8. Incluir escenarios de error.
9. Incluir sus propias pruebas.
10. Declarar dependencias reales.
11. Identificar la capacidad principal que crea.
12. Identificar capacidades que consume.
13. Registrar cobertura estructurada de requisitos.
14. Evitar detalles internos dependientes del repositorio.
15. Ser suficientemente pequeña para un ciclo de DevFlow.

## Prueba obligatoria de separación

Antes de publicar una tarea, intentar dividirla al menos en dos resultados.

Debe dividirse cuando ambas partes pueden tener independientemente:

- objetivo;
- alcance;
- fuera de alcance;
- criterios;
- pruebas;
- resultado verificable.

No se divide artificialmente cuando una parte no produce un resultado observable
o no puede aceptarse por separado.

La prueba es interna. No se agrega `Indivisibility Justification`.

## Condiciones de rechazo

Una tarea es inválida cuando:

- puede aprobarse parcialmente;
- produce dos o más resultados independientes;
- crea más de una capacidad principal;
- mezcla infraestructura y negocio sin necesidad;
- mezcla modelo, persistencia, HTTP e integración cuando pueden verificarse por
  separado;
- incluye varias integraciones independientes;
- requiere una decisión no confirmada;
- obliga al Supervisor a inventar reglas;
- consume una capacidad creada por una tarea posterior;
- duplica una capacidad;
- reclama un requisito fuera de alcance;
- reclama un requisito sin `SCOPE-*` y `AC-*`;
- usa términos subjetivos sin condición verificable;
- define el esquema global por conveniencia;
- concentra todas las pruebas al final.

## Propiedad de capacidades

Para cada capacidad `planned` debe cumplirse:

```text
exactamente una tarea la incluye en createsCapabilityIds
=
capability-map.json.ownerTaskId
```

Una tarea funcional o habilitadora debe crear exactamente una capacidad
principal.

Otras tareas pueden consumirla, pero no volver a implementarla.

Cada capacidad consumida debe:

1. crearse en la misma tarea; o
2. existir por una dependencia anterior; o
3. tener `implementationKind = preexisting`; o
4. tener `implementationKind = external`.

## Persistencia incremental

No crear una tarea inicial de esquema global completo.

Cada capacidad introduce únicamente los modelos, campos, relaciones, índices y
migraciones que necesita para su resultado verificable.

## Pruebas junto con la capacidad

Cada tarea funcional incluye sus pruebas.

Una tarea final de integración no puede:

- probar por primera vez capacidades individuales;
- compensar pruebas omitidas;
- concentrar toda la cobertura.

## Acciones prohibidas

- modificar decisiones confirmadas;
- cambiar silenciosamente el alcance de una épica;
- crear capacidades nuevas sin regresar a `capability_mapping`;
- crear tareas puramente temáticas;
- publicar épicas como tareas;
- marcar el proceso como terminado;
- ejecutar todavía el validador final.

## Entregables

Crear o actualizar:

- `task-planning/tasks/*.md`;
- `task-planning/task-plan.json`;
- `task-planning/epic-plan.json`;
- `task-planning/capability-map.json`;
- `task-planning/project-state.json`.

Al crear la primera tarea:

- `task-plan.json.status = in_progress`.

## Condición de permanencia

Mientras exista una épica pendiente:

- mantener fase `epic_decomposition`;
- mantener estado `in_progress`;
- actualizar `currentEpicId`.

## Condición de salida

Cuando todas las épicas estén descompuestas:

- cada capacidad `planned` tiene un `ownerTaskId`;
- cada capacidad `planned` aparece en `createsCapabilityIds` de exactamente una
  tarea;
- cada épica contiene todos sus `taskIds`;
- todas las épicas tienen `decomposed = true`;
- el índice coincide con los archivos;
- los contadores fueron recalculados desde los artefactos;

entonces:

- cambiar fase a `plan_validation`;
- mantener estado `in_progress`;
- establecer `currentEpicId = null`;
- mantener `planValidated = false`;
- mantener `planPublished = false`.

## Condición de bloqueo

Regresar a:

- `epic_generation` si la épica está mal delimitada;
- `capability_mapping` si existe propiedad duplicada o capacidad faltante;
- `construction_strategy` si el orden es inviable;
- `blueprint_consolidation` si un requisito es inválido;
- `decision_resolution` si aparece una decisión material.

---

# Regla transversal — Sincronización de artefactos

Los artefactos y `task-planning/project-state.json` deben permanecer
sincronizados.

Después de crear o modificar cualquiera de estos artefactos:

- `task-planning/SOFTWARE-BLUEPRINT-RESOLVED.md`;
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
mvpRequirementsDetected =
requirements.json requirements con scope = mvp

mvpFunctionsDetected =
mvpBehaviorsDetected + unresolvedFunctions MVP

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
4. `task-planning/requirements.json`;
5. `task-planning/construction-strategy.md`;
6. `task-planning/capability-map.json`;
7. `task-planning/epic-plan.json`;
8. todos los archivos dentro de `task-planning/epics/`;
9. `task-planning/task-plan.json`;
10. todos los archivos dentro de `task-planning/tasks/`;
11. `task-planning/tools/validate-plan.mjs`.

La validación debe tratar el plan como producido por un tercero.

## Preparación obligatoria

Antes de ejecutar el validador:

1. recalcular todos los contadores desde los artefactos;
2. persistir esos contadores en `project-state.json`;
3. confirmar que:
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
   - `requirements.json.status = validated`;
   - `capability-map.json.status = validated`;
   - `epic-plan.json.status = validated`;
   - `task-plan.json.status = validated`;
3. actualizar en `project-state.json`:
   - `progress.planValidated = true`;
   - `progress.planPublished = false`;
   - `progress.capabilityMapValidated = true`;
   - contadores reales;
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

## Si el usuario aprueba

Actualizar, en este orden:

1. `task-plan.json.status = published`.
2. `epic-plan.json.status = published`.
3. Registrar la aprobación en `approvals.finalPlan`.
4. Establecer:
   - `progress.planPublished = true`;
   - `progress.finalPlanApproved = true`;
   - `artifacts.taskPlan.status = published`;
   - `artifacts.epicPlan.status = published`.
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
