# Fase 3: Usuarios y Procesos

## 1. Actores y Roles

### 1.1 Actores del Sistema

| Actor | Rol | Descripción | Permisos |
|-------|-----|-------------|----------|
| **Administrador de correo** | admin | Usuario principal del panel. Responsable de gestionar dominios, buzones, aliases, identidades, listas de distribución, migración IMAP y validación. | Acceso completo a todas las funcionalidades |
| **Operador de correo** | operator | Usuario con permisos limitados para operaciones diarias de gestión de buzones y aliases. | Lectura y escritura de buzones y aliases |

### 1.2 Roles Definidos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **admin** | Administrador principal | CRUD completo sobre todos los módulos |
| **operator** | Operador con permisos limitados | Lectura y escritura de buzones y aliases |

## 2. Procesos Actuales

### 2.1 Crear un Buzón Nuevo

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar comando `mailctl mailbox create`
3. Ingresar parámetros manualmente (usuario, dominio, contraseña)
4. Verificar que se creó correctamente

**Problemas identificados:**
- Proceso manual y repetitivo
- No hay validación automática de datos
- Hay que recordar dominios y usuarios existentes
- Sin interfaz gráfica para visualización

### 2.2 Eliminar un Buzón

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar comando `mailctl mailbox delete`
3. Ingresar usuario y dominio
4. Confirmar eliminación

**Problemas identificados:**
- Riesgo de eliminar buzón incorrecto
- No hay confirmación visual
- Sin auditoría de quién eliminó qué

### 2.3 Restablecer Contraseña

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar comando `mailctl passwd`
3. Ingresar usuario, dominio y nueva contraseña
4. Verificar cambio

**Problemas identificados:**
- Sin generación automática de contraseñas seguras
- Sin registro de cambio de contraseña

### 2.4 Gestionar Alias

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar comando `mailctl alias`
3. Ingresar alias, destino y dominio
4. Verificar cambios

**Problemas identificados:**
- Sin vista consolidada de todos los aliases
- Difícil rastrear aliases existentes

### 2.5 Gestionar Dominio

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar comando `mailctl domain`
3. Ingresar nombre de dominio
4. Configurar DNS y certificados SSL
5. Verificar funcionamiento

**Problemas identificados:**
- Proceso complejo y manual
- Requiere conocimiento de configuración DNS
- Sin gestión integrada de certificados SSL

### 2.6 Validar Plataforma

**Pasos actuales:**
1. Conectar vía SSH al servidor
2. Ejecutar comando `mailctl validate`
3. Revisar resultados manualmente

**Problemas identificados:**
- Sin interfaz de visualización
- Resultados en texto plano
- Sin历史历史 de validaciones

## 3. Frecuencia de Operaciones

| Operación | Frecuencia |
|-----------|------------|
| Crear buzón | Bajo demanda |
| Eliminar buzón | Bajo demanda |
| Restablecer contraseña | Bajo demanda |
| Gestionar alias | Bajo demanda |
| Gestionar dominio | Bajo demanda |
| Validar plataforma | Periódica |

## 4. Tiempo Actual de Operaciones

| Operación | Tiempo estimado |
|-----------|-----------------|
| Crear buzón | Bastante tiempo (manual) |
| Eliminar buzón | Bastante tiempo (manual) |
| Restablecer contraseña | Bastante tiempo (manual) |
| Gestionar alias | Bastante tiempo (manual) |
| Gestionar dominio | Bastante tiempo (manual) |
| Validar plataforma | Bastante tiempo (manual) |

## 5. Errores Comunes

1. **Falta de datos relacionados**: Al ser CLI, no hay información contextual sobre dominios o usuarios existentes.
2. **Memoria**: Hay que recordar dominios, usuarios y configuraciones anteriores.
3. **Tipeo**: Errores al escribir comandos o parámetros manualmente.
4. **Documentación**: Falta de registro de cambios realizados.

## 6. Puntos de Dolor

1. **CLI como única interfaz**: Toda la gestión se realiza vía línea de comandos, lo cual es lento y propenso a errores.
2. **Sin visualización**: No hay forma de ver rápidamente el estado actual de buzones, dominios o servicios.
3. **Sin auditoría**: No hay registro de quién hizo qué cambio y cuándo.
4. **Sin validación**: No hay validación automática de parámetros de entrada.

## 7. Procesos Futuros (MailAdmin)

### 7.1 Flujo Ideal para Crear Buzón

1. Acceder a la interfaz web
2. Seleccionar "Crear buzón"
3. Sistema muestra dominios disponibles (selección dropdown)
4. Ingresar nombre de usuario
5. Sistema genera contraseña segura (opcional: contraseña personalizada)
6. Configurar cuota (opcional: política predefinida)
7. Confirmar creación
8. Sistema muestra resumen y registro en auditoría

### 7.2 Flujo Ideal para Validar Plataforma

1. Acceder a la interfaz web
2. Seleccionar "Validación"
3. Sistema muestra opciones de validación
4. Ejecutar validación de plataforma
5. Sistema muestra resultados con indicadores visuales
6. Guardar历史历史 de validación

### 7.3 Flujo Ideal para Ver Logs

1. Acceder a la interfaz web
2. Seleccionar "Bitácoras"
3. Sistema muestra logs con filtros predefinidos
4. Buscar por fecha, acción, módulo
5. Exportar resultados si es necesario

## 8. Excepciones

No se han identificado excepciones en esta fase. El sistema debe manejar casos normales de administración de la plataforma de correo.

## 9. Puntos de Control

| Punto de control | Descripción |
|------------------|-------------|
| **Autenticación** | El administrador debe autenticarse antes de acceder |
| **Autorización** | Solo los roles autorizados pueden realizar operaciones |
| **Confirmación de acciones** | Acciones destructivas requieren confirmación |
| **Registro de auditoría** | Todas las acciones quedan registradas |

## 10. Próximos pasos

1. ~~Aprobar fase de usuarios y procesos~~ ✓ COMPLETADO
2. Avanzar a fase 4 (Catálogo de módulos)
