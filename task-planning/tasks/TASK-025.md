# TASK-025: Eliminar identidad

## Objetivo

Implementar la funcionalidad para eliminar identidades.

## Alcance

- SCOPE-001: Botón de eliminar en tabla de identidades
- SCOPE-002: Diálogo de confirmación antes de eliminar
- SCOPE-003: Llamada a `mailctl identity delete`
- SCOPE-004: Manejo de errores (identidad es predeterminada)
- SCOPE-005: Actualización de tabla tras eliminar

## Fuera de alcance

- Eliminación en masa
- Soft delete
- Recuperación de identidades eliminadas

## Criterios de aceptación

- AC-001: El botón de eliminar muestra un diálogo de confirmación
- AC-002: Al confirmar, se ejecuta `mailctl identity delete`
- AC-003: Si la eliminación es exitosa, se actualiza la tabla
- AC-004: Si la identidad es predeterminada, se muestra error
- AC-005: Se muestra toast de éxito al eliminar

## Pruebas

- Test E2E: Eliminar una identidad
- Test E2E: Intentar eliminar una identidad predeterminada
- Test E2E: Cancelar eliminación

## Capacidades creadas

- CAP-031: Eliminar identidad

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-024: Gestión de identidades - Eliminar identidad
