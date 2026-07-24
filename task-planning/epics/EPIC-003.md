# EPIC-003: Gestión de Dominios

## Objetivo

Implementar el CRUD completo de dominios de correo.

## Capacidades

- **CAP-005**: CRUD de dominios

## Requisitos

- REQ-006: Gestión de dominios - Crear dominio
- REQ-007: Gestión de dominios - Habilitar/deshabilitar dominio
- REQ-008: Gestión de dominios - Eliminar dominio
- REQ-009: Gestión de dominios - Validar configuración

## Decisiones

- DEC-001: Modelo de autenticación (CLI subprocess)
- DEC-002: Contrato de comunicación (CLI)
- DEC-003: Modelo de datos (inferir desde comandos)

## Criterios de Verificación

- Se pueden listar dominios existentes
- Se puede crear un dominio nuevo
- Se puede habilitar/deshabilitar un dominio
- Se puede eliminar un dominio
- Se puede validar la configuración

## Dependencias

- EPIC-002: Dashboard y Componentes UI
