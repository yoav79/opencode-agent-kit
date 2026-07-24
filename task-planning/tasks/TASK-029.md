# TASK-029: Eliminar lista de distribución

## Objetivo

Implementar la funcionalidad para eliminar listas de distribución.

## Alcance

- SCOPE-001: Botón de eliminar en tabla de listas
- SCOPE-002: Diálogo de confirmación antes de eliminar
- SCOPE-003: Llamada a `mailctl distribution delete`
- SCOPE-004: Manejo de errores (lista con miembros activos)
- SCOPE-005: Actualización de tabla tras eliminar

## Fuera de alcance

- Eliminación en masa
- Soft delete
- Recuperación de listas eliminadas

## Criterios de aceptación

- AC-001: El botón de eliminar muestra un diálogo de confirmación
- AC-002: Al confirmar, se ejecuta `mailctl distribution delete`
- AC-003: Si la eliminación es exitosa, se actualiza la tabla
- AC-004: Si la lista tiene miembros, se muestra advertencia
- AC-005: Se muestra toast de éxito al eliminar

## Pruebas

- Test E2E: Eliminar una lista de distribución
- Test E2E: Cancelar eliminación

## Capacidades creadas

- CAP-034: Eliminar lista de distribución

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-026: Listas de distribución - Eliminar lista
