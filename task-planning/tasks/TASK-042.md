# TASK-042: Ver estado de servicios

## Objetivo

Implementar la funcionalidad para visualizar el estado de los servicios del sistema.

## Alcance

- SCOPE-001: Página de servicios `app/services/page.tsx`
- SCOPE-002: Tabla con columnas: servicio, estado, PID, uso de recursos
- SCOPE-003: Llamada a `mailctl service status`
- SCOPE-004: Indicador visual de estado (verde/rojo)
- SCOPE-005: Loading state mientras se cargan datos
- SCOPE-006: Botón de actualizar

## Fuera de alcance

- Reinicio de servicios
- Recarga de configuración
- Health check detallado

## Criterios de aceptación

- AC-001: La tabla muestra todos los servicios del sistema
- AC-002: Se muestra el estado de cada servicio con indicador visual
- AC-003: Se muestra el PID y uso de recursos
- AC-004: Se puede actualizar la lista
- AC-005: Se muestra loading state mientras se cargan datos

## Pruebas

- Test E2E: Ver estado de servicios
- Test E2E: Actualizar lista de servicios

## Capacidades creadas

- CAP-013: Administración de servicios (parcial)

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-039: Servicios - Ver estado
