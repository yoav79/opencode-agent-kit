# Fase 7: Arquitectura de Solución

## 1. Resumen de Decisiones Arquitectónicas

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| **Estilo arquitectónico** | Capa de presentación | La WebUI consume servicios del backend existente |
| **Frontend** | React + Next.js | Framework rápido en Node.js |
| **Backend** | mailctl | Capa de orquestación autorizada para todas las operaciones |
| **Automatización** | Ansible | Motor de automatización de infraestructura existente |
| **Base de datos** | PostgreSQL (vía mailctl) | Acceso exclusivo a través de mailctl |

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Alto Nivel

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

### 2.2 Capas de la Arquitectura

| Capa | Componente | Responsabilidad |
|------|------------|-----------------|
| **Presentación** | WebUI de MailAdmin | Interfaz gráfica de administración |
| **API** | API del Backend | Conecta WebUI con mailctl |
| **Orquestación** | mailctl | Capa de orquestación autorizada |
| **Automatización** | Ansible | Motor de automatización de infraestructura |
| **Servicios** | PostgreSQL, Dovecot, Postfix, etc. | Servicios backend existentes |

## 3. Principios Arquitectónicos

### 3.1 Principios Fundamentales

| Principio | Descripción | Implicación |
|-----------|-------------|-------------|
| **Lógica de negocio en mailctl** | La WebUI NO implementa lógica de negocio | Todas las operaciones pasan por mailctl |
| **Infraestructura vía Ansible** | Los cambios se ejecutan mediante automatización | No hay configuración manual de servicios |
| **WebUI sin estado** | La interfaz no mantiene estado | No hay sesiones persistentes en servidor |
| **Operaciones idempotentes** | Las operaciones pueden ejecutarse múltiples veces | No hay efectos colaterales |
| **Auditoría completa** | Toda operación es auditable | Todas las acciones quedan registradas |
| **Resultados del backend** | La WebUI muestra resultados sin modificarlos | Validación vía mailctl validate |

### 3.2 Restricciones Arquitectónicas

| Restricción | Descripción |
|-------------|-------------|
| **NO acceso directo a PostgreSQL** | La WebUI nunca accede directamente a la base de datos |
| **NO modificación de configuración** | La WebUI nunca modifica archivos de Dovecot/Postfix |
| **NO reemplazo de servicios** | La WebUI no reemplaza mailctl, Ansible, ni otros servicios |
| **Invocación de mailctl** | Toda operación pasa por mailctl |

## 4. Componentes del Sistema

### 4.1 Frontend (WebUI)

| Componente | Descripción |
|------------|-------------|
| **Panel Principal** | Dashboard con estado, servicios, estadísticas |
| **Gestión de Dominios** | CRUD de dominios |
| **Gestión de Buzones** | CRUD de buzones, contraseñas, cuotas |
| **Gestión de Aliases** | CRUD de aliases |
| **Identidades** | Gestión de identidades del remitente |
| **Listas de Distribución** | Gestión de listas de distribución |
| **Migración IMAP** | Migración de buzones IMAP |
| **Validación** | Validación de plataforma y configuración |
| **Bitácoras** | Logs de operaciones y auditoría |
| **Servicios** | Administración de servicios backend |

### 4.2 Backend (mailctl)

| Operación | Comando |
|-----------|---------|
| Crear buzón | mailctl mailbox create |
| Eliminar buzón | mailctl mailbox delete |
| Restablecer contraseña | mailctl passwd |
| Administrar alias | mailctl alias |
| Administrar identidades | mailctl identity |
| Administrar listas | mailctl distribution |
| Migración IMAP | mailctl migrate |
| Validación | mailctl validate |

### 4.3 Infraestructura (Ansible)

| Servicio | Gestión |
|----------|---------|
| PostgreSQL | Configuración y mantenimiento |
| Dovecot | Configuración de buzones |
| Postfix | Configuración de correo |
| NGINX | Configuración de web server |
| Almacenamiento | Gestión de almacenamiento de correo |

## 5. Seguridad

### 5.1 Autenticación

| Requisito | Implementación |
|-----------|----------------|
| **Autenticación** | Login de administradores |
| **Autorización** | Basada en roles (RBAC) |
| **Sesiones** | Gestión de sesiones activas |

### 5.2 Transporte

| Requisito | Implementación |
|-----------|----------------|
| **TLS** | Comunicaciones cifradas |
| **Secretos** | No expuestos en la WebUI |

### 5.3 Auditoría

| Requisito | Implementación |
|-----------|----------------|
| **Registro de acciones** | Toda operación es auditable |
| **Bitácoras** | Logs de operaciones y validación |

## 6. Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN                    │
│                    (React + Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  • Panel Principal                                          │
│  • Gestión de Dominios                                      │
│  • Gestión de Buzones                                       │
│  • Gestión de Aliases                                       │
│  • Identidades del Remitente                                │
│  • Listas de Distribución                                   │
│  • Migración IMAP                                           │
│  • Validación                                               │
│  • Bitácoras                                                │
│  • Administración de Servicios                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE API                             │
│                   (Conecta WebUI con mailctl)               │
├─────────────────────────────────────────────────────────────┤
│  • Endpoints REST                                           │
│  • Autenticación y autorización                             │
│  • Validación de entrada                                    │
│  • Invocación de mailctl                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE ORQUESTACIÓN                    │
│                        (mailctl)                            │
├─────────────────────────────────────────────────────────────┤
│  • Lógica de negocio                                        │
│  • Gestión de operaciones                                   │
│  • Validación de resultados                                 │
│  • Integración con Ansible                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE AUTOMATIZACIÓN                  │
│                       (Ansible)                             │
├─────────────────────────────────────────────────────────────┤
│  • Configuración de PostgreSQL                              │
│  • Configuración de Dovecot                                 │
│  • Configuración de Postfix                                 │
│  • Configuración de NGINX                                   │
│  • Gestión de almacenamiento                                │
└─────────────────────────────────────────────────────────────┘
```

## 7. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React + Next.js |
| **Estilos** | Tailwind CSS |
| **API** | Next.js API Routes |
| **Orquestación** | mailctl |
| **Automatización** | Ansible |
| **Base de datos** | PostgreSQL (vía mailctl) |
| **Servidores** | Dovecot, Postfix, NGINX |
| **Servicio de correo** | Mailgun |

## 8. Próximos pasos

1. ~~Aprobar arquitectura de solución~~ ✓ COMPLETADO
2. Avanzar a fase 8 (Stack tecnológico)
