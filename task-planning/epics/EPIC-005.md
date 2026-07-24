# EPIC-005: Gestión de Aliases e Identidades

## Objetivo

Implementar el CRUD de aliases e identidades del remitente.

## Capacidades

- **CAP-007**: CRUD de aliases
- **CAP-008**: CRUD de identidades

## Requisitos

- REQ-017: Gestión de aliases - Crear alias
- REQ-018: Gestión de aliases - Eliminar alias
- REQ-019: Gestión de aliases - Habilitar/deshabilitar alias
- REQ-020: Identidades del remitente - Crear identidad
- REQ-021: Identidades del remitente - Actualizar identidad
- REQ-022: Identidades del remitente - Eliminar identidad
- REQ-023: Identidades del remitente - Identidad predeterminada

## Decisiones

- DEC-001: Modelo de autenticación (CLI subprocess)
- DEC-002: Contrato de comunicación (CLI)
- DEC-003: Modelo de datos (inferir desde comandos)

## Criterios de Verificación

- Se pueden listar aliases existentes
- Se puede crear un alias nuevo
- Se pueden listar identidades existentes
- Se puede crear una identidad nueva
- Se puede establecer identidad predeterminada

## Dependencias

- EPIC-004: Gestión de Buzones
