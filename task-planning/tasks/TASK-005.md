# TASK-005: Sistema de manejo de errores con toast

## Objetivo

Implementar el sistema de notificaciones toast para mostrar errores y éxitos al usuario.

## Alcance

- SCOPE-001: Crear componente `Toast` con variantes (success, error, warning, info)
- SCOPE-002: Crear hook `useToast()` para mostrar toasts programáticamente
- SCOPE-003: Implementar auto-dismiss después de 5 segundos
- SCOPE-004: Soportar múltiples toasts simultáneos
- SCOPE-005: Posicionar toasts en la esquina superior derecha

## Fuera de alcance

- Persistencia de toasts
- Notificaciones push
- Sonidos de notificación

## Criterios de aceptación

- AC-001: El toast muestra un mensaje con icono según el tipo
- AC-002: El toast se cierra automáticamente después de 5 segundos
- AC-003: El toast se puede cerrar manualmente haciendo clic
- AC-004: Se pueden mostrar múltiples toasts simultáneamente
- AC-005: Los toasts no se superponen entre sí

## Pruebas

- Test unitario: `useToast` muestra un toast con el mensaje correcto
- Test unitario: El toast se cierra después del timeout
- Test E2E: Se muestra toast al realizar una acción exitosa
- Test E2E: Se muestra toast de error al fallar una operación

## Capacidades creadas

- CAP-015: Manejo de errores con toast

## Capacidades consumidas

- CAP-014: Componentes UI reutilizables

## Cobertura de requisitos

- REQ-006: Gestión de dominios - Crear dominio (habilitador)
- REQ-010: Gestión de buzones - Crear buzón (habilitador)
- REQ-017: Gestión de aliases - Crear alias (habilitador)
