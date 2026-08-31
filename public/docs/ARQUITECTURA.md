# ARQUITECTURA DEL SISTEMA — SoporteTI

## Versión 1.0.0

---

## 1. Visión General

SoporteTI es una aplicación web interna para la gestión de farmacias, activos tecnológicos y control de actividades del área de soporte. Desarrollada en Next.js con SQL Server como base de datos, desplegada en Docker y accesible desde la red interna de la empresa o mediante VPN.

---

## 2. Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        RED INTERNA / VPN                        │
│                                                                 │
│   ┌──────────────┐         ┌──────────────────────────────┐    │
│   │   USUARIOS   │         │     SERVIDOR DOCKER          │    │
│   │              │  HTTP   │                              │    │
│   │  Técnico     │────────▶│   ┌──────────────────────┐  │    │
│   │  Coordinador │  :3000  │   │   Next.js App        │  │    │
│   │              │         │   │   (App Router)       │  │    │
│   │  PC / Laptop │         │   │                      │  │    │
│   └──────────────┘         │   │  ┌────────────────┐  │  │    │
│                             │   │  │   Frontend     │  │  │    │
│                             │   │  │   React/TSX    │  │  │    │
│                             │   │  └───────┬────────┘  │  │    │
│                             │   │          │            │  │    │
│                             │   │  ┌───────▼────────┐  │  │    │
│                             │   │  │   BFF / API    │  │  │    │
│                             │   │  │   /api/routes  │  │  │    │
│                             │   │  └───────┬────────┘  │  │    │
│                             │   │          │            │  │    │
│                             │   │  ┌───────▼────────┐  │  │    │
│                             │   │  │  Next-Auth     │  │  │    │
│                             │   │  │  Sesión/Roles  │  │  │    │
│                             │   │  └────────────────┘  │  │    │
│                             │   └──────────┬───────────┘  │    │
│                             └──────────────┼───────────────┘    │
│                                            │                    │
│              ┌─────────────────────────────┼──────────────┐    │
│              │                             │              │    │
│              ▼                             ▼              │    │
│   ┌──────────────────┐       ┌─────────────────────┐     │    │
│   │  SQL Server      │       │  SQL Server         │     │    │
│   │  LOCAL           │       │  MATRIZ             │     │    │
│   │  BD: SoporteTI   │       │  (Solo lectura)     │     │    │
│   │                  │       │                     │     │    │
│   │  • farmacia      │       │  Conexión ODBC      │     │    │
│   │  • activo        │       │  Solo en Sync       │     │    │
│   │  • servidor      │       │                     │     │    │
│   │  • tecnicos      │       └─────────────────────┘     │    │
│   │  • historico     │                                    │    │
│   └──────────────────┘                                    │    │
│                                                           │    │
└───────────────────────────────────────────────────────────┘    │
```

---

## 3. Componentes del Sistema

### 3.1 Capa de Presentación — Frontend

- **Tecnología:** React + TypeScript (Next.js App Router)
- **Estilos:** Tailwind CSS
- **Notificaciones:** react-hot-toast
- **Autenticación:** next-auth (sesión por JWT)
- **Procesamiento Excel:** xlsx (client-side)

### 3.2 Capa de Negocio — BFF (Backend for Frontend)

- **Tecnología:** Next.js API Routes (`/app/api/`)
- **Patrón:** BFF — cada endpoint sirve directamente al frontend
- **Autenticación:** Middleware next-auth verifica sesión y rol en cada request
- **Endpoints principales:**

| Endpoint              | Método       | Descripción               |
| --------------------- | ------------ | ------------------------- |
| `/api/auth`           | GET/POST     | Autenticación next-auth   |
| `/api/farmacias`      | GET/PUT      | Gestión de farmacias      |
| `/api/activos`        | GET/POST/PUT | Gestión de activos        |
| `/api/activos/import` | POST         | Importación Excel SAP     |
| `/api/activos/baja`   | POST         | Baja manual de activo     |
| `/api/tecnicos`       | GET/POST/PUT | Gestión de técnicos       |
| `/api/sync`           | POST         | Sincronización con matriz |
| `/api/actividades`    | GET/PUT      | Historial de actividades  |

### 3.3 Capa de Datos — SQL Server Local

- **Motor:** SQL Server (Windows)
- **BD:** SoporteTI
- **Driver:** mssql (Node.js)
- **Patrón:** Connection Pool — reutiliza conexiones

### 3.4 Base de Datos Matriz

- **Acceso:** Acceso: Solo lectura via usuario SQL Server (permisos SELECT únicamente)
- **Uso:** Únicamente en proceso de Sincronización
- **Datos que provee:** Farmacias, técnicos asignados, marcas

---

## 4. Esquema de Base de Datos

```
┌─────────────┐         ┌─────────────┐
│   tecnicos  │         │   farmacia  │
│─────────────│         │─────────────│
│ cedula (PK) │◀────────│cedula_tecnico│
│ nombres     │         │ oficina (PK)│
│ apellidos   │         │ nombre      │
│ usuario     │         │ tipo_farmacia│
│ rol         │         │ marca       │
│ estado      │         │ estado      │
└─────────────┘         │ tecnologia_ │
                        │ terminales  │
                        │ ssoo_       │
                        │ terminales  │
                        │ num_puntos_ │
                        │ venta       │
                        │ tipo_rack   │
                        │ fecha_sync  │
                        └──────┬──────┘
                               │
                               │ 1
                               │
                        ┌──────▼──────┐
                        │   activo    │
                        │─────────────│
                        │codigo_activo│
                        │ (PK)        │
                        │ nombre_     │
                        │ activo      │
                        │ fecha_compra│
                        │ descripcion │
                        │ estado      │
                        │ oficina(FK) │
                        │ cedula_     │
                        │ tecnico(FK) │
                        └──────┬──────┘
                               │ 1
                               │
                  ┌────────────┴────────────┐
                  │                         │
           ┌──────▼──────┐          ┌───────▼──────┐
           │   servidor  │          │historico_    │
           │─────────────│          │activo        │
           │codigo_activo│          │──────────────│
           │ (PK/FK)     │          │ id (PK)      │
           │ so_servidor │          │ codigo_activo│
           │ virtualizer │          │ nombre_activo│
           │ ram         │          │ oficina      │
           │ tipo_ram    │          │ cedula_      │
           │ es_principal│          │ tecnico      │
           └─────────────┘          │ nombre_      │
                                    │ tecnico      │
                                    │ motivo_baja  │
                                    │ observacion  │
                                    │ fecha_baja   │
                                    │ tipo_baja    │
                                    │ verificado   │
                                    │ fecha_       │
                                    │ verificacion │
                                    │ codigo_      │
                                    │ reemplazo    │
                                    │ ano_compra   │
                                    └──────────────┘
```

---

## 5. Flujos Principales

### 5.1 Autenticación

```
Usuario ingresa credenciales
        ↓
next-auth valida contra tabla tecnicos
(usuario + password)
        ↓
JWT generado con: cedula, nombre, rol
        ↓
Rol determina acceso:
  TECNICO      → ve solo sus farmacias y activos
  COORDINADOR  → ve todo, puede importar y sincronizar
```

### 5.2 Sincronización con Matriz

```
Coordinador presiona "Sincronizar Matriz"
        ↓
POST /api/sync
        ↓
Conexión ODBC a BD Matriz (solo lectura)
        ↓
MERGE farmacias → actualiza nombre, técnico, tipo, marca
MERGE tecnicos  → actualiza nombres, crea nuevos usuarios
        ↓
Campos propios NO se sobreescriben
(tecnologia_terminales, ssoo_terminales, etc.)
        ↓
fecha_sync = GETDATE() por farmacia actualizada
        ↓
Cierra conexión matriz
        ↓
Respuesta con conteo de cambios
```

### 5.3 Importación Excel SAP

```
Coordinador sube archivo .xlsx/.xls
        ↓
POST /api/activos/import
        ↓
┌─── LOOP 1: Procesar filas Excel ───┐
│                                    │
│  ¿Código empieza con 18000?        │
│    SI → buscar 14000 en Detalle    │
│         UPDATE codigo en activo    │
│                                    │
│  ¿Nombre en lista blanca?          │
│    NO → saltar fila                │
│                                    │
│  ¿Farmacia existe?                 │
│    NO → agregar a sin_farmacia     │
│                                    │
│  ¿Es Franquicia y no existe?       │
│    SI → omitir                     │
│                                    │
│  ¿Ya existe en BD?                 │
│    SI → UPDATE activo              │
│         Si estaba inactivo         │
│         → INSERT historico         │
│           "Reactivado"             │
│    NO → INSERT activo nuevo        │
│                                    │
│  ¿Es CPU con SERVIDOR en detalle?  │
│    SI → MERGE servidor             │
└────────────────────────────────────┘
        ↓
┌─── LOOP 2: Bajas automáticas ──────┐
│                                    │
│  Por cada activo en BD             │
│  que NO aparece en Excel:          │
│                                    │
│  ¿Tiene baja manual pendiente?     │
│    SI → UPDATE verificado = 1      │
│    NO → UPDATE estado = 'I'        │
│         INSERT historico AUTO      │
└────────────────────────────────────┘
        ↓
Respuesta con resumen:
insertados, actualizados, bajas,
reactivados, sin_farmacia
```

### 5.4 Baja Manual de Activo

```
Técnico/Coordinador abre modal activo
        ↓
Tab "Dar de Baja" → selecciona motivo + observación
        ↓
POST /api/activos/baja
        ↓
UPDATE activo SET estado = 'I'
        ↓
INSERT historico_activo
  tipo_baja = 'MANUAL'
  verificado = 0 (Pendiente)
  — excepto Franquicia → verificado = 1
        ↓
Aparece en página Actividades
  Estado: Pendiente (amarillo)
  hasta que Excel confirme → Verificado (verde)
```

---

## 6. Roles y Permisos

| Acción             | TECNICO            | COORDINADOR |
| ------------------ | ------------------ | ----------- |
| Ver farmacias      | Solo asignadas     | Todas       |
| Editar farmacia    | Solo asignadas     | Todas       |
| Ver activos        | Solo sus farmacias | Todos       |
| Dar de baja activo | ✓                  | ✓           |
| Importar Excel SAP | ✗                  | ✓           |
| Sincronizar Matriz | ✗                  | ✓           |
| Ver Actividades    | Solo propias       | Todas       |
| Ver Técnicos       | ✗                  | ✓           |
| Gestionar Técnicos | ✗                  | ✓           |

---

## 7. Stack Tecnológico

| Componente    | Tecnología   | Versión |
| ------------- | ------------ | ------- |
| Framework     | Next.js      | 14+     |
| Lenguaje      | TypeScript   | 5+      |
| Base de datos | SQL Server   | 2019+   |
| ORM/Driver    | mssql        | 10+     |
| Autenticación | next-auth    | 4+      |
| Estilos       | Tailwind CSS | 3+      |
| Contenedor    | Docker       | 24+     |
| Runtime       | Node.js      | 20 LTS  |
| Sistema base  | Linux Alpine | 3.x     |

---

## 8. Consideraciones de Seguridad

- **Autenticación:** JWT firmado con `NEXTAUTH_SECRET`
- **Roles:** Verificados en cada endpoint, no solo en el frontend
- **Variables sensibles:** Nunca en el código, siempre en `.env`
- **BD Matriz:** Acceso de solo lectura, conexión cerrada tras cada sync
- **Docker:** App corre con usuario no-root (nextjs:nodejs)
- **Red:** App accesible solo desde red interna o VPN

---

## 9. Módulos del Sistema

| Módulo      | Ruta           | Descripción                            |
| ----------- | -------------- | -------------------------------------- |
| Login       | `/login`       | Autenticación de usuarios              |
| Farmacias   | `/farmacias`   | Gestión y edición de farmacias         |
| Activos     | `/activos`     | Gestión de activos tecnológicos        |
| Actividades | `/actividades` | Historial de bajas y verificaciones    |
| Técnicos    | `/tecnicos`    | Gestión de técnicos (solo COORDINADOR) |
