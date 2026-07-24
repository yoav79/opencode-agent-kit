# TASK-030: Gestionar miembros de lista de distribución

## Objetivo

Implementar la funcionalidad para agregar y eliminar miembros de listas de distribución.

## Alcance

- SCOPE-001: Página de gestión de miembros `app/distribution/[id]/members/page.tsx`
- SCOPE-002: Formulario para agregar miembros (email o buzón)
- SCOPE-003: Lista de miembros actuales con opción de eliminar
- SCOPE-004: Llamada a `mailctl distribution add-member`
- SCOPE-005: Llamada a `mailctl distribution remove-member`
- SCOPE-006: Manejo de errores (miembro ya existe, miembro no válido)
- SCOPE-007: Actualización de lista tras agregar/eliminar

## Fuera de alcance

- Importación masiva de miembros
- Validación de existencia de buzón
- Historial de cambios

## Criterios de aceptación

- AC-001: Se muestran los miembros actuales de la lista
- AC-002: Se puede agregar un nuevo miembro
- AC-003: Se puede eliminar un miembro existente
- AC-004: Si el miembro ya existe, se muestra error
- AC-005: Si la operación es exitosa, se actualiza la lista
- AC-006: Se muestra toast de éxito al agregar/eliminar
- AC-007: Se muestra toast de error si falla la operación

## Pruebas

- Test E2E: Agregar un miembro a una lista
- Test E2E: Eliminar un miembro de una lista
- Test E2E: Intentar agregar un miembro existente

## Capacidades creadas

- CAP-035: Gestionar miembros de lista

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-027: Listas de distribución - Gestionar miembros
