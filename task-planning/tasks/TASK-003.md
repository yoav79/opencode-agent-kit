# TASK-003: Página de login y autenticación

## Objetivo

Implementar la página de login que permite a los administradores autenticarse contra mailctl.

## Alcance

- SCOPE-001: Crear página `app/login/page.tsx` con formulario de login
- SCOPE-002: Implementar función `authenticate(username: string, password: string): Promise<boolean>`
- SCOPE-003: Integrar con `executeMailctl` para validar credenciales
- SCOPE-004: Integrar con `createSession` para crear sesión después de autenticar
- SCOPE-005: Redirigir a `/dashboard` después de login exitoso
- SCOPE-006: Mostrar errores de autenticación al usuario

## Fuera de alcance

- Dashboard y otras páginas (se implementan en TASK-004)
- Gestión de roles (un solo rol de administrador)
- Recuperación de contraseña

## Criterios de aceptación

- AC-001: El formulario muestra campos de username y password
- AC-002: El formulario valida que ambos campos estén llenos
- AC-003: Al enviar, se ejecuta `authenticate` contra mailctl
- AC-004: Si la autenticación es exitosa, se crea sesión y se redirige a `/dashboard`
- AC-005: Si la autenticación falla, se muestra error al usuario
- AC-006: El formulario muestra loading state durante la autenticación

## Pruebas

- Test E2E: El usuario puede hacer login con credenciales válidas
- Test E2E: El usuario ve error con credenciales inválidas
- Test E2E: El usuario es redirigido a `/dashboard` después de login

## Capacidades creadas

- CAP-003: Autenticación de administrador

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl
- CAP-002: Sesión HTTP-only cookie

## Cobertura de requisitos

- REQ-001: Autenticación de administradores
