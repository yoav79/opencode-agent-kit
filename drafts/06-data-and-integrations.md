# Fase 6: Información e Integraciones

## 1. Modelo conceptual de datos

### 1.1 Entidades definidas

#### Entidad: Usuario (Buzón)
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | UUID | Identificador único | PK, auto-generado |
| usuario | VARCHAR(64) | Nombre de usuario | Obligatorio, único por dominio |
| dominio_id | UUID | Referencia al dominio | FK → Dominio.id, obligatorio |
| contraseña_hash | VARCHAR(255) | Contraseña cifrada | Obligatorio |
| quota | BIGINT | Límite de disco en bytes | Default 1GB, máx 5GB |
| estado | ENUM | Estado del buzón | Valores: activo, inactivo, bloqueado |
| fecha_creación | TIMESTAMP | Fecha de creación | Auto-generado |

#### Entidad: Dominio
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | UUID | Identificador único | PK, auto-generado |
| nombre | VARCHAR(255) | Nombre del dominio | Obligatorio, único, formato DNS |
| estado | ENUM | Estado del dominio | Valores: activo, inactivo |
| fecha_creación | TIMESTAMP | Fecha de creación | Auto-generado |

#### Entidad: Alias
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | UUID | Identificador único | PK, auto-generado |
| alias | VARCHAR(64) | Nombre del alias | Obligatorio, único por dominio |
| destino | TEXT | Email(s) destino | Obligatorio, formato email |
| dominio_id | UUID | Referencia al dominio | FK → Dominio.id, obligatorio |
| estado | ENUM | Estado del alias | Valores: activo, inactivo |
| fecha_creación | TIMESTAMP | Fecha de creación | Auto-generado |

#### Entidad: Log
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | UUID | Identificador único | PK, auto-generado |
| fecha | DATE | Fecha del evento | Obligatorio |
| hora | TIME | Hora del evento | Obligatorio |
| remitente | VARCHAR(255) | Email remitente | Obligatorio |
| destinatario | VARCHAR(255) | Email destinatario | Obligatorio |
| estado | ENUM | Estado de entrega | Valores: entregado, rechazado, pendiente |
| tamaño | BIGINT | Tamaño del mensaje en bytes | Obligatorio |
| servidor | VARCHAR(255) | Nombre del servidor | Obligatorio |

#### Entidad: Auditoría
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | UUID | Identificador único | PK, auto-generado |
| timestamp | TIMESTAMP | Fecha y hora de la acción | Obligatorio, auto-generado |
| usuario | VARCHAR(255) | Usuario que realizó la acción | Obligatorio |
| acción | VARCHAR(100) | Tipo de acción | Obligatorio |
| módulo | VARCHAR(50) | Módulo afectado | Obligatorio |
| detalles | TEXT | Detalles adicionales | Opcional |
| ip_origen | VARCHAR(45) | IP de origen | Obligatorio |

#### Entidad: Configuración
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | UUID | Identificador único | PK, auto-generado |
| parámetro | VARCHAR(100) | Nombre del parámetro | Obligatorio, único |
| valor | TEXT | Valor del parámetro | Obligatorio |
| fecha_modificación | TIMESTAMP | Última modificación | Auto-generado |

#### Entidad: Certificado
| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | UUID | Identificador único | PK, auto-generado |
| dominio_id | UUID | Referencia al dominio | FK → Dominio.id, obligatorio |
| fecha_emisión | DATE | Fecha de emisión | Obligatorio |
| fecha_expiración | DATE | Fecha de expiración | Obligatorio |
| estado | ENUM | Estado del certificado | Valores: válido, próximo_a_vencer, vencido |
| emisor | VARCHAR(255) | Emisor del certificado | Obligatorio |

### 1.2 Diagrama Entidad-Relación

```
┌─────────────────┐         ┌─────────────────┐
│    Dominio      │         │   Certificado   │
├─────────────────┤         ├─────────────────┤
│ PK id           │◄───┐    │ PK id           │
│    nombre       │    │    │ FK dominio_id   │
│    estado       │    │    │    fecha_emisión │
│    fecha_creación│    │    │    fecha_expiración│
└────────┬────────┘    │    │    estado       │
         │             │    │    emisor       │
         │             │    └─────────────────┘
         │             │
         │             │    ┌─────────────────┐
         │             │    │    Alias        │
         │             │    ├─────────────────┤
         │             ├───►│ PK id           │
         │             │    │    alias        │
         │             │    │    destino      │
         │             │    │ FK dominio_id   │
         │             │    │    estado       │
         │             │    │    fecha_creación│
         │             │    └─────────────────┘
         │             │
         │             │    ┌─────────────────┐
         │             │    │  Usuario/Buzón  │
         │             │    ├─────────────────┤
         └─────────────┴───►│ PK id           │
                            │    usuario      │
                            │ FK dominio_id   │
                            │    contraseña_hash│
                            │    quota        │
                            │    estado       │
                            │    fecha_creación│
                            └─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│    Auditoría    │    │  Configuración  │
├─────────────────┤    ├─────────────────┤
│ PK id           │    │ PK id           │
│    timestamp    │    │    parámetro    │
│    usuario      │    │    valor        │
│    acción       │    │    fecha_modificación│
│    módulo       │    └─────────────────┘
│    detalles     │
│    ip_origen    │    ┌─────────────────┐
└─────────────────┘    │      Log        │
                       ├─────────────────┤
                       │ PK id           │
                       │    fecha        │
                       │    hora         │
                       │    remitente    │
                       │    destinatario │
                       │    estado       │
                       │    tamaño       │
                       │    servidor     │
                       └─────────────────┘
```

### 1.3 Relaciones

| Relación | Tipo | Descripción |
|----------|------|-------------|
| Dominio → Usuario | 1:N | Un dominio tiene muchos buzones |
| Dominio → Alias | 1:N | Un dominio tiene muchos aliases |
| Dominio → Certificado | 1:1 | Un dominio tiene un certificado SSL |
| Usuario → Alias | 1:N | Un buzón puede tener muchos aliases (como destino) |

## 2. Datos sensibles

### 2.1 Campos que requieren protección

| Entidad | Campo | Tipo de protección | Justificación |
|---------|-------|-------------------|---------------|
| Usuario | contraseña_hash | Cifrado en reposo | Datos de autenticación |
| Auditoría | ip_origen | Protección de privacidad | Datos personales |
| Configuración | valor | Según contenido | Puede contener credenciales |

### 2.2 Políticas de protección

1. **Contraseñas**: Almacenar solo hashes con algoritmos seguros (bcrypt/argon2)
2. **IPs**: No mostrar IPs completas en interfaces públicas
3. **Credenciales**: Nunca mostrar en texto plano en logs o interfaces
4. **Transporte**: Usar HTTPS para toda comunicación
5. **Logs**: No registrar contraseñas ni tokens en logs

## 3. Integraciones

### 3.1 Sistemas externos

| Sistema | Tipo | Protocolo | Descripción |
|---------|------|-----------|-------------|
| PostgreSQL 16 | Base de datos | TCP/IP | Almacenamiento de datos |
| Dovecot | Servidor IMAP/POP3 | TCP/IP | Servidor de buzones |
| Postfix | Servidor SMTP | TCP/IP | Servidor de correo |
| Let's Encrypt | Certificados SSL | HTTPS | Renovación de certificados |

### 3.2 Integración con cluster

Para la gestión de certificados SSL, el sistema se conecta vía SSH a los servidores del cluster:
- **Protocolo**: SSH con llaves públicas
- **Autenticación**: Llaves SSH sin contraseña
- **Comandos**: Ejecución remota de comandos de certificados
- **Alcance**: Solo gestión de certificados, no otros servicios

## 4. Política de retención

| Tipo de dato | Período de retención | Acción después del período |
|--------------|---------------------|---------------------------|
| Logs de entrega | Indefinido | Conservar indefinitely |
| Auditoría | Indefinido | Conservar indefinitely |
| Configuración | Indefinido | Conservar indefinitely |
| Usuarios/Buzones | Mientras exista el buzón | Eliminar con buzón |
| Dominios | Mientras exista el dominio | Eliminar con dominio |
| Certificados | Mientras sea válido | Eliminar al expirar |

## 5. Cifrado

### 5.1 Cifrado en reposo

| Dato | Método | Justificación |
|------|--------|---------------|
| Contraseñas | bcrypt/argon2 | Protección de credenciales |
| Datos de sesión | Token JWT cifrado | Seguridad de sesión |

### 5.2 Cifrado en tránsito

| Comunicación | Protocolo | Justificación |
|--------------|-----------|---------------|
| Frontend ↔ Backend | HTTPS/TLS | Protección de datos en tránsito |
| Backend ↔ PostgreSQL | SSL/TLS | Protección de datos en tránsito |
| Backend ↔ Servidores | SSH | Acceso seguro a servidores |

## 6. Almacenamiento

### 6.1 PostgreSQL

- **Motor**: PostgreSQL 16
- **Codificación**: UTF-8
- **Collation**: Spanish (es_ES.UTF-8)
- **Tablas**: Una tabla por entidad
- **Índices**: En campos de búsqueda frecuente
- **Foreign Keys**: Para mantener integridad referencial

### 6.2 Archivos de log

- **Formato**: Texto plano
- **Ubicación**: Directorio configurable
- **Rotación**: Diaria
- **Compresión**: Opcional

## 7. Próximos pasos

1. Aprobar información e integraciones
2. Avanzar a fase 7 (Arquitectura)
