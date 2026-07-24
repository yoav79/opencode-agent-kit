# Fase 4: Catálogo de Módulos

## 1. Visión general de la arquitectura modular

El sistema **SysAdmin Mail** se organiza en 9 módulos independientes pero relacionados. Cada módulo encapsula una funcionalidad específica y se comunica con los demás módulos a través de interfaces bien definidas.

## 2. Arquitectura de navegación

La interfaz de usuario sigue el patrón **consola administrativa**:
- **Columna izquierda**: Navegación con los módulos disponibles
- **Columna derecha**: Ventana de operación donde se muestra el contenido del módulo seleccionado

## 3. Catálogo de módulos

### 3.1 Módulo de Autenticación

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Autenticación |
| **Objetivo** | Gestionar el acceso seguro al sistema mediante autenticación de usuario y dos factores (2FA) |
| **Usuarios** | Administrador de correo |
| **Responsabilidades** | Login/logout, autenticación de dos factores, gestión de sesiones, control de accesos |
| **Funciones** | Iniciar sesión, cerrar sesión, verificar código 2FA, gestionar tokens de sesión, bloquear sesión por inactividad |
| **Entradas** | Credenciales de usuario (email/contraseña), código 2FA |
| **Salidas** | Token de sesión, estado de autenticación |
| **Reglas de negocio** | Máximo 5 intentos de login antes de bloqueo temporal; sesión expira después de 30 minutos de inactividad; 2FA obligatorio |
| **Dependencias** | Ninguna (módulo base) |
| **Permisos** | Solo el administrador autenticado puede acceder |
| **Notificaciones** | Alerta de intentos fallidos de login |
| **Reportes** | Log de intentos de acceso |
| **Criterios de aceptación** | Login funcional con 2FA; sesión segura con expiración; bloqueo por intentos fallidos |
| **Prioridad** | Crítica (MVP) |
| **Clasificación** | MVP |

### 3.2 Módulo de Gestión de Buzones

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Gestión de Buzones |
| **Objetivo** | Administrar buzones de correo: crear, eliminar, modificar, contraseñas, quotas |
| **Usuarios** | Administrador de correo |
| **Responsabilidades** | CRUD completo de buzones, gestión de contraseñas, configuración de quotas de disco |
| **Funciones** | Crear buzón, eliminar buzón, modificar buzón, cambiar contraseña, configurar quota, ver estado de buzón |
| **Entradas** | Datos del buzón (usuario, dominio, contraseña, quota) |
| **Salidas** | Buzón creado/modificado/eliminado, estado de operación |
| **Reglas de negocio** | Un buzón pertenece a un solo dominio; la contraseña debe cumplir política de seguridad; la quota se configura por usuario; eliminación requiere confirmación |
| **Dependencias** | Módulo de Dominios (para validar dominio existente) |
| **Permisos** | CRUD completo sobre buzones |
| **Notificaciones** | Confirmación de creación/eliminación de buzón |
| **Reportes** | Lista de buzones, uso de quota por buzón |
| **Criterios de aceptación** | CRUD funcional de buzones; cambio de contraseña; configuración de quota; validación de datos |
| **Prioridad** | Crítica (MVP) |
| **Clasificación** | MVP |

### 3.3 Módulo de Gestión de Dominios

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Gestión de Dominios |
| **Objetivo** | Administrar dominios de correo electrónico |
| **Usuarios** | Administrador de correo |
| **Responsabilidades** | CRUD de dominios, validación de dominios, configuración básica |
| **Funciones** | Agregar dominio, eliminar dominio, modificar dominio, listar dominios, verificar estado |
| **Entradas** | Nombre del dominio, configuración |
| **Salidas** | Dominio creado/modificado/eliminado, lista de dominios |
| **Reglas de negocio** | Un dominio debe ser válido (formato DNS); no se pueden duplicar dominios; eliminación requiere que no haya buzones asociados |
| **Dependencias** | Ninguna (módulo base) |
| **Permisos** | CRUD completo sobre dominios |
| **Notificaciones** | Confirmación de creación/eliminación de dominio |
| **Reportes** | Lista de dominios activos, dominios con más buzones |
| **Criterios de aceptación** | CRUD funcional de dominios; validación de formato; prevención de duplicados |
| **Prioridad** | Crítica (MVP) |
| **Clasificación** | MVP |

### 3.4 Módulo de Gestión de Aliases

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Gestión de Aliases |
| **Objetivo** | Administrar aliases y redirecciones de correo |
| **Usuarios** | Administrador de correo |
| **Responsabilidades** | CRUD de aliases, gestión de redirecciones, validación de destinos |
| **Funciones** | Crear alias, eliminar alias, modificar alias, listar aliases, crear redirección, eliminar redirección |
| **Entradas** | Alias, destino, dominio |
| **Salidas** | Alias creado/modificado/eliminado, lista de aliases |
| **Reglas de negocio** | Un alias debe tener un destino válido; no se pueden crear aliases circulares; un alias pertenece a un dominio |
| **Dependencias** | Módulo de Buzones (para validar buzón destino) |
| **Permisos** | CRUD completo sobre aliases |
| **Notificaciones** | Confirmación de creación/eliminación de alias |
| **Reportes** | Lista de aliases, aliases por dominio |
| **Criterios de aceptación** | CRUD funcional de aliases; validación de destinos; prevención de ciclos |
| **Prioridad** | Alta (MVP) |
| **Clasificación** | MVP |

### 3.5 Módulo de Logs de Entrega

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Logs de Entrega |
| **Objetivo** | Visualizar y buscar logs de entrega de correo |
| **Usuarios** | Administrador de correo |
| **Responsabilidades** | Lectura de logs, filtrado, búsqueda, exportación |
| **Funciones** | Ver logs recientes, buscar por usuario, buscar por dominio, buscar por fecha, filtrar por estado, exportar resultados |
| **Entradas** | Filtros de búsqueda (usuario, dominio, fecha, estado) |
| **Salidas** | Logs filtrados, resultados de búsqueda |
| **Reglas de negocio** | Solo lectura; logs se muestran en orden cronológico inverso; se pueden exportar a CSV |
| **Dependencias** | Ninguna (módulo de solo lectura) |
| **Permisos** | Solo lectura |
| **Notificaciones** | Ninguna |
| **Reportes** | Logs de entrega, estadísticas básicas |
| **Criterios de aceptación** | Visualización de logs; búsqueda funcional; exportación a CSV |
| **Prioridad** | Media (MVP) |
| **Clasificación** | MVP |

### 3.6 Módulo de Bloqueo/Desbloqueo

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Bloqueo/Desbloqueo |
| **Objetivo** | Gestionar el estado de bloqueo de usuarios |
| **Usuarios** | Administrador de correo |
| **Responsabilidades** | Bloquear usuarios, desbloquear usuarios, verificar estado |
| **Funciones** | Bloquear usuario, desbloquear usuario, ver estado de bloqueo, listar usuarios bloqueados |
| **Entradas** | Usuario, dominio, acción (bloquear/desbloquear) |
| **Salidas** | Estado de bloqueo actualizado, lista de usuarios bloqueados |
| **Reglas de negocio** | Bloqueo impide envío y recepción de correo; desbloqueo restaura acceso; se registra cambio de estado |
| **Dependencias** | Módulo de Buzones (para validar buzón existente) |
| **Permisos** | Cambiar estado de bloqueo |
| **Notificaciones** | Confirmación de cambio de estado |
| **Reportes** | Lista de usuarios bloqueados, historial de cambios |
| **Criterios de aceptación** | Bloqueo/desbloqueo funcional; registro de cambios; vista de estado actual |
| **Prioridad** | Alta (MVP) |
| **Clasificación** | MVP |

### 3.7 Módulo de Certificados SSL

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Certificados SSL |
| **Objetivo** | Gestionar certificados SSL para dominios de correo |
| **Usuarios** | Administrador de correo |
| **Responsabilidades** | Renovación automática, visualización de estado, instalación, alertas de expiración |
| **Funciones** | Ver estado de certificados, renovar certificado, instalar certificado, configurar alertas, ver historial |
| **Entradas** | Dominio, acción (renovar/instalar/configurar) |
| **Salidas** | Estado de certificado, certificado instalado, alertas configuradas |
| **Reglas de negocio** | Renovación automática antes de expiración; alertas 30, 15, 7 días antes de expiración; instalación automática tras renovación |
| **Dependencias** | Módulo de Dominios (para obtener dominios); Acceso SSH a servidores del cluster |
| **Permisos** | Gestión completa de certificados |
| **Notificaciones** | Alertas de expiración, confirmación de renovación |
| **Reportes** | Estado de certificados, historial de renovaciones |
| **Criterios de aceptación** | Visualización de estado; renovación funcional; alertas configurables; instalación automática |
| **Prioridad** | Alta (MVP) |
| **Clasificación** | MVP |

### 3.8 Módulo de Auditoría

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Auditoría |
| **Objetivo** | Registrar todas las acciones realizadas por el administrador |
| **Usuarios** | Administrador de correo |
| **Responsabilidades** | Registro de acciones, visualización de historial, exportación de logs de auditoría |
| **Funciones** | Registrar acción, ver historial de acciones, filtrar por fecha/acción/usuario, exportar resultados |
| **Entradas** | Acción realizada, usuario, timestamp |
| **Salidas** | Registro de auditoría, historial filtrado |
| **Reglas de negocio** | Todas las acciones se registran automáticamente; los registros no se pueden modificar ni eliminar; se conservan por tiempo mínimo de 1 año |
| **Dependencias** | Ninguna (módulo transversal) |
| **Permisos** | Solo lectura (el sistema escribe automáticamente) |
| **Notificaciones** | Ninguna |
| **Reportes** | Historial de acciones, acciones por usuario, acciones por tipo |
| **Criterios de aceptación** | Registro automático de todas las acciones; visualización de historial; exportación funcional |
| **Prioridad** | Alta (MVP) |
| **Clasificación** | MVP |

### 3.9 Módulo de Configuración

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Configuración |
| **Objetivo** | Gestionar la configuración del sistema SysAdmin Mail |
| **Usuarios** | Administrador de correo |
| **Responsabilidades** | Configuración general, políticas de contraseñas, configuración de alertas, parámetros del sistema |
| **Funciones** | Ver configuración, modificar política de contraseñas, configurar alertas, configurar restricciones de IP, gestionar usuarios del sistema |
| **Entradas** | Parámetros de configuración |
| **Salidas** | Configuración actualizada |
| **Reglas de negocio** | Solo el administrador puede cambiar configuración; los cambios requieren confirmación; se registran cambios de configuración |
| **Dependencias** | Ninguna (módulo de configuración global) |
| **Permisos** | Configuración completa del sistema |
| **Notificaciones** | Confirmación de cambios de configuración |
| **Reportes** | Configuración actual, historial de cambios |
| **Criterios de aceptación** | Visualización de configuración; modificación de parámetros; registro de cambios |
| **Prioridad** | Media (MVP) |
| **Clasificación** | MVP |

## 4. Matriz de dependencias

| Módulo | Dependencias |
|--------|--------------|
| Autenticación | Ninguna |
| Gestión de Dominios | Ninguna |
| Gestión de Buzones | Gestión de Dominios |
| Gestión de Aliases | Gestión de Buzones |
| Logs de Entrega | Ninguna |
| Bloqueo/Desbloqueo | Gestión de Buzones |
| Certificados SSL | Gestión de Dominios, Acceso SSH |
| Auditoría | Ninguna (transversal) |
| Configuración | Ninguna |

## 5. Diagrama de dependencias

```
┌─────────────────┐
│  Autenticación  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Gestión Dominios│◄────│  Configuración  │
└────────┬────────┘     └─────────────────┘
         │
         ├──►┌─────────────────┐
         │   │Gestión Buzones  │
         │   └────────┬────────┘
         │            │
         │            ├──►┌─────────────────┐
         │            │   │Gestión Aliases  │
         │            │   └─────────────────┘
         │            │
         │            ├──►┌─────────────────┐
         │            │   │Bloqueo/Desbloq. │
         │            │   └─────────────────┘
         │
         ├──►┌─────────────────┐
         │   │ Certificados SSL│
         │   └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Logs Entrega   │     │    Auditoría    │
└─────────────────┘     └─────────────────┘
```

## 6. Resumen de prioridades

| Prioridad | Módulos |
|-----------|---------|
| **Crítica** | Autenticación, Gestión de Buzones, Gestión de Dominios |
| **Alta** | Gestión de Aliases, Bloqueo/Desbloqueo, Certificados SSL, Auditoría |
| **Media** | Logs de Entrega, Configuración |

## 7. Próximos pasos

1. Aprobar catálogo de módulos
2. Avanzar a fase 5 (Requisitos funcionales)
