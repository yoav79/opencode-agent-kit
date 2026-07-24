# TASK-012: Crear buzón

## Objetivo

Implementar la funcionalidad para crear nuevos buzones de correo.

## Alcance

- SCOPE-001: Crear página `app/mailboxes/new/page.tsx`
- SCOPE-002: Formulario con campos: dominio, nombre de buzón, contraseña
- SCOPE-003: Selector de dominio existente
- SCOPE-004: Validación de nombre de buzón (formato válido)
- SCOPE-005: Llamada a `mailctl mailbox create`
- SCOPE-006: Manejo de errores (buzón ya existe, dominio no existe)
- SCOPE-007: Redirección a lista de buzones tras crear

## Fuera de alcance

- Edición y eliminación de buzones
- Gestión de contraseñas y cuotas
- Listado de buzones

## Criterios de aceptación

- AC-001: El formulario muestra campos para dominio, nombre y contraseña
- AC-002: El selector de dominio muestra dominios existentes
- AC-003: La validación de formato funciona correctamente
- AC-004: Al enviar, se ejecuta `mailctl mailbox create`
- AC-005: Si el buzón ya existe, se muestra error
- AC-006: Si la creación es exitosa, se redirige a la lista de buzones
- AC-007: Se muestra toast de éxito al crear

## Pruebas

- Test E2E: Crear un buzón nuevo
- Test E2E: Intentar crear un buzón existente
- Test E2E: Validar formato de nombre de buzón

## Capacidades creadas

- CAP-006: CRUD de buzones (parcial)

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-010: Gestión de buzones - Crear buzón
