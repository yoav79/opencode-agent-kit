# Fase 8: Stack Tecnológico

## 1. Resumen del Stack

| Capa | Tecnología | Uso |
|------|------------|-----|
| **Frontend** | React + Next.js | Interfaz web administrativa (framework rápido en Node.js) |
| **Estilos** | Tailwind CSS | Diseño responsive |
| **API** | Next.js API Routes | Conexión WebUI con mailctl |
| **Orquestación** | mailctl | Capa de orquestación autorizada |
| **Automatización** | Ansible | Motor de automatización |
| **Base de datos** | PostgreSQL | Almacenamiento (vía mailctl) |
| **Servidores** | Dovecot, Postfix | Servidores de correo |
| **Web Server** | NGINX | Proxy inverso |
| **Servicio de correo** | Mailgun | Correo transaccional |

## 2. Detalles por Capa

### 2.1 Frontend

| Tecnología | Uso |
|------------|-----|
| **React** | Biblioteca de UI |
| **Next.js** | Framework fullstack |
| **Tailwind CSS** | Estilos utility-first |

### 2.2 API

| Tecnología | Uso |
|------------|-----|
| **Next.js API Routes** | Endpoints REST |
| **mailctl** | Invocación de operaciones |

### 2.3 Backend (Existente)

| Componente | Descripción |
|------------|-------------|
| **mailctl** | Capa de orquestación autorizada |
| **Ansible** | Motor de automatización de infraestructura |
| **PostgreSQL** | Base de datos de la plataforma |
| **Dovecot** | Servidor IMAP/POP3 |
| **Postfix** | Servidor SMTP |
| **NGINX** | Servidor web y proxy inverso |
| **Mailgun** | Servicio de correo transaccional |

## 3. Contrato del Backend

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

## 4. Restricciones del Stack

### 4.1 Acceso a Base de Datos

| Restricción | Descripción |
|-------------|-------------|
| **NO acceso directo** | La WebUI nunca accede directamente a PostgreSQL |
| **Vía mailctl** | Todas las consultas pasan por mailctl |
| **SQL permitido** | Solo mailctl ejecuta consultas SQL |

### 4.2 Configuración de Servicios

| Restricción | Descripción |
|-------------|-------------|
| **NO modificación directa** | La WebUI nunca modifica archivos de configuración |
| **Vía Ansible** | Todos los cambios pasan por Ansible |
| **mailctl autorizado** | Solo mailctl ejecuta cambios de configuración |

## 5. Variables de Entorno

```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Backend
MAILCTL_PATH=/usr/local/bin/mailctl
ANSIBLE_PATH=/etc/ansible

# App
APP_URL=https://correo.tudominio.com
NODE_ENV=production
```

## 6. Scripts de npm

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## 7. Justificación de Decisiones

| Decisión | Justificación |
|----------|---------------|
| **Next.js** | Framework fullstack con API routes integradas |
| **Tailwind CSS** | CSS utility-first para diseño rápido |
| **mailctl** | Capa de orquestación existente y autorizada |
| **Ansible** | Motor de automatización existente |

## 8. Próximos pasos

1. ~~Aprobar stack tecnológico~~ ✓ COMPLETADO
2. Avanzar a fase 9 (Seguridad y NFR)
