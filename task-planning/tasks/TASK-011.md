# TASK-011: Eliminar dominio

## Objetivo

Implementar la funcionalidad para eliminar dominios.

## Alcance

- SCOPE-001: Botón de eliminar en tabla de dominios
- SCOPE-002: Diálogo de confirmación antes de eliminar
- SCOPE-003: Llamada a `mailctl domain delete`
- SCOPE-004: Manejo de errores (dominio con buzones existentes)
- SCOPE-005: Actualización de tabla tras eliminar

## Fuera de alcance

- Eliminación en masa
- Soft delete
- Recuperación de dominios eliminados

## Criterios de aceptación

- AC-001: El botón de eliminar muestra un diálogo de confirmación
- AC-002: Al confirmar, se ejecuta `mailctl domain delete`
- AC-003: Si la eliminación es exitosa, se actualiza la tabla
- AC-004: Si el dominio tiene buzones, se muestra error
- AC-005: Se muestra toast de éxito al eliminar

## Pruebas

- Test E2E: Eliminar un dominio
- Test E2E: Intentar eliminar un dominio con buzones
- Test E2E: Cancelar eliminación

## Capacidades creadas

- CAP-020: Eliminar dominio

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-009: Gestión de dominios - Eliminar dominio
