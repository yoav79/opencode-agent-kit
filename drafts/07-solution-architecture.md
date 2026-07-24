# Fase 7: Arquitectura de Solución

## 1. Resumen de decisiones arquitectónicas

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| **Estilo arquitectónico** | Monolítica (Fullstack) | Equipo pequeño (1 humano + 1 IA), presupuesto cero, simplicidad de mantenimiento |
| **Framework** | Next.js | Frontend y backend en un solo framework, SSR/SSG, API routes |
| **Base de datos** | PostgreSQL 16 | Ya existente, consolidado, sin costo adicional |
| **Despliegue** | Servidores VMware | Hipervisores existentes, instalación manual de servicios |
| **Escalabilidad** | Horizontal | Balanceo de carga entre múltiples servidores virtuales |
| **Disponibilidad** | 99% 24/7 | Redundancia básica con balanceador de carga |

## 2. Arquitectura propuesta

### 2.1 Diagrama de alto nivel

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

### 2.2 Capas de la arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN                    │
│                    (React + Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  • Componentes React                                        │
│  • Estado global (Context API / Zustand)                    │
│  • Estilos (Tailwind CSS / CSS Modules)                     │
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

## 3. Componentes del sistema

### 3.1 Frontend (Next.js)

| Componente | Descripción |
|------------|-------------|
| **Layout principal** | Consola administrativa con sidebar y área de contenido |
| **Módulo Autenticación** | Login, 2FA, gestión de sesiones |
| **Módulo Buzones** | CRUD de buzones, contraseñas, quotas |
| **Módulo Dominios** | CRUD de dominios |
| **Módulo Aliases** | CRUD de aliases y redirecciones |
| **Módulo Logs** | Visualización y búsqueda de logs |
| **Módulo Bloqueo** | Gestión de estado de usuarios |
| **Módulo Certificados** | Estado, renovación, alertas |
| **Módulo Auditoría** | Historial de acciones |
| **Módulo Configuración** | Parámetros del sistema |

### 3.2 Backend (Next.js API Routes)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Iniciar sesión |
| `/api/auth/verify-2fa` | POST | Verificar código 2FA |
| `/api/auth/logout` | POST | Cerrar sesión |
| `/api/mailboxes` | GET/POST | Listar/crear buzones |
| `/api/mailboxes/[id]` | GET/PUT/DELETE | Operaciones sobre buzón |
| `/api/mailboxes/[id]/password` | PUT | Cambiar contraseña |
| `/api/domains` | GET/POST | Listar/crear dominios |
| `/api/domains/[id]` | GET/PUT/DELETE | Operaciones sobre dominio |
| `/api/aliases` | GET/POST | Listar/crear aliases |
| `/api/aliases/[id]` | GET/PUT/DELETE | Operaciones sobre alias |
| `/api/logs` | GET | Consultar logs |
| `/api/logs/export` | GET | Exportar logs a CSV |
| `/api/block/[id]` | PUT | Bloquear/desbloquear |
| `/api/ssl` | GET | Estado de certificados |
| `/api/ssl/renew` | POST | Renovar certificado |
| `/api/audit` | GET | Historial de auditoría |
| `/api/audit/export` | GET | Exportar auditoría |
| `/api/config` | GET/PUT | Configuración del sistema |

### 3.3 Base de datos

| Tabla | Descripción |
|-------|-------------|
| `users` | Buzones de correo |
| `domains` | Dominios de correo |
| `aliases` | Aliases y redirecciones |
| `delivery_logs` | Logs de entrega |
| `audit_logs` | Logs de auditoría |
| `config` | Configuración del sistema |
| `certificates` | Certificados SSL |
| `sessions` | Sesiones activas |

## 4. Stack tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Frontend** | React + Next.js | 14.x |
| **Estilos** | Tailwind CSS | 3.x |
| **Backend** | Next.js API Routes | 14.x |
| **Driver DB** | pg (node-postgres) | 8.x |
| **Base de datos** | PostgreSQL | 16 |
| **Autenticación** | JWT + bcrypt + speakeasy (2FA) | - |
| **Reverse Proxy** | Nginx | 1.x |
| **Certificados** | Let's Encrypt + Certbot | - |
| **SSH** | ssh2 (librería Node.js) | - |
| **Node.js** | Node.js | 20.x LTS |
| **SO Servidor** | Linux (Ubuntu/CentOS) | - |

## 5. Seguridad

### 5.1 Autenticación

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───►│  Validar    │───►│  Verificar  │
│  (email +   │    │  credenciales│    │     2FA     │
│  password)  │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │   Crear     │
                                       │   sesión    │
                                       │   (JWT)     │
                                       └─────────────┘
```

### 5.2 Medidas de seguridad

| Medida | Implementación |
|--------|----------------|
| **HTTPS** | Certificados SSL con Let's Encrypt |
| **2FA** | TOTP con speakeasy |
| **JWT** | Tokens firmados con expiración |
| **Rate Limiting** | Limitación de intentos de login |
| **CORS** | Configuración estricta |
| **Helmet** | Headers de seguridad HTTP |
| **SQL Injection** | Consultas parametrizadas |
| **XSS** | Sanitización de entrada |
| **CSRF** | Tokens CSRF |

## 6. Despliegue en VMware

### 6.1 Arquitectura de servidores

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA VMware                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Servidor 1  │  │  Servidor 2  │  │  Servidor DB │     │
│  │  (VM)        │  │  (VM)        │  │  (VM)        │     │
│  │              │  │              │  │              │     │
│  │  • Nginx     │  │  • Nginx     │  │  • PostgreSQL│     │
│  │  • Next.js   │  │  • Next.js   │  │  • Backups   │     │
│  │  • Node.js   │  │  • Node.js   │  │              │     │
│  │  • PM2       │  │  • PM2       │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Configuración de cada servidor de aplicación

| Componente | Configuración |
|------------|---------------|
| **SO** | Ubuntu 22.04 LTS / CentOS 8 |
| **Node.js** | v20.x LTS (via NVM o package manager) |
| **PM2** | Gestor de procesos para Node.js |
| **Nginx** | Reverse proxy y balanceador de carga |
| **Certbot** | Gestión de certificados SSL |
| **UFW** | Firewall (solo puertos 80, 443, 22) |

### 6.3 Pasos de despliegue

1. **Provisionar VM** en VMware
2. **Instalar SO** base (Ubuntu/CentOS)
3. **Configurar red** y firewall
4. **Instalar Node.js** v20.x LTS
5. **Instalar Nginx**
6. **Configurar Nginx** como reverse proxy
7. **Clonar repositorio** de la aplicación
8. **Instalar dependencias** (npm install)
9. **Configurar variables** de entorno
10. **Ejecutar migraciones** de base de datos
11. **Iniciar aplicación** con PM2
12. **Configurar SSL** con Certbot
13. **Configurar monitoreo** básico

### 6.4 Escalabilidad horizontal

```
                    ┌─────────────────┐
                    │     Nginx       │
                    │  (Load Balancer)│
                    │   (Servidor 1)  │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │  App (1)    │  │  App (2)    │  │  App (N)    │
    │  (VMware)   │  │  (VMware)   │  │  (VMware)   │
    │  Port 3000  │  │  Port 3000  │  │  Port 3000  │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   (Servidor DB) │
                    │   (VMware VM)   │
                    └─────────────────┘
```

## 7. Monitoreo

| Métrica | Herramienta | Umbral |
|---------|-------------|--------|
| **Uso de CPU** | top/htop | > 80% |
| **Uso de memoria** | free -m | > 80% |
| **Disco** | df -h | > 85% |
| **Tiempo de respuesta** | Logs de acceso | > 2s |
| **Errores 5xx** | Logs de aplicación | > 1% |
| **Conexiones DB** | PostgreSQL | > 80% pool |
| **Procesos Node** | PM2 status | Caída de proceso |

## 8. Backup y recuperación

| Componente | Frecuencia | Retención | Método |
|------------|------------|-----------|--------|
| **PostgreSQL** | Diario | 30 días | pg_dump |
| **Archivos de configuración** | Semanal | Indefinido | rsync |
| **Logs de auditoría** | Diario | Indefinido | Copia a storage |
| **Estado PM2** | Continuo | - | PM2 dump |

## 9. Alternativas evaluadas

### 9.1 Alternativa 1: Arquitectura Monolítica en VMware (SELECCIONADA)

| Aspecto | Evaluación |
|---------|------------|
| **Complejidad** | Baja |
| **Costo** | Cero (infraestructura existente) |
| **Mantenimiento** | Simple |
| **Escalabilidad** horizontal básica |
| **Equipo** | 1 persona suficiente |
| **Despliegue** | Manual en VMs existentes |

### 9.2 Alternativa 2: Microservicios

| Aspecto | Evaluación |
|---------|------------|
| **Complejidad** | Alta |
| **Costo** | Potencialmente alto |
| **Mantenimiento** | Complejo |
| **Escalabilidad** | Granular |
| **Equipo** | Mínimo 3 personas |

**Descartada** por: Complejidad excesiva para equipo de 1 persona y presupuesto cero.

### 9.3 Alternativa 3: Serverless (AWS Lambda / Vercel)

| Aspecto | Evaluación |
|---------|------------|
| **Complejidad** | Media |
| **Costo** | Variables (puede ser bajo) |
| **Mantenimiento** | Moderado |
| **Escalabilidad** | Automática |
| **Equipo** | 1 persona suficiente |

**Descartada** por: Preferencia de despliegue en infraestructura VMware existente.

## 10. Próximos pasos

1. Aprobar arquitectura de solución
2. Avanzar a fase 8 (Stack tecnológico)
