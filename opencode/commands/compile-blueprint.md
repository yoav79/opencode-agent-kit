---
description: Compila drafts de Technical Requirements o Software Blueprint desde documentos aprobados
agent: blueprint-compiler
subtask: true
---

Compila drafts deterministas usando el subagente blueprint-compiler.

## Modos

El comando acepta un argumento de modo que determina qué draft generar:

### technical-requirements

Genera `.devflow/software-architect/drafts/11-technical-requirements.md`.

Precondiciones:
- `.devflow/software-architect/` con project-state.json
- docs/07-backend-schema.md, 08-solution-architecture.md, 09-technology-stack.md, 10-security-and-nfr.md en estado `approved`
- El contrato de interfaz en `$CONFIG_DIR/templates/software-architect/contracts/blueprint-compiler.md`

### software-blueprint

Genera `.devflow/software-architect/drafts/SOFTWARE-BLUEPRINT.md`.

Precondiciones:
- `.devflow/software-architect/` con project-state.json
- Todos los documentos de fases 1-12 en `docs/` en estado `approved`
- El contrato de interfaz en `$CONFIG_DIR/templates/software-architect/contracts/blueprint-compiler.md`

## Notas

- Este agente es de solo lectura sobre docs/ y solo escribe en drafts/.
- No modifica project-state.json.
- Se invoca automáticamente desde software-architect en fase 11 (technical-requirements) y fase 13 (software-blueprint).

## Contexto adicional

$ARGUMENTS
