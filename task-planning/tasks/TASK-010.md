# TASK-010: Editar dominio

## Objetivo

Implementar la funcionalidad para editar dominios existentes.

## Alcance

- SCOPE-001: Crear página `app/domains/[id]/edit/page.tsx`
- SCOPE-002: Formulario con campos editables del dominio
- SCOPE-003: Llamada a `mailctl domain update`
- SCOPE-004: Manejo de errores
- SCOPE-005: Redirección a lista de dominios tras editar

## Fuera de alcance

- Eliminación de dominios
- Cambio de nombre de dominio (requiere recreación)
- Configuración DNS

## Criterios de aceptación

- AC-001: El formulario muestra los datos actuales del dominio
- AC-002: Al enviar, se ejecuta `mailctl domain update`
- AC-003: Si la edición es exitosa, se redirige a la lista de dominios
- AC-004: Se muestra toast de éxito al editar
- AC-005: Se muestra toast de error si falla

## Pruebas

- Test E2E: Editar un dominio existente
- Test E2E: Manejar errores al editar dominio

## Capacidades creadas

- CAP-019: Editar dominio

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-008: Gestión de dominios - Editar dominio
