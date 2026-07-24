# TASK-038: Ver resultados de validación

## Objetivo

Implementar la funcionalidad para consultar el historial de validaciones.

## Alcance

- SCOPE-001: Página de historial `app/validation/history/page.tsx`
- SCOPE-002: Tabla con columnas: fecha, tipo, resultado, duración
- SCOPE-003: Llamada a `mailctl validation list`
- SCOPE-004: Filtro por tipo de validación
- SCOPE-005: Detalle de cada validación
- SCOPE-006: Loading state mientras se cargan datos

## Fuera de alcance

- Exportación de resultados
- Comparación entre validaciones
- Alertas automáticas

## Criterios de aceptación

- AC-001: La tabla muestra todas las validaciones ejecutadas
- AC-002: Se puede filtrar por tipo de validación
- AC-003: Se puede ver el detalle de cada validación
- AC-004: Se muestra loading state mientras se cargan datos
- AC-005: Se muestra mensaje cuando no hay validaciones

## Pruebas

- Test E2E: Ver historial de validaciones
- Test E2E: Filtrar por tipo de validación
- Test E2E: Ver detalle de una validación

## Capacidades creadas

- CAP-041: Ver resultados de validación

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-035: Validación - Ver resultados
