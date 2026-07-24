# Next Task

Este template instala el estado y los contratos del dominio de ejecución utilizado por `Next Task Agent`.

## Ubicación en el proyecto

El contenido se copia a:

```text
.devflow/execution/
├── README.md
├── execution-state.json
├── execution-state.schema.json
├── selection.json
├── task-selection.schema.json
└── runs/
```

El nombre del template es `next-task` porque corresponde al agente que inaugura esta capacidad. La ubicación runtime se llama `execution` porque sus archivos serán compartidos posteriormente por el scheduler, el ejecutor, el reviewer y el orquestador.

## Entradas canónicas

`Next Task Agent` debe consumir únicamente:

- `.devflow/task-planner/project-state.json`
- `.devflow/task-planner/readiness.json`
- `.devflow/task-planner/epic-plan.json`
- `.devflow/task-planner/task-plan.json`
- `.devflow/task-planner/capability-map.json`
- `.devflow/execution/execution-state.json`

El agente no debe modificar ninguno de esos archivos.

## Salida canónica

El agente escribe exclusivamente:

- `.devflow/execution/selection.json`

El orquestador es responsable de validar la selección, reservar la tarea, crear el run, copiar la selección como evidencia y actualizar `execution-state.json`.

## Plan listo

El plan se considera listo solamente cuando se cumplen todas estas condiciones:

1. `project-state.json` indica que el plan final está aprobado.
2. `progress.planValidated` es `true`.
3. `progress.planPublished` es `true`.
4. `progress.finalPlanApproved` es `true`.
5. `readiness.status` es `passed`.
6. `readiness.summary.errors` es `0` o no existe porque el validador no reportó errores.
7. Los hashes de `epic-plan.json`, `task-plan.json` y `capability-map.json` existen y son válidos.

Si el plan todavía no está listo, la clasificación debe ser `PLAN_NOT_READY`.

## Interpretación del estado de una tarea

Una tarea presente en `task-plan.json` y ausente de `execution-state.json` se interpreta como:

- `status: pending`
- `attemptCount: 0`
- `maxAttempts: policy.defaultMaxAttempts`

Una entrada en `execution-state.json` cuyo `taskId` no existe en `task-plan.json` es un conflicto de estado.

Los identificadores `TASK-6` y `TASK-006` representan el mismo valor numérico. Si ambos aparecen en el plan o en el estado, la entrada es inválida.

## Tarea disponible

Una tarea está disponible cuando:

1. Existe en `task-plan.json`.
2. Su épica existe en `epic-plan.json`.
3. La épica tiene una `executionWave` válida.
4. Todas sus dependencias existen y están `completed`.
5. Su estado efectivo es `pending`, `interrupted` o `failed_retryable`.
6. `attemptCount` es menor que `maxAttempts`.
7. No tiene un run activo, una reserva activa ni un bloqueo.
8. La capacidad máxima de concurrencia no está agotada.

`capability-map.json` se utiliza para comprobar consistencia del plan y para registrar su hash en la selección. No representa disponibilidad de runtime y no sustituye a `dependencyIds`.

## Política de selección

Las tareas disponibles se ordenan de forma determinista:

1. Menor `executionWave` de la épica asociada.
2. Menor valor numérico del identificador `TASK-*`.

La primera tarea es seleccionada. `unlocksTaskIds` es informativo y no modifica el orden.

## Clasificaciones

- `NOT_EVALUATED`: valor inicial del archivo antes de ejecutar el agente.
- `TASK_SELECTED`: se seleccionó exactamente una tarea.
- `NO_READY_TASK`: el plan es válido, pero no existe una tarea disponible o la concurrencia está agotada.
- `PLAN_NOT_READY`: el plan aún no está validado, publicado y aprobado.
- `INPUT_INVALID`: un archivo requerido es inválido, incompleto o ambiguo.
- `STATE_CONFLICT`: los archivos son válidos individualmente, pero se contradicen.

## Control de concurrencia

`selection.json` no reserva una tarea. El orquestador debe comparar `sourceSnapshot.executionStateRevision` contra la revisión actual antes de reservarla. Si cambió, debe descartar la selección y evaluar nuevamente.

## Propiedad de los archivos

- `execution-state.json`: mutable únicamente por el orquestador.
- `selection.json`: reemplazable únicamente por `Next Task Agent`.
- `runs/`: creado y administrado únicamente por el orquestador.
- `*.schema.json`: contratos inmutables durante una ejecución.
