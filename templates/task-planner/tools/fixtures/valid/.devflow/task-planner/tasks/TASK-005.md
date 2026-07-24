# TASK-005 — Deshabilitar dominio de correo

## Objetivo

Implementar la funcionalidad de deshabilitación de dominios de correo en la WebUI, invocando `mailctl domain disable` y mostrando el resultado sin modificación.

## Capacidades creadas

- CAP-DOM-DISABLE

## Capacidades consumidas

- CAP-API-LAYER

## Alcance

- SCOPE-005: Implementar únicamente el resultado descrito por el contrato semántico de dom.disable.

## Fuera de alcance

- Cualquier behavior, operación o política no incluida en el contrato semántico (create, enable, delete, validate).

## Criterios de aceptación

- AC-001: Bajo las precondiciones declaradas, la acción produce exactamente el resultado observable del contrato.
- AC-002: Un fallo de la operación no se reporta como éxito.

## Pruebas

- Caso exitoso del behavior principal: deshabilitar un dominio habilitado y verificar que la WebUI muestra la confirmación.
- Caso de error relevante: intentar deshabilitar un dominio que ya está deshabilitado y verificar que el error se muestra correctamente.

## Contrato semántico

```json
{
  "behaviorIds": ["BEH-DOM-DISABLE"],
  "semanticKeys": ["dom.disable"],
  "sourceFunctionIds": ["FUN-DOM-DISABLE"],
  "backendBindings": ["mailctl domain disable"]
}
```
