# TASK-009: Listar dominios

## Objetivo

Implementar la funcionalidad para listar todos los dominios de correo electrónico.

## Alcance

- SCOPE-001: Crear página `app/domains/page.tsx`
- SCOPE-002: Tabla con columnas: nombre del dominio, estado, fecha de creación
- SCOPE-003: Llamada a `mailctl domain list`
- SCOPE-004: Loading state mientras se cargan datos
- SCOPE-005: Enlace a creación de dominio
- SCOPE-006: Acciones: editar, eliminar (por implementar)

## Fuera de alcance

- Edición y eliminación de dominios
- Búsqueda y filtrado avanzado
- Paginación

## Criterios de aceptación

- AC-001: La tabla muestra todos los dominios existentes
- AC-002: La tabla muestra el estado de cada dominio
- AC-003: Se puede navegar a creación de dominio
- AC-004: Se muestra loading state mientras se cargan datos
- AC-005: Se muestra mensaje cuando no hay dominios

## Pruebas

- Test E2E: Listar dominios existentes
- Test E2E: Navegar a creación de dominio
- Test E2E: Mostrar mensaje cuando no hay dominios

## Capacidades creadas

- CAP-018: Listar dominios

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-007: Gestión de dominios - Listar dominios
