# Fase 5: Requisitos Funcionales

## 1. Visión General

Este documento define los requisitos funcionales del sistema **MailAdmin**, derivados del catálogo de módulos y los procesos documentados. Cada requisito es trazable a un módulo específico e incluye criterios de aceptación.

## 2. Integración Técnica

- **Backend**: mailctl (capa de orquestación autorizada)
- **Automatización**: Ansible (motor de automatización)
- **Base de datos**: PostgreSQL (acceso vía mailctl, NO directo)
- **Servidores**: Dovecot, Postfix (configuración vía Ansible/mailctl)

## 3. Validaciones Globales

| Validación | Regla |
|------------|-------|
| **Dominio** | Formato DNS válido |
| **Email** | Formato válido (user@domain.com) |
| **Campos obligatorios** | Todos los campos marcados como requeridos |

---

## 4. Requisitos Funcionales por Módulo

### 4.1 Panel Principal (Dashboard)

#### RF-DASH-001: Ver estado general
**Descripción**: El administrador puede ver el estado general de la plataforma.
**Criterios de aceptación**:
- Se muestra estado de la plataforma
- Se muestran servicios activos
- Se muestran estadísticas básicas

#### RF-DASH-002: Ver estado de servicios
**Descripción**: El administrador puede ver el estado de los servicios backend.
**Criterios de aceptación**:
- Se muestra estado de PostgreSQL
- Se muestra estado de Dovecot
- Se muestra estado de Postfix
- Se muestra estado de NGINX

#### RF-DASH-003: Ver estadísticas
**Descripción**: El administrador puede ver estadísticas de correo.
**Criterios de aceptación**:
- Se muestra cantidad de dominios
- Se muestra cantidad de buzones
- Se muestra cantidad de aliases

#### RF-DASH-004: Ver operaciones recientes
**Descripción**: El administrador puede ver las últimas operaciones realizadas.
**Criterios de aceptación**:
- Se muestran las últimas 10 operaciones
- Se muestra fecha, hora y usuario
- Se muestra tipo de operación

#### RF-DASH-005: Ver alertas
**Descripción**: El administrador puede ver alertas del sistema.
**Criterios de aceptación**:
- Se muestran alertas activas
- Se muestra severidad
- Se muestra fecha de la alerta

---

### 4.2 Autenticación y Autorización

#### RF-AUTH-001: Inicio de sesión
**Descripción**: El administrador puede iniciar sesión con credenciales.
**Criterios de aceptación**:
- Se valida usuario y contraseña
- Se crea sesión activa
- Se redirige al dashboard

#### RF-AUTH-002: Cierre de sesión
**Descripción**: El administrador puede cerrar sesión.
**Criterios de aceptación**:
- Se invalida la sesión
- Se redirige al login

#### RF-AUTH-003: Gestión de sesiones
**Descripción**: El sistema gestiona sesiones con expiración.
**Criterios de aceptación**:
- La sesión expira después de inactividad
- Se muestra alerta antes de expirar

#### RF-AUTH-004: Autorización por roles
**Descripción**: El sistema aplica autorización basada en roles.
**Criterios de aceptación**:
- Se validan permisos por rol
- Se deniegan operaciones no autorizadas

#### RF-AUTH-005: Gestión de usuarios
**Descripción**: El administrador puede gestionar usuarios del sistema.
**Criterios de aceptación**:
- Se pueden crear usuarios
- Se pueden asignar roles
- Se pueden eliminar usuarios

---

### 4.3 Gestión de Dominios

#### RF-DOM-001: Crear dominio
**Descripción**: El administrador puede crear un nuevo dominio.
**Backend**: mailctl domain create
**Criterios de aceptación**:
- El nombre tiene formato DNS válido
- No existe otro dominio con el mismo nombre
- Se muestra confirmación de creación
- Se registra en auditoría

#### RF-DOM-002: Habilitar dominio
**Descripción**: El administrador puede habilitar un dominio existente.
**Backend**: mailctl domain enable
**Criterios de aceptación**:
- Se verifica que el dominio existe
- El dominio queda habilitado
- Se registra en auditoría

#### RF-DOM-003: Deshabilitar dominio
**Descripción**: El administrador puede deshabilitar un dominio existente.
**Backend**: mailctl domain disable
**Criterios de aceptación**:
- Se verifica que el dominio existe
- El dominio queda deshabilitado
- Se registra en auditoría

#### RF-DOM-004: Eliminar dominio
**Descripción**: El administrador puede eliminar un dominio existente.
**Backend**: mailctl domain delete
**Criterios de aceptación**:
- Se verifica que no hay buzones asociados
- Se muestra confirmación antes de eliminar
- Se muestra mensaje de éxito
- Se registra en auditoría

#### RF-DOM-005: Validar configuración
**Descripción**: El administrador puede validar la configuración de un dominio.
**Backend**: mailctl validate
**Criterios de aceptación**:
- Se ejecuta validación
- Se muestran resultados
- Se muestra estado de la validación

---

### 4.4 Gestión de Buzones

#### RF-MAIL-001: Crear buzón
**Descripción**: El administrador puede crear un nuevo buzón.
**Backend**: mailctl mailbox create
**Criterios de aceptación**:
- El dominio seleccionado existe
- La contraseña cumple política de seguridad
- El usuario no existe en el dominio
- Se muestra confirmación de creación
- Se registra en auditoría

#### RF-MAIL-002: Eliminar buzón
**Descripción**: El administrador puede eliminar un buzón existente.
**Backend**: mailctl mailbox delete
**Criterios de aceptación**:
- Se muestra confirmación antes de eliminar
- Se verifica que el buzón existe
- Se muestra mensaje de éxito
- Se registra en auditoría

#### RF-MAIL-003: Habilitar buzón
**Descripción**: El administrador puede habilitar un buzón existente.
**Backend**: mailctl mailbox enable
**Criterios de aceptación**:
- Se verifica que el buzón existe
- El buzón queda habilitado
- Se registra en auditoría

#### RF-MAIL-004: Deshabilitar buzón
**Descripción**: El administrador puede deshabilitar un buzón existente.
**Backend**: mailctl mailbox disable
**Criterios de aceptación**:
- Se verifica que el buzón existe
- El buzón queda deshabilitado
- Se registra en auditoría

#### RF-MAIL-005: Restablecer contraseña
**Descripción**: El administrador puede restablecer la contraseña de un buzón.
**Backend**: mailctl passwd
**Criterios de aceptación**:
- Se solicita nueva contraseña
- Se permite generar contraseña aleatoria
- El cambio se aplica inmediatamente
- Se registra en auditoría

#### RF-MAIL-006: Administrar cuotas
**Descripción**: El administrador puede administrar las cuotas de los buzones.
**Backend**: mailctl mailbox quota
**Criterios de aceptación**:
- Se muestra uso actual de cuota
- Se permite configurar límite
- Los cambios se reflejan inmediatamente

#### RF-MAIL-007: Operaciones por lotes
**Descripción**: El administrador puede realizar operaciones por lotes.
**Backend**: mailctl passwd --batch
**Criterios de aceptación**:
- Se pueden seleccionar múltiples buzones
- Se pueden aplicar cambios en lote
- Se muestra progreso de la operación

---

### 4.5 Gestión de Aliases

#### RF-ALI-001: Crear alias
**Descripción**: El administrador puede crear un nuevo alias.
**Backend**: mailctl alias create
**Criterios de aceptación**:
- El dominio seleccionado existe
- El destino es un email válido
- No existe otro alias con el mismo nombre
- Se muestra confirmación de creación
- Se registra en auditoría

#### RF-ALI-002: Eliminar alias
**Descripción**: El administrador puede eliminar un alias existente.
**Backend**: mailctl alias delete
**Criterios de aceptación**:
- Se muestra confirmación antes de eliminar
- Se verifica que el alias existe
- Se muestra mensaje de éxito
- Se registra en auditoría

#### RF-ALI-003: Habilitar alias
**Descripción**: El administrador puede habilitar un alias existente.
**Backend**: mailctl alias enable
**Criterios de aceptación**:
- Se verifica que el alias existe
- El alias queda habilitado
- Se registra en auditoría

#### RF-ALI-004: Deshabilitar alias
**Descripción**: El administrador puede deshabilitar un alias existente.
**Backend**: mailctl alias disable
**Criterios de aceptación**:
- Se verifica que el alias existe
- El alias queda deshabilitado
- Se registra en auditoría

---

### 4.6 Identidades del Remitente

#### RF-IDT-001: Crear identidad
**Descripción**: El administrador puede crear una nueva identidad del remitente.
**Backend**: mailctl identity create
**Criterios de aceptación**:
- El buzón asociado existe
- Los datos son válidos
- Se muestra confirmación de creación
- Se registra en auditoría

#### RF-IDT-002: Actualizar identidad
**Descripción**: El administrador puede actualizar una identidad existente.
**Backend**: mailctl identity update
**Criterios de aceptación**:
- Se verifica que la identidad existe
- Los datos son válidos
- Los cambios se reflejan inmediatamente
- Se registra en auditoría

#### RF-IDT-003: Eliminar identidad
**Descripción**: El administrador puede eliminar una identidad existente.
**Backend**: mailctl identity delete
**Criterios de aceptación**:
- Se muestra confirmación antes de eliminar
- Se verifica que la identidad existe
- Se muestra mensaje de éxito
- Se registra en auditoría

#### RF-IDT-004: Establecer identidad predeterminada
**Descripción**: El administrador puede establecer una identidad como predeterminada.
**Backend**: mailctl identity default
**Criterios de aceptación**:
- Se verifica que la identidad existe
- La identidad queda como predeterminada
- Se registra en auditoría

---

### 4.7 Listas de Distribución

#### RF-DIST-001: Crear lista
**Descripción**: El administrador puede crear una nueva lista de distribución.
**Backend**: mailctl distribution create
**Criterios de aceptación**:
- El dominio seleccionado existe
- Los datos son válidos
- Se muestra confirmación de creación
- Se registra en auditoría

#### RF-DIST-002: Eliminar lista
**Descripción**: El administrador puede eliminar una lista existente.
**Backend**: mailctl distribution delete
**Criterios de aceptación**:
- Se muestra confirmación antes de eliminar
- Se verifica que la lista existe
- Se muestra mensaje de éxito
- Se registra en auditoría

#### RF-DIST-003: Administrar miembros
**Descripción**: El administrador puede administrar los miembros de una lista.
**Backend**: mailctl distribution members
**Criterios de aceptación**:
- Se pueden agregar miembros
- Se pueden eliminar miembros
- Se muestra lista de miembros actual

#### RF-DIST-004: Actualizaciones por lotes
**Descripción**: El administrador puede realizar actualizaciones por lotes.
**Backend**: mailctl distribution batch
**Criterios de aceptación**:
- Se pueden importar miembros desde archivo
- Se muestra progreso de la operación
- Se muestra resumen de cambios

---

### 4.8 Migración IMAP

#### RF-IMAP-001: Iniciar migración
**Descripción**: El administrador puede iniciar una migración IMAP.
**Backend**: mailctl migrate start
**Criterios de aceptación**:
- Se muestran opciones de migración
- Se confirma el inicio
- Se muestra progreso

#### RF-IMAP-002: Supervisar progreso
**Descripción**: El administrador puede supervisar el progreso de una migración.
**Backend**: mailctl migrate status
**Criterios de aceptación**:
- Se muestra estado actual
- Se muestra porcentaje completado
- Se muestran errores si los hay

#### RF-IMAP-003: Reintentar fallidos
**Descripción**: El administrador puede reintentar trabajos fallidos.
**Backend**: mailctl migrate retry
**Criterios de aceptación**:
- Se muestran trabajos fallidos
- Se confirma el reintento
- Se muestra progreso

#### RF-IMAP-004: Consultar resultados
**Descripción**: El administrador puede consultar los resultados de una migración.
**Backend**: mailctl migrate results
**Criterios de aceptación**:
- Se muestra resumen de la migración
- Se muestran detalles de cada buzón
- Se permite exportar resultados

---

### 4.9 Validación

#### RF-VAL-001: Validación de plataforma
**Descripción**: El administrador puede ejecutar una validación completa de la plataforma.
**Backend**: mailctl validate platform
**Criterios de aceptación**:
- Se ejecutan todas las validaciones
- Se muestra estado de cada servicio
- Se muestra resumen de la validación

#### RF-VAL-002: Validación de flujo de correo
**Descripción**: El administrador puede validar el flujo de correo.
**Backend**: mailctl validate flow
**Criterios de aceptación**:
- Se valida envío de correo
- Se valida recepción de correo
- Se muestra estado del flujo

#### RF-VAL-003: Validación de configuración
**Descripción**: El administrador puede validar la configuración.
**Backend**: mailctl validate config
**Criterios de aceptación**:
- Se valida configuración de PostgreSQL
- Se valida configuración de Dovecot
- Se valida configuración de Postfix

#### RF-VAL-004: Validación en tiempo de ejecución
**Descripción**: El administrador puede ejecutar validaciones en tiempo de ejecución.
**Backend**: mailctl validate runtime
**Criterios de aceptación**:
- Se ejecutan validaciones en tiempo real
- Se muestra estado actual
- Se muestran alertas si las hay

---

### 4.10 Bitácoras

#### RF-LOG-001: Ver bitácoras operativas
**Descripción**: El administrador puede ver las bitácoras de operaciones.
**Criterios de aceptación**:
- Se muestra historial de operaciones
- Se permite filtrar por fecha, acción, módulo
- Se permite buscar por detalles

#### RF-LOG-002: Ver bitácoras de validación
**Descripción**: El administrador puede ver las bitácoras de validación.
**Criterios de aceptación**:
- Se muestra historial de validaciones
- Se permite filtrar por fecha, tipo
- Se muestra estado de cada validación

#### RF-LOG-003: Exportar historial
**Descripción**: El administrador puede exportar el historial de auditoría.
**Criterios de aceptación**:
- Se exportan los registros filtrados
- El archivo CSV incluye todos los campos
- Se descarga automáticamente

---

### 4.11 Administración de Servicios

#### RF-SVC-001: Ver estado de servicios
**Descripción**: El administrador puede ver el estado de los servicios backend.
**Criterios de aceptación**:
- Se muestra estado de PostgreSQL
- Se muestra estado de Dovecot
- Se muestra estado de Postfix
- Se muestra estado de NGINX

#### RF-SVC-002: Reiniciar servicio
**Descripción**: El administrador puede reiniciar un servicio.
**Criterios de aceptación**:
- Se muestra confirmación antes de reiniciar
- Se ejecuta el reinicio
- Se muestra estado actualizado

#### RF-SVC-003: Recargar configuración
**Descripción**: El administrador puede recargar la configuración de un servicio.
**Criterios de aceptación**:
- Se muestra confirmación antes de recargar
- Se ejecuta la recarga
- Se muestra estado actualizado

#### RF-SVC-004: Ver información de salud
**Descripción**: El administrador puede ver información de salud de los servicios.
**Criterios de aceptación**:
- Se muestra health check de cada servicio
- Se muestra uptime
- Se muestra uso de recursos

---

## 5. Matriz de Trazabilidad

| Requisito | Módulo | Backend |
|-----------|--------|---------|
| RF-DASH-001 | Panel Principal | - |
| RF-DASH-002 | Panel Principal | - |
| RF-DASH-003 | Panel Principal | - |
| RF-DASH-004 | Panel Principal | - |
| RF-DASH-005 | Panel Principal | - |
| RF-AUTH-001 | Autenticación | - |
| RF-AUTH-002 | Autenticación | - |
| RF-AUTH-003 | Autenticación | - |
| RF-AUTH-004 | Autenticación | - |
| RF-AUTH-005 | Autenticación | - |
| RF-DOM-001 | Dominios | mailctl domain create |
| RF-DOM-002 | Dominios | mailctl domain enable |
| RF-DOM-003 | Dominios | mailctl domain disable |
| RF-DOM-004 | Dominios | mailctl domain delete |
| RF-DOM-005 | Dominios | mailctl validate |
| RF-MAIL-001 | Buzones | mailctl mailbox create |
| RF-MAIL-002 | Buzones | mailctl mailbox delete |
| RF-MAIL-003 | Buzones | mailctl mailbox enable |
| RF-MAIL-004 | Buzones | mailctl mailbox disable |
| RF-MAIL-005 | Buzones | mailctl passwd |
| RF-MAIL-006 | Buzones | mailctl mailbox quota |
| RF-MAIL-007 | Buzones | mailctl passwd --batch |
| RF-ALI-001 | Aliases | mailctl alias create |
| RF-ALI-002 | Aliases | mailctl alias delete |
| RF-ALI-003 | Aliases | mailctl alias enable |
| RF-ALI-004 | Aliases | mailctl alias disable |
| RF-IDT-001 | Identidades | mailctl identity create |
| RF-IDT-002 | Identidades | mailctl identity update |
| RF-IDT-003 | Identidades | mailctl identity delete |
| RF-IDT-004 | Identidades | mailctl identity default |
| RF-DIST-001 | Listas | mailctl distribution create |
| RF-DIST-002 | Listas | mailctl distribution delete |
| RF-DIST-003 | Listas | mailctl distribution members |
| RF-DIST-004 | Listas | mailctl distribution batch |
| RF-IMAP-001 | Migración | mailctl migrate start |
| RF-IMAP-002 | Migración | mailctl migrate status |
| RF-IMAP-003 | Migración | mailctl migrate retry |
| RF-IMAP-004 | Migración | mailctl migrate results |
| RF-VAL-001 | Validación | mailctl validate platform |
| RF-VAL-002 | Validación | mailctl validate flow |
| RF-VAL-003 | Validación | mailctl validate config |
| RF-VAL-004 | Validación | mailctl validate runtime |
| RF-LOG-001 | Bitácoras | - |
| RF-LOG-002 | Bitácoras | - |
| RF-LOG-003 | Bitácoras | - |
| RF-SVC-001 | Servicios | - |
| RF-SVC-002 | Servicios | - |
| RF-SVC-003 | Servicios | - |
| RF-SVC-004 | Servicios | - |

## 6. Próximos pasos

1. ~~Aprobar requisitos funcionales~~ ✓ COMPLETADO
2. Avanzar a fase 6 (Información e integraciones)
