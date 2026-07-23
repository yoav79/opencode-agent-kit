# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/) y el proyecto adherencia a [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-07-23

### Agregado

#### Agentes

- **`software-architect`** — Agente principal que convierte ideas incompletas en blueprints coherentes, trazables e implementables. Workflow de 6 fases con delegacion a subagentes.
- **`requirements-analyst`** — Subagente de solo lectura para diagnostico de requisitos faltantes antes de avanzar a especificacion.
- **`architecture-reviewer`** — Subagente de solo lectura para revision independiente de arquitectura con hallazgos clasificados por severidad (blocker/major/minor/observation).

#### Skills

- **`requirements-discovery`** — Skill de 7 pasos para convertir informacion inicial en evidencia suficiente para decidir si el proyecto puede avanzar a requisitos.
- **`software-blueprint`** — Skill que produce 13 entregables: resumen ejecutivo, actores, requisitos funcionales/no funcionales, contexto, componentes, flujos, modelo de datos, contratos, seguridad, observabilidad, testing, riesgos, plan de implementacion.
- **`architecture-review`** — Skill de auditoria de 8 pasos con matriz requisito-componente-validacion y clasificacion de hallazgos.

#### Comandos

- **`/new-blueprint`** — Inicia o diagnostica un flujo de blueprint en el proyecto actual. Carga `requirements-discovery` y determina la fase real con evidencia.
- **`/continue-blueprint`** — Reanuda el blueprint desde la fase registrada en `project-state.json`, actualizando solo archivos necesarios.
- **`/validate-blueprint`** — Ejecuta `architecture-reviewer` como subtarea para auditar consistencia, cobertura y preparacion del blueprint.

#### Reglas Compartidas

- **`general.md`** — Reglas generales: trabajo con evidencia observable, separacion de diagnostico/decision/implementacion/validacion, verificacion de criterios de aceptacion.
- **`git-policy.md`** — Politica de git: inspeccion permitida, commits/push/branch switching requiere autorizacion explicita, nunca ocultar cambios existentes.
- **`documentation-policy.md`** — Politica de documentacion: ubicacion de documentos por estado, borradores nunca eliminados, decisiones registradas como ADRs.

#### Plantilla de Proyecto

- **`software-design-project/`** — Scaffold completo con `project-state.json` (maquina de estados de 5 fases), `workflow.md` (criterios de salida), y directorios para decisions, docs, drafts y archive.

#### Scripts

- **`install.sh`** — Instalacion global via symlinks en `~/.config/opencode`. Flags: `--dry-run`, `--force`, `--with-global-rules`, `--config-dir`.
- **`uninstall.sh`** — Desinstalacion segura que solo elimina symlinks apuntando a este repositorio.
- **`create-project.sh`** — Crea scaffold de diseno en un proyecto destino, detectando automaticamente el remote URL del repositorio git.
- **`validate.sh`** — Validacion de integridad: JSON valido, frontmatter obligatorio, nombres kebab-case, permisos basicos, referencias internas.

#### Infraestructura

- **`Makefile`** — Targets: `validate`, `test`, `install`, `dry-run`.
- **`tests/test-scripts.sh`** — Tests de integracion para install, create-project y uninstall.
- **`opencode.example.json`** — Configuracion de ejemplo con permisos de lectura/escritura y reglas compartidas.
