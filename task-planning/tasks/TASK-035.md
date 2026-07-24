# TASK-035: Ejecutar validación de plataforma

## Objetivo

Implementar la funcionalidad para ejecutar validaciones de plataforma y configuración.

## Alcance

- SCOPE-001: Página de validación `app/validation/page.tsx`
- SCOPE-002: Botón para ejecutar validación de plataforma
- SCOPE-003: Llamada a `mailctl validation platform`
- SCOPE-004: Mostrar resultados: servicios activos, configuración, dependencias
- SCOPE-005: Loading state mientras se ejecuta
- SCOPE-006: Manejo de errores

## Fuera de alcance

- Validación de flujo de correo
- Validación de runtime
- Historial de validaciones

## Criterios de aceptación

- AC-001: Se puede ejecutar validación de plataforma
- AC-002: Se muestran los resultados de la validación
- AC-003: Se muestra loading state mientras se ejecuta
- AC-004: Se muestra toast de error si falla
- AC-005: Los resultados son claros y fáciles de entender

## Pruebas

- Test E2E: Ejecutar validación de plataforma
- Test E2E: Manejar errores de validación

## Capacidades creadas

- CAP-011: Validación del sistema (parcial)

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-032: Validación - Plataforma
