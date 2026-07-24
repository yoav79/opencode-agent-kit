# Fase 2: Definición Ejecutiva

## 1. Visión del Proyecto

**MailAdmin** será la interfaz web administrativa para la Plataforma de Correo existente. El sistema proporcionará una interfaz moderna que invocará la capa de orquestación del backend (`mailctl`) para todas las operaciones administrativas.

## 2. Solución Propuesta

MailAdmin reemplazará la ejecución manual de comandos `mailctl` vía CLI con una interfaz web centralizada que permitirá:

- **Gestión unificada**: Administrar dominios, buzones, aliases, identidades, listas de distribución desde un único panel.
- **Automatización**: Eliminar tareas manuales repetitivas mediante flujos de trabajo guiados.
- **Seguridad**: Implementar autenticación y autorización basada en roles.
- **Validación**: Ejecutar validaciones de plataforma y mostrar resultados.

## 3. Propuesta de Valor

| Beneficio | Descripción |
|-----------|-------------|
| **Ahorro de tiempo** | Reducción significativa del tiempo de gestión |
| **Reducción de errores** | Eliminación de errores humanos comunes |
| **Interfaz intuitiva** | Diseño fácil de usar |
| **Seguridad mejorada** | Autenticación y autorización basada en roles |
| **Visibilidad centralizada** | Vista unificada de la plataforma |

## 4. Objetivos Específicos

### 4.1 Objetivos Principales

1. **Reducir el tiempo de gestión**: Disminuir el tiempo necesario para realizar operaciones de administración en al menos un 50%.
2. **Democratizar la administración**: Permitir que personas no técnicas puedan realizar tareas básicas de gestión.
3. **Mejorar la seguridad**: Implementar autenticación y autorización basada en roles.
4. **Eliminar errores manuales**: Reducir a cero los errores causados por procesos manuales.

### 4.2 Objetivos Secundarios

1. **Mantenibilidad**: Crear código modular y bien documentado para facilitar actualizaciones futuras.
2. **Integrabilidad**: Diseñar la arquitectura para permitir futuras integraciones con otros sistemas.

## 5. Alcance

### 5.1 Incluido en MVP

| Funcionalidad | Descripción |
|---------------|-------------|
| Panel Principal | Dashboard con estado, servicios, estadísticas |
| Autenticación | Login y autorización basada en roles |
| Gestión de Dominios | CRUD de dominios |
| Gestión de Buzones | CRUD de buzones, contraseñas, cuotas |
| Gestión de Aliases | CRUD de aliases |
| Identidades del Remitente | Gestión de identidades |
| Listas de Distribución | Gestión de listas de distribución |
| Migración IMAP | Migración de buzones IMAP |
| Validación | Validación de plataforma y configuración |
| Bitácoras | Logs de operaciones y auditoría |
| Administración de Servicios | Estado y gestión de servicios |

### 5.2 Excluido del MVP

- Reemplazar mailctl
- Reemplazar Ansible
- Reemplazar PostgreSQL
- Reemplazar Dovecot
- Reemplazar Postfix
- Modificación directa de la base de datos
- Modificación directa de archivos de configuración

## 6. Exclusiones Claras

1. **No reemplaza servicios existentes**: MailAdmin no reemplazará mailctl, Ansible, PostgreSQL, Dovecot ni Postfix.
2. **No accede directamente a la base de datos**: La WebUI nunca accede directamente a PostgreSQL.
3. **No modifica configuraciones**: La WebUI nunca modifica archivos de configuración de Dovecot, Postfix ni del SO.
4. **No implementa lógica de negocio**: Toda la lógica de negocio reside en mailctl.

## 7. Stakeholders

| Stakeholder | Rol | Interés |
|-------------|-----|---------|
| Administrador de correo | Usuario principal | Usar el sistema diariamente |
| Equipo de TI | Soporte | Mantener la infraestructura |
| Empleados | Beneficiarios | Tener un servicio de correo más confiable |

## 8. Restricciones y Dependencias

### 8.1 Restricciones

- **mailctl** es la capa de orquestación autorizada
- **Ansible** administra la infraestructura
- La WebUI es **sin estado** (stateless)
- Las operaciones deben ser **idempotentes**
- Toda operación es **auditable**

### 8.2 Dependencias

- `mailctl` funcional y disponible
- Ansible configurado y administrando la infraestructura
- Servicios backend existentes (PostgreSQL, Dovecot, Postfix, etc.)

## 9. Métricas de Éxito

1. **Tiempo de gestión**: Reducción del 50% en tiempo promedio por operación.
2. **Errores**: Reducción del 100% en errores manuales.
3. **Satisfacción**: Evaluación del administrador ≥ 8/10 en usabilidad.
4. **Adopción**: El administrador usa el sistema para el 100% de las operaciones de gestión.

## 10. Próximos pasos

1. ~~Aprobar definición ejecutiva~~ ✓ COMPLETADO
2. Avanzar a fase 3 (Usuarios y procesos)
