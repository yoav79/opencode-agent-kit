# Fase 2: Definición Ejecutiva

## 1. Visión del proyecto

**SysAdmin Mail** será una plataforma web de administración de buzones de correo diseñada con principios de simplicidad y funcionalidad. El sistema debe ser intuitivo y fácil de usar, permitiendo que incluso usuarios con conocimientos técnicos limitados puedan gestionar buzones de correo de manera eficiente y segura.

## 2. Solución propuesta

SysAdmin Mail reemplazará el uso manual de Ansible playbooks con una interfaz web centralizada que permitirá:

- **Gestión unificada**: Administrar buzones, aliases, dominios, quotas y certificados SSL desde un único panel.
- **Automatización**: Eliminar tareas manuales repetitivas mediante flujos de trabajo guiados.
- **Seguridad**: Implementar autenticación robusta (2FA) y registro completo de auditoría.
- **Escalabilidad**: Soportar desde 50 hasta miles de buzones sin degradación del rendimiento.

## 3. Propuesta de valor

| Beneficio | Descripción |
|-----------|-------------|
| **Ahorro de tiempo** | Reducción significativa del tiempo de gestión comparado con Ansible CLI |
| **Reducción de errores** | Eliminación de errores humanos comunes en procesos manuales |
| **Interfaz intuitiva** | Diseño fácil de usar que no requiere conocimientos técnicos avanzados |
| **Accesibilidad** | Puede ser utilizado por operadores del administrador sin experiencia técnica profunda |
| **Seguridad mejorada** | Autenticación de dos factores y auditoría completa |
| **Visibilidad centralizada** | Vista unificada de todos los buzones y dominios |

## 4. Objetivos específicos

### 4.1 Objetivos principales
1. **Reducir el tiempo de gestión**: Disminuir el tiempo necesario para realizar operaciones de administración de buzones en al menos un 50%.
2. **Democratizar la administración**: Permitir que personas no técnicas puedan realizar tareas básicas de gestión de correo.
3. **Mejorar la seguridad**: Implementar autenticación de dos factores y registro de auditoría completo.
4. **Eliminar errores manuales**: Reducir a cero los errores causados por procesos manuales.

### 4.2 Objetivos secundarios
1. **Escalabilidad**: Preparar la plataforma para crecer de 50 a miles de buzones.
2. **Mantenibilidad**: Crear código modular y bien documentado para facilitar actualizaciones futuras.
3. **Integrabilidad**: Diseñar la arquitectura para permitir futuras integraciones con otros sistemas.

## 5. Alcance

### 5.1 MVP (Fase 1)
Las funcionalidades ya definidas en la fase de descubrimiento:

**Incluido en MVP:**
- Gestión de buzones (crear, eliminar, modificar)
- Gestión de contraseñas
- Gestión de quotas de disco
- Gestión de aliases y redirecciones
- Gestión de dominios
- Visualización de logs de entrega
- Bloqueo/desbloqueo de usuarios
- Gestión de certificados SSL (renovación, visualización, instalación, alertas)
- Auditoría de acciones
- Seguridad (2FA, restricción por IP, logs)

**Excluido del MVP:**
- Control de servidores (monitoreo, gestión de servicios)
- Interfaz de usuario final (portal de auto-servicio)
- Gestión de infraestructura (configuración de Postfix, Dovecot)
- Integración con directorio externo (LDAP/AD)

### 5.2 Fase 2 (Post-MVP - Futuro)
Funcionalidades que podrían agregarse en el futuro:

- Monitoreo de servidores de correo
- Gestión de servicios (iniciar/detener Postfix, Dovecot)
- Portal de auto-servicio para usuarios finales
- Integración con LDAP/Active Directory
- Integración con sistemas de monitoreo (Prometheus, Grafana)
- Integración con sistemas de ticketing (Jira, ServiceNow)
- Reportes y estadísticas avanzadas
- Soporte para múltiples administradores con roles

## 6. Exclusiones claras

1. **No es un sistema de monitoreo**: SysAdmin Mail no reemplazará herramientas de monitoreo como Prometheus o Nagios.
2. **No es un cliente de correo**: No permitirá enviar/recibir correos, solo administrar buzones.
3. **No gestiona infraestructura**: No configurará servidores, firewalls ni servicios de red.
4. **No es para usuarios finales**: En MVP, solo el administrador puede usar el sistema.

## 7. Stakeholders

| Stakeholder | Rol | Interés |
|-------------|-----|---------|
| Administrador de correo | Usuario principal | Usar el sistema diariamente |
| Equpo de TI | Soporte | Mantener la infraestructura |
| Empleados | Beneficiarios | Tener un servicio de correo más confiable |

## 8. Restricciones y dependencias

### 8.1 Restricciones
- Despliegue en servidor de nube privada existente
- PostgreSQL 16 como base de datos
- Cluster de correo existente (Dovecot, Postfix)
- Plazo ASAP

### 8.2 Dependencias
- Acceso a los servidores del cluster para gestión de certificados SSL
- Conexión a PostgreSQL para gestión de buzones
- Herramientas de renovación de certificados (Let's Encrypt o similar)

## 9. Métricas de éxito

1. **Tiempo de gestión**: Reducción del 50% en tiempo promedio por operación.
2. **Errores**: Reducción del 100% en errores manuales.
3. **Satisfacción del usuario**: Evaluación del administrador ≥ 8/10 en usabilidad.
4. **Adopción**: El administrador usa el sistema para el 100% de las operaciones de gestión.

## 10. Próximos pasos

1. Aprobar definición ejecutiva
2. Avanzar a fase 3 (Usuarios y procesos)
