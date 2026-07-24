# TASK-032: Monitorear progreso de migración

## Objetivo

Implementar la funcionalidad para supervisar el progreso de una migración IMAP en curso.

## Alcance

- SCOPE-001: Dashboard de migración `app/migration/page.tsx`
- SCOPE-002: Barra de progreso con porcentaje completado
- SCOPE-003: Estadísticas: emails migrados, errores, tiempo transcurrido
- SCOPE-004: Llamada a `mailctl migration status`
- SCOPE-005: Auto-refresh cada 5 segundos
- SCOPE-006: Botón de cancelar migración

## Fuera de alcance

- Logs detallados de cada email
- Reintentos automáticos
- Historial de migraciones completadas

## Criterios de aceptación

- AC-001: Se muestra la barra de progreso actualizada
- AC-002: Se muestran estadísticas de migración
- AC-003: Los datos se actualizan automáticamente
- AC-004: Se puede cancelar la migración en curso
- AC-005: Se muestra loading state mientras se cargan datos

## Pruebas

- Test E2E: Monitorear progreso de migración
- Test E2E: Cancelar migración en curso

## Capacidades creadas

- CAP-036: Monitorear progreso de migración

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-029: Migración IMAP - Monitorear progreso
