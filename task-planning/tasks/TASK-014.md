# TASK-014: Editar buzón

## Objetivo

Implementar la funcionalidad para editar buzones existentes.

## Alcance

- SCOPE-001: Crear página `app/mailboxes/[id]/edit/page.tsx`
- SCOPE-002: Formulario con campos editables del buzón
- SCOPE-003: Llamada a `mailctl mailbox update`
- SCOPE-004: Manejo de errores
- SCOPE-005: Redirección a lista de buzones tras editar

## Fuera de alcance

- Eliminación de buzones
- Cambio de contraseña
- Gestión de cuotas

## Criterios de aceptación

- AC-001: El formulario muestra los datos actuales del buzón
- AC-002: Al enviar, se ejecuta `mailctl mailbox update`
- AC-003: Si la edición es exitosa, se redirige a la lista de buzones
- AC-004: Se muestra toast de éxito al editar
- AC-005: Se muestra toast de error si falla

## Pruebas

- Test E2E: Editar un buzón existente
- Test E2E: Manejar errores al editar buzón

## Capacidades creadas

- CAP-022: Editar buzón

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-012: Gestión de buzones - Editar buzón
