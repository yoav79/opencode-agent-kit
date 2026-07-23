# Politica de documentacion

## Ubicacion de archivos

- **`software-design/docs/`** — documentos vigentes y aprobados. Solo un
  documento activo por topic.
- **`software-design/drafts/`** — trabajo incompleto o pendiente de aprobacion.
  Los borradores nunca se eliminan; se promueven a `docs/` o se mueven a
  `archive/`.
- **`software-design/decisions/`** — decisiones arquitectonicas registradas como
  ADRs (Architecture Decision Records).
- **`software-design/archive/`** — versiones reemplazadas que deben conservarse
  por trazabilidad. No se eliminan.

## Convenciones de nombres

- Documentos: `kebab-case-descriptivo.md` (por ejemplo:
  `requisitos-principales.md`).
- ADRs: `ADR-NNNN-kebab-case.md` (por ejemplo: `ADR-0001-base-de-datos.md`).

## project-state.json

`project-state.json` representa **estado** (fase actual, bloqueos, evidencias),
no conocimiento narrativo. La informacion sobre *por que* se tomo una decision
va en `decisions/`. La informacion sobre *que* hace el sistema va en `docs/`.

## Movimiento de archivos

Cuando un documento es reemplazado por una version actualizada:
1. El agente mueve la version anterior a `archive/`.
2. El agente actualiza o crea el nuevo documento en `docs/`.
3. Nunca se borra directamente; el historial se preserva en `archive/`.
