# TASK-018: Crear alias

## Objetivo

Implementar la funcionalidad para crear nuevos aliases de correo electrónico.

## Alcance

- SCOPE-001: Crear página `app/aliases/new/page.tsx`
- SCOPE-002: Formulario con campos: nombre de alias, destino
- SCOPE-003: Selector de destino (buzón o dirección externa)
- SCOPE-004: Validación de nombre de alias (formato válido)
- SCOPE-005: Llamada a `mailctl alias create`
- SCOPE-006: Manejo de errores (alias ya existe, destino no válido)
- SCOPE-007: Redirección a lista de aliases tras crear

## Fuera de alcance

- Edición y eliminación de aliases
- Listado de aliases
- Gestión de identidades

## Criterios de aceptación

- AC-001: El formulario muestra campos para nombre y destino
- AC-002: El selector de destino muestra buzones existentes
- AC-003: La validación de formato funciona correctamente
- AC-004: Al enviar, se ejecuta `mailctl alias create`
- AC-005: Si el alias ya existe, se muestra error
- AC-006: Si la creación es exitosa, se redirige a la lista de aliases
- AC-007: Se muestra toast de éxito al crear

## Pruebas

- Test E2E: Crear un alias nuevo
- Test E2E: Intentar crear un alias existente
- Test E2E: Validar formato de nombre de alias

## Capacidades creadas

- CAP-007: CRUD de aliases (parcial)

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-017: Gestión de aliases - Crear alias
