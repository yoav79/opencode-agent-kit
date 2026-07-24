# TASK-016: Cambiar contraseña de buzón

## Objetivo

Implementar la funcionalidad para cambiar la contraseña de un buzón de correo.

## Alcance

- SCOPE-001: Botón de cambiar contraseña en tabla de buzones
- SCOPE-002: Diálogo/modal con campo de nueva contraseña
- SCOPE-003: Llamada a `mailctl mailbox password`
- SCOPE-004: Validación de contraseña (mínimo 8 caracteres)
- SCOPE-005: Manejo de errores
- SCOPE-006: Toast de confirmación tras cambio exitoso

## Fuera de alcance

- Restablecimiento de contraseña
- Políticas de contraseñas
- Historial de contraseñas

## Criterios de aceptación

- AC-001: El diálogo muestra campo para nueva contraseña
- AC-002: La validación de contraseña funciona correctamente
- AC-003: Al enviar, se ejecuta `mailctl mailbox password`
- AC-004: Si el cambio es exitoso, se muestra toast de confirmación
- AC-005: Se muestra toast de error si falla

## Pruebas

- Test E2E: Cambiar contraseña de un buzón
- Test E2E: Validar formato de contraseña
- Test E2E: Manejar errores al cambiar contraseña

## Capacidades creadas

- CAP-024: Cambiar contraseña de buzón

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-014: Gestión de buzones - Cambiar contraseña
