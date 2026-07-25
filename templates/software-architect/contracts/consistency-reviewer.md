# Consistency Reviewer — Contrato de interfaz (v2)

## Invocación
- `task` desde `software-architect` o comando `/review-consistency`
- Modo: subagent | Temperatura: 0

## Inputs (solo lectura)

- `.devflow/software-architect/docs/*.md` (todos los aprobados, 1-13)
- `.devflow/software-architect/docs/SOFTWARE-BLUEPRINT.md` (entregable fase 13)
- `.devflow/software-architect/project-state.json`

## Outputs

- `.devflow/software-architect/drafts/14-consistency-review.md`

## Return codes

- `APPROVED` — cero `BLOCKING` + cero `WARNING`
- `MINOR_ISSUES` — cero `BLOCKING`
- `BLOCKED` — uno o más `BLOCKING`

## Formato de hallazgos

- El reporte se organiza por severidad según la plantilla de fase 14.
- Cada hallazgo debe conservar la etapa revisada con formato
  `[SEVERIDAD] [Etapa] descripción`.
- Etapas válidas: Estructura, Estado, Coherencia interna, Contradicciones,
  Trazabilidad, Documento final.

## Correcciones respecto a v1

- Ya NO exige `14-consistency-review.md` como input (era circular)
- Ya NO exige `SOFTWARE-BLUEPRINT.md` en `drafts/` (está en `docs/` como aprobado)
- Ya NO busca `documents.*.path` (campo eliminado del estado)

## Prohibiciones

- No modificar documentos fuente
- No modificar `project-state.json`
- No interactuar con el usuario
