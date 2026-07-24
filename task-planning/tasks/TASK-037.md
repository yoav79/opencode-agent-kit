# TASK-037: Ejecutar validación de runtime

## Objetivo

Implementar la funcionalidad para ejecutar validaciones de runtime del sistema.

## Alcance

- SCOPE-001: Botón para ejecutar validación de runtime
- SCOPE-002: Llamada a `mailctl validation runtime`
- SCOPE-003: Mostrar resultados: procesos, memoria, disco, red
- SCOPE-004: Loading state mientras se ejecuta
- SCOPE-005: Manejo de errores

## Fuera de alcance

- Validación de plataforma
- Validación de flujo
- Historial de validaciones

## Criterios de aceptación

- AC-001: Se puede ejecutar validación de runtime
- AC-002: Se muestran los resultados de la validación
- AC-003: Se muestra loading state mientras se ejecuta
- AC-004: Se muestra toast de error si falla
- AC-005: Los resultados son claros y fáciles de entender

## Pruebas

- Test E2E: Ejecutar validación de runtime
- Test E2E: Manejar errores de validación

## Capacidades creadas

- CAP-040: Ejecutar validación de runtime

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-034: Validación - Runtime
