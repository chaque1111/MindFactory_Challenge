# MindFactory Data Normalizer

Plataforma fullstack para cargar, validar y procesar archivos CSV de movimientos.

La aplicacion:
- recibe un CSV con movimientos financieros/comerciales,
- valida y normaliza campos,
- usa IA cuando los datos vienen incompletos o ambiguos,
- guarda el resultado en base de datos,
- y expone el estado y detalle del trabajo en una interfaz web.

---

## Que hace la plataforma

1. Subes un archivo CSV desde el frontend.
2. El backend crea un trabajo (job) y parsea cada fila.
3. Se aplican validaciones de formato y calidad de datos.
4. Si una fila no se puede resolver solo con reglas, se invoca IA (AWS Bedrock) para extraer/normalizar informacion mas precisa.
5. Se guarda el resultado final (trabajo + movimientos procesados) en PostgreSQL.
6. Puedes consultar:
   - listado de trabajos,
   - detalle del trabajo,
   - y movimientos por trabajo.

---

## Arquitectura

- `front/`: React + Vite + TypeScript (UI de carga, listado y detalle).
- `back/`: NestJS + TypeORM (API REST y logica de procesamiento).
- `db`: PostgreSQL 15.
- IA: integracion con AWS Bedrock para asistencia de extraccion/normalizacion.

Endpoints principales del backend:
- `POST /records/upload` (multipart/form-data, campo `file`)
- `GET /records` (listado paginado)
- `GET /records/:id` (detalle del trabajo)
- `POST /records/:id/process` (dispara reprocesamiento manual, si aplica)

---

## Requisitos

- Docker y Docker Compose
- (Opcional, modo local sin Docker) Node.js 20+ y npm
- Credenciales/configuracion de Bedrock para el backend

---

## Levantar con Docker (recomendado)

Desde la raiz del proyecto:

```bash
docker compose up --build
```

Servicios:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3000](http://localhost:3000)
- PostgreSQL: `localhost:5432`

Nota: en `docker-compose.yml`, el frontend recibe la variable:
- `VITE_API_URL=http://localhost:3000`

---

## Levantar en local (sin Docker)

### 1) Base de datos
Levanta PostgreSQL local y crea la base `mindFactory` (o ajusta variables).

### 2) Backend

```bash
cd back
npm install
npm run start:dev
```

Variables esperadas en `back/.env`:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `POSTGRES_HOST`
- `BEDROCK_AWS_ACCESS_KEY_ID`
- `BEDROCK_AWS_SECRET_ACCESS_KEY`
- `BEDROCK_AWS_REGION`
- `BEDROCK_MODEL_ID`

### 3) Frontend

```bash
cd front
npm install
npm run dev
```

Variable de frontend:
- `VITE_API_URL=http://localhost:3000`

---

## Uso rapido

1. Entra al frontend en `http://localhost:5173`.
2. Ve a **Cargar Registros**.
3. Selecciona un CSV y subelo.
4. Revisa el **Listado de Registros**.
5. Abre el detalle para ver:
   - metricas del trabajo,
   - movimientos procesados,
   - estado, tiempos y tokens de IA.

Archivo de ejemplo (en tu entorno):
- `C:\Users\Alex\Documents\Trabajo\MindFactory\Challenge\records.csv`

---

## Formato esperado del CSV

Cabecera ejemplo:

```csv
source_id,transaction_date,currency,amount,description,counterparty_name,counterparty_tax_id,counterparty_email,counterparty_role,cost_type
```

La aplicacion valida y normaliza estos campos por fila. Si hay inconsistencias, intenta resolverlas y/o marcarlas para revision, usando IA cuando corresponde.

---

## Observaciones importantes

- El upload se hace como `multipart/form-data` y el campo debe llamarse `file`.
- El frontend consume la API usando `VITE_API_URL` (sin hardcodear rutas de backend).
- El backend persiste tanto el trabajo como las filas procesadas.

---

## Scripts utiles

Backend (`back/`):
- `npm run start:dev`
- `npm run build`
- `npm run test`

Frontend (`front/`):
- `npm run dev`
- `npm run build`
- `npm run lint`

