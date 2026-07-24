# TASK-041: Ver bitácoras de aplicación

## Objetivo

Implementar la funcionalidad para visualizar bitácoras de aplicación.

## Alcance

- SCOPE-001: Página de logs de aplicación `app/logs/application/page.tsx`
- SCOPE-002: Tabla con columnas: fecha, nivel, mensaje, stack trace
- SCOPE-003: Llamada a `mailctl logs application`
- SCOPE-004: Filtro por nivel
- SCOPE-005: Expansión de stack trace
- SCOPE-006: Paginación de resultados

## Fuera de alcance

- Logs operativos
- Logs de auditoría
- Exportación de logs

## Criterios de aceptación

- AC-001: La tabla muestra las bitácoras de aplicación
- AC-002: Se puede filtrar por nivel
- AC-003: Se puede expandir el stack trace
- AC-004: Se muestra paginación
- AC-005: Se muestra mensaje cuando no hay logs

## Pruebas

- Test E2E: Ver bitácoras de aplicación
- Test E2E: Filtrar por nivel
- Test E2E: Expandir stack trace

## Capacidades creadas

- CAP-043: Ver bitácoras de aplicación

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-038: Bitácoras - Aplicación
