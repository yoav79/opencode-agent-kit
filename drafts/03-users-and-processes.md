# Fase 3: Usuarios y Procesos

## 1. Actores y roles

### 1.1 Actores del sistema

| Actor | Rol | Descripción | Permisos |
|-------|-----|-------------|----------|
| **Administrador de correo** | admin | Único usuario del sistema en fase 1. Responsable de gestionar buzones, dominios, aliases, quotas, certificados SSL y logs de entrega. | Acceso completo a todas las funcionalidades |

### 1.2 Roles definidos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **admin** | Administrador principal del sistema | CRUD completo sobre buzones, dominios, aliases, quotas, certificados SSL; lectura de logs; auditoría |

## 2. Procesos actuales (Ansible CLI)

### 2.1 Crear un buzón nuevo

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar playbook de Ansible para crear buzón
3. Ingresar parámetros manualmente (usuario, dominio, contraseña)
4. Verificar que se creó correctamente
5. Documentar manualmente si es necesario

**Problemas identificados:**
- Proceso manual y repetitivo
- No hay validación automática de datos
- Hay que recordar dominios y usuarios existentes
- Sin interfaz gráfica para visualización

### 2.2 Eliminar un buzón

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar playbook de Ansible para eliminar buzón
3. Ingresar usuario y dominio
4. Confirmar eliminación
5. Verificar que se eliminó

**Problemas identificados:**
- Riesgo de eliminar buzón incorrecto
- No hay confirmación visual
- Sin auditoría de quién eliminó qué

### 2.3 Cambiar contraseña

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar playbook de Ansible para cambiar contraseña
3. Ingresar usuario, dominio y nueva contraseña
4. Verificar cambio

**Problemas identificados:**
- Sin generación automática de contraseñas seguras
- Sin registro de cambio de contraseña

### 2.4 Configurar quota

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar playbook de Ansible para configurar quota
3. Ingresar usuario, dominio y límite de disco
4. Verificar configuración

**Problemas identificados:**
- Sin políticas predefinidas
- Sin visualización de uso actual

### 2.5 Gestionar alias

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar playbook de Ansible para crear/modificar/eliminar alias
3. Ingresar alias, destino y dominio
4. Verificar cambios

**Problemas identificados:**
- Sin vista consolidada de todos los aliases
- Difícil rastrear aliases existentes

### 2.6 Gestionar dominio

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar playbook de Ansible para agregar/eliminar dominio
3. Ingresar nombre de dominio
4. Configurar DNS y certificados SSL
5. Verificar funcionamiento

**Problemas identificados:**
- Proceso complejo y manual
- Requiere conocimiento de configuración DNS
- Sin gestión integrada de certificados SSL

### 2.7 Ver logs de entrega

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Navegar por archivos de log manualmente
3. Buscar información específica con grep/awk
4. Copiar información relevante

**Problemas identificados:**
- Sin interfaz de visualización
- Búsqueda manual y lenta
- Sin filtros predefinidos

### 2.8 Bloquear/desbloquear usuario

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar playbook de Ansible para bloquear/desbloquear
3. Ingresar usuario y dominio
4. Verificar cambio de estado

**Problemas identificados:**
- Sin visualización de estado actual
- Sin registro de cambios

### 2.9 Gestionar certificado SSL

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar comandos de Let's Encrypt o similar
3. Renovar certificados manualmente
4. Verificar instalación
5. Monitorear expiración manualmente

**Problemas identificados:**
- Proceso manual y propenso a olvidos
- Sin alertas de expiración
- Sin gestión centralizada

## 3. Frecuencia de operaciones

| Operación | Frecuencia |
|-----------|------------|
| Crear buzón | Bajo demanda |
| Eliminar buzón | Bajo demanda |
| Cambiar contraseña | Bajo demanda |
| Configurar quota | Bajo demanda |
| Gestionar alias | Bajo demanda |
| Gestionar dominio | Bajo demanda |
| Ver logs de entrega | Bajo demanda |
| Bloquear/desbloquear | Bajo demanda |
| Gestionar certificado SSL | Bajo demanda |

## 4. Tiempo actual de operaciones

| Operación | Tiempo estimado |
|-----------|-----------------|
| Crear buzón | Bastante tiempo (manual) |
| Eliminar buzón | Bastante tiempo (manual) |
| Cambiar contraseña | Bastante tiempo (manual) |
| Configurar quota | Bastante tiempo (manual) |
| Gestionar alias | Bastante tiempo (manual) |
| Gestionar dominio | Bastante tiempo (manual) |
| Ver logs de entrega | Bastante tiempo (búsqueda manual) |
| Bloquear/desbloquear | Bastante tiempo (manual) |
| Gestionar certificado SSL | Bastante tiempo (manual) |

## 5. Errores comunes

1. **Falta de datos relacionados**: Al ser CLI, no hay información contextual sobre dominios, usuarios o configuraciones existentes.
2. **Memoria**: Hay que recordar dominios, usuarios y configuraciones anteriores.
3. **Tipeo**: Errores al escribir comandos o parámetros manualmente.
4. **Documentación**: Falta de registro de cambios realizados.

## 6. Puntos de dolor

1. **CLI como única interfaz**: Toda la gestión se realiza vía línea de comandos, lo cual es lento y propenso a errores.
2. **Sin visualización**: No hay forma de ver rápidamente el estado actual de buzones, dominios o certificados.
3. **Sin auditoría**: No hay registro de quién hizo qué cambio y cuándo.
4. **Sin validación**: No hay validación automática de parámetros de entrada.

## 7. Procesos futuros (SysAdmin Mail)

### 7.1 Flujo ideal para crear buzón
1. Acceder a la interfaz web
2. Seleccionar "Crear buzón"
3. Sistema muestra dominios disponibles (selección dropdown)
4. Ingresar nombre de usuario
5. Sistema genera contraseña segura (opcional: contraseña personalizada)
6. Configurar quota (opcional: política predefinida)
7. Confirmar creación
8. Sistema muestra resumen y registro en auditoría

### 7.2 Flujo ideal para gestionar certificados SSL
1. Acceder a la interfaz web
2. Seleccionar "Certificados SSL"
3. Sistema muestra estado de todos los certificados
4. Renovar certificado vencido con un clic
5. Instalar nuevo certificado
6. Recibir alertas de expiración

### 7.3 Flujo ideal para ver logs
1. Acceder a la interfaz web
2. Seleccionar "Logs de entrega"
3. Sistema muestra logs con filtros predefinidos
4. Buscar por usuario, dominio, fecha, estado
5. Exportar resultados si es necesario

## 8. Excepciones

No se han identificado excepciones en esta fase. El sistema debe manejar casos normales de administración de buzones de correo.

## 9. Puntos de control

| Punto de control | Descripción |
|------------------|-------------|
| **Autenticación** | El administrador debe autenticarse (usuario/contraseña + 2FA) antes de acceder |
| **Confirmación de acciones** | Acciones destructivas (eliminar buzón, bloquear usuario) requieren confirmación |
| **Registro de auditoría** | Todas las acciones quedan registradas con timestamp y usuario |
| **Logs de seguridad** | Intentos de acceso, cambios sensibles y errores se registran |

## 10. Próximos pasos

1. Aprobar fase de usuarios y procesos
2. Avanzar a fase 4 (Catálogo de módulos)
