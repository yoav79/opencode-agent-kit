---
description: Compila drafts de Technical Requirements y Software Blueprint desde documentos aprobados
agent: blueprint-compiler
subtask: true
---

Compila drafts deterministas usando el subagente blueprint-compiler.

## Precondiciones

Deben existir:
- `.devflow/software-architect/` con project-state.json
- Los documentos fuente en `.devflow/software-architect/docs/`
- El contrato de interfaz en `$CONFIG_DIR/templates/software-architect/contracts/blueprint-compiler.md`

## Salida

Escribe en `.devflow/software-architect/drafts/`:
- `11-technical-requirements.md`
- `SOFTWARE-BLUEPRINT.md`

## Notas

- Este agente es de solo lectura sobre docs/ y solo escribe en drafts/.
- No modifica project-state.json.
- Se invoca automáticamente desde software-architect en fases 11 y 13.

## Contexto adicional

$ARGUMENTS
