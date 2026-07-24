# TASK-031: Configurar migración IMAP

## Objetivo

Implementar la funcionalidad para configurar y iniciar una migración IMAP.

## Alcance

- SCOPE-001: Crear página `app/migration/new/page.tsx`
- SCOPE-002: Formulario con campos: servidor origen, puerto, usuario, contraseña, buzón destino
- SCOPE-003: Validación de campos (formato de servidor, puerto válido)
- SCOPE-004: Llamada a `mailctl migration start`
- SCOPE-005: Manejo de errores (conexión fallida, credenciales inválidas)
- SCOPE-006: Redirección a dashboard de migración tras iniciar

## Fuera de alcance

- Monitoreo en tiempo real de la migración
- Historial de migraciones
- Cancelación de migración

## Criterios de aceptación

- AC-001: El formulario muestra campos para configuración IMAP
- AC-002: La validación de campos funciona correctamente
- AC-003: Al enviar, se ejecuta `mailctl migration start`
- AC-004: Si la conexión falla, se muestra error
- AC-005: Si la migración inicia exitosamente, se redirige al dashboard
- AC-006: Se muestra toast de éxito al iniciar

## Pruebas

- Test E2E: Configurar e iniciar una migración
- Test E2E: Intentar iniciar con credenciales inválidas
- Test E2E: Validar formato de campos

## Capacidades creadas

- CAP-048: Configurar migración IMAP

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-003: Autenticación de administrador
- CAP-014: Componentes UI reutilizables
- CAP-015: Manejo de errores con toast
- CAP-016: Layout responsivo con navegación

## Cobertura de requisitos

- REQ-028: Migración IMAP - Configurar migración
