# TASK-006 — Eliminar dominio de correo

## Objetivo

Implementar la funcionalidad de eliminación de dominios de correo en la WebUI, invocando `mailctl domain delete` y mostrando el resultado sin modificación.

## Capacidades creadas

- CAP-DOM-DELETE

## Capacidades consumidas

- CAP-API-LAYER

## Alcance

- SCOPE-006: Implementar únicamente el resultado descrito por el contrato semántico de dom.delete.

## Fuera de alcance

- Cualquier behavior, operación o política no incluida en el contrato semántico (create, enable, disable, validate).

## Criterios de aceptación

- AC-001: Bajo las precondiciones declaradas, la acción produce exactamente el resultado observable del contrato.
- AC-002: Un fallo de la operación no se reporta como éxito.

## Pruebas

- Caso exitoso del behavior principal: eliminar un dominio existente y verificar que la WebUI muestra la confirmación.
- Caso de error relevante: intentar eliminar un dominio inexistente y verificar que el error se muestra correctamente.

## Contrato semántico

```json
{
  "behaviorIds": ["BEH-DOM-DELETE"],
  "semanticKeys": ["dom.delete"],
  "sourceFunctionIds": ["FUN-DOM-DELETE"],
  "backendBindings": ["mailctl domain delete"]
}
```
