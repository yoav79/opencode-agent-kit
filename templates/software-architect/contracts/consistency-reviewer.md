# Consistency Reviewer — Contrato de interfaz (v2)

## Invocación
- `task` desde `software-architect` o comando `/review-consistency`
- Modo: subagent | Temperatura: 0

## Inputs (solo lectura)

- `.devflow/software-architect/docs/*.md` (todos los aprobados)
- `.devflow/software-architect/drafts/SOFTWARE-BLUEPRINT.md` (candidato)
- `.devflow/software-architect/project-state.json`

## Outputs

- `.devflow/software-architect/review/review-report.md`

## Return codes

- `APPROVED` — cero `BLOCKING` + cero `WARNING`
- `MINOR_ISSUES` — cero `BLOCKING`
- `BLOCKED` — uno o más `BLOCKING`

## Correcciones respecto a v1

- Ya NO exige `14-consistency-review.md` como input (era circular)
- Ya NO exige `SOFTWARE-BLUEPRINT.md` en `docs/` (está en `drafts/` como candidato)
- Ya NO busca `documents.*.path` (campo eliminado del estado)

## Prohibiciones

- No modificar documentos fuente
- No modificar `project-state.json`
- No interactuar con el usuario
