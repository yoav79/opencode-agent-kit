---
description: Revisa la consistencia del Software Blueprint completo
agent: consistency-reviewer
subtask: true
---

Ejecuta una revisión independiente de consistencia sobre el Software
Blueprint generado por `software-architect`.

Este comando es invocado automáticamente por `software-architect` durante
la fase 14 (Consistency Review), la revisión final del blueprint, pero puede
ejecutarse manualmente para auditar el blueprint en cualquier momento.

## Precondiciones

Debe existir `.devflow/software-architect/` con al menos `project-state.json`
y los documentos de las fases completadas.

## Salida

Escribe `.devflow/software-architect/review/review-report.md` con:

- Hallazgos clasificados por gravedad (`BLOCKING`, `WARNING`, `INFO`)
- Etapas de revisión: estructura, estado, coherencia, contradicciones,
  trazabilidad, documento final
- Resumen con veredicto (`APPROVED`, `MINOR_ISSUES`, `BLOCKED`)

## Notas

- Este agente es de solo lectura. No modifica ningún documento fuente.
- El reporte se escribe en `review/` para no mezclarse con los documentos
  del blueprint.
- El software-architect no debería avanzar a la fase final si el veredicto
  es `BLOCKED`.

## Contexto adicional

$ARGUMENTS
