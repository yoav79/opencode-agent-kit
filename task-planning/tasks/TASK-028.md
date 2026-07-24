# TASK-028: Listar listas de distribución

## Objetivo

Implementar la funcionalidad para listar todas las listas de distribución.

## Alcance

- SCOPE-001: Crear página `app/distribution/page.tsx`
- SCOPE-002: Tabla con columnas: nombre de lista, descripción, cantidad de miembros
- SCOPE-003: Llamada a `mailctl distribution list`
- SCOPE-004: Loading state mientras se cargan datos
- SCOPE-005: Enlace a creación de lista
- SCOPE-006: Acciones: editar, eliminar, gestionar miembros (por implementar)

## Fuera de alcance

- Gestión de miembros de la lista
- Edición y eliminación de listas
- Búsqueda y filtrado avanzado

## Criterios de aceptación

- AC-001: La tabla muestra todas las listas existentes
- AC-002: La tabla muestra la descripción de cada lista
- AC-003: La tabla muestra la cantidad de miembros de cada lista
- AC-004: Se puede navegar a creación de lista
- AC-005: Se muestra loading state mientras se cargan datos
- AC-006: Se muestra mensaje cuando no hay listas

## Pruebas

- Test E2E: Listar listas existentes
- Test E2E: Navegar a creación de lista
- Test E2E: Mostrar mensaje cuando no hay listas

## Capacidades creadas

- CAP-033: Listar listas de distribución

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-025: Listas de distribución - Listar listas
