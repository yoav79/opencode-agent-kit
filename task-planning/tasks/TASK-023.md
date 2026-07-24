# TASK-023: Listar identidades

## Objetivo

Implementar la funcionalidad para listar todas las identidades de correo electrónico.

## Alcance

- SCOPE-001: Crear página `app/identities/page.tsx`
- SCOPE-002: Tabla con columnas: nombre, email, estado, predeterminada
- SCOPE-003: Llamada a `mailctl identity list`
- SCOPE-004: Loading state mientras se cargan datos
- SCOPE-005: Enlace a creación de identidad
- SCOPE-006: Acciones: editar, eliminar, establecer predeterminada (por implementar)

## Fuera de alcance

- Edición y eliminación de identidades
- Búsqueda y filtrado avanzado
- Paginación

## Criterios de aceptación

- AC-001: La tabla muestra todas las identidades existentes
- AC-002: La tabla muestra el email de cada identidad
- AC-003: La tabla muestra cuál es la identidad predeterminada
- AC-004: Se puede navegar a creación de identidad
- AC-005: Se muestra loading state mientras se cargan datos
- AC-006: Se muestra mensaje cuando no hay identidades

## Pruebas

- Test E2E: Listar identidades existentes
- Test E2E: Navegar a creación de identidad
- Test E2E: Mostrar mensaje cuando no hay identidades

## Capacidades creadas

- CAP-029: Listar identidades

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-022: Gestión de identidades - Listar identidades
