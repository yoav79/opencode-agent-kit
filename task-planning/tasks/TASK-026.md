# TASK-026: Establecer identidad predeterminada

## Objetivo

Implementar la funcionalidad para establecer una identidad como predeterminada.

## Alcance

- SCOPE-001: Botón de establecer predeterminada en tabla de identidades
- SCOPE-002: Llamada a `mailctl identity set-default`
- SCOPE-003: Manejo de errores
- SCOPE-004: Actualización de tabla tras cambiar
- SCOPE-005: Confirmación antes de cambiar

## Fuera de alcance

- Creación y edición de identidades
- Eliminación de identidades
- Gestión de múltiples identidades predeterminadas

## Criterios de aceptación

- AC-001: El botón de establecer predeterminada está disponible
- AC-002: Al hacer clic, se ejecuta `mailctl identity set-default`
- AC-003: Si el cambio es exitoso, se actualiza la tabla
- AC-004: Se muestra toast de éxito al cambiar
- AC-005: Se muestra toast de error si falla

## Pruebas

- Test E2E: Establecer una identidad como predeterminada
- Test E2E: Manejar errores al cambiar identidad predeterminada

## Capacidades creadas

- CAP-032: Establecer identidad predeterminada

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-025: Gestión de identidades - Establecer identidad predeterminada
