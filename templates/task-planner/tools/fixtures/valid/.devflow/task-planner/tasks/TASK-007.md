# TASK-007 — Validar configuración de correo

## Objetivo

Implementar la funcionalidad de validación de configuración de correo en la WebUI, invocando `mailctl validate` y mostrando el resultado sin modificación.

## Capacidades creadas

- CAP-DOM-VALIDATE

## Capacidades consumidas

- CAP-API-LAYER

## Alcance

- SCOPE-007: Implementar únicamente el resultado descrito por el contrato semántico de dom.validate.

## Fuera de alcance

- Cualquier behavior, operación o política no incluida en el contrato semántico (create, enable, disable, delete).

## Criterios de aceptación

- AC-001: Bajo las precondiciones declaradas, la acción produce exactamente el resultado observable del contrato.
- AC-002: Un fallo de la operación no se reporta como éxito.

## Pruebas

- Caso exitoso del behavior principal: ejecutar la validación y verificar que la WebUI muestra el resultado producido por mailctl.
- Caso de error relevante: ejecutar la validación con configuración inválida y verificar que el error se muestra correctamente.

## Contrato semántico

```json
{
  "behaviorIds": ["BEH-DOM-VALIDATE"],
  "semanticKeys": ["dom.validate"],
  "sourceFunctionIds": ["FUN-DOM-VALIDATE"],
  "backendBindings": ["mailctl validate"]
}
```
