# TASK-045: Ejecutar health check

## Objetivo

Implementar la funcionalidad para ejecutar un health check detallado de los servicios.

## Alcance

- SCOPE-001: Botón de health check en página de servicios
- SCOPE-002: Llamada a `mailctl service health`
- SCOPE-003: Mostrar resultados: servicios ok, advertencias, errores
- SCOPE-004: Loading state mientras se ejecuta
- SCOPE-005: Manejo de errores

## Fuera de alcance

- Health check automático
- Monitoreo continuo
- Alertas de health check

## Criterios de aceptación

- AC-001: Se puede ejecutar health check
- AC-002: Se muestran los resultados detallados
- AC-003: Se muestra loading state mientras se ejecuta
- AC-004: Se muestra toast de error si falla
- AC-005: Los resultados son claros y fáciles de entender

## Pruebas

- Test E2E: Ejecutar health check
- Test E2E: Manejar errores de health check

## Capacidades creadas

- CAP-046: Ejecutar health check

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-042: Servicios - Health check
