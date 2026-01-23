# Marketplace B2B Analítico

## Descripción
Este proyecto consiste en el desarrollo de una plataforma web B2B orientada a la venta y análisis de productos para proveedores y distribuidores.

La aplicación combina las funcionalidades de un marketplace tradicional (catálogo, pedidos, gestión de productos) con una capa analítica que permite a los proveedores tomar decisiones estratégicas basadas en datos reales de ventas, demanda e incidencias.

El objetivo principal del proyecto es servir como ejercicio práctico de arquitectura y desarrollo de una aplicación web profesional, utilizando tecnologías actuales del ecosistema JavaScript.

---

## Objetivos del proyecto
- Desarrollar un marketplace B2B multi-proveedor.
- Implementar un sistema de roles (proveedor, cliente, administrador).
- Ofrecer un dashboard analítico con KPIs comerciales.
- Aplicar buenas prácticas de arquitectura, seguridad y despliegue.
- Utilizar contenedores para un entorno reproducible.

---

## Stack tecnológico

### Backend
- **Node.js** v22.18.0
- **NestJS** (framework backend)
- **PostgreSQL** (base de datos relacional)
- **Prisma ORM**
- **JWT** para autenticación

### Frontend
- **Angular** v20.3.9
- **TypeScript**
- **Angular Router & Guards**

### Infraestructura
- **Docker** v29.1.3
- **Docker Compose** v5.0.1

---

## Estructura del proyecto
marketplace-b2b/
├── apps/
│ ├── api/ # Backend (NestJS)
│ └── web/ # Frontend (Angular)
├── docker-compose.yml
└── README.md

---

## Estado del proyecto
🟡 Proyecto en fase inicial.  
Actualmente se está configurando la base técnica (entorno, backend y frontend) sobre la que se desarrollarán las funcionalidades principales.