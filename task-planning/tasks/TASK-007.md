# TASK-007: Dashboard con estado de servicios

## Objetivo

Implementar la página principal del dashboard que muestra el estado de la plataforma y servicios.

## Alcance

- SCOPE-001: Crear página `app/dashboard/page.tsx`
- SCOPE-002: Mostrar estado general de la plataforma
- SCOPE-003: Mostrar estado de cada servicio (PostgreSQL, Dovecot, Postfix, etc.)
- SCOPE-004: Mostrar estadísticas de correo (dominios, buzones, aliases)
- SCOPE-005: Mostrar operaciones recientes
- SCOPE-006: Implementar loading state mientras se cargan datos

## Fuera de alcance

- Gráficos y visualizaciones avanzadas
- Alertas y notificaciones en tiempo real
- Historial completo de operaciones

## Criterios de aceptación

- AC-001: El dashboard muestra el estado de cada servicio con indicador visual
- AC-002: El dashboard muestra estadísticas básicas de la plataforma
- AC-003: El dashboard muestra las últimas 10 operaciones realizadas
- AC-004: Los datos se actualizan al recargar la página
- AC-005: Se muestra loading state mientras se cargan los datos
- AC-006: La información es clara y fácil de entender

## Pruebas

- Test E2E: El dashboard carga y muestra información
- Test E2E: El dashboard muestra el estado de servicios
- Test E2E: El dashboard muestra operaciones recientes

## Capacidades creadas

- CAP-004: Dashboard con estado de servicios

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables

## Cobertura de requisitos

- REQ-002: Dashboard - Estado general
- REQ-003: Dashboard - Estado de servicios
- REQ-004: Dashboard - Estadísticas de correo
- REQ-005: Dashboard - Operaciones recientes
