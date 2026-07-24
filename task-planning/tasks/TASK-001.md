# TASK-001: Wrapper de ejecución de comandos mailctl

## Objetivo

Crear la utilidad `lib/mailctl.ts` que permite ejecutar comandos mailctl como subprocess y obtener stdout/stderr.

## Alcance

- SCOPE-001: Implementar función `executeMailctl(args: string[]): Promise<{stdout: string, stderr: string}>`
- SCOPE-002: Configurar path al binario mailctl desde variable de entorno `NEXT_PUBLIC_MAILCTL_PATH`
- SCOPE-003: Manejar errores de ejecución (comando no encontrado, timeout, etc.)

## Fuera de alcance

- Autenticación del usuario (se implementa en TASK-003)
- Gestión de sesiones (se implementa en TASK-002)
- UI de la aplicación

## Criterios de aceptación

- AC-001: La función `executeMailctl` ejecuta un comando y retorna stdout/stderr
- AC-002: La función maneja errores y retorna un error descriptivo
- AC-003: El path al binario mailctl se configura vía variable de entorno
- AC-004: La función está tipada correctamente con TypeScript

## Pruebas

- Test unitario: `executeMailctl` ejecuta un comando válido y retorna resultado
- Test unitario: `executeMailctl` maneja comando inexistente
- Test unitario: `executeMailctl` maneja timeout

## Capacidades creadas

- CAP-001: Ejecución de comandos mailctl

## Capacidades consumidas

Ninguna

## Cobertura de requisitos

- REQ-001: Autenticación de administradores (habilitador)
- REQ-006: Gestión de dominios - Crear dominio (habilitador)
- REQ-010: Gestión de buzones - Crear buzón (habilitador)
