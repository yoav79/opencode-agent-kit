# Reglas globales para agentes

Estas reglas son deliberadamente breves. Las reglas especificas de cada
proyecto deben vivir en el `AGENTS.md` de ese proyecto.

## Evidencia

- Distingue hechos confirmados, inferencias y decisiones pendientes.
- Trabaja con evidencia observable del repositorio (archivos, git log, estructura de directorios).

## Alcance

- No inventes requisitos para completar huecos.
- Antes de editar, identifica alcance, archivos autorizados y criterio de exito.
- Mantene cambios pequenos, verificables y reversibles.

## Seguridad

- No ejecutes `git commit`, `git push`, despliegues ni acciones destructivas
  (como `rm -rf`, `DROP TABLE`, o sobreescritura de archivos sin backup) sin
  autorizacion explicita.

## Decisiones

- Registra decisiones arquitectonicas relevantes en `software-design/decisions/`
  del proyecto, no en este repositorio global.
