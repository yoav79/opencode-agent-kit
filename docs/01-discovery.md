# Fase 1: Descubrimiento

## 1. Problema

La Plataforma de Correo necesita una interfaz web moderna para administrar las operaciones existentes. Actualmente se ejecutan comandos `mailctl` vía CLI, lo cual es manual y propenso a errores.

## 2. Solución Propuesta

**MailAdmin** proporcionará una interfaz web que invocará `mailctl` para todas las operaciones administrativas, manteniendo la arquitectura existente.

### 2.1 Restricciones Críticas

La WebUI **DEBERÁ**:
- ✅ Invocar `mailctl` para todas las operaciones
- ✅ Utilizar únicamente las interfaces del backend
- ✅ Preservar el comportamiento operativo existente

La WebUI **NO DEBERÁ**:
- ❌ Modificar PostgreSQL directamente
- ❌ Modificar archivos de configuración de Dovecot/Postfix
- ❌ Reemplazar `mailctl`, Ansible, ni otros servicios

## 3. Arquitectura del Sistema

```text
Navegador
   │
   ▼
WebUI de MailAdmin
   │
   ▼
API del Backend
   │
   ▼
mailctl
   │
   ▼
Ansible
   │
   ├── PostgreSQL
   ├── Dovecot
   ├── Postfix
   ├── NGINX
   ├── Almacenamiento de Correo
   └── Mailgun
```

## 4. Principios Arquitectónicos

| Principio | Descripción |
|-----------|-------------|
| **Lógica de negocio en mailctl** | La WebUI NO implementa lógica de negocio |
| **Infraestructura vía Ansible** | Los cambios se ejecutan mediante automatización existente |
| **WebUI sin estado** | La interfaz no mantiene estado entre peticiones |
| **Operaciones idempotentes** | Las operaciones pueden ejecutarse múltiples veces |
| **Auditoría completa** | Toda operación administrativa es auditable |

## 5. Módulos Identificados

| # | Módulo | Prioridad | Descripción |
|---|--------|-----------|-------------|
| 1 | Panel Principal | Crítica | Dashboard con estado, servicios, estadísticas |
| 2 | Autenticación | Crítica | Login y autorización basada en roles |
| 3 | Dominios | Crítica | CRUD de dominios |
| 4 | Buzones | Crítica | CRUD de buzones, contraseñas, cuotas |
| 5 | Aliases | Alta | CRUD de aliases |
| 6 | Identidades | Alta | Gestión de identidades del remitente |
| 7 | Listas Distribución | Alta | Gestión de listas de distribución |
| 8 | Migración IMAP | Media | Migración de buzones IMAP |
| 9 | Validación | Alta | Validación de plataforma y configuración |
| 10 | Bitácoras | Alta | Logs de operaciones y auditoría |
| 11 | Servicios | Alta | Administración de servicios backend |

## 6. Contrato del Backend

| Acción en la WebUI | Backend |
|--------------------|---------|
| Crear buzón | mailctl mailbox create |
| Eliminar buzón | mailctl mailbox delete |
| Restablecer contraseña | mailctl passwd |
| Administrar alias | mailctl alias |
| Administrar identidades | mailctl identity |
| Administrar listas | mailctl distribution |
| Migración IMAP | mailctl migrate |
| Validación | mailctl validate |

## 7. Restricciones

- **mailctl** es la capa de orquestación autorizada
- **Ansible** administra la infraestructura
- La WebUI es **sin estado** (stateless)
- Las operaciones deben ser **idempotentes**
- Toda operación es **auditable**

## 8. Próximos pasos

1. ~~Descubrimiento~~ ✓ COMPLETADO
2. Avanzar a fase 2 (Definición ejecutiva)
