# Contributing

## Cambios a agentes

- Explica el rol, autoridad y limites del agente.
- No agregues un modelo obligatorio salvo que exista una razon comprobada.
- Define permisos por minimo privilegio.
- No dupliques instrucciones que pertenecen a una skill o regla compartida.

## Cambios a skills

- Usa nombres lowercase kebab-case.
- Haz que `name` coincida con el directorio.
- Describe con precision cuando debe cargarse.
- Conserva archivos de apoyo dentro del directorio de la skill.

## Validacion

Ejecuta antes de abrir un pull request:

```bash
./scripts/validate.sh
./scripts/install.sh --dry-run
```
