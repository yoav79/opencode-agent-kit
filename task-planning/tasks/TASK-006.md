# TASK-006: Layout responsivo con navegación lateral

## Objetivo

Implementar el layout principal de la aplicación con navegación lateral responsiva.

## Alcance

- SCOPE-001: Crear layout base en `app/layout.tsx`
- SCOPE-002: Crear componente `Sidebar` con navegación a todos los módulos
- SCOPE-003: Implementar menú hamburguesa para mobile
- SCOPE-004: Mantener sidebar fijo en desktop
- SCOPE-005: Incluir header con información de usuario y botón de logout

## Fuera de alcance

- Dashboard y contenido de páginas
- Autenticación (ya implementada en TASK-003)
- Temas y personalización

## Criterios de aceptación

- AC-001: El sidebar muestra enlaces a todos los módulos del MVP
- AC-002: En desktop, el sidebar está siempre visible
- AC-003: En mobile, el sidebar se oculta y se muestra con menú hamburguesa
- AC-004: El header muestra el nombre del usuario y botón de logout
- AC-005: La navegación actual se resalta en el sidebar

## Pruebas

- Test E2E: La navegación funciona en desktop
- Test E2E: La navegación funciona en mobile
- Test E2E: El botón de logout cierra la sesión

## Capacidades creadas

- CAP-016: Layout responsivo con navegación

## Capacidades consumidas

- CAP-014: Componentes UI reutilizables

## Cobertura de requisitos

- REQ-002: Dashboard - Estado general (habilitador)
