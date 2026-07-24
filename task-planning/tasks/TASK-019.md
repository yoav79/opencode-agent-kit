# TASK-019: Listar aliases

## Objetivo

Implementar la funcionalidad para listar todos los aliases de correo electrónico.

## Alcance

- SCOPE-001: Crear página `app/aliases/page.tsx`
- SCOPE-002: Tabla con columnas: alias, destino, estado
- SCOPE-003: Llamada a `mailctl alias list`
- SCOPE-004: Loading state mientras se cargan datos
- SCOPE-005: Enlace a creación de alias
- SCOPE-006: Acciones: editar, eliminar (por implementar)

## Fuera de alcance

- Edición y eliminación de aliases
- Búsqueda y filtrado avanzado
- Paginación

## Criterios de aceptación

- AC-001: La tabla muestra todos los aliases existentes
- AC-002: La tabla muestra el destino de cada alias
- AC-003: La tabla muestra el estado de cada alias
- AC-004: Se puede navegar a creación de alias
- AC-005: Se muestra loading state mientras se cargan datos
- AC-006: Se muestra mensaje cuando no hay aliases

## Pruebas

- Test E2E: Listar aliases existentes
- Test E2E: Navegar a creación de alias
- Test E2E: Mostrar mensaje cuando no hay aliases

## Capacidades creadas

- CAP-026: Listar aliases

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-018: Gestión de aliases - Listar aliases
