# TASK-004 — Habilitar dominio de correo

## Objetivo

Implementar la funcionalidad de habilitación de dominios de correo en la WebUI, invocando `mailctl domain enable` y mostrando el resultado sin modificación.

## Capacidades creadas

- CAP-DOM-ENABLE

## Capacidades consumidas

- CAP-API-LAYER

## Alcance

- SCOPE-004: Implementar únicamente el resultado descrito por el contrato semántico de dom.enable.

## Fuera de alcance

- Cualquier behavior, operación o política no incluida en el contrato semántico (create, disable, delete, validate).

## Criterios de aceptación

- AC-001: Bajo las precondiciones declaradas, la acción produce exactamente el resultado observable del contrato.
- AC-002: Un fallo de la operación no se reporta como éxito.

## Pruebas

- Caso exitoso del behavior principal: habilitar un dominio existente y verificar que la WebUI muestra la confirmación.
- Caso de error relevante: intentar habilitar un dominio que ya está habilitado y verificar que el error se muestra correctamente.

## Contrato semántico

```json
{
  "behaviorIds": ["BEH-DOM-ENABLE"],
  "semanticKeys": ["dom.enable"],
  "sourceFunctionIds": ["FUN-DOM-ENABLE"],
  "backendBindings": ["mailctl domain enable"]
}
```
