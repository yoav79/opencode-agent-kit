# Fase 1: Descubrimiento

## 1. Problema

El administrador de correo necesita un panel de administración web para gestionar buzones de correo en una infraestructura Dovecot/Postfix. Actualmente utiliza Ansible playbooks ejecutados vía CLI, lo cual es un proceso manual, propenso a errores y difícil de escalar.

El sistema debe reemplazar la gestión manual y proporcionar una interfaz web centralizada que permita al administrador realizar todas las operaciones de gestión de buzones de correo de forma eficiente y segura.

## 2. Contexto actual

- **Tecnologías**: Dovecot (servidor IMAP/POP3), Postfix (servidor SMTP), PostgreSQL (base de datos).
- **Herramienta actual**: Ansible playbooks ejecutados vía línea de comandos.
- **Proceso**: Manual, uno a uno, sin interfaz gráfica.
- **Infraestructura**: Cluster de correo con múltiples servidores (Dovecot, Postfix, IMAP, servicio GUI de correo).
- **Base de datos**: PostgreSQL centralizada que almacena información de buzones.

## 3. Usuarios y roles

### 3.1 Usuarios primarios
- **Administrador de correo**: Único usuario del panel en fase 1. Responsable de gestionar todos los buzones, dominios, aliases, quotas, certificados SSL y logs de entrega.

### 3.2 Beneficiarios indirectos
- **Empleados de la empresa**: Usuarios de correo que se benefician de una gestión más rápida y eficiente.

## 4. Criterios de éxito

1. El administrador puede realizar todas las operaciones de gestión de buzones desde una interfaz web.
2. Se reduce significativamente el tiempo de gestión comparado con Ansible CLI.
3. El sistema es seguro: autenticación de dos factores, restricción por IP, logs de seguridad.
4. El sistema es escalable: comienza con 50 buzones pero debe soportar miles.
5. El administrador puede gestionar certificados SSL (renovación automática, visualización, instalación, alertas).

## 5. Alcance del sistema

### 5.1 Funcionalidades incluidas (Fase 1)
- **Gestión de buzones**: Crear, eliminar, modificar buzones de correo.
- **Gestión de contraseñas**: Modificar contraseñas de usuarios.
- **Gestión de quotas**: Configurar límites de disco por usuario (decisión del administrador).
- **Gestión de aliases y redirecciones**: Crear, modificar, eliminar aliases y redirecciones de correo.
- **Gestión de dominios**: Administrar dominios de correo.
- **Logs de entrega**: Visualizar logs de entrega de correo.
- **Bloqueo/desbloqueo**: Bloquear y desbloquear usuarios.
- **Certificados SSL**: Renovación automática (Let's Encrypt), visualización de estado, instalación/configuración, alertas de expiración.
- **Auditoría**: Registro de acciones realizadas por el administrador.
- **Seguridad**: Autenticación de dos factores, restricción por IP, logs de seguridad.

### 5.2 Funcionalidades excluidas (Fase 1)
- **Control de servidores**: No se incluye monitoreo ni gestión de servicios en fase 1.
- **Interfaz de usuario final**: No se incluye portal de auto-servicio para empleados.
- **Gestión de infraestructura**: No se incluye configuración de Postfix, Dovecot u otros servicios.

## 6. Restricciones

- **Base de datos**: PostgreSQL 16 (ya existente).
- **Infraestructura**: Múltiples servidores en cluster (Dovecot, Postfix, IMAP, servicio GUI de correo).
- **Plazo**: Lo antes posible (ASAP).
- **Presupuesto**: No especificado.
- **Respaldos**: El sysadmin se encarga de las políticas de respaldo de PostgreSQL.

## 7. Supuestos

1. **SUPUESTO**: El panel será una aplicación web que se conecta a PostgreSQL para gestionar buzones.
2. **SUPUESTO**: La gestión de buzones se realiza mediante consultas directas a la base de datos PostgreSQL.
3. **SUPUESTO**: Los certificados SSL se gestionan vía Let's Encrypt o similar para renovación automática.
4. **SUPUESTO**: El panel necesita conectarse a los servidores del cluster para gestionar certificados SSL.
5. **SUPUESTO**: No se requiere integración con directorio externo (LDAP/AD) en fase 1.
6. **SUPUESTO**: El panel se desplegará en la misma red que los servidores de correo.

## 8. Preguntas abiertas

Todas las preguntas críticas han sido respondidas.

## 8.1 Decisiones Confirmadas

1. **Tecnología frontend**: React (confirmado por el usuario).
2. **Tecnología backend**: Node.js (confirmado por el usuario).
3. **Autenticación del administrador**: Usuario/contraseña + autenticación de dos factores (2FA) (confirmado por el usuario).
4. **Formato de logs**: Texto plano (confirmado por el usuario).
5. **Compatibilidad de navegador**: Cualquier navegador comercial moderno (Firefox, Chrome, Edge, etc.) (confirmado por el usuario).
6. **Versión de PostgreSQL**: 16 (confirmado por el usuario).
7. **Políticas de respaldo**: El sysadmin se encarga (confirmado por el usuario).

## 9. Riesgos identificados

1. **Complejidad de gestión de certificados SSL en cluster**: Gestionar certificados en múltiples servidores puede ser complejo.
2. **Escalabilidad**: Pasar de 50 a miles de usuarios puede requerir optimización de consultas y arquitectura.
3. **Seguridad**: La gestión remota de servidores vía SSH puede ser un vector de ataque si no se maneja adecuadamente.
4. **Integración con cluster**: La comunicación con múltiples servidores puede introducir latencia y puntos de falla.

## 10. Información faltante crítica

No hay información faltante crítica. Todas las preguntas abiertas han sido respondidas.

## 11. Próximos pasos

1. ~~Responder preguntas abiertas.~~ ✓ COMPLETADO
2. ~~Crear borrador de fase 1.~~ ✓ COMPLETADO
3. **Aprobar borrador.** ← ESTAMOS AQUÍ
4. Crear versión final en `docs/01-discovery.md`.
5. Avanzar a fase 2 (Definición ejecutiva).
