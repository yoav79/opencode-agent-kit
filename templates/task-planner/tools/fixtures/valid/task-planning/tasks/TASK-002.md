# TASK-002 — Capa de API routes de Next.js

## Objetivo

Establecer la capa de API routes de Next.js que permite invocar `mailctl` desde el servidor sin exponer credenciales al cliente.

## Capacidades creadas

- CAP-API-LAYER

## Capacidades consumidas

- CAP-SCAFFOLD

## Alcance

- SCOPE-002: Implementar la estructura de API routes con integración a mailctl.

## Fuera de alcance

- Cualquier funcionalidad específica de dominios (create, enable, disable, delete, validate).

## Criterios de aceptación

- AC-001: Las API routes están disponibles bajo `/api/`.
- AC-002: La capa puede invocar comandos de `mailctl` desde el servidor.
- AC-003: Las credenciales no se exponen al cliente.

## Pruebas

- Invocación de una API route de prueba que llama a `mailctl`.
- Verificación de que la respuesta llega al cliente sin credenciales.

## Contrato semántico

```json
{
  "behaviorIds": [],
  "semanticKeys": [],
  "sourceFunctionIds": [],
  "backendBindings": []
}
```
