# MailAdmin - Software Blueprint Resuelto

> **Blueprint original**: `docs/12-final-document.md`
> **Fecha de resolución**: 2026-07-22
> **Decisiones incorporadas**: DEC-001 a DEC-007

---

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
API del Backend (Next.js API Routes)
   │
   ▼
mailctl (CLI ejecutado vía subprocess)  [DEC-001, DEC-002]
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

## 4. Decisiones Arquitectónicas

### DEC-001: Modelo de autenticación de administradores

**Resolución**: **B** — CLI con subprocess

La WebUI ejecutará comandos mailctl como subprocessos de Node.js. La autenticación se maneja a nivel de sistema operativo (usuarios Unix).

**Consecuencias**:
- La WebUI necesita permisos de ejecución del binario mailctl en el servidor
- La gestión de sesiones se maneja a nivel de aplicación
- El parsing de salida de mailctl debe ser robusto

### DEC-002: Contrato de comunicación con mailctl

**Resolución**: **A** — CLI ejecutado vía subprocess

Todas las operaciones (dominios, buzones, aliases, etc.) se ejecutan vía CLI. La WebUI parsea stdout/stderr y retorna resultados.

**Consecuencias**:
- La salida de mailctl debe ser predecible y parseable
- Los errores se manejan vía stderr o códigos de salida
- No hay dependencia de API HTTP en mailctl

### DEC-003: Modelo de datos conceptual

**Resolución**: **A** — Inferir modelo desde comandos mailctl

La WebUI se diseña basándose en los comandos mailctl disponibles sin un modelo conceptual explícito. La validación se delega a mailctl.

**Consecuencias**:
- La WebUI no validará cardinalidades ni relaciones antes de enviar a mailctl
- Los formularios se diseñan según los parámetros que acepta cada comando
- Los errores de validación vienen del backend

### DEC-004: Roles y permisos RBAC

**Resolución**: **A** — Un solo rol: administrador

Un solo rol de administrador con todos los permisos. Todos los usuarios autenticados pueden realizar todas las operaciones.

**Consecuencias**:
- No hay granularidad de permisos
- No es necesario implementar lógica de autorización por rol
- Simplifica la implementación del módulo de autenticación

### DEC-005: Gestión de sesiones

**Resolución**: **A** — Sesiones HTTP-only cookies con timeout server-side

La WebUI usa cookies HTTP-only. El timeout se gestiona en la WebUI.

**Consecuencias**:
- La cookie es HTTP-only (no accesible desde JavaScript)
- El timeout es configurable vía variables de entorno
- La sesión se invalida eliminando la cookie
- Soporte natural para múltiples pestañas

### DEC-006: Despliegue y configuración de la WebUI

**Resolución**: **A** — Despliegue con PM2 y variables de entorno

La WebUI se despliega con PM2. La configuración se hace vía variables de entorno.

**Variables de entorno requeridas**:
- `NEXT_PUBLIC_MAILCTL_PATH`: Ruta al binario mailctl
- `SESSION_SECRET`: Secreto para firmar cookies de sesión
- `SESSION_TIMEOUT_MINUTES`: Timeout de sesión en minutos
- `NODE_ENV`: Entorno de ejecución (development/production)

### DEC-007: Manejo de errores y feedback al usuario

**Resolución**: **A** — Toasts y mensajes inline

Los errores se muestran como toast (éxito/error) y mensajes inline en formularios. No hay retry automático.

**Consecuencias**:
- Los errores de mailctl se muestran como notificaciones toast
- Los errores de formularios se muestran inline
- El usuario debe reintentar manualmente en caso de fallo

---

## 5. Módulos Funcionales

### 5.1 Panel Principal (Dashboard)

| Funcionalidad | Descripción |
|---------------|-------------|
| Estado general | Vista resumida de la plataforma |
| Estado de servicios | Estado de PostgreSQL, Dovecot, Postfix, etc. |
| Estadísticas de correo | Métricas de la plataforma |
| Operaciones recientes | Últimas acciones realizadas |
| Alertas | Notificaciones del sistema |

### 5.2 Autenticación y Autorización

| Funcionalidad | Descripción |
|---------------|-------------|
| Login | Autenticación de administradores |
| Sesiones | Gestión de sesiones activas (HTTP-only cookies) |

> **Nota**: Un solo rol de administrador (DEC-004). No hay granularidad de permisos.

### 5.3 Gestión de Dominios

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Crear dominio | mailctl domain create |
| Listar dominios | mailctl domain list |
| Editar dominio | mailctl domain update |
| Habilitar dominio | mailctl domain enable |
| Deshabilitar dominio | mailctl domain disable |
| Eliminar dominio | mailctl domain delete |
| Validar configuración | mailctl validate |

### 5.4 Gestión de Buzones

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Crear buzón | mailctl mailbox create |
| Listar buzones | mailctl mailbox list |
| Editar buzón | mailctl mailbox update |
| Eliminar buzón | mailctl mailbox delete |
| Habilitar buzón | mailctl mailbox enable |
| Deshabilitar buzón | mailctl mailbox disable |
| Restablecer contraseña | mailctl passwd |
| Restablecimiento masivo | mailctl passwd --batch |
| Administrar cuotas | mailctl mailbox quota |
| Operaciones por lotes | mailctl mailbox batch |

### 5.5 Gestión de Aliases

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Crear alias | mailctl alias create |
| Listar aliases | mailctl alias list |
| Editar alias | mailctl alias update |
| Eliminar alias | mailctl alias delete |
| Habilitar alias | mailctl alias enable |
| Deshabilitar alias | mailctl alias disable |

### 5.6 Identidades del Remitente

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Crear identidad | mailctl identity create |
| Actualizar identidad | mailctl identity update |
| Eliminar identidad | mailctl identity delete |
| Identidad predeterminada | mailctl identity default |

### 5.7 Listas de Distribución

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Crear lista | mailctl distribution create |
| Eliminar lista | mailctl distribution delete |
| Administrar miembros | mailctl distribution members |
| Actualizaciones por lotes | mailctl distribution batch |

### 5.8 Migración IMAP

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Iniciar migración | mailctl migrate start |
| Supervisar progreso | mailctl migrate status |
| Reintentar fallidos | mailctl migrate retry |
| Consultar resultados | mailctl migrate results |

### 5.9 Validación

| Funcionalidad | Comando mailctl |
|---------------|-----------------|
| Validación de plataforma | mailctl validate platform |
| Validación de flujo de correo | mailctl validate flow |
| Validación de configuración | mailctl validate config |
| Validación en tiempo de ejecución | mailctl validate runtime |

### 5.10 Bitácoras

| Funcionalidad | Descripción |
|---------------|-------------|
| Bitácoras operativas | Registro de operaciones administrativas |
| Bitácoras de validación | Registro de validaciones |
| Historial de auditoría | Historial completo de acciones |

### 5.11 Administración de Servicios

| Funcionalidad | Descripción |
|---------------|-------------|
| Estado | Estado actual de los servicios |
| Reiniciar | Reiniciar servicios |
| Recargar | Recargar configuración |
| Información de salud | Health check de servicios |

---

## 6. Contrato del Backend

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

## 7. Seguridad

La WebUI **DEBERÁ**:

- Autenticar a los administradores
- No exponer secretos
- Auditar las acciones administrativas
- Utilizar TLS para todas las comunicaciones
- Usar cookies HTTP-only para sesiones (DEC-005)

> **Nota**: Un solo rol de administrador (DEC-004). No hay autorización por roles.

---

## 8. Integraciones

| Sistema | Tipo | Descripción | Acceso |
|---------|------|-------------|--------|
| **mailctl** | Orquestación | Capa de orquestación autorizada | Directo vía CLI (subprocess) |
| **Ansible** | Automatización | Motor de automatización | Vía mailctl |
| **PostgreSQL** | Base de datos | Almacenamiento de datos | **NO directo** |
| **Dovecot** | Servidor IMAP/POP3 | Servidor de buzones | **NO directo** |
| **Postfix** | Servidor SMTP | Servidor de correo | **NO directo** |
| **NGINX** | Servidor web | Proxy inverso | Configuración existente |
| **Mailgun** | Servicio de correo | Correo transaccional | Configuración existente |

---

## 9. Lineamientos de Desarrollo

Los desarrolladores **DEBERÁN**:

1. Utilizar únicamente las interfaces del backend (`mailctl`)
2. Evitar modificaciones directas a la base de datos
3. Evitar cambios directos a la infraestructura
4. Preservar el comportamiento operativo existente
5. Mantener la lógica de negocio dentro de `mailctl`

---

## 10. Alcance

### 10.1 Incluido en MVP

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

### 10.2 Excluido del MVP

- Reemplazar mailctl
- Reemplazar Ansible
- Reemplazar PostgreSQL
- Reemplazar Dovecot
- Reemplazar Postfix
- Modificación directa de la base de datos
- Modificación directa de archivos de configuración

---

## 11. Trazabilidad de Requisitos

Los siguientes requisitos están documentados en `requirements.json` y cubiertos por el plan de construcción:

### REQ-001: Autenticación de administradores
La WebUI debe autenticar a los administradores antes de permitir acceso a las funcionalidades administrativas.

### REQ-002: Dashboard - Estado general
El panel principal muestra una vista resumida del estado de la plataforma de correo.

### REQ-003: Dashboard - Estado de servicios
El dashboard muestra el estado actual de PostgreSQL, Dovecot, Postfix y otros servicios.

### REQ-004: Dashboard - Estadísticas de correo
El dashboard muestra métricas de la plataforma de correo.

### REQ-005: Dashboard - Operaciones recientes
El dashboard muestra las últimas operaciones realizadas.

### REQ-006: Gestión de dominios - Crear dominio
El administrador puede crear nuevos dominios de correo electrónico.

### REQ-007: Gestión de dominios - Listar dominios
El administrador puede ver todos los dominios configurados.

### REQ-008: Gestión de dominios - Editar dominio
El administrador puede modificar la configuración de dominios existentes.

### REQ-009: Gestión de dominios - Eliminar dominio
El administrador puede eliminar dominios del sistema.

### REQ-010: Gestión de buzones - Crear buzón
El administrador puede crear nuevos buzones de correo.

### REQ-011: Gestión de buzones - Listar buzones
El administrador puede ver todos los buzones configurados.

### REQ-012: Gestión de buzones - Editar buzón
El administrador puede modificar la configuración de buzones existentes.

### REQ-013: Gestión de buzones - Eliminar buzón
El administrador puede eliminar buzones del sistema.

### REQ-014: Gestión de buzones - Cambiar contraseña
El administrador puede cambiar la contraseña de un buzón.

### REQ-015: Gestión de buzones - Establecer cuota
El administrador puede establecer cuotas de almacenamiento para buzones.

### REQ-016: Gestión de buzones - Ver uso de cuota
El administrador puede visualizar el uso actual de cuota de cada buzón.

### REQ-017: Gestión de aliases - Crear alias
El administrador puede crear nuevos aliases de correo electrónico.

### REQ-018: Gestión de aliases - Listar aliases
El administrador puede ver todos los aliases configurados.

### REQ-019: Gestión de aliases - Editar alias
El administrador puede modificar aliases existentes.

### REQ-020: Gestión de aliases - Eliminar alias
El administrador puede eliminar aliases del sistema.

### REQ-021: Gestión de identidades - Crear identidad
El administrador puede crear nuevas identidades de correo electrónico.

### REQ-022: Gestión de identidades - Listar identidades
El administrador puede ver todas las identidades configuradas.

### REQ-023: Gestión de identidades - Editar identidad
El administrador puede modificar identidades existentes.

### REQ-024: Gestión de identidades - Eliminar identidad
El administrador puede eliminar identidades del sistema.

### REQ-025: Gestión de identidades - Establecer identidad predeterminada
El administrador puede establecer cuál es la identidad predeterminada.

### REQ-026: Listas de distribución - Crear lista
El administrador puede crear nuevas listas de distribución.

### REQ-027: Listas de distribución - Listar listas
El administrador puede ver todas las listas de distribución configuradas.

### REQ-028: Listas de distribución - Eliminar lista
El administrador puede eliminar listas de distribución del sistema.

### REQ-029: Listas de distribución - Gestionar miembros
El administrador puede agregar y eliminar miembros de listas de distribución.

### REQ-030: Migración IMAP - Configurar migración
El administrador puede configurar e iniciar una migración IMAP.

### REQ-031: Migración IMAP - Monitorear progreso
El administrador puede supervisar el progreso de una migración en curso.

### REQ-032: Migración IMAP - Reintentar migración
El administrador puede reintentar una migración que falló.

### REQ-033: Migración IMAP - Ver resultados
El administrador puede consultar los resultados de una migración completada.

### REQ-034: Validación - Plataforma
El administrador puede ejecutar validaciones de plataforma.

### REQ-035: Validación - Flujo de correo
El administrador puede ejecutar validaciones de flujo de correo.

### REQ-036: Validación - Runtime
El administrador puede ejecutar validaciones de runtime.

### REQ-037: Validación - Ver resultados
El administrador puede consultar el historial de validaciones.

### REQ-038: Bitácoras - Operativas
El administrador puede visualizar bitácoras operativas del sistema.

### REQ-039: Bitácoras - Auditoría
El administrador puede visualizar bitácoras de auditoría.

### REQ-040: Bitácoras - Aplicación
El administrador puede visualizar bitácoras de aplicación.

### REQ-041: Servicios - Ver estado
El administrador puede visualizar el estado de los servicios del sistema.

### REQ-042: Servicios - Reiniciar
El administrador puede reiniciar servicios del sistema.

### REQ-043: Servicios - Recargar configuración
El administrador puede recargar la configuración de un servicio.

### REQ-044: Servicios - Health check
El administrador puede ejecutar un health check detallado de los servicios.

---

## 12. Conclusión

Este documento establece la arquitectura correcta para MailAdmin:

- **mailctl** como la capa de orquestación (acceso vía CLI subprocess)
- **Ansible** como el motor de automatización de infraestructura
- **La WebUI** como la capa de presentación (React + Next.js)
- **Los servicios backend existentes** como el sistema de registro (System of Record)

Todo desarrollo futuro de MailAdmin **DEBERÁ** cumplir con estos principios arquitectónicos.

---

*Documento generado el 2026-07-22*
*Blueprint resuelto con 7 decisiones confirmadas*
