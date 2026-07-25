# Tests

Las suites actuales son deterministas: prueban scripts, herramientas y
contratos de archivos sin iniciar OpenCode ni depender de un modelo.

## Suites

| Suite | Cobertura | Fuera de alcance |
|-------|-----------|------------------|
| `test-scripts.sh` | Instalación por symlinks, creación de scaffold y desinstalación | Ejecución de agentes, slash commands y permisos en runtime |
| `test-software-architect-tools.sh` | Validator, migración v1 a v2 y estados reproducibles | Entrevistas, delegación con `task`, gates humanos y promoción realizada por OpenCode |

## Fixtures

Los archivos bajo `fixtures/software-architect/` son estados de entrada para
herramientas deterministas. No simulan una conversación ni una sesión de
OpenCode. Su propósito es reproducir casos válidos, inválidos y migrables sin
servicios externos.

## Runtime de OpenCode

El repositorio todavía no incluye una prueba E2E de OpenCode. Una futura suite
de runtime debe vivir separada, por ejemplo en `test-opencode-smoke.sh`, y debe
instalar la configuración en un entorno temporal, iniciar OpenCode y verificar
comandos, permisos, subagentes y gates humanos. Esa suite no debe presentarse
como determinista ni mezclarse con las pruebas actuales.

## Ejecución

```bash
make test
```

También pueden ejecutarse por separado:

```bash
make test-repository
make test-software-architect-tools
```
