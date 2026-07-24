# TASK-044: Recargar configuración de servicio

## Objetivo

Implementar la funcionalidad para recargar la configuración de un servicio sin reiniciarlo.

## Alcance

- SCOPE-001: Botón de recargar configuración en tabla de servicios
- SCOPE-002: Diálogo de confirmación antes de recargar
- SCOPE-003: Llamada a `mailctl service reload`
- SCOPE-004: Manejo de errores (servicio no soporta reload, configuración inválida)
- SCOPE-005: Confirmación tras recarga exitosa

## Fuera de alcance

- Recarga en masa
- Recarga programada
- Historial de recargas

## Criterios de aceptación

- AC-001: El botón de recargar está disponible para servicios compatibles
- AC-002: Al hacer clic, se muestra diálogo de confirmación
- AC-003: Al confirmar, se ejecuta `mailctl service reload`
- AC-004: Si la recarga es exitosa, se muestra confirmación
- AC-005: Se muestra toast de error si falla

## Pruebas

- Test E2E: Recargar configuración de un servicio
- Test E2E: Cancelar recarga

## Capacidades creadas

- CAP-045: Recargar configuración de servicio

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-041: Servicios - Recargar configuración
