# TASK-027: Crear lista de distribución

## Objetivo

Implementar la funcionalidad para crear nuevas listas de distribución.

## Alcance

- SCOPE-001: Crear página `app/distribution/new/page.tsx`
- SCOPE-002: Formulario con campos: nombre de lista, descripción
- SCOPE-003: Validación de nombre de lista (formato válido)
- SCOPE-004: Llamada a `mailctl distribution create`
- SCOPE-005: Manejo de errores (lista ya existe, formato inválido)
- SCOPE-006: Redirección a lista de distribución tras crear

## Fuera de alcance

- Gestión de miembros de la lista
- Edición y eliminación de listas
- Listado de listas de distribución

## Criterios de aceptación

- AC-001: El formulario muestra campos para nombre y descripción
- AC-002: La validación de formato funciona correctamente
- AC-003: Al enviar, se ejecuta `mailctl distribution create`
- AC-004: Si la lista ya existe, se muestra error
- AC-005: Si la creación es exitosa, se redirige a la lista de distribución
- AC-006: Se muestra toast de éxito al crear

## Pruebas

- Test E2E: Crear una lista de distribución nueva
- Test E2E: Intentar crear una lista existente
- Test E2E: Validar formato de nombre de lista

## Capacidades creadas

- CAP-009: Gestión de listas de distribución (parcial)

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-024: Listas de distribución - Crear lista
