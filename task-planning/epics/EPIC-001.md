# EPIC-001: Infraestructura Base y Autenticación

## Objetivo

Establecer la base del proyecto Next.js con autenticación funcional y conexión a mailctl.

## Capacidades

- **CAP-001**: Ejecución de comandos mailctl
- **CAP-002**: Sesión HTTP-only cookie
- **CAP-003**: Autenticación de administrador

## Requisitos

- REQ-001: Autenticación de administradores

## Decisiones

- DEC-001: Modelo de autenticación (CLI subprocess)
- DEC-002: Contrato de comunicación (CLI)
- DEC-004: Roles RBAC (un solo rol)
- DEC-005: Gestión de sesiones (HTTP-only cookies)

## Criterios de Verificación

- El proyecto Next.js compila sin errores
- La página de login se muestra correctamente
- Se puede autenticar contra mailctl
- La sesión se almacena en HTTP-only cookie
- El timeout de sesión funciona correctamente

## Dependencias

Ninguna (épica inicial).
