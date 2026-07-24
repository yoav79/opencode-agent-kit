# Fase 9: Seguridad y Requisitos No Funcionales

## 1. Seguridad

### 1.1 Autenticación y autorización

| Requisito | Implementación |
|-----------|----------------|
| **Autenticación de usuario** | Email + contraseña con hash bcrypt |
| **Autenticación de dos factores** | TOTP con speakeasy (Google Authenticator, Authy) |
| **Gestión de sesiones** | JWT con expiración configurable |
| **Bloqueo por intentos fallidos** | 5 intentos → bloqueo temporal 15 minutos |
| **Política de contraseñas** | Mínimo 8 caracteres |

### 1.2 Transporte y comunicaciones

| Requisito | Implementación |
|-----------|----------------|
| **HTTPS** | Certificados SSL con Let's Encrypt |
| **TLS** | Versión 1.2 o superior |
| **SSH** | Conexiones a servidores del cluster con llaves públicas |
| **CORS** | Configuración estricta, solo permitir origen conocido |

### 1.3 Protección de datos

| Requisito | Implementación |
|-----------|----------------|
| **Contraseñas** | Hash bcrypt, nunca almacenar en texto plano |
| **Tokens JWT** | Firmados con secreto seguro, expiración configurable |
| **Credenciales SSH** | Llaves sin contraseña, permisos restrictivos |
| **Logs** | No registrar contraseñas ni tokens sensibles |

### 1.4 Seguridad de aplicación

| Requisito | Implementación |
|-----------|----------------|
| **Headers de seguridad** | Helmet (X-Content-Type-Options, X-Frame-Options, etc.) |
| **SQL Injection** | Consultas parametrizadas |
| **XSS** | Sanitización de entrada, escape de salida |
| **CSRF** | Tokens CSRF en formularios |
| **Rate Limiting** | Limitación de peticiones por IP |
| **Validación de entrada** | Zod para todos los datos de entrada |

### 1.5 Seguridad de infraestructura

| Requisito | Implementación |
|-----------|----------------|
| **Firewall** | UFW (solo puertos 80, 443, 22) |
| **Acceso SSH** | Solo con llaves públicas, sin passwords |
| **Actualizaciones** | Mantener SO y dependencias actualizadas |
| **Logs de seguridad** | Registrar intentos de acceso no autorizados |

## 2. Requisitos no funcionales

### 2.1 Disponibilidad

| Requisito | Valor | Justificación |
|-----------|-------|---------------|
| **Disponibilidad** | 99% 24/7 | Sistema crítico para administración de correo |
| **Ventanas de mantenimiento** | No especificadas | Mantenimiento en horarios de baja actividad |
| **Tiempo máximo de inactividad** | < 5 minutos | Para mantenimiento programado |

### 2.2 Rendimiento

| Requisito | Valor | Justificación |
|-----------|-------|---------------|
| **Tiempo de respuesta** | < 2 segundos | Experiencia de usuario aceptable |
| **Usuarios concurrentes** | 5 | Equipo pequeño de administración |
| **Solicitudes por segundo** | < 50 | Volumen de uso esperado |
| **Tamaño de respuesta** | < 1 MB | Respuestas JSON ligeras |

### 2.3 Escalabilidad

| Requisito | Valor | Justificación |
|-----------|-------|---------------|
| **Usuarios concurrentes** | 5 (MVP) | Escalar a 50+ en futuro |
| **Buzones gestionados** | 50 (MVP) | Escalar a miles en futuro |
| **Método de escalabilidad** | Horizontal | Agregar más servidores VMware |
| **Carga** | Nginx load balancer | Distribución entre instancias |

### 2.4 Mantenibilidad

| Requisito | Valor | Justificación |
|-----------|-------|---------------|
| **Estándares de código** | ESLint | Código limpio y consistente |
| **Documentación** | Comentarios en código | Sin documentación externa requerida |
| **Versionado** | Git | Control de versiones |
| **Deps update** | Mensual | Mantener dependencias actualizadas |

### 2.5 Privacidad

| Requisito | Valor | Justificación |
|-----------|-------|---------------|
| **Datos personales** | No aplica | Solo datos de buzones de correo |
| **GDPR** | No aplica | Uso interno, no público |
| **Retención de datos** | Indefinida | Según política definida |
| **Derechos ARCO** | No aplica | Sistema interno de administración |

### 2.6 Monitoreo

| Requisito | Valor | Justificación |
|-----------|-------|---------------|
| **Monitoreo de aplicación** | No requerido (MVP) | Simplificación inicial |
| **Logs de aplicación** | Texto plano | Revisión manual si es necesario |
| **Alertas** | No requeridas (MVP) | Monitoreo manual |
| **Métricas** | No requeridas (MVP) | Simplificación inicial |

### 2.7 Recuperación

| Requisito | Valor | Justificación |
|-----------|-------|---------------|
| **RTO (Tiempo de recuperación)** | No requerido | Sin SLA específico |
| **RPO (Punto de recuperación)** | No requerido | Sin SLA específico |
| **Backups** | Gestión manual por sysadmin | Según política existente |
| **Restauración** | Manual | Procedimiento documentado |

## 3. Cumplimiento normativo

| Norma | Aplicabilidad | Estado |
|-------|---------------|--------|
| **GDPR** | No aplica (uso interno) | N/A |
| **PCI DSS** | No aplica (no maneja pagos) | N/A |
| **HIPAA** | No aplica (no es datos de salud) | N/A |
| **ISO 27001** | No requerido | N/A |

## 4. Auditoría

| Requisito | Implementación |
|-----------|----------------|
| **Registro de acciones** | Todas las acciones del administrador se registran |
| **Campos de auditoría** | timestamp, usuario, acción, módulo, detalles, IP |
| **Retención** | Indefinida |
| **Consulta** | Filtros por fecha, acción, módulo |
| **Exportación** | Formato CSV |

## 5. Resumen de requisitos no funcionales

| Categoría | Requisito principal | Estado |
|-----------|---------------------|--------|
| **Seguridad** | 2FA, HTTPS, JWT, bcrypt | Definido |
| **Disponibilidad** | 99% 24/7 | Confirmado |
| **Rendimiento** | < 2s respuesta, 5 usuarios | Definido |
| **Escalabilidad** | Horizontal, 5→50+ usuarios | Definido |
| **Mantenibilidad** | ESLint, Git | Definido |
| **Privacidad** | No aplica (uso interno) | N/A |
| **Monitoreo** | No requerido (MVP) | Diferido |
| **Recuperación** | Manual por sysadmin | Definido |

## 6. Próximos pasos

1. Aprobar seguridad y requisitos no funcionales
2. Avanzar a fase 10 (Plan de construcción)
