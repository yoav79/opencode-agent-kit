# TASK-040: Ver bitácoras de auditoría

## Objetivo

Implementar la funcionalidad para visualizar bitácoras de auditoría.

## Alcance

- SCOPE-001: Página de auditoría `app/logs/audit/page.tsx`
- SCOPE-002: Tabla con columnas: fecha, usuario, acción, recurso
- SCOPE-003: Llamada a `mailctl logs audit`
- SCOPE-004: Filtro por usuario
- SCOPE-005: Filtro por tipo de acción
- SCOPE-006: Paginación de resultados

## Fuera de alcance

- Logs de aplicación
- Logs operativos
- Exportación de logs

## Criterios de aceptación

- AC-001: La tabla muestra las bitácoras de auditoría
- AC-002: Se puede filtrar por usuario
- AC-003: Se puede filtrar por tipo de acción
- AC-004: Se muestra paginación
- AC-005: Se muestra mensaje cuando no hay logs

## Pruebas

- Test E2E: Ver bitácoras de auditoría
- Test E2E: Filtrar por usuario
- Test E2E: Filtrar por tipo de acción

## Capacidades creadas

- CAP-042: Ver bitácoras de auditoría

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-037: Bitácoras - Auditoría
