# TASK-022: Crear identidad

## Objetivo

Implementar la funcionalidad para crear nuevas identidades de correo electrónico.

## Alcance

- SCOPE-001: Crear página `app/identities/new/page.tsx`
- SCOPE-002: Formulario con campos: nombre, email, descripción
- SCOPE-003: Validación de email (formato válido)
- SCOPE-004: Llamada a `mailctl identity create`
- SCOPE-005: Manejo de errores (identidad ya existe, email inválido)
- SCOPE-006: Redirección a lista de identidades tras crear

## Fuera de alcance

- Edición y eliminación de identidades
- Listado de identidades
- Establecer identidad predeterminada

## Criterios de aceptación

- AC-001: El formulario muestra campos para nombre, email y descripción
- AC-002: La validación de email funciona correctamente
- AC-003: Al enviar, se ejecuta `mailctl identity create`
- AC-004: Si la identidad ya existe, se muestra error
- AC-005: Si la creación es exitosa, se redirige a la lista de identidades
- AC-006: Se muestra toast de éxito al crear

## Pruebas

- Test E2E: Crear una identidad nueva
- Test E2E: Intentar crear una identidad existente
- Test E2E: Validar formato de email

## Capacidades creadas

- CAP-008: CRUD de identidades (parcial)

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-021: Gestión de identidades - Crear identidad
