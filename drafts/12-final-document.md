# SysAdmin Mail - Software Blueprint

## Resumen Ejecutivo

**SysAdmin Mail** es un sistema web de administración de buzones de correo diseñado para reemplazar el uso manual de Ansible playbooks en una infraestructura Dovecot/Postfix. El sistema proporciona una interfaz web centralizada que permite al administrador realizar todas las operaciones de gestión de buzones de correo de forma eficiente y segura.

### Datos Clave

| Aspecto | Valor |
|---------|-------|
| **Nombre** | SysAdmin Mail |
| **Descripción** | Panel de administración web para buzones de correo |
| **Equipo** | 1 humano + 1 IA |
| **Presupuesto** | Cero |
| **Plazo** | ASAP |
| **Base de datos** | PostgreSQL 16 (existente) |
| **Arquitectura** | Monolítica Next.js en VMware |

---

## 1. Problema y Solución

### 1.1 Problema
El administrador de correo necesita un panel de administración web para gestionar buzones de correo en una infraestructura Dovecot/Postfix. Actualmente utiliza Ansible playbooks ejecutados vía CLI, lo cual es un proceso manual, propenso a errores y difícil de escalar.

### 1.2 Solución
SysAdmin Mail reemplazará la gestión manual con una interfaz web centralizada que permitirá:
- Gestión unificada de buzones, aliases, dominios, quotas y certificados SSL
- Automatización de tareas manuales repetitivas
- Seguridad con autenticación de dos factores y auditoría completa
- Escalabilidad de 50 a miles de buzones

### 1.3 Propuesta de Valor

| Beneficio | Descripción |
|-----------|-------------|
| **Ahorro de tiempo** | Reducción significativa del tiempo de gestión |
| **Reducción de errores** | Eliminación de errores humanos comunes |
| **Interfaz intuitiva** | Diseño fácil de usar |
| **Seguridad mejorada** | 2FA y auditoría completa |

---

## 2. Alcance

### 2.1 Incluido en MVP

| Funcionalidad | Descripción |
|---------------|-------------|
| Gestión de buzones | Crear, eliminar, modificar buzones de correo |
| Gestión de contraseñas | Modificar contraseñas de usuarios |
| Gestión de quotas | Configurar límites de disco por usuario |
| Gestión de aliases | Crear, modificar, eliminar aliases y redirecciones |
| Gestión de dominios | Administrar dominios de correo |
| Logs de entrega | Visualizar logs de entrega de correo |
| Bloqueo/desbloqueo | Bloquear y desbloquear usuarios |
| Certificados SSL | Renovación automática, visualización, instalación, alertas |
| Auditoría | Registro de acciones realizadas por el administrador |
| Seguridad | 2FA, restricción por IP, logs de seguridad |

### 2.2 Excluido del MVP

- Control de servidores (monitoreo, gestión de servicios)
- Portal de auto-servicio para usuarios finales
- Configuración de Postfix, Dovecot u otros servicios
- Integración con directorio externo (LDAP/AD)

---

## 3. Usuarios y Actores

### 3.1 Actor Principal

| Actor | Rol | Descripción | Permisos |
|-------|-----|-------------|----------|
| **Administrador de correo** | admin | Único usuario del sistema | Acceso completo a todas las funcionalidades |

### 3.2 Beneficiarios

| Beneficiario | Descripción |
|--------------|-------------|
| **Empleados de la empresa** | Usuarios de correo que se benefician de una gestión más rápida y eficiente |

---

## 4. Catálogo de Módulos

### 4.1 Módulos MVP

| # | Módulo | Prioridad | Dependencias | Duración |
|---|--------|-----------|--------------|----------|
| 1 | **Autenticación** | Crítica | Ninguna | 1 día |
| 2 | **Gestión de Dominios** | Crítica | Ninguna | 1 día |
| 3 | **Gestión de Buzones** | Crítica | Dominios | 2 días |
| 4 | **Gestión de Aliases** | Alta | Buzones | 1 día |
| 5 | **Bloqueo/Desbloqueo** | Alta | Buzones | 1 día |
| 6 | **Logs de Entrega** | Media | Ninguna | 1 día |
| 7 | **Certificados SSL** | Alta | Dominios | 2 días |
| 8 | **Auditoría** | Alta | Ninguna | 1 día |
| 9 | **Configuración** | Media | Ninguna | 1 día |

**Total estimado: 11 días de desarrollo**

### 4.2 Diagrama de Dependencias

```
Autenticación (F1)
  ↓
Dominios (F2)
  ↓
Buzones (F3) ←─────────────────┐
  ↓                               │
Aliases (F4)                      │
Bloqueo/Desbloqueo (F5)           │
                                  │
Logs (F6) ──────────────────────┐ │
Certificados SSL (F7) ←─────────┤ │
Auditoría (F8) ─────────────────┤ │
Configuración (F9) ─────────────┘ │
                                  │
                                  └──→ Dependencias de Buzones
```

---

## 5. Requisitos Funcionales

### 5.1 Autenticación (4 requisitos)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-AUTH-001 | Inicio de sesión | Login con email + contraseña |
| RF-AUTH-002 | Verificación 2FA | Código de verificación de dos factores |
| RF-AUTH-003 | Gestión de sesiones | Expiración por inactividad (30 min) |
| RF-AUTH-004 | Bloqueo por intentos | 5 intentos → bloqueo 15 minutos |

### 5.2 Gestión de Buzones (6 requisitos)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-MAIL-001 | Crear buzón | Crear nuevo buzón de correo |
| RF-MAIL-002 | Eliminar buzón | Eliminar buzón existente |
| RF-MAIL-003 | Modificar buzón | Modificar quota y estado |
| RF-MAIL-004 | Cambiar contraseña | Cambiar contraseña de buzón |
| RF-MAIL-005 | Configurar quota | Configurar límite de disco (máx 5GB) |
| RF-MAIL-006 | Listar buzones | Ver lista con búsqueda y filtros |

### 5.3 Gestión de Dominios (4 requisitos)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-DOM-001 | Agregar dominio | Crear nuevo dominio |
| RF-DOM-002 | Eliminar dominio | Eliminar dominio existente |
| RF-DOM-003 | Modificar dominio | Cambiar estado del dominio |
| RF-DOM-004 | Listar dominios | Ver lista con búsqueda |

### 5.4 Gestión de Aliases (4 requisitos)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-ALI-001 | Crear alias | Crear nuevo alias de correo |
| RF-ALI-002 | Eliminar alias | Eliminar alias existente |
| RF-ALI-003 | Modificar alias | Cambiar destino y estado |
| RF-ALI-004 | Listar aliases | Ver lista con búsqueda y filtros |

### 5.5 Logs de Entrega (3 requisitos)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-LOG-001 | Ver logs recientes | Últimos 100 registros |
| RF-LOG-002 | Buscar logs | Filtros por fecha, remitente, destinatario |
| RF-LOG-003 | Exportar logs | Exportar a CSV |

### 5.6 Bloqueo/Desbloqueo (3 requisitos)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-BLK-001 | Bloquear usuario | Bloquear acceso de usuario |
| RF-BLK-002 | Desbloquear usuario | Restaurar acceso de usuario |
| RF-BLK-003 | Ver usuarios bloqueados | Lista de usuarios bloqueados |

### 5.7 Certificados SSL (4 requisitos)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-SSL-001 | Ver estado | Estado de todos los certificados |
| RF-SSL-002 | Renovar certificado | Renovación vía Let's Encrypt |
| RF-SSL-003 | Configurar alertas | Alertas 30, 15, 7 días antes |
| RF-SSL-004 | Ver historial | Historial de renovaciones |

### 5.8 Auditoría (3 requisitos)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-AUD-001 | Registrar acción | Registro automático de acciones |
| RF-AUD-002 | Ver historial | Historial de acciones |
| RF-AUD-003 | Exportar historial | Exportar a CSV |

### 5.9 Configuración (3 requisitos)

| ID | Requisito | Descripción |
|----|-----------|-------------|
| RF-CFG-001 | Ver configuración | Parámetros del sistema |
| RF-CFG-002 | Modificar configuración | Cambiar parámetros |
| RF-CFG-003 | Restablecer configuración | Valores por defecto |

**Total: 33 requisitos funcionales**

---

## 6. Modelo de Datos

### 6.1 Entidades

#### Usuario (Buzón)
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| usuario | VARCHAR(64) | Obligatorio, único por dominio |
| dominio_id | UUID | FK → Dominio.id, obligatorio |
| contraseña_hash | VARCHAR(255) | Obligatorio |
| quota | BIGINT | Default 1GB, máx 5GB |
| estado | ENUM | activo, inactivo, bloqueado |
| fecha_creación | TIMESTAMP | Auto-generado |

#### Dominio
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| nombre | VARCHAR(255) | Obligatorio, único, formato DNS |
| estado | ENUM | activo, inactivo |
| fecha_creación | TIMESTAMP | Auto-generado |

#### Alias
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| alias | VARCHAR(64) | Obligatorio, único por dominio |
| destino | TEXT | Obligatorio, formato email |
| dominio_id | UUID | FK → Dominio.id, obligatorio |
| estado | ENUM | activo, inactivo |
| fecha_creación | TIMESTAMP | Auto-generado |

#### Log
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| fecha | DATE | Obligatorio |
| hora | TIME | Obligatorio |
| remitente | VARCHAR(255) | Obligatorio |
| destinatario | VARCHAR(255) | Obligatorio |
| estado | ENUM | entregado, rechazado, pendiente |
| tamaño | BIGINT | Obligatorio |
| servidor | VARCHAR(255) | Obligatorio |

#### Auditoría
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| timestamp | TIMESTAMP | Auto-generado |
| usuario | VARCHAR(255) | Obligatorio |
| acción | VARCHAR(100) | Obligatorio |
| módulo | VARCHAR(50) | Obligatorio |
| detalles | TEXT | Opcional |
| ip_origen | VARCHAR(45) | Obligatorio |

#### Configuración
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| parámetro | VARCHAR(100) | Obligatorio, único |
| valor | TEXT | Obligatorio |
| fecha_modificación | TIMESTAMP | Auto-generado |

#### Certificado
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | UUID | PK, auto-generado |
| dominio_id | UUID | FK → Dominio.id, obligatorio |
| fecha_emisión | DATE | Obligatorio |
| fecha_expiración | DATE | Obligatorio |
| estado | ENUM | válido, próximo_a_vencer, vencido |
| emisor | VARCHAR(255) | Obligatorio |

### 6.2 Diagrama Entidad-Relación

```
┌─────────────────┐         ┌─────────────────┐
│    Dominio      │         │   Certificado   │
├─────────────────┤         ├─────────────────┤
│ PK id           │◄───┐    │ PK id           │
│    nombre       │    │    │ FK dominio_id   │
│    estado       │    │    │    fecha_emisión │
│    fecha_creación│    │    │    fecha_expiración│
└────────┬────────┘    │    │    estado       │
         │             │    │    emisor       │
         │             │    └─────────────────┘
         │             │
         │             │    ┌─────────────────┐
         │             │    │    Alias        │
         │             │    ├─────────────────┤
         │             ├───►│ PK id           │
         │             │    │    alias        │
         │             │    │    destino      │
         │             │    │ FK dominio_id   │
         │             │    │    estado       │
         │             │    │    fecha_creación│
         │             │    └─────────────────┘
         │             │
         │             │    ┌─────────────────┐
         │             │    │  Usuario/Buzón  │
         │             │    ├─────────────────┤
         └─────────────┴───►│ PK id           │
                            │    usuario      │
                            │ FK dominio_id   │
                            │    contraseña_hash│
                            │    quota        │
                            │    estado       │
                            │    fecha_creación│
                            └─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│    Auditoría    │    │  Configuración  │
├─────────────────┤    ├─────────────────┤
│ PK id           │    │ PK id           │
│    timestamp    │    │    parámetro    │
│    usuario      │    │    valor        │
│    acción       │    │    fecha_modificación│
│    módulo       │    └─────────────────┘
│    detalles     │
│    ip_origen    │    ┌─────────────────┐
└─────────────────┘    │      Log        │
                       ├─────────────────┤
                       │ PK id           │
                       │    fecha        │
                       │    hora         │
                       │    remitente    │
                       │    destinatario │
                       │    estado       │
                       │    tamaño       │
                       │    servidor     │
                       └─────────────────┘
```

---

## 7. Arquitectura

### 7.1 Estilo Arquitectónico
**Monolítica (Fullstack)** con Next.js

### 7.2 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Frontend** | React + Next.js | 18.x + 14.x |
| **Estilos** | Tailwind CSS | 3.x |
| **Backend** | Next.js API Routes | 14.x |
| **Driver DB** | pg (node-postgres) | 8.x |
| **Base de datos** | PostgreSQL | 16 |
| **Autenticación** | JWT + bcrypt + speakeasy | - |
| **Validación** | Zod | 3.x |
| **Reverse Proxy** | Nginx | 1.x |
| **Certificados** | Let's Encrypt + Certbot | - |
| **SSH** | ssh2 | 1.x |
| **Node.js** | Node.js | 22.x LTS |
| **SO** | Linux (Ubuntu/CentOS) | - |
| **Process Manager** | PM2 | 5.x |

### 7.3 Diagrama de Arquitectura

```
                    ┌─────────────────┐
                    │   Internet      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Balanceador   │
                    │     de Carga    │
                    │    (Nginx)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────────┐ ┌──▼───────────┐ ┌▼────────────────┐
     │  Servidor 1     │ │  Servidor 2  │ │  Servidor N     │
     │  (VMware VM)    │ │  (VMware VM) │ │  (VMware VM)    │
     │  Next.js App    │ │  Next.js App │ │  Next.js App    │
     └────────┬────────┘ └──────┬───────┘ └────────┬────────┘
              │                 │                  │
              └─────────────────┼──────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │     PostgreSQL 16     │
                    │    (Base de datos)    │
                    └───────────────────────┘
```

### 7.4 Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN                    │
│                    (React + Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  • Componentes React                                        │
│  • Estado global (Zustand)                                  │
│  • Estilos (Tailwind CSS)                                   │
│  • Formularios y validación                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE API                             │
│                   (Next.js API Routes)                      │
├─────────────────────────────────────────────────────────────┤
│  • Rutas RESTful                                            │
│  • Middleware (autenticación, auditoría)                     │
│  • Validación de entrada                                    │
│  • Lógica de negocio                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE DATOS                           │
│                   (pg driver - node-postgres)               │
├─────────────────────────────────────────────────────────────┤
│  • Consultas directas a PostgreSQL                          │
│  • Migraciones de esquema                                   │
│  • Transacciones                                            │
│  • Pool de conexiones                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE INFRAESTRUCTURA                 │
│                    (SSH + Nginx)                             │
├─────────────────────────────────────────────────────────────┤
│  • Conexiones SSH a servidores del cluster                  │
│  • Gestión de certificados SSL                              │
│  • Logs de sistema                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Seguridad

### 8.1 Autenticación

| Requisito | Implementación |
|-----------|----------------|
| **Autenticación de usuario** | Email + contraseña con hash bcrypt |
| **Autenticación de dos factores** | TOTP con speakeasy (Google Authenticator) |
| **Gestión de sesiones** | JWT con expiración configurable |
| **Bloqueo por intentos fallidos** | 5 intentos → bloqueo temporal 15 minutos |
| **Política de contraseñas** | Mínimo 8 caracteres |

### 8.2 Transporte

| Requisito | Implementación |
|-----------|----------------|
| **HTTPS** | Certificados SSL con Let's Encrypt |
| **TLS** | Versión 1.2 o superior |
| **SSH** | Conexiones con llaves públicas |
| **CORS** | Configuración estricta |

### 8.3 Protección de Datos

| Requisito | Implementación |
|-----------|----------------|
| **Contraseñas** | Hash bcrypt, nunca texto plano |
| **Tokens JWT** | Firmados con secreto seguro |
| **Credenciales SSH** | Llaves sin contraseña |
| **Logs** | No registrar contraseñas ni tokens |

### 8.4 Medidas de Seguridad

| Medida | Implementación |
|--------|----------------|
| **Headers de seguridad** | Helmet (X-Content-Type-Options, X-Frame-Options) |
| **SQL Injection** | Consultas parametrizadas |
| **XSS** | Sanitización de entrada |
| **CSRF** | Tokens CSRF |
| **Rate Limiting** | Limitación de peticiones por IP |
| **Validación de entrada** | Zod para todos los datos |

---

## 9. Requisitos No Funcionales

### 9.1 Disponibilidad

| Requisito | Valor |
|-----------|-------|
| **Disponibilidad** | 99% 24/7 |
| **Tiempo máximo de inactividad** | < 5 minutos |

### 9.2 Rendimiento

| Requisito | Valor |
|-----------|-------|
| **Tiempo de respuesta** | < 2 segundos |
| **Usuarios concurrentes** | 5 |
| **Solicitudes por segundo** | < 50 |
| **Tamaño de respuesta** | < 1 MB |

### 9.3 Escalabilidad

| Requisito | Valor |
|-----------|-------|
| **Usuarios concurrentes** | 5 (MVP) → 50+ (futuro) |
| **Buzones gestionados** | 50 (MVP) → Miles (futuro) |
| **Método** | Horizontal (más VMs) |

### 9.4 Mantenibilidad

| Requisito | Valor |
|-----------|-------|
| **Estándares de código** | ESLint |
| **Versionado** | Git |
| **Deps update** | Mensual |

---

## 10. Integraciones

### 10.1 Sistemas Externos

| Sistema | Protocolo | Estado |
|---------|-----------|--------|
| **PostgreSQL 16** | TCP/IP | Existente |
| **Dovecot** | TCP/IP | Existente |
| **Postfix** | TCP/IP | Existente |
| **Let's Encrypt** | HTTPS | Planeado |

### 10.2 Integración con Cluster

- **Protocolo**: SSH con llaves públicas
- **Autenticación**: Llaves SSH sin contraseña
- **Comandos**: Ejecución remota de comandos de certificados
- **Alcance**: Solo gestión de certificados SSL

---

## 11. Plan de Construcción

### 11.1 Orden de Construcción

| Fase | Módulo | Dependencias | Duración |
|------|--------|--------------|----------|
| F1 | Auth | Ninguna | 1 día |
| F2 | Domains | Ninguna | 1 día |
| F3 | Mailboxes | Domains | 2 días |
| F4 | Aliases | Mailboxes | 1 día |
| F5 | Block/Unblock | Mailboxes | 1 día |
| F6 | Logs | Ninguna | 1 día |
| F7 | SSL Certs | Domains | 2 días |
| F8 | Audit | Ninguna | 1 día |
| F9 | Config | Ninguna | 1 día |

**Total: 11 días de desarrollo**

### 11.2 Tiempo Total

| Concepto | Días |
|----------|------|
| Desarrollo por módulo | 11 días |
| Integración y pruebas | 2 días |
| Ajustes finales | 1 día |
| **Total** | **14 días** |

### 11.3 Criterios de Entrega por Módulo

Cada módulo se considera completo cuando:
1. ✅ CRUD funcional
2. ✅ Validaciones implementadas
3. ✅ Estados manejados correctamente
4. ✅ Búsqueda y paginación funcionales
5. ✅ UI responsive con Tailwind
6. ✅ Integración con PostgreSQL
7. ✅ Auditoría de acciones registrada
8. ✅ Pruebas manuales exitosas

---

## 12. Estructura de Proyecto

```
sysadmin-mail/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (login)
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── mailboxes/
│   │   ├── domains/
│   │   ├── aliases/
│   │   ├── logs/
│   │   ├── ssl/
│   │   ├── audit/
│   │   └── config/
│   └── api/
│       ├── auth/
│       ├── mailboxes/
│       ├── domains/
│       ├── aliases/
│       ├── logs/
│       ├── ssl/
│       ├── audit/
│       └── config/
├── components/
│   ├── ui/
│   ├── layout/
│   └── forms/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── ssh.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── scripts/
    ├── migrate.js
    └── seed.js
```

---

## 13. Variables de Entorno

```bash
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/sysadmin_mail

# JWT
JWT_SECRET=tu_secreto_aqui
JWT_EXPIRATION=24h

# 2FA
2FA_SECRET=tu_secreto_2fa

# SSH (para gestión de certificados)
SSH_HOST=cluster-server-ip
SSH_USER=sysadmin
SSH_KEY_PATH=/path/to/ssh/key

# SSL
SSL_EMAIL=admin@tudominio.com

# App
APP_URL=https://mail.tudominio.com
NODE_ENV=production
```

---

## 14. Riesgos

| ID | Riesgo | Impacto | Probabilidad |
|----|--------|---------|--------------|
| risk_1 | Complejidad de gestión de certificados SSL en cluster | Medio | Medio |
| risk_2 | Escalabilidad de 50 a miles de usuarios | Alto | Medio |
| risk_3 | Seguridad de gestión remota vía SSH | Alto | Bajo |
| risk_4 | Integración con cluster puede introducir latencia | Medio | Medio |

---

## 15. Métricas de Éxito

1. **Tiempo de gestión**: Reducción del 50% en tiempo promedio por operación
2. **Errores**: Reducción del 100% en errores manuales
3. **Satisfacción**: Evaluación del administrador ≥ 8/10
4. **Adopción**: 100% de operaciones desde el sistema

---

## 16. Decisiones Confirmadas

| ID | Decisión | Fecha |
|----|----------|-------|
| tech_frontend | Tecnología frontend: React | 2026-07-18 |
| tech_backend | Tecnología backend: Node.js | 2026-07-18 |
| auth_method | Autenticación: Usuario/contraseña + 2FA | 2026-07-18 |
| log_format | Formato de logs: Texto plano | 2026-07-18 |
| browser_compat | Compatibilidad: Navegadores modernos | 2026-07-18 |
| db_version | Versión de PostgreSQL: 16 | 2026-07-18 |
| backup_policy | Políticas de respaldo: Sysadmin | 2026-07-18 |

---

## 17. Documentos del Blueprint

| # | Documento | Estado |
|---|-----------|--------|
| 1 | Descubrimiento | ✅ Aprobado |
| 2 | Definición Ejecutiva | ✅ Aprobado |
| 3 | Usuarios y Procesos | ✅ Aprobado |
| 4 | Catálogo de Módulos | ✅ Aprobado |
| 5 | Requisitos Funcionales | ✅ Aprobado |
| 6 | Información e Integraciones | ✅ Aprobado |
| 7 | Arquitectura de Solución | ✅ Aprobado |
| 8 | Stack Tecnológico | ✅ Aprobado |
| 9 | Seguridad y NFR | ✅ Aprobado |
| 10 | Plan de Construcción | ✅ Aprobado |
| 11 | Revisión de Consistencia | ✅ Aprobado |
| 12 | **Documento Final** | ✅ **Este documento** |

---

## 18. Próximos Pasos

1. ~~Descubrimiento~~ ✓
2. ~~Definición Ejecutiva~~ ✓
3. ~~Usuarios y Procesos~~ ✓
4. ~~Catálogo de Módulos~~ ✓
5. ~~Requisitos Funcionales~~ ✓
6. ~~Información e Integraciones~~ ✓
7. ~~Arquitectura de Solución~~ ✓
8. ~~Stack Tecnológico~~ ✓
9. ~~Seguridad y NFR~~ ✓
10. ~~Plan de Construcción~~ ✓
11. ~~Revisión de Consistencia~~ ✓
12. ~~Documento Final~~ ✓
13. **Generar Prompts para Agente de IA** → Pendiente

---

*Documento generado el 2026-07-18*
*Blueprint completo y listo para generación de prompts*
