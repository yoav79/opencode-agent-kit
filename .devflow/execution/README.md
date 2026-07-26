# Execution Runtime

Este template instala el estado mutable de ejecución, el motor transaccional
de ejecución y las herramientas de orquestación.

## Runtime instalado por /init-execution

- `.devflow/execution/README.md`
- `.devflow/execution/execution-state.json`
- `.devflow/execution/execution-state.schema.json`
- `.devflow/execution/tools/execution-contract-helpers.mjs`
- `.devflow/execution/tools/execution-transition-engine.mjs`
- `.devflow/execution/tools/prepare-task-run.mjs`
- `.devflow/execution/tools/touch-execution-state.mjs`

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

## Archivos

### `execution-state.json`

Estado canónico y mutable de la ejecución. Es la única fuente de verdad para el
progreso de tareas, reservas, intentos y bloqueos. Solo el motor de transiciones
debe modificarlo.

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

En caso de crash, el motor de transiciones detecta el journal y completa,
revierte o declara conflicto según una matriz de recuperación documentada.

### `lock/`

Lock exclusivo entre procesos implementado mediante `mkdir` atómico.
Contiene metadata (PID, host, timestamp) para detectar locks abandonados.

### `tools/execution-contract-helpers.mjs`

Módulo de utilidades puras y compartidas sin efectos laterales:

- `isObject`, `isPositiveInteger`, `isNonNegativeInteger`, `isDateTimeOrNull`
- `sameKeys`, `issue`, `pushUniqueIssue`
- `loadJson`
- `validateExecutionStateShape`, `validateTaskCollection`
- `artifactDigest`
- Constantes de paths (`FILES`, `EXECUTION_ENGINE_FILES`)
- Constantes de keys y statuses

No escribe estado, no toma locks, no selecciona tareas, no ejecuta transiciones.

### `tools/execution-transition-engine.mjs`

Dueño único de las mutaciones de `execution-state.json`. Secuencia transaccional:

1. Carga y valida la selección
2. Adquiere lock exclusivo del runtime
3. Bajo lock: relee estado, selección, journal, evidencia
4. Valida revisión, estado reservable, intentos, conflictos
5. Detecta y recupera transiciones parciales vía journal
6. Obtiene timestamp oficial una sola vez
7. Calcula nuevo estado en memoria
8. Escribe journal de intención (fase: started)
9. Escribe evidencia (temp + rename atómico)
10. Escribe estado (temp + rename atómico)
11. Limpia journal
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
- `STALE_SELECTION`: la revisión de la selección ya no corresponde
- `RUN_CONFLICT`: la tarea no es reservable o hay evidencia contradictoria

## Propiedad de los archivos

- `execution-state.json`: mutable únicamente por `execution-transition-engine.mjs`.
- `transition-journal.json`: sidecar transitorio, único responsable el motor.
- `lock/`: directorio de lock, único responsable el motor.
- `*.schema.json`: contratos inmutables durante una ejecución.
- `runs/`: creado y administrado únicamente por el motor.
- `tools/prepare-task-run.mjs`: wrapper CLI, sin lógica de negocio.
- `tools/execution-transition-engine.mjs`: motor transaccional, único autorizado para mutar el estado.
- `tools/execution-contract-helpers.mjs`: utilidades puras, sin efectos laterales.
- `tools/touch-execution-state.mjs`: herramienta de inicialización, no usada por el motor.
