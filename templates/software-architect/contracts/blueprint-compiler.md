# Blueprint Compiler — Contrato de interfaz

## Invocación
- `task` desde `software-architect` o comando `/compile-blueprint`
- Modo: subagent | Temperatura: 0

## Inputs (solo lectura)

Todos deben existir y estar en estado `approved` en `project-state.json`:

- `.devflow/software-architect/docs/07-backend-schema.md`
- `.devflow/software-architect/docs/08-solution-architecture.md`
- `.devflow/software-architect/docs/09-technology-stack.md`
- `.devflow/software-architect/docs/10-security-and-nfr.md`
- `.devflow/software-architect/docs/12-delivery-roadmap.md`
- `.devflow/software-architect/project-state.json`

## Outputs (solo escritura en drafts/)

- `.devflow/software-architect/drafts/11-technical-requirements.md`
- `.devflow/software-architect/drafts/SOFTWARE-BLUEPRINT.md`

## Return codes

- `GENERATED` — drafts creados sin errores
- `BLOCKED` — faltan inputs o hay contradicciones explícitas

## Prohibiciones

- No interactuar con el usuario
- No modificar `project-state.json`
- No modificar archivos en `docs/`
- No aprobar fases
- No cambiar estados

## Criterios de bloqueo

- Falta uno o más inputs (reportar cuáles)
- Contradicción explícita entre dos o más inputs
- Algún input no está en estado `approved`
