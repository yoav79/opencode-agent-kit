# Fase 8: Stack Tecnológico

## 1. Resumen del stack

| Capa | Tecnología | Versión | Justificación |
|------|------------|---------|---------------|
| **Frontend** | React + Next.js | 14.x | Framework fullstack, SSR/SSG, API routes integradas |
| **Estilos** | Tailwind CSS | 3.x | CSS utility-first, diseño rápido, sin CSS custom |
| **Backend** | Next.js API Routes | 14.x | Integrado con frontend, sin servidor separado |
| **Driver DB** | pg (node-postgres) | 8.x | Driver oficial PostgreSQL, sin ORM, consultas directas |
| **Base de datos** | PostgreSQL | 16 | Ya existente, robusto, escalable |
| **Autenticación** | JWT + bcrypt + speakeasy | - | JWT para sesiones, bcrypt para hashes, speakeasy para 2FA |
| **Validación** | Zod | 3.x | Validación de esquemas, tipado estático |
| **Fechas** | date-fns | 3.x | Manipulación de fechas ligera y modular |
| **Reverse Proxy** | Nginx | 1.x | Balanceador de carga, proxy inverso, SSL |
| **Certificados** | Let's Encrypt + Certbot | - | Certificados SSL gratuitos y automáticos |
| **SSH** | ssh2 (librería Node.js) | - | Conexión SSH para gestión de certificados en cluster |
| **Node.js** | Node.js | 22.x LTS | Runtime JavaScript, LTS estable |
| **SO Servidor** | Linux (Ubuntu/CentOS) | - | Sistema operativo estable y seguro |
| **Monitoreo PM2** | PM2 | 5.x | Gestor de procesos Node.js, supervisión, clustering |

## 2. Detalles por capa

### 2.1 Frontend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.x | Biblioteca de UI |
| Next.js | 14.x | Framework fullstack |
| Tailwind CSS | 3.x | Estilos |
| Zustand | 4.x | Estado global (ligero) |
| React Hook Form | 7.x | Formularios |
| Zod | 3.x | Validación de formularios |
| date-fns | 3.x | Formateo de fechas |

### 2.2 Backend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js API Routes | 14.x | Endpoints REST |
| pg (node-postgres) | 8.x | Conexión a PostgreSQL |
| bcrypt | 5.x | Hash de contraseñas |
| jsonwebtoken | 9.x | Tokens JWT |
| speakeasy | 2.x | Generación/verificación 2FA TOTP |
| ssh2 | 1.x | Conexiones SSH |
| helmet | 7.x | Headers de seguridad |
| express-rate-limit | 7.x | Limitación de peticiones |
| cors | 2.x | Configuración CORS |

### 2.3 Base de datos

| Tecnología | Versión | Uso |
|------------|---------|-----|
| PostgreSQL | 16 | Motor de base de datos |
| pg_dump | - | Respaldos |
| pg_restore | - | Restauración |

### 2.4 Infraestructura

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Nginx | 1.x | Reverse proxy, load balancer |
| Certbot | 2.x | Gestión de certificados SSL |
| PM2 | 5.x | Gestor de procesos Node.js |
| UFW | - | Firewall |
| Ubuntu Server | 22.04 LTS | SO de servidores |

### 2.5 Herramientas de desarrollo

| Tecnología | Uso |
|------------|-----|
| ESLint | Linting de código |
| opencode | Entorno de desarrollo |

## 3. Instalación de dependencias

### 3.1 Frontend (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.50.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

### 3.2 Backend (package.json)

```json
{
  "dependencies": {
    "pg": "^8.11.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "speakeasy": "^2.0.0",
    "ssh2": "^1.14.0",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "cors": "^2.8.0"
  }
}
```

## 4. Configuración de entorno

### 4.1 Variables de entorno (.env)

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

## 5. Scripts de npm

### 5.1 Scripts principales

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js"
  }
}
```

## 6. Justificación de decisiones

| Decisión | Justificación |
|----------|---------------|
| **Next.js** | Framework fullstack que permite frontend y backend en un solo proyecto, reduciendo complejidad |
| **Tailwind CSS** | Acelera el desarrollo de UI con clases utility-first, sin necesidad de CSS custom |
| **pg directo** | Sin ORM para mantener control total sobre las consultas y rendimiento |
| **Zod** | Validación de esquemas con tipado estático, integrado con TypeScript |
| **date-fns** | Librería ligera y modular para manipulación de fechas |
| **PM2** | Gestor de procesos robusto para Node.js en producción, con clustering |
| **Node.js 22.x** | Versión LTS estable con soporte a largo plazo |
| **bcrypt** | Algoritmo de hashing probado y seguro para contraseñas |
| **speakeasy** | Implementación TOTP estándar para autenticación de dos factores |
| **ssh2** | Conexión SSH nativa desde Node.js para gestión de certificados |

## 7. Próximos pasos

1. Aprobar stack tecnológico
2. Avanzar a fase 9 (Seguridad y requisitos no funcionales)
