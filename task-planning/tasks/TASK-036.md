# TASK-036: Ejecutar validación de flujo de correo

## Objetivo

Implementar la funcionalidad para ejecutar validaciones de flujo de correo.

## Alcance

- SCOPE-001: Botón para ejecutar validación de flujo
- SCOPE-002: Llamada a `mailctl validation flow`
- SCOPE-003: Mostrar resultados: envío, recepción, reenvío
- SCOPE-004: Loading state mientras se ejecuta
- SCOPE-005: Manejo de errores

## Fuera de alcance

- Validación de plataforma
- Validación de runtime
- Historial de validaciones

## Criterios de aceptación

- AC-001: Se puede ejecutar validación de flujo
- AC-002: Se muestran los resultados de la validación
- AC-003: Se muestra loading state mientras se ejecuta
- AC-004: Se muestra toast de error si falla
- AC-005: Los resultados son claros y fáciles de entender

## Pruebas

- Test E2E: Ejecutar validación de flujo
- Test E2E: Manejar errores de validación

## Capacidades creadas

- CAP-039: Ejecutar validación de flujo de correo

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-033: Validación - Flujo de correo
