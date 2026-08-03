# Prescript Frontend

Aplicacion web de Prescript construida con React y Vite. Este frontend consume la API de `prescript_backend` y ofrece el portal operativo para doctores, enfermeria, secretaria, administracion y gerencia.

## Stack

- React 19
- Vite
- React Router
- Axios
- Lucide React
- ESLint
- Docker y Nginx para despliegue en contenedor

## Funcionalidades

- Inicio de sesion y activacion de acceso medico.
- Navegacion protegida por autenticacion.
- Control de acceso por rol.
- Agenda de citas.
- Gestion de pacientes.
- Captura de preclinica.
- Editor de recetas.
- Catalogo y preferencias de medicamentos.
- Dashboard de KPIs para administracion y gerencia.

## Estructura

```text
src/
  api/              Cliente Axios, tokens y endpoints
  config/           Configuracion de roles, rutas y navegacion
  modules/          Pantallas por dominio funcional
  routes/           Rutas privadas y rutas por rol
  shared/           Layout, contexto y componentes reutilizables
```

## Requisitos

- Node.js 20 o superior recomendado.
- Backend `prescript_backend` disponible.
- Variable `VITE_API_URL` apuntando a la API.

## Configuracion local

```powershell
cd C:\Users\InteractiveCore\Documents\ProyectosAnaliza\Prescript_Frontend
npm install
Copy-Item .env.example .env
```

Configura `.env`:

```env
VITE_API_URL=http://localhost:8003/api/v1
```

Si ejecutas el backend local sin Docker en el puerto `8001`, usa:

```env
VITE_API_URL=http://localhost:8001/api/v1
```

## Ejecucion local

```powershell
npm run dev
```

Vite mostrara la URL local disponible, normalmente:

```text
http://localhost:5173
```

## Ejecucion con Docker

```powershell
cd C:\Users\InteractiveCore\Documents\ProyectosAnaliza\Prescript_Frontend
docker compose up -d --build
```

La aplicacion queda disponible en:

```text
http://localhost:5175
```

## Despliegue en Vercel

El proyecto incluye `vercel.json` para desplegar el frontend como SPA de Vite:

- Framework preset: `Vite`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Configura en Vercel la variable de entorno:

```env
VITE_API_URL=https://tu-backend-prescript.com/api/v1
```

El backend debe permitir el dominio de Vercel en:

```env
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://tu-frontend.vercel.app
```

## Scripts

```powershell
npm run dev
npm run build
npm run preview
npm run lint
```

## Rutas principales

```text
/login
/activar-acceso
/app/agenda
/app/pacientes
/app/pacientes/:patientId
/app/preclinica
/app/recetas
/app/medicamentos
/app/dashboard
```

## Relacion con el backend

El cliente HTTP esta en `src/api/axios.js`. Usa `VITE_API_URL`, agrega el token JWT en cada solicitud y maneja la renovacion del access token mediante `/auth/refresh`.

Para desarrollo con Docker, el backend esperado por defecto es:

```text
http://localhost:8003/api/v1
```
