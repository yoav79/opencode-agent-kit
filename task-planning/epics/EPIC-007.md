# EPIC-007: Migración IMAP

## Objetivo

Implementar la supervisión de migraciones IMAP.

## Capacidades

- **CAP-010**: Supervisión de migración IMAP

## Requisitos

- REQ-028: Migración IMAP - Iniciar migración
- REQ-029: Migración IMAP - Supervisar progreso
- REQ-030: Migración IMAP - Reintentar fallidos
- REQ-031: Migración IMAP - Consultar resultados

## Decisiones

- DEC-001: Modelo de autenticación (CLI subprocess)
- DEC-002: Contrato de comunicación (CLI)

## Criterios de Verificación

- Se puede iniciar una migración
- Se puede supervisar el progreso
- Se pueden reintentar migraciones fallidas
- Se pueden consultar resultados

## Dependencias

- EPIC-006: Listas de Distribución
