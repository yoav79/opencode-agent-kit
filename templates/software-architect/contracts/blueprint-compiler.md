# Blueprint Compiler — Contrato de interfaz

## Invocación
- `task` desde `software-architect` o comando `/compile-blueprint <modo>`
- Modo: subagent | Temperatura: 0

## Modos

### technical-requirements

Inputs (todos deben existir y estar `approved` en project-state.json):

- `.devflow/software-architect/docs/07-backend-schema.md`
- `.devflow/software-architect/docs/08-solution-architecture.md`
- `.devflow/software-architect/docs/09-technology-stack.md`
- `.devflow/software-architect/docs/10-security-and-nfr.md`
- `.devflow/software-architect/project-state.json`

Output:

- `.devflow/software-architect/drafts/11-technical-requirements.md`

Return codes:
- `GENERATED` — draft creado sin errores
- `BLOCKED` — faltan inputs o hay contradicciones explícitas

### software-blueprint

Inputs (todos deben existir y estar `approved` en project-state.json):

- `.devflow/software-architect/docs/01-discovery.md`
- `.devflow/software-architect/docs/02-product-requirements.md`
- `.devflow/software-architect/docs/03-application-flow.md`
- `.devflow/software-architect/docs/04-uiux-brief.md`
- `.devflow/software-architect/docs/05-module-catalog.md`
- `.devflow/software-architect/docs/06-functional-requirements.md`
- `.devflow/software-architect/docs/07-backend-schema.md`
- `.devflow/software-architect/docs/08-solution-architecture.md`
- `.devflow/software-architect/docs/09-technology-stack.md`
- `.devflow/software-architect/docs/10-security-and-nfr.md`
- `.devflow/software-architect/docs/11-technical-requirements.md`
- `.devflow/software-architect/docs/12-delivery-roadmap.md`
- `.devflow/software-architect/project-state.json`

Output:

- `.devflow/software-architect/drafts/SOFTWARE-BLUEPRINT.md`

Return codes:
- `GENERATED` — draft creado sin errores
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
