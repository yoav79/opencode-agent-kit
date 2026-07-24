# TASK-017: Gestionar cuotas de buzón

## Objetivo

Implementar la funcionalidad para establecer y ver cuotas de buzón.

## Alcance

- SCOPE-001: Botón de gestionar cuota en tabla de buzones
- SCOPE-002: Diálogo/modal con campo de cuota (en MB)
- SCOPE-003: Llamada a `mailctl mailbox quota`
- SCOPE-004: Visualización de uso actual de cuota
- SCOPE-005: Manejo de errores
- SCOPE-006: Toast de confirmación tras cambio exitoso

## Fuera de alcance

- Cuotas por dominio
- Alertas de cuota
- Historial de uso

## Criterios de aceptación

- AC-001: El diálogo muestra la cuota actual y el uso
- AC-002: El campo de cuota acepta valores en MB
- AC-003: Al enviar, se ejecuta `mailctl mailbox quota`
- AC-004: Si el cambio es exitoso, se muestra toast de confirmación
- AC-005: Se muestra toast de error si falla

## Pruebas

- Test E2E: Establecer cuota de un buzón
- Test E2E: Ver uso de cuota
- Test E2E: Manejar errores al gestionar cuota

## Capacidades creadas

- CAP-025: Gestionar cuotas de buzón

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-015: Gestión de buzones - Establecer cuota
