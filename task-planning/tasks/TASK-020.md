# TASK-020: Editar alias

## Objetivo

Implementar la funcionalidad para editar aliases existentes.

## Alcance

- SCOPE-001: Crear página `app/aliases/[id]/edit/page.tsx`
- SCOPE-002: Formulario con campos editables del alias
- SCOPE-003: Llamada a `mailctl alias update`
- SCOPE-004: Manejo de errores
- SCOPE-005: Redirección a lista de aliases tras editar

## Fuera de alcance

- Eliminación de aliases
- Habilitar/deshabilitar alias
- Cambio de destino

## Criterios de aceptación

- AC-001: El formulario muestra los datos actuales del alias
- AC-002: Al enviar, se ejecuta `mailctl alias update`
- AC-003: Si la edición es exitosa, se redirige a la lista de aliases
- AC-004: Se muestra toast de éxito al editar
- AC-005: Se muestra toast de error si falla

## Pruebas

- Test E2E: Editar un alias existente
- Test E2E: Manejar errores al editar alias

## Capacidades creadas

- CAP-027: Editar alias

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-019: Gestión de aliases - Editar alias
