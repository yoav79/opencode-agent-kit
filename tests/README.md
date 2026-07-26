# Tests

Las suites actuales son deterministas: prueban scripts, herramientas y
contratos de archivos sin iniciar OpenCode ni depender de un modelo.

## Suites

| Suite | Cobertura | Fuera de alcance |
|-------|-----------|------------------|
| `test-scripts.sh` | Instalación por symlinks, creación de scaffold y desinstalación | Ejecución de agentes, slash commands y permisos en runtime |
| `test-software-architect-tools.sh` | Validator, migración v1 a v2, estados reproducibles, publish | Entrevistas, delegación con `task`, gates humanos y promoción realizada por OpenCode |
| `test-task-planner-tools` (`node --test`) | 6 suites: permisos (`task: allow`), timestamps, validación de plan, épicas, capacidades, epic-decomposition | Planificación completa con agente, decisiones humanas, interacción con blueprint |
| `test-next-task-tools` (`node --test` + `node --check`) | Selección real de la siguiente tarea, dependencias, waves, concurrencia lógica, IDs descriptivos/ambiguos, gate `validate-next-task`, no mutación de `execution-state.json` | Ejecución de agentes, slash commands de OpenCode, cobertura E2E |
| `test-execution-tools` (`node --test`) | Motor transaccional: preparación de runs, concurrencia, journal, locks, recuperación ante fallos, idempotencia y migración v1→v2 de `execution-state.json` | Ejecución real de tareas, integración con OpenCode, gates humanos |
| `test-agent-contracts` (`node --test`) | Contratos de permisos: `context-builder` como subagente, denylist de lectura sensible, uso de inspección determinista y resolución canónica de `/build-next-task-context` | Comportamiento runtime de los agentes, delegación con `task`, conversaciones |

## Cobertura de runtime

Aunque las suites no ejecutan OpenCode, cubren invariantes del runtime:

- **Permisos de agentes:** se verifica que `context-builder.md` tenga
  `mode: subagent`, no pueda editar `execution-state.json` ni `selection.json`,
  no tenga permiso `mkdir`, bloquee patrones sensibles de lectura, use la tool
  determinista `inspect-repository-context.mjs`, y que solo edite
  `execution-context.json` y `execution-prompt.md`.
- **Comandos:** `build-next-task-context.md` no contiene instrucciones para
  ejecutar o referenciar `prepare-task-run`, y resuelve el intento solo desde
  `reservation.token` o `activeRunId`.
- **Motor de transiciones:** `execution-transition-engine.mjs` se prueba con
  reserva normal, stale selection, idempotencia, concurrencia real entre
  procesos, fault injection (fallo tras journal, tras evidencia, tras estado),
  recuperación de journal, locks abandonados y límite de intentos.
- **Selector determinista:** `select-next-task.mjs` se prueba con estados
  `paused` y `completed`, dependencias satisfechas o pendientes, ciclos,
  límite de concurrencia, IDs descriptivos y ambigüedades numéricas.
- **CLI real:** `prepare-task-run.mjs` se prueba como comando CLI con
  fixtures de directorio completo.
- **Validación estructural:** `scripts/validate.sh` verifica que toda
  herramienta runtime tenga su ruta en `required_paths`, que todo frontmatter
  sea válido, y que ningún archivo `.test.mjs` quede fuera de `make test`.

## Lo que NO cubren las suites

- Conversaciones completas de OpenCode con modelo.
- Ejecución de agentes, subagentes o delegación con `task`.
- Slash commands en runtime (solo se verifican contratos de archivos).
- Gates humanos, aprobación de fases o promoción de drafts.
- Comportamiento de OpenCode con configuraciones reales.
- Pruebas E2E del pipeline Diseño → Planificación → Ejecución.

Una futura suite de runtime debe vivir separada, por ejemplo en
`test-opencode-smoke.sh`, y debe instalar la configuración en un entorno
temporal, iniciar OpenCode y verificar comandos, permisos, subagentes y
gates humanos. Esa suite no debe presentarse como determinista ni mezclarse
con las pruebas actuales.

## Fixtures

Los archivos bajo `fixtures/software-architect/` son estados de entrada para
herramientas deterministas. No simulan una conversación ni una sesión de
OpenCode. Su propósito es reproducir casos válidos, inválidos y migrables sin
servicios externos.

## Ejecución

```bash
make test
```

También pueden ejecutarse por separado:

```bash
make test-repository
make test-software-architect-tools
make test-task-planner-tools
make test-next-task-tools
make test-execution-tools
make test-agent-contracts
```
