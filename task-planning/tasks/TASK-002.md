# TASK-002: Sistema de sesiones con HTTP-only cookies

## Objetivo

Implementar el sistema de sesiones utilizando cookies HTTP-only con timeout configurable.

## Alcance

- SCOPE-001: Crear función `createSession(userId: string)` que genera cookie HTTP-only
- SCOPE-002: Crear función `validateSession(cookie: string): Promise<string | null>` que valida la cookie
- SCOPE-003: Crear función `destroySession(cookie: string)` que elimina la cookie
- SCOPE-004: Configurar timeout de sesión vía variable de entorno `SESSION_TIMEOUT_MINUTES`
- SCOPE-005: Implementar firma de cookie con `SESSION_SECRET`

## Fuera de alcance

- UI de login (se implementa en TASK-003)
- Persistencia de sesiones en base de datos
- Gestión de múltiples sesiones concurrentes

## Criterios de aceptación

- AC-001: La cookie es HTTP-only (no accesible desde JavaScript)
- AC-002: La cookie tiene timeout configurable (default: 30 minutos)
- AC-003: La cookie está firmada con `SESSION_SECRET`
- AC-004: La función `validateSession` retorna el userId o null
- AC-005: La función `destroySession` elimina la cookie

## Pruebas

- Test unitario: `createSession` genera una cookie válida
- Test unitario: `validateSession` retorna userId para cookie válida
- Test unitario: `validateSession` retorna null para cookie inválida
- Test unitario: `destroySession` elimina la cookie

## Capacidades creadas

- CAP-002: Sesión HTTP-only cookie

## Capacidades consumidas

- CAP-001: Ejecución de comandos mailctl (para futuras validaciones)

## Cobertura de requisitos

- REQ-001: Autenticación de administradores (habilitador)
