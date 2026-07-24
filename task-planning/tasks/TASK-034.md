# TASK-034: Ver resultados de migración

## Objetivo

Implementar la funcionalidad para consultar los resultados de una migración completada.

## Alcance

- SCOPE-001: Página de resultados `app/migration/[id]/results/page.tsx`
- SCOPE-002: Resumen: total emails, migrados, fallidos, omitidos
- SCOPE-003: Lista de emails fallidos con razón del error
- SCOPE-004: Llamada a `mailctl migration results`
- SCOPE-005: Exportar resultados a CSV
- SCOPE-006: Loading state mientras se cargan datos

## Fuera de alcance

- Reintentar emails fallidos individualmente
- Logs detallados de cada email
- Historial de migraciones

## Criterios de aceptación

- AC-001: Se muestra el resumen de la migración
- AC-002: Se lista los emails fallidos con razón
- AC-003: Se puede exportar resultados a CSV
- AC-004: Se muestra loading state mientras se cargan datos
- AC-005: Se muestra mensaje cuando no hay resultados

## Pruebas

- Test E2E: Ver resultados de migración completada
- Test E2E: Exportar resultados a CSV

## Capacidades creadas

- CAP-038: Ver resultados de migración

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-031: Migración IMAP - Ver resultados
