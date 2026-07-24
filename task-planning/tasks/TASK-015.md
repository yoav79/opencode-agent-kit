# TASK-015: Eliminar buzón

## Objetivo

Implementar la funcionalidad para eliminar buzones.

## Alcance

- SCOPE-001: Botón de eliminar en tabla de buzones
- SCOPE-002: Diálogo de confirmación antes de eliminar
- SCOPE-003: Llamada a `mailctl mailbox delete`
- SCOPE-004: Manejo de errores
- SCOPE-005: Actualización de tabla tras eliminar

## Fuera de alcance

- Eliminación en masa
- Soft delete
- Recuperación de buzones eliminados

## Criterios de aceptación

- AC-001: El botón de eliminar muestra un diálogo de confirmación
- AC-002: Al confirmar, se ejecuta `mailctl mailbox delete`
- AC-003: Si la eliminación es exitosa, se actualiza la tabla
- AC-004: Se muestra toast de éxito al eliminar
- AC-005: Se muestra toast de error si falla

## Pruebas

- Test E2E: Eliminar un buzón
- Test E2E: Cancelar eliminación

## Capacidades creadas

- CAP-023: Eliminar buzón

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-013: Gestión de buzones - Eliminar buzón
