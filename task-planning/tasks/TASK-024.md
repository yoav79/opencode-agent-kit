# TASK-024: Editar identidad

## Objetivo

Implementar la funcionalidad para editar identidades existentes.

## Alcance

- SCOPE-001: Crear página `app/identities/[id]/edit/page.tsx`
- SCOPE-002: Formulario con campos editables de la identidad
- SCOPE-003: Llamada a `mailctl identity update`
- SCOPE-004: Manejo de errores
- SCOPE-005: Redirección a lista de identidades tras editar

## Fuera de alcance

- Eliminación de identidades
- Establecer identidad predeterminada
- Cambio de email

## Criterios de aceptación

- AC-001: El formulario muestra los datos actuales de la identidad
- AC-002: Al enviar, se ejecuta `mailctl identity update`
- AC-003: Si la edición es exitosa, se redirige a la lista de identidades
- AC-004: Se muestra toast de éxito al editar
- AC-005: Se muestra toast de error si falla

## Pruebas

- Test E2E: Editar una identidad existente
- Test E2E: Manejar errores al editar identidad

## Capacidades creadas

- CAP-030: Editar identidad

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-023: Gestión de identidades - Editar identidad
