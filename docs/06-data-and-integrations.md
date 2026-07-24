# Fase 6: Información e Integraciones

## 1. Integraciones

### 1.1 Sistemas Externos

| Sistema | Tipo | Descripción | Acceso |
|---------|------|-------------|--------|
| **mailctl** | Orquestación | Capa de orquestación autorizada | Directo vía API |
| **Ansible** | Automatización | Motor de automatización | Vía mailctl |
| **PostgreSQL** | Base de datos | Almacenamiento de datos | **NO directo** |
| **Dovecot** | Servidor IMAP/POP3 | Servidor de buzones | **NO directo** |
| **Postfix** | Servidor SMTP | Servidor de correo | **NO directo** |
| **NGINX** | Servidor web | Proxy inverso | Configuración existente |
| **Mailgun** | Servicio de correo | Correo transaccional | Configuración existente |

### 1.2 Diagrama de Integración

```text
WebUI (React + Next.js)
   │
   ▼
API del Backend
   │
   ▼
mailctl
   │
   ├──► PostgreSQL (vía mailctl)
   ├──► Dovecot (vía Ansible)
   ├──► Postfix (vía Ansible)
   ├──► NGINX (vía Ansible)
   ├──► Almacenamiento (vía Ansible)
   └──► Mailgun (configuración existente)
```

## 2. Contrato del Backend

| Acción en la WebUI | Backend | Descripción |
|--------------------|---------|-------------|
| Crear buzón | mailctl mailbox create | Crear nuevo buzón de correo |
| Eliminar buzón | mailctl mailbox delete | Eliminar buzón existente |
| Restablecer contraseña | mailctl passwd | Cambiar contraseña de buzón |
| Restablecimiento masivo | mailctl passwd --batch | Cambiar contraseñas en lote |
| Administrar alias | mailctl alias | CRUD de aliases |
| Administrar identidades | mailctl identity | CRUD de identidades del remitente |
| Administrar listas | mailctl distribution | CRUD de listas de distribución |
| Migración IMAP | mailctl migrate | Migración de buzones IMAP |
| Validación | mailctl validate | Validación de plataforma |

## 3. Restricciones de Acceso

### 3.1 Acceso a Base de Datos

| Restricción | Descripción |
|-------------|-------------|
| **NO acceso directo** | La WebUI nunca accede directamente a PostgreSQL |
| **Vía mailctl** | Todas las consultas pasan por mailctl |
| **SQL permitido** | Solo mailctl ejecuta consultas SQL |

### 3.2 Configuración de Servicios

| Restricción | Descripción |
|-------------|-------------|
| **NO modificación directa** | La WebUI nunca modifica archivos de configuración |
| **Vía Ansible** | Todos los cambios pasan por Ansible |
| **mailctl autorizado** | Solo mailctl ejecuta cambios de configuración |

## 4. Flujo de Datos

### 4.1 Crear Buzón

```text
WebUI → API → mailctl mailbox create → Ansible → PostgreSQL/Dovecot
```

### 4.2 Eliminar Buzón

```text
WebUI → API → mailctl mailbox delete → Ansible → PostgreSQL/Dovecot
```

### 4.3 Restablecer Contraseña

```text
WebUI → API → mailctl passwd → Ansible → Dovecot
```

### 4.4 Validar Plataforma

```text
WebUI → API → mailctl validate → Resultados → WebUI
```

## 5. Políticas de Datos

### 5.1 Datos Sensibles

| Dato | Protección |
|------|------------|
| **Contraseñas** | Nunca expuestas en la WebUI |
| **Secretos** | No expuestos en la interfaz |
| **Configuración** | Acceso solo vía mailctl |

### 5.2 Retención de Datos

| Tipo de dato | Período |
|--------------|---------|
| **Bitácoras operativas** | Según política existente |
| **Bitácoras de validación** | Según política existente |
| **Historial de auditoría** | Según política existente |

## 6. Próximos pasos

1. ~~Aprobar información e integraciones~~ ✓ COMPLETADO
2. Avanzar a fase 7 (Arquitectura)
