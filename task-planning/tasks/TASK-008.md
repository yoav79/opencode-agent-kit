# TASK-008: Crear dominio

## Objetivo

Implementar la funcionalidad para crear nuevos dominios de correo electrónico.

## Alcance

- SCOPE-001: Crear página `app/domains/new/page.tsx`
- SCOPE-002: Formulario con campos: nombre del dominio
- SCOPE-003: Validación de nombre de dominio (formato válido)
- SCOPE-004: Llamada a `mailctl domain create`
- SCOPE-005: Manejo de errores (dominio ya existe, formato inválido)
- SCOPE-006: Redirección a lista de dominios tras crear

## Fuera de alcance

- Validación DNS (se implementa en TASK-010)
- Edición y eliminación de dominios
- Listado de dominios

## Criterios de aceptación

- AC-001: El formulario muestra campos para nombre del dominio
- AC-002: La validación de formato funciona correctamente
- AC-003: Al enviar, se ejecuta `mailctl domain create`
- AC-004: Si el dominio ya existe, se muestra error
- AC-005: Si la creación es exitosa, se redirige a la lista de dominios
- AC-006: Se muestra toast de éxito al crear

## Pruebas

- Test E2E: Crear un dominio nuevo
- Test E2E: Intentar crear un dominio existente
- Test E2E: Validar formato de nombre de dominio

## Capacidades creadas

- CAP-005: CRUD de dominios (parcial)

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-006: Gestión de dominios - Crear dominio
