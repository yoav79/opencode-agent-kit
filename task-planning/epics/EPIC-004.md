# EPIC-004: Gestión de Buzones

## Objetivo

Implementar el CRUD completo de buzones de correo con operaciones avanzadas.

## Capacidades

- **CAP-006**: CRUD de buzones

## Requisitos

- REQ-010: Gestión de buzones - Crear buzón
- REQ-011: Gestión de buzones - Eliminar buzón
- REQ-012: Gestión de buzones - Habilitar/deshabilitar buzón
- REQ-013: Gestión de buzones - Restablecer contraseña
- REQ-014: Gestión de buzones - Restablecimiento masivo
- REQ-015: Gestión de buzones - Administrar cuotas
- REQ-016: Gestión de buzones - Operaciones por lotes

## Decisiones

- DEC-001: Modelo de autenticación (CLI subprocess)
- DEC-002: Contrato de comunicación (CLI)
- DEC-003: Modelo de datos (inferir desde comandos)

## Criterios de Verificación

- Se pueden listar buzones existentes
- Se puede crear un buzón nuevo
- Se puede habilitar/deshabilitar un buzón
- Se puede eliminar un buzón
- Se puede restablecer contraseña
- Se pueden realizar operaciones en lote

## Dependencias

- EPIC-003: Gestión de Dominios
