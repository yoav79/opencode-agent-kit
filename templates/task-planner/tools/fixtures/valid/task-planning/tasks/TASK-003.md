# TASK-003 — Crear dominio de correo

## Objetivo

Implementar la funcionalidad de creación de dominios de correo en la WebUI, invocando `mailctl domain create` y mostrando el resultado sin modificación.

## Capacidades creadas

- CAP-DOM-CREATE

## Capacidades consumidas

- CAP-API-LAYER

## Alcance

- SCOPE-003: Implementar únicamente el resultado descrito por el contrato semántico de dom.create.

## Fuera de alcance

- Cualquier behavior, operación o política no incluida en el contrato semántico (enable, disable, delete, validate).

## Criterios de aceptación

- AC-001: Bajo las precondiciones declaradas, la acción produce exactamente el resultado observable del contrato.
- AC-002: Un fallo de la operación no se reporta como éxito.

## Pruebas

- Caso exitoso del behavior principal: crear un dominio y verificar que la WebUI muestra la confirmación.
- Caso de error relevante: intentar crear un dominio duplicado y verificar que el error se muestra correctamente.

## Contrato semántico

```json
{
  "behaviorIds": ["BEH-DOM-CREATE"],
  "semanticKeys": ["dom.create"],
  "sourceFunctionIds": ["FUN-DOM-CREATE"],
  "backendBindings": ["mailctl domain create"]
}
```
