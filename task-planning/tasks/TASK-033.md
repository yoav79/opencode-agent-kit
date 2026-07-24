# TASK-033: Reintentar migración fallida

## Objetivo

Implementar la funcionalidad para reintentar una migración que falló.

## Alcance

- SCOPE-001: Botón de reintentar en dashboard de migración
- SCOPE-002: Diálogo de confirmación antes de reintentar
- SCOPE-003: Llamada a `mailctl migration retry`
- SCOPE-004: Manejo de errores (migración no fallida, configuración inválida)
- SCOPE-005: Redirección a monitoreo tras reintentar

## Fuera de alcance

- Reintentos automáticos
- Configuración de política de reintentos
- Historial de reintentos

## Criterios de aceptación

- AC-001: El botón de reintentar está disponible cuando la migración falló
- AC-002: Al hacer clic, se muestra diálogo de confirmación
- AC-003: Al confirmar, se ejecuta `mailctl migration retry`
- AC-004: Si el reintento inicia, se redirige al monitoreo
- AC-005: Se muestra toast de éxito al reintentar

## Pruebas

- Test E2E: Reintentar una migración fallida
- Test E2E: Cancelar reintento

## Capacidades creadas

- CAP-037: Reintentar migración fallida

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-030: Migración IMAP - Reintentar migración
