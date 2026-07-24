# Fase 4: Catálogo de Módulos

## 1. Visión General

El sistema **MailAdmin** se organiza en 11 módulos independientes pero relacionados. Cada módulo encapsula una funcionalidad específica y se comunica con el backend (`mailctl`) a través de interfaces bien definidas.

## 2. Principios Arquitectónicos

- **Lógica de negocio en mailctl**: La WebUI NO implementa lógica de negocio
- **Infraestructura vía Ansible**: Los cambios se ejecutan mediante automatización
- **WebUI sin estado**: La interfaz no mantiene estado
- **Operaciones idempotentes**: Las operaciones pueden ejecutarse múltiples veces
- **Auditoría completa**: Toda operación administrativa es auditable

## 3. Catálogo de Módulos

### 3.1 Panel Principal (Dashboard)

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Panel Principal |
| **Objetivo** | Proporcionar una vista general de la plataforma |
| **Usuarios** | Administradores de correo |
| **Funciones** | Estado general, estado de servicios, estadísticas, operaciones recientes, alertas |
| **Dependencias** | Ninguna |
| **Prioridad** | Crítica (MVP) |

### 3.2 Autenticación y Autorización

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Autenticación y Autorización |
| **Objetivo** | Gestionar el acceso seguro al sistema |
| **Usuarios** | Administradores de correo |
| **Funciones** | Login, logout, gestión de sesiones, autorización basada en roles |
| **Dependencias** | Ninguna |
| **Prioridad** | Crítica (MVP) |

### 3.3 Gestión de Dominios

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Gestión de Dominios |
| **Objetivo** | Administrar dominios de correo electrónico |
| **Usuarios** | Administradores de correo |
| **Funciones** | Crear, habilitar, deshabilitar, eliminar, validar configuración |
| **Comando mailctl** | mailctl domain [create|enable|disable|delete] |
| **Dependencias** | Ninguna |
| **Prioridad** | Crítica (MVP) |

### 3.4 Gestión de Buzones

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Gestión de Buzones |
| **Objetivo** | Administrar buzones de correo |
| **Usuarios** | Administradores de correo |
| **Funciones** | Crear, eliminar, habilitar, deshabilitar, restablecer contraseña, administrar cuotas, operaciones por lotes |
| **Comando mailctl** | mailctl mailbox [create|delete|enable|disable], mailctl passwd |
| **Dependencias** | Gestión de Dominios |
| **Prioridad** | Crítica (MVP) |

### 3.5 Gestión de Aliases

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Gestión de Aliases |
| **Objetivo** | Administrar aliases de correo |
| **Usuarios** | Administradores de correo |
| **Funciones** | Crear, eliminar, habilitar, deshabilitar |
| **Comando mailctl** | mailctl alias [create|delete|enable|disable] |
| **Dependencias** | Gestión de Buzones |
| **Prioridad** | Alta (MVP) |

### 3.6 Identidades del Remitente

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Identidades del Remitente |
| **Objetivo** | Administrar identidades del remitente |
| **Usuarios** | Administradores de correo |
| **Funciones** | Crear, actualizar, eliminar, identidad predeterminada |
| **Comando mailctl** | mailctl identity [create|update|delete|default] |
| **Dependencias** | Gestión de Buzones |
| **Prioridad** | Alta (MVP) |

### 3.7 Listas de Distribución

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Listas de Distribución |
| **Objetivo** | Administrar listas de distribución de correo |
| **Usuarios** | Administradores de correo |
| **Funciones** | Crear, eliminar, administrar miembros, actualizaciones por lotes |
| **Comando mailctl** | mailctl distribution [create|delete|members|batch] |
| **Dependencias** | Gestión de Dominios |
| **Prioridad** | Alta (MVP) |

### 3.8 Migración IMAP

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Migración IMAP |
| **Objetivo** | Gestionar migraciones de buzones IMAP |
| **Usuarios** | Administradores de correo |
| **Funciones** | Iniciar migración, supervisar progreso, reintentar fallidos, consultar resultados |
| **Comando mailctl** | mailctl migrate [start|status|retry|results] |
| **Dependencias** | Ninguna |
| **Prioridad** | Media (MVP) |

### 3.9 Validación

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Validación |
| **Objetivo** | Validar la plataforma y configuración |
| **Usuarios** | Administradores de correo |
| **Funciones** | Validación de plataforma, flujo de correo, configuración, tiempo de ejecución |
| **Comando mailctl** | mailctl validate [platform|flow|config|runtime] |
| **Dependencias** | Ninguna |
| **Prioridad** | Alta (MVP) |

### 3.10 Bitácoras

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Bitácoras |
| **Objetivo** | Registrar operaciones y validaciones |
| **Usuarios** | Administradores de correo |
| **Funciones** | Bitácoras operativas, bitácoras de validación, historial de auditoría |
| **Dependencias** | Ninguna |
| **Prioridad** | Alta (MVP) |

### 3.11 Administración de Servicios

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Administración de Servicios |
| **Objetivo** | Gestionar el estado de los servicios backend |
| **Usuarios** | Administradores de correo |
| **Funciones** | Estado, reiniciar, recargar, información de salud |
| **Dependencias** | Ninguna |
| **Prioridad** | Alta (MVP) |

## 4. Matriz de Dependencias

| Módulo | Dependencias |
|--------|--------------|
| Panel Principal | Ninguna |
| Autenticación | Ninguna |
| Gestión de Dominios | Ninguna |
| Gestión de Buzones | Gestión de Dominios |
| Gestión de Aliases | Gestión de Buzones |
| Identidades del Remitente | Gestión de Buzones |
| Listas de Distribución | Gestión de Dominios |
| Migración IMAP | Ninguna |
| Validación | Ninguna |
| Bitácoras | Ninguna |
| Administración de Servicios | Ninguna |

## 5. Diagrama de Dependencias

```
Panel Principal (F1)
Autenticación (F2)
Dominios (F3)
  ↓
Buzones (F4) ←─────────────────┐
  ↓                               │
Aliases (F5)                      │
Identidades (F6)                  │
                                  │
Listas Distribución (F7) ←───────┤
Migración IMAP (F8) ────────────┐ │
Validación (F9) ────────────────┤ │
Bitácoras (F10) ────────────────┤ │
Servicios (F11) ────────────────┘ │
                                  │
                                  └──→ Dependencias de Buzones
```

## 6. Resumen de Prioridades

| Prioridad | Módulos |
|-----------|---------|
| **Crítica** | Panel Principal, Autenticación, Dominios, Buzones |
| **Alta** | Aliases, Identidades, Listas, Validación, Bitácoras, Servicios |
| **Media** | Migración IMAP |

## 7. Próximos pasos

1. ~~Aprobar catálogo de módulos~~ ✓ COMPLETADO
2. Avanzar a fase 5 (Requisitos funcionales)
