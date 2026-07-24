# TASK-043: Reiniciar servicio

## Objetivo

Implementar la funcionalidad para reiniciar un servicio del sistema.

## Alcance

- SCOPE-001: Botón de reiniciar en tabla de servicios
- SCOPE-002: Diálogo de confirmación antes de reiniciar
- SCOPE-003: Llamada a `mailctl service restart`
- SCOPE-004: Manejo de errores (servicio no encontrado, permisos insuficientes)
- SCOPE-005: Actualización de estado tras reiniciar

## Fuera de alcance

- Reinicio en masa
- Reinicio programado
- Historial de reinicios

## Criterios de aceptación

- AC-001: El botón de reiniciar está disponible para cada servicio
- AC-002: Al hacer clic, se muestra diálogo de confirmación
- AC-003: Al confirmar, se ejecuta `mailctl service restart`
- AC-004: Si el reinicio es exitoso, se actualiza el estado
- AC-005: Se muestra toast de éxito al reiniciar

## Pruebas

- Test E2E: Reiniciar un servicio
- Test E2E: Cancelar reinicio

## Capacidades creadas

- CAP-044: Reiniciar servicio

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-040: Servicios - Reiniciar
