# Execution Runtime

Este template instala el estado mutable de ejecución, el motor transaccional
de ejecución y las herramientas de orquestación.

## Runtime instalado por /init-execution

- `.devflow/execution/README.md`
- `.devflow/execution/execution-state.json`
- `.devflow/execution/execution-state.schema.json`
- `.devflow/execution/transition-journal.schema.json`
- `.devflow/execution/tools/execution-contract-helpers.mjs`
- `.devflow/execution/tools/execution-transition-engine.mjs`
- `.devflow/execution/tools/migrate-execution-state-v1-to-v2.mjs`
- `.devflow/execution/tools/prepare-task-run.mjs`
- `.devflow/execution/tools/touch-execution-state.mjs`

## Dependencia compartida instalada por /init-execution

- `.devflow/shared/tools/devflow-runtime-helpers.mjs`

## Dependencias instaladas por /init-next-task

`prepare-task-run.mjs` no debe ejecutarse hasta que existan estas rutas:

- `.devflow/execution/selection.json`
- `.devflow/execution/task-selection.schema.json`
- `.devflow/execution/tools/select-next-task.mjs`
- `.devflow/execution/tools/validate-next-task.mjs`

## Ubicación en el proyecto

El contenido se copia a:

```text
.devflow/execution/
├── README.md
├── execution-state.json
├── execution-state.schema.json
├── transition-journal.schema.json
├── runs/
├── transition-journal.json        (sidecar, existe solo durante una transición)
├── lock/                          (lock exclusivo entre procesos)
└── tools/
    ├── execution-contract-helpers.mjs
    ├── execution-transition-engine.mjs
    ├── prepare-task-run.mjs
    └── touch-execution-state.mjs
```

El directorio `runs/` contiene la evidencia de cada intento de ejecución.
`transition-journal.json` y `lock/` son sidecars operativos: no se instalan en
el scaffold inicial, aparecen solo durante la ejecución.

El helper puro compartido vive fuera de `.devflow/execution/` para que tanto
`next-task` como `execution` puedan instalarlo explícitamente sin depender del
orden de inicialización:

```text
.devflow/shared/
└── tools/
    └── devflow-runtime-helpers.mjs
```

## Archivos

### `execution-state.json`

Estado canónico y mutable de la ejecución. Es la única fuente de verdad para el
progreso de tareas, reservas, intentos y bloqueos. Solo el motor de transiciones
debe modificarlo.

El owner contractual actual es:

- `schemaVersion = 2`
- `engine.name = devflow-execution`
- `engine.contractVersion = 2.0`

Los proyectos legacy con `schemaVersion = 1` y `engine.name = next-task` no se
editan silenciosamente: deben migrarse con
`tools/migrate-execution-state-v1-to-v2.mjs`.

Campos principales definidos en `execution-state.schema.json`.

### `execution-state.schema.json`

Contrato JSON Schema Draft 2020-12 que valida la estructura de
`execution-state.json`. Inmutable durante una ejecución.

### `transition-journal.json` (sidecar)

Persiste la intención de una transición antes de la mutación definitiva.
Existe solo durante una transición incompleta. Contiene:

- versión del contrato
- tipo de transición (prepare_task_run)
- identificador de tarea e intento
- revisión esperada y revisión objetivo
- hash verificable de la selección
- fase de la transición (started / completed)
- timestamp oficial
- artefactos esperados

El journal se valida como entrada no confiable. `runPath` debe coincidir
exactamente con el path canónico derivado de `taskId` + `attempt`, y la
recuperación solo avanza cuando digest, evidencia, revisión y estado son
coherentes.

### `transition-journal.schema.json`

Contrato formal del sidecar `transition-journal.json`. Fija tipos, nombres de
campos, `additionalProperties: false`, patrones básicos y valores conocidos.
Las relaciones semánticas que JSON Schema no puede expresar de forma portable
(`targetRevision = expectedRevision + 1`, `runPath` canónico y
`expectedArtifacts` exactos) se verifican además en
`execution-contract-helpers.mjs`.

### `lock/`

Lock exclusivo entre procesos implementado mediante `mkdir` atómico.
Contiene metadata (PID, host, timestamp) para detectar locks abandonados.

### `.devflow/shared/tools/devflow-runtime-helpers.mjs`

Fuente compartida de helpers puros usados por `next-task` y `execution`:

- validación de JSON y estructuras canónicas
- IDs de tareas y orden determinista
- hashes canónicos
- validación de `execution-state.json`, `selection.json` y journals
- construcción de issues y resolución de `runPath`

No escribe estado, no toma locks, no selecciona tareas, no ejecuta transiciones.

### `tools/execution-contract-helpers.mjs`

Wrapper de `execution` sobre el helper compartido. Además resuelve la solicitud
canónica usada por `/build-next-task-context`:

- usa `reservation.token` cuando el estado es `reserved`
- usa `activeRunId` cuando el estado es `running`, `waiting_human` o
  `waiting_external`
- valida que el token permanezca dentro de `.devflow/execution/runs`
- exige que la evidencia del run coincida con la selección global actual

No muta estado.

### `tools/execution-transition-engine.mjs`

Dueño único de las mutaciones de `execution-state.json`. Secuencia transaccional:

1. Carga y valida la selección
2. Adquiere lock exclusivo del runtime
3. Bajo lock: relee estado, selección, journal, evidencia
4. Valida revisión, estado reservable, intentos, conflictos
5. Detecta y recupera transiciones parciales vía journal validado
6. Obtiene timestamp oficial una sola vez
7. Calcula nuevo estado en memoria
8. Escribe journal de intención (temp + fsync + rename, fase: started)
9. Escribe evidencia (temp + rename atómico)
10. Escribe estado (temp + rename atómico)
11. Limpia journal solo al final de una recuperación o transición exitosa
12. Libera lock

Exporta `prepareTaskRun(options)`.

### `tools/prepare-task-run.mjs`

Wrapper CLI fino. Solo:
1. Parsea argumentos (`--root`, `--attempt`)
2. Verifica que estén instalados los artefactos obligatorios de `next-task`
3. Invoca `execution-transition-engine.mjs`
4. Imprime resultado JSON canónico en stdout
5. Mapea errores a exit codes

No contiene lógica de reserva, validación ni persistencia.

### `tools/touch-execution-state.mjs`

Herramienta determinista para inicialización de timestamps.
Usada únicamente por `/init-execution`. El motor de transiciones
incorpora timestamps directamente sin llamar a esta herramienta.

## Resultado CLI canónico

`prepare-task-run.mjs` produce JSON estable:

```json
{
  "classification": "RUN_PREPARED",
  "taskId": "TASK-006",
  "attempt": 1,
  "runPath": ".devflow/execution/runs/TASK-006/attempt-01",
  "previousRevision": 4,
  "newRevision": 5,
  "recovered": false,
  "idempotent": false
}
```

Clasificaciones:
- `RUN_PREPARED`: transición exitosa
- `IDEMPOTENT`: mismo estado ya preparado, no se modificó nada
- `RECOVERED`: transición completada desde un journal pendiente
- `SELECTION_INVALID`: `selection.json` no demuestra una selección canónica y verificable
- `STALE_SELECTION`: la revisión de la selección ya no corresponde
- `RUN_CONFLICT`: la tarea no es reservable o hay evidencia contradictoria
- `JOURNAL_INVALID`: el journal existe pero no cumple el contrato
- `JOURNAL_CONFLICT`: el journal es válido pero ya no se puede reconciliar de forma segura
- `LOCK_INVALID`: existe un lock incompleto o corrupto

## Reglas de Path

- Todo `selectedTaskId` y todo `journal.taskId` debe cumplir el patrón
  `TASK-[A-Z0-9][A-Z0-9_-]*`.
- El motor rechaza `/`, `\\`, `..`, controles y espacios en IDs antes de
  construir cualquier ruta.
- El helper canónico deriva `runPath` desde `taskId` + `attempt`, resuelve el
  absoluto y verifica que permanezca dentro de
  `.devflow/execution/runs/`.
- `journal.runPath` nunca se trata como ruta confiable por sí solo.

## Matriz de Recuperación

| Journal | Evidencia | Estado | Acción |
|---|---|---|---|
| válido | ausente | revisión esperada y tarea reservable | reiniciar desde la intención verificada |
| válido | válida | estado todavía no actualizado y reservable | completar `execution-state.json` |
| válido | válida | estado ya refleja exactamente la reserva | responder `IDEMPOTENT` y limpiar journal |
| válido | inválida | cualquiera | `RUN_CONFLICT`, conservar journal |
| válido | ausente | estado ya reservado o revisión incompatible | `JOURNAL_CONFLICT`, conservar journal |
| válido | válida | tarea terminal (`completed`/`cancelled`/`failed_permanent`) | `RUN_CONFLICT`, conservar journal |
| inválido | cualquiera | cualquiera | `JOURNAL_INVALID`, conservar journal |
| inexistente | evidencia huérfana | cualquiera | no se recupera automáticamente |

## Protocolo de Lock

- Adquisición por `mkdir` atómico de `.devflow/execution/lock/`.
- Propiedad del lock en `lock/owner.json` escrita vía temp + `rename`.
- Si falta la metadata recién creado el directorio, se respeta una ventana corta
  de inicialización y no se borra de inmediato.
- Si el `host` es remoto, el motor no usa `process.kill(pid, 0)` y espera hasta
  timeout.
- Si el `host` es local y el PID sigue vivo, la edad del lock no lo vuelve stale.
- Solo un lock local con PID inexistente se recupera automáticamente.
- Clasificaciones: `LOCK_TIMEOUT`, `LOCK_INVALID`, `LOCK_FAILED`.

## Propiedad de los archivos

- `execution-state.json`: mutable únicamente por `execution-transition-engine.mjs`.
- `transition-journal.json`: sidecar transitorio, único responsable el motor.
- `lock/`: directorio de lock, único responsable el motor.
- `*.schema.json`: contratos inmutables durante una ejecución.
- `runs/`: creado y administrado únicamente por el motor.
- `.devflow/shared/tools/devflow-runtime-helpers.mjs`: helper puro compartido, sin efectos laterales.
- `tools/prepare-task-run.mjs`: wrapper CLI, sin lógica de negocio.
- `tools/execution-transition-engine.mjs`: motor transaccional, único autorizado para mutar el estado.
- `tools/execution-contract-helpers.mjs`: adaptador de `execution` para contratos y resolución de contextos.
- `tools/touch-execution-state.mjs`: herramienta de inicialización, no usada por el motor.
