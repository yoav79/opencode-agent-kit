# Fase 5: Requisitos Funcionales

## 1. Visión general

Este documento define los requisitos funcionales del sistema **SysAdmin Mail**, derivados del catálogo de módulos y los procesos documentados. Cada requisito es trazable a un módulo específico y incluye criterios de aceptación.

## 2. Integración técnica

- **Base de datos**: Consultas directas a PostgreSQL 16 (sin ORM)
- **Servidores del cluster**: Conexión directa vía SSH para gestión de certificados SSL
- **Backend**: Node.js con acceso directo a PostgreSQL

## 3. Validaciones globales

| Validación | Regla |
|------------|-------|
| Contraseña | Mínimo 8 caracteres |
| Quota máxima | 5GB por usuario |
| Dominio | Formato DNS válido |
| Email | Formato válido (user@domain.com) |
| Campos obligatorios | Todos los campos marcados como requeridos |

---

## 4. Requisitos funcionales por módulo

### 4.1 Módulo de Autenticación

#### RF-AUTH-001: Inicio de sesión
**Descripción**: El administrador puede iniciar sesión con credenciales de usuario y contraseña.
**Criterios de aceptación**:
- El sistema valida email y contraseña contra PostgreSQL
- Si las credenciales son correctas, se muestra pantalla de verificación 2FA
- Si las credenciales son incorrectas, se muestra mensaje de error
- Se incrementa contador de intentos fallidos

#### RF-AUTH-002: Verificación 2FA
**Descripción**: El sistema solicita código de verificación de dos factores después de autenticación correcta.
**Criterios de aceptación**:
- Se muestra campo para ingresar código 2FA
- El código se valida contra el generador configurado
- Si el código es correcto, se crea sesión y se redirige al dashboard
- Si el código es incorrecto, se muestra mensaje de error

#### RF-AUTH-003: Gestión de sesiones
**Descripción**: El sistema gestiona sesiones con expiración por inactividad.
**Criterios de aceptación**:
- La sesión expira después de 30 minutos de inactividad
- Se muestra alerta antes de expirar (5 minutos)
- Al expirar, se redirige a login
- Se puede cerrar sesión manualmente

#### RF-AUTH-004: Bloqueo por intentos fallidos
**Descripción**: El sistema bloquea temporalmente el acceso después de 5 intentos fallidos.
**Criterios de aceptación**:
- Después de 5 intentos fallidos, se bloquea por 15 minutos
- Se muestra mensaje con tiempo restante de bloqueo
- El contador se reinicia después de login exitoso

---

### 4.2 Módulo de Gestión de Buzones

#### RF-MAIL-001: Crear buzón
**Descripción**: El administrador puede crear un nuevo buzón de correo.
**Campos**:
- usuario (obligatorio)
- dominio (obligatorio, selección de lista)
- contraseña (obligatorio, mín. 8 caracteres)
- quota (opcional, máx. 5GB, default 1GB)
- estado (automático: activo)
- fecha_creación (automático)

**Criterios de aceptación**:
- El dominio seleccionado existe en el sistema
- La contraseña cumple política de seguridad
- El usuario no existe en el dominio
- Se muestra confirmación de creación
- Se registra en auditoría

#### RF-MAIL-002: Eliminar buzón
**Descripción**: El administrador puede eliminar un buzón existente.
**Criterios de aceptación**:
- Se muestra confirmación antes de eliminar
- Se verifica que el buzón existe
- Se eliminan aliases asociados automáticamente
- Se muestra mensaje de éxito
- Se registra en auditoría

#### RF-MAIL-003: Modificar buzón
**Descripción**: El administrador puede modificar información de un buzón.
**Campos modificables**: quota, estado
**Criterios de aceptación**:
- Se muestran datos actuales del buzón
- Solo se pueden modificar campos permitidos
- Los cambios se reflejan inmediatamente
- Se registra en auditoría

#### RF-MAIL-004: Cambiar contraseña
**Descripción**: El administrador puede cambiar la contraseña de un buzón.
**Criterios de aceptación**:
- Se solicita nueva contraseña (mín. 8 caracteres)
- Se permite generar contraseña aleatoria
- El cambio se aplica inmediatamente
- Se registra en auditoría

#### RF-MAIL-005: Configurar quota
**Descripción**: El administrador puede configurar la quota de disco de un buzón.
**Criterios de aceptación**:
- Se muestra uso actual de quota
- Se permite configurar hasta 5GB
- Se valida que no exceda el límite
- Los cambios se reflejan inmediatamente

#### RF-MAIL-006: Listar buzones
**Descripción**: El administrador puede ver la lista de todos los buzones.
**Criterios de aceptación**:
- Se muestra tabla con: usuario, dominio, estado, quota, fecha_creación
- Se permite buscar por usuario o dominio
- Se permite filtrar por estado
- Se permite ordenar por cualquier columna

---

### 4.3 Módulo de Gestión de Dominios

#### RF-DOM-001: Agregar dominio
**Descripción**: El administrador puede agregar un nuevo dominio de correo.
**Campos**:
- nombre (obligatorio, formato DNS)
- estado (automático: activo)
- fecha_creación (automático)

**Criterios de aceptación**:
- El nombre tiene formato DNS válido
- No existe otro dominio con el mismo nombre
- Se muestra confirmación de creación
- Se registra en auditoría

#### RF-DOM-002: Eliminar dominio
**Descripción**: El administrador puede eliminar un dominio existente.
**Criterios de aceptación**:
- Se verifica que no hay buzones asociados
- Se muestra confirmación antes de eliminar
- Se muestra mensaje de éxito
- Se registra en auditoría

#### RF-DOM-003: Modificar dominio
**Descripción**: El administrador puede modificar información de un dominio.
**Campos modificables**: estado
**Criterios de aceptación**:
- Se muestran datos actuales del dominio
- Los cambios se reflejan inmediatamente
- Se registra en auditoría

#### RF-DOM-004: Listar dominios
**Descripción**: El administrador puede ver la lista de todos los dominios.
**Criterios de aceptación**:
- Se muestra tabla con: nombre, estado, fecha_creación, cantidad_buzones
- Se permite buscar por nombre
- Se permite ordenar por cualquier columna

---

### 4.4 Módulo de Gestión de Aliases

#### RF-ALI-001: Crear alias
**Descripción**: El administrador puede crear un nuevo alias de correo.
**Campos**:
- alias (obligatorio)
- destino (obligatorio, email o lista de emails)
- dominio (obligatorio, selección de lista)
- estado (automático: activo)
- fecha_creación (automático)

**Criterios de aceptación**:
- El dominio seleccionado existe
- El destino es un email válido
- No existe otro alias con el mismo nombre en el dominio
- No se crean aliases circulares
- Se muestra confirmación de creación
- Se registra en auditoría

#### RF-ALI-002: Eliminar alias
**Descripción**: El administrador puede eliminar un alias existente.
**Criterios de aceptación**:
- Se muestra confirmación antes de eliminar
- Se verifica que el alias existe
- Se muestra mensaje de éxito
- Se registra en auditoría

#### RF-ALI-003: Modificar alias
**Descripción**: El administrador puede modificar información de un alias.
**Campos modificables**: destino, estado
**Criterios de aceptación**:
- Se muestran datos actuales del alias
- Los cambios se reflejan inmediatamente
- Se registra en auditoría

#### RF-ALI-004: Listar aliases
**Descripción**: El administrador puede ver la lista de todos los aliases.
**Criterios de aceptación**:
- Se muestra tabla con: alias, destino, dominio, estado, fecha_creación
- Se permite buscar por alias o destino
- Se permite filtrar por dominio o estado
- Se permite ordenar por cualquier columna

---

### 4.5 Módulo de Logs de Entrega

#### RF-LOG-001: Ver logs recientes
**Descripción**: El administrador puede visualizar los logs de entrega más recientes.
**Campos del log**:
- fecha
- hora
- remitente
- destinatario
- estado (entregado/rechazado/pendiente)
- tamaño
- servidor

**Criterios de aceptación**:
- Se muestran los últimos 100 registros
- Se muestran en orden cronológico inverso
- Se colorean según estado (verde: entregado, rojo: rechazado, amarillo: pendiente)

#### RF-LOG-002: Buscar logs
**Descripción**: El administrador puede buscar logs con filtros específicos.
**Filtros disponibles**:
- Rango de fechas
- Remitente
- Destinatario
- Estado
- Servidor

**Criterios de aceptación**:
- Se muestran filtros en panel lateral
- Los resultados se actualizan al aplicar filtros
- Se muestra cantidad de resultados encontrados

#### RF-LOG-003: Exportar logs
**Descripción**: El administrador puede exportar logs a formato CSV.
**Criterios de aceptación**:
- Se exportan los registros filtrados
- El archivo CSV incluye todos los campos
- Se descarga automáticamente el archivo

---

### 4.6 Módulo de Bloqueo/Desbloqueo

#### RF-BLK-001: Bloquear usuario
**Descripción**: El administrador puede bloquear el acceso de un usuario.
**Criterios de aceptación**:
- Se verifica que el buzón existe
- Se muestra confirmación antes de bloquear
- El usuario queda sin acceso a envío y recepción
- Se muestra estado actualizado
- Se registra en auditoría

#### RF-BLK-002: Desbloquear usuario
**Descripción**: El administrador puede desbloquear el acceso de un usuario.
**Criterios de aceptación**:
- Se verifica que el buzón está bloqueado
- Se muestra confirmación antes de desbloquear
- El usuario recupera acceso a envío y recepción
- Se muestra estado actualizado
- Se registra en auditoría

#### RF-BLK-003: Ver usuarios bloqueados
**Descripción**: El administrador puede ver la lista de usuarios bloqueados.
**Criterios de aceptación**:
- Se muestra tabla con: usuario, dominio, fecha_bloqueo
- Se permite buscar por usuario o dominio
- Se permite desbloquear desde la lista

---

### 4.7 Módulo de Certificados SSL

#### RF-SSL-001: Ver estado de certificados
**Descripción**: El administrador puede ver el estado de todos los certificados SSL.
**Campos**:
- dominio
- fecha_emisión
- fecha_expiración
- estado (válido/próximo_a_vencer/vencido)
- emisor

**Criterios de aceptación**:
- Se muestra tabla con todos los dominios y su estado de certificado
- Se colorean según estado (verde: válido, amarillo: próximo, rojo: vencido)
- Se muestran días restantes hasta expiración

#### RF-SSL-002: Renovar certificado
**Descripción**: El administrador puede renovar un certificado SSL manualmente.
**Criterios de aceptación**:
- Se muestra confirmación antes de renovar
- Se ejecuta renovación vía Let's Encrypt
- Se muestra progreso de la operación
- Se muestra mensaje de éxito/error
- Se registra en auditoría

#### RF-SSL-003: Configurar alertas
**Descripción**: El administrador puede configurar alertas de expiración.
**Opciones de alerta**:
- 30 días antes de expirar
- 15 días antes de expirar
- 7 días antes de expirar

**Criterios de aceptación**:
- Se muestran opciones de configuración
- Se guardan las preferencias
- Se envían alertas según configuración

#### RF-SSL-004: Ver historial de renovaciones
**Descripción**: El administrador puede ver el historial de renovaciones de certificados.
**Criterios de aceptación**:
- Se muestra tabla con: dominio, fecha_renovación, resultado
- Se permite filtrar por dominio o fecha
- Se permite exportar a CSV

---

### 4.8 Módulo de Auditoría

#### RF-AUD-001: Registrar acción
**Descripción**: El sistema registra automáticamente todas las acciones del administrador.
**Campos del registro**:
- timestamp
- usuario
- acción
- módulo
- detalles
- IP_origen

**Criterios de aceptación**:
- Todas las acciones se registran automáticamente
- Los registros son inmutables
- Se conservan por mínimo 1 año

#### RF-AUD-002: Ver historial de acciones
**Descripción**: El administrador puede ver el historial de acciones.
**Criterios de aceptación**:
- Se muestra tabla con todos los campos del registro
- Se permite filtrar por fecha, acción, módulo
- Se permite buscar por detalles
- Se muestran en orden cronológico inverso

#### RF-AUD-003: Exportar historial
**Descripción**: El administrador puede exportar el historial de auditoría.
**Criterios de aceptación**:
- Se exportan los registros filtrados
- El archivo CSV incluye todos los campos
- Se descarga automáticamente

---

### 4.9 Módulo de Configuración

#### RF-CFG-001: Ver configuración actual
**Descripción**: El administrador puede ver la configuración del sistema.
**Parámetros configurables**:
- Política de contraseñas (longitud mínima)
- Tiempo de expiración de sesión (minutos)
- Intentos máximos de login
- Tiempo de bloqueo por intentos fallidos
- Configuración de alertas SSL
- Restricciones de IP

**Criterios de aceptación**:
- Se muestran todos los parámetros con sus valores actuales
- Se permite modificar cada parámetro
- Se muestran valores por defecto

#### RF-CFG-002: Modificar configuración
**Descripción**: El administrador puede modificar los parámetros de configuración.
**Criterios de aceptación**:
- Se muestra confirmación antes de guardar
- Los cambios se aplican inmediatamente
- Se registra el cambio en auditoría
- Se muestra mensaje de éxito

#### RF-CFG-003: Restablecer configuración
**Descripción**: El administrador puede restablecer la configuración por defecto.
**Criterios de aceptación**:
- Se muestra confirmación antes de restablecer
- Todos los parámetros vuelven a valores por defecto
- Se registra en auditoría
- Se muestra mensaje de éxito

---

## 5. Matriz de trazabilidad

| Requisito | Módulo | Proceso asociado |
|-----------|--------|------------------|
| RF-AUTH-001 | Autenticación | Login |
| RF-AUTH-002 | Autenticación | Verificación 2FA |
| RF-AUTH-003 | Autenticación | Gestión de sesiones |
| RF-AUTH-004 | Autenticación | Bloqueo por intentos |
| RF-MAIL-001 | Gestión de Buzones | Crear buzón |
| RF-MAIL-002 | Gestión de Buzones | Eliminar buzón |
| RF-MAIL-003 | Gestión de Buzones | Modificar buzón |
| RF-MAIL-004 | Gestión de Buzones | Cambiar contraseña |
| RF-MAIL-005 | Gestión de Buzones | Configurar quota |
| RF-MAIL-006 | Gestión de Buzones | Listar buzones |
| RF-DOM-001 | Gestión de Dominios | Agregar dominio |
| RF-DOM-002 | Gestión de Dominios | Eliminar dominio |
| RF-DOM-003 | Gestión de Dominios | Modificar dominio |
| RF-DOM-004 | Gestión de Dominios | Listar dominios |
| RF-ALI-001 | Gestión de Aliases | Crear alias |
| RF-ALI-002 | Gestión de Aliases | Eliminar alias |
| RF-ALI-003 | Gestión de Aliases | Modificar alias |
| RF-ALI-004 | Gestión de Aliases | Listar aliases |
| RF-LOG-001 | Logs de Entrega | Ver logs recientes |
| RF-LOG-002 | Logs de Entrega | Buscar logs |
| RF-LOG-003 | Logs de Entrega | Exportar logs |
| RF-BLK-001 | Bloqueo/Desbloqueo | Bloquear usuario |
| RF-BLK-002 | Bloqueo/Desbloqueo | Desbloquear usuario |
| RF-BLK-003 | Bloqueo/Desbloqueo | Ver bloqueados |
| RF-SSL-001 | Certificados SSL | Ver estado |
| RF-SSL-002 | Certificados SSL | Renovar certificado |
| RF-SSL-003 | Certificados SSL | Configurar alertas |
| RF-SSL-004 | Certificados SSL | Ver historial |
| RF-AUD-001 | Auditoría | Registrar acción |
| RF-AUD-002 | Auditoría | Ver historial |
| RF-AUD-003 | Auditoría | Exportar historial |
| RF-CFG-001 | Configuración | Ver configuración |
| RF-CFG-002 | Configuración | Modificar configuración |
| RF-CFG-003 | Configuración | Restablecer configuración |

## 6. Próximos pasos

1. Aprobar requisitos funcionales
2. Avanzar a fase 6 (Información e integraciones)
