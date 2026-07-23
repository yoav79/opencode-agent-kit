# TASK-XXX — Título de la tarea

## Objetivo

Describir un único resultado principal observable.

## Capacidades creadas

- CAP-RESOURCE-ACTION

## Capacidades consumidas

- Ninguna.

## Alcance

- SCOPE-001: Implementar únicamente el resultado descrito por el contrato semántico.

## Fuera de alcance

- Cualquier behavior, operación o política no incluida en el contrato semántico.

## Criterios de aceptación

- AC-001: Bajo las precondiciones declaradas, la acción produce exactamente el resultado observable del contrato.
- AC-002: Un fallo de la operación no se reporta como éxito.

## Pruebas

- Caso exitoso del behavior principal.
- Caso de error relevante.

## Contrato semántico

```json
{
  "behaviorIds": ["BEH-RESOURCE-ACTION"],
  "semanticKeys": ["resource.action"],
  "sourceFunctionIds": ["FUN-RESOURCE-ACTION"]
}
```
