# TASK-039: Ver bitácoras operativas

## Objetivo

Implementar la funcionalidad para visualizar bitácoras operativas del sistema.

## Alcance

- SCOPE-001: Página de bitácoras `app/logs/page.tsx`
- SCOPE-002: Tabla con columnas: fecha, nivel, mensaje, servicio
- SCOPE-003: Llamada a `mailctl logs operational`
- SCOPE-004: Filtro por nivel (info, warn, error)
- SCOPE-005: Filtro por servicio
- SCOPE-006: Paginación de resultados

## Fuera de alcance

- Logs de aplicación
- Logs de auditoría
- Exportación de logs

## Criterios de aceptación

- AC-001: La tabla muestra las bitácoras operativas
- AC-002: Se puede filtrar por nivel
- AC-003: Se puede filtrar por servicio
- AC-004: Se muestra paginación
- AC-005: Se muestra mensaje cuando no hay logs

## Pruebas

- Test E2E: Ver bitácoras operativas
- Test E2E: Filtrar por nivel
- Test E2E: Filtrar por servicio

## Capacidades creadas

- CAP-012: Visualización de bitácoras (parcial)

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-036: Bitácoras - Operativas
