# TASK-013: Listar buzones

## Objetivo

Implementar la funcionalidad para listar todos los buzones de correo.

## Alcance

- SCOPE-001: Crear página `app/mailboxes/page.tsx`
- SCOPE-002: Tabla con columnas: buzón, dominio, estado, uso de cuota
- SCOPE-003: Llamada a `mailctl mailbox list`
- SCOPE-004: Loading state mientras se cargan datos
- SCOPE-005: Enlace a creación de buzón
- SCOPE-006: Acciones: editar, eliminar, cambiar contraseña (por implementar)

## Fuera de alcance

- Edición y eliminación de buzones
- Búsqueda y filtrado avanzado
- Paginación

## Criterios de aceptación

- AC-001: La tabla muestra todos los buzones existentes
- AC-002: La tabla muestra el dominio de cada buzón
- AC-003: La tabla muestra el uso de cuota de cada buzón
- AC-004: Se puede navegar a creación de buzón
- AC-005: Se muestra loading state mientras se cargan datos
- AC-006: Se muestra mensaje cuando no hay buzones

## Pruebas

- Test E2E: Listar buzones existentes
- Test E2E: Navegar a creación de buzón
- Test E2E: Mostrar mensaje cuando no hay buzones

## Capacidades creadas

- CAP-021: Listar buzones

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-011: Gestión de buzones - Listar buzones
- REQ-016: Gestión de buzones - Ver uso de cuota
