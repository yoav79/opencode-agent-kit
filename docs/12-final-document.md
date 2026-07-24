# MailAdmin - Software Blueprint

## Resumen Ejecutivo

**MailAdmin** es la interfaz web administrativa para la Plataforma de Correo existente. El sistema proporciona una interfaz moderna que invoca la capa de orquestación del backend (`mailctl`) para todas las operaciones administrativas.

### Datos Clave

| Aspecto | Valor |
|---------|-------|
| **Nombre** | MailAdmin |
| **Descripción** | Interfaz web administrativa para la Plataforma de Correo |
| **Frontend** | React + Next.js (framework rápido en Node.js) |
| **Backend** | mailctl (capa de orquestación) |
| **Automatización** | Ansible |
| **Módulos MVP** | 11 |

---

## 1. Arquitectura del Sistema

### 1.1 Diagrama de Arquitectura

```text
Navegador
   │
   ▼
WebUI (React + Next.js)
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

### 1.2 Principios Arquitectónicos

| Principio | Descripción |
|-----------|-------------|
| **Lógica de negocio en mailctl** | La WebUI NO implementa lógica de negocio |
| **Infraestructura vía Ansible** | Los cambios se ejecutan mediante automatización existente |
| **WebUI sin estado** | La interfaz no mantiene estado entre peticiones |
| **Operaciones idempotentes** | Las operaciones pueden ejecutarse múltiples veces sin efectos colaterales |
| **Auditoría completa** | Toda operación administrativa es auditable |
| **Resultados del backend** | La WebUI muestra resultados de validación sin modificarlos |

---

## 2. Restricciones Críticas

La WebUI **DEBERÁ**:

✅ Invocar `mailctl` para todas las operaciones administrativas
✅ Utilizar únicamente las interfaces del backend
✅ Preservar el comportamiento operativo existente
✅ Mantener la lógica de negocio dentro de `mailctl`

La WebUI **NO DEBERÁ**:

❌ Modificar PostgreSQL de forma directa
❌ Modificar archivos de configuración de Dovecot, Postfix ni del SO
❌ Reemplazar `mailctl`, Ansible, PostgreSQL, Dovecot ni Postfix

---

## 3. Stack Tecnológico

### 3.1 Frontend (WebUI)

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Framework** | React + Next.js | 18.x + 14.x |
| **Estilos** | Tailwind CSS | 3.x |
| **API Routes** | Next.js API Routes | 14.x |
| **Node.js** | Node.js | 22.x LTS |
| **Process Manager** | PM2 | 5.x |

### 3.2 Backend (Existente)

| Componente | Descripción |
|------------|-------------|
| **mailctl** | Capa de orquestación autorizada |
| **Ansible** | Motor de automatización de infraestructura |
| **PostgreSQL** | Base de datos de la plataforma |
| **Dovecot** | Servidor IMAP/POP3 |
| **Postfix** | Servidor SMTP |
| **NGINX** | Servidor web y proxy inverso |
| **Mailgun** | Servicio de correo transaccional |

---

## 4. Módulos Funcionales

### 4.1 Panel Principal (Dashboard)

| Funcionalidad | Descripción |
|---------------|-------------|
| Estado general | Vista resumida de la plataforma |
| Estado de servicios | Estado de PostgreSQL, Dovecot, Postfix, etc. |
| Estadísticas de correo | Métricas de la plataforma |
| Operaciones recientes | Últimas acciones realizadas |
| Alertas | Notificaciones del sistema |

### 4.2 Autenticación y Autorización

| Funcionalidad | Descripción |
|---------------|-------------|
| Login | Autenticación de administradores |
| Roles | Autorización basada en roles (RBAC) |
| Sesiones | Gestión de sesiones activas |

### 4.3 Gestión de Dominios

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Crear dominio | mailctl domain create |
| Habilitar dominio | mailctl domain enable |
| Deshabilitar dominio | mailctl domain disable |
| Eliminar dominio | mailctl domain delete |
| Validar configuración | mailctl validate |

### 4.4 Gestión de Buzones

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Crear buzón | mailctl mailbox create |
| Eliminar buzón | mailctl mailbox delete |
| Habilitar buzón | mailctl mailbox enable |
| Deshabilitar buzón | mailctl mailbox disable |
| Restablecer contraseña | mailctl passwd |
| Restablecimiento masivo | mailctl passwd --batch |
| Administrar cuotas | mailctl mailbox quota |
| Operaciones por lotes | mailctl mailbox batch |

### 4.5 Gestión de Aliases

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Crear alias | mailctl alias create |
| Eliminar alias | mailctl alias delete |
| Habilitar alias | mailctl alias enable |
| Deshabilitar alias | mailctl alias disable |

### 4.6 Identidades del Remitente

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Crear identidad | mailctl identity create |
| Actualizar identidad | mailctl identity update |
| Eliminar identidad | mailctl identity delete |
| Identidad predeterminada | mailctl identity default |

### 4.7 Listas de Distribución

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Crear lista | mailctl distribution create |
| Eliminar lista | mailctl distribution delete |
| Administrar miembros | mailctl distribution members |
| Actualizaciones por lotes | mailctl distribution batch |

### 4.8 Migración IMAP

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Iniciar migración | mailctl migrate start |
| Supervisar progreso | mailctl migrate status |
| Reintentar fallidos | mailctl migrate retry |
| Consultar resultados | mailctl migrate results |

### 4.9 Validación

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Validación de plataforma | mailctl validate platform |
| Validación de flujo de correo | mailctl validate flow |
| Validación de configuración | mailctl validate config |
| Validación en tiempo de ejecución | mailctl validate runtime |

### 4.10 Bitácoras

| Funcionalidad | Descripción |
|---------------|-------------|
| Bitácoras operativas | Registro de operaciones administrativas |
| Bitácoras de validación | Registro de validaciones |
| Historial de auditoría | Historial completo de acciones |

### 4.11 Administración de Servicios

| Funcionalidad | Descripción |
|---------------|-------------|
| Estado | Estado actual de los servicios |
| Reiniciar | Reiniciar servicios |
| Recargar | Recargar configuración |
| Información de salud | Health check de servicios |

---

## 5. Contrato del Backend

Toda acción realizada desde la WebUI **DEBERÁ** corresponder a una operación del backend implementada mediante `mailctl`.

| Acción en la WebUI | Backend |
|--------------------|---------|
| Crear buzón | mailctl mailbox create |
| Eliminar buzón | mailctl mailbox delete |
| Restablecer contraseña | mailctl passwd |
| Restablecimiento masivo | mailctl passwd --batch |
| Administrar alias | mailctl alias |
| Administrar identidades | mailctl identity |
| Administrar listas | mailctl distribution |
| Migración IMAP | mailctl migrate |
| Validación | mailctl validate |

---

## 6. Seguridad

La WebUI **DEBERÁ**:

- Autenticar a los administradores
- Aplicar autorización basada en roles
- No exponer secretos
- Auditar las acciones administrativas
- Utilizar TLS para todas las comunicaciones

---

## 7. Integraciones

| Sistema | Tipo | Descripción | Acceso |
|---------|------|-------------|--------|
| **mailctl** | Orquestación | Capa de orquestación autorizada | Directo vía API |
| **Ansible** | Automatización | Motor de automatización | Vía mailctl |
| **PostgreSQL** | Base de datos | Almacenamiento de datos | **NO directo** |
| **Dovecot** | Servidor IMAP/POP3 | Servidor de buzones | **NO directo** |
| **Postfix** | Servidor SMTP | Servidor de correo | **NO directo** |
| **NGINX** | Servidor web | Proxy inverso | Configuración existente |
| **Mailgun** | Servicio de correo | Correo transaccional | Configuración existente |

---

## 8. Lineamientos de Desarrollo

Los desarrolladores **DEBERÁN**:

1. Utilizar únicamente las interfaces del backend (`mailctl`)
2. Evitar modificaciones directas a la base de datos
3. Evitar cambios directos a la infraestructura
4. Preservar el comportamiento operativo existente
5. Mantener la lógica de negocio dentro de `mailctl`

---

## 9. Alcance

### 9.1 Incluido en MVP

| Módulo | Prioridad |
|--------|-----------|
| Panel Principal (Dashboard) | Crítica |
| Autenticación y Autorización | Crítica |
| Gestión de Dominios | Crítica |
| Gestión de Buzones | Crítica |
| Gestión de Aliases | Alta |
| Identidades del Remitente | Alta |
| Listas de Distribución | Alta |
| Migración IMAP | Media |
| Validación | Alta |
| Bitácoras | Alta |
| Administración de Servicios | Alta |

### 9.2 Excluido del MVP

- Reemplazar mailctl
- Reemplazar Ansible
- Reemplazar PostgreSQL
- Reemplazar Dovecot
- Reemplazar Postfix
- Modificación directa de la base de datos
- Modificación directa de archivos de configuración

---

## 10. Conclusión

Este documento establece la arquitectura correcta para MailAdmin:

- **mailctl** como la capa de orquestación
- **Ansible** como el motor de automatización de infraestructura
- **La WebUI** como la capa de presentación (React + Next.js)
- **Los servicios backend existentes** como el sistema de registro (System of Record)

Todo desarrollo futuro de MailAdmin **DEBERÁ** cumplir con estos principios arquitectónicos.

---

*Documento generado el 2026-07-18*
*Blueprint completo y listo para desarrollo*
