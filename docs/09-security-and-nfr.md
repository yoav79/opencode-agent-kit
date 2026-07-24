# Fase 9: Seguridad y Requisitos No Funcionales

## 1. Seguridad

### 1.1 Autenticación y Autorización

| Requisito | Implementación |
|-----------|----------------|
| **Autenticación** | Login de administradores |
| **Autorización** | Basada en roles (RBAC) |
| **Sesiones** | Gestión de sesiones activas |
| **Secretos** | No expuestos en la WebUI |

### 1.2 Transporte

| Requisito | Implementación |
|-----------|----------------|
| **TLS** | Comunicaciones cifradas |
| **HTTPS** | Certificados SSL configurados |

### 1.3 Auditoría

| Requisito | Implementación |
|-----------|----------------|
| **Registro de acciones** | Toda operación es auditable |
| **Bitácoras** | Logs de operaciones y validación |
| **Historial** | Historial completo de acciones |

### 1.4 Restricciones de Seguridad

| Restricción | Descripción |
|-------------|-------------|
| **NO acceso directo a DB** | La WebUI nunca accede directamente a PostgreSQL |
| **NO modificación de config** | La WebUI nunca modifica archivos de configuración |
| **Invocación de mailctl** | Todas las operaciones pasan por mailctl |
| **Resultados del backend** | La WebUI muestra resultados sin modificarlos |

## 2. Requisitos No Funcionales

### 2.1 Disponibilidad

| Requisito | Valor |
|-----------|-------|
| **Disponibilidad** | 99% 24/7 |
| **Tiempo máximo de inactividad** | < 5 minutos |

### 2.2 Rendimiento

| Requisito | Valor |
|-----------|-------|
| **Tiempo de respuesta** | < 2 segundos |
| **Usuarios concurrentes** | 5 |
| **Solicitudes por segundo** | < 50 |

### 2.3 Escalabilidad

| Requisito | Valor |
|-----------|-------|
| **Usuarios concurrentes** | 5 (MVP) → 50+ (futuro) |
| **Buzones gestionados** | 50 (MVP) → Miles (futuro) |

### 2.4 Mantenibilidad

| Requisito | Valor |
|-----------|-------|
| **Estándares de código** | ESLint |
| **Versionado** | Git |

## 3. Princípios Arquitectónicos de Seguridad

| Principio | Descripción |
|-----------|-------------|
| **Lógica de negocio en mailctl** | La WebUI NO implementa lógica de negocio |
| **Infraestructura vía Ansible** | Los cambios se ejecutan mediante automatización |
| **WebUI sin estado** | La interfaz no mantiene estado |
| **Operaciones idempotentes** | Las operaciones pueden ejecutarse múltiples veces |
| **Auditoría completa** | Toda operación administrativa es auditable |

## 4. Próximos pasos

1. ~~Aprobar seguridad y requisitos no funcionales~~ ✓ COMPLETADO
2. Avanzar a fase 10 (Plan de construcción)
