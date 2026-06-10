# DasCash — Flujo QR + Mercado Pago: Handoff para Claude Code

**Fecha:** Junio 2026  
**Objetivo:** Implementar el flujo completo de pago con QR e integración Mercado Pago Checkout Pro.  
**Fase:** 1 (sin Marketplace split — funcional para demo con municipio).

---

## 0. Qué entrega este paquete

El flujo completo de extremo a extremo:

```
Consumer abre DasCash
        ↓
Escanea QR del comercio  [ScanQR.tsx]
        ↓
Ve info del comercio + ingresa monto + elige causa  [PagarComercio.tsx]
        ↓
DasCash crea Purchase + Preference en MP  [InitiateQRPaymentView]
        ↓
Consumer paga en Mercado Pago  [checkout externo]
        ↓
MP dispara webhook → cashback auto-generado  [MPWebhookView]
        ↓
Consumer ve "Aportaste $X al Club Y"  [PagoExitoso.tsx]
```

---

## 1. Instalar dependencias

### Backend — dentro del container o en apps/api/

```bash
pip install mercadopago qrcode[pil]
```

**Agregar a `apps/api/requirements.txt`:**
```
mercadopago>=2.2.5
qrcode[pil]>=7.4.2
```

### Frontend — dentro de apps/web/

```bash
npm install html5-qrcode
```

---

## 2. Variables de entorno

**Agregar al final de `apps/api/.env`** (o al docker-compose.yml como env vars):

```env
# Mercado Pago — obtener en https://www.mercadopago.com.ar/developers/panel/app
MP_ACCESS_TOKEN=TEST-xxxx-xxxx-xxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx
MP_SANDBOX=true
BACKEND_BASE_URL=http://localhost:8000
FRONTEND_BASE_URL=http://localhost:5173
```

> **Cómo obtener el access token de prueba:**
> 1. Ir a https://www.mercadopago.com.ar/developers/panel/app
> 2. Crear una aplicación
> 3. Ir a "Credenciales" → "Credenciales de prueba"
> 4. Copiar el "Access token" (empieza con TEST-)

---

## 3. Backend — Archivos NUEVOS (crear)

### 3.1 `apps/api/cashback/mp_service.py`
**→ Copiar el contenido de `backend_mp_service.py` de este paquete**

Servicio de integración con Mercado Pago SDK. Encapsula:
- `create_checkout_preference()` — crea la preference y devuelve la URL de checkout
- `get_payment_details()` — consulta el pago por ID (usado desde el webhook)
- `is_payment_approved()` — helper de estado

### 3.2 `apps/api/cashback/qr_service.py`
**→ Copiar el contenido de `backend_qr_service.py` de este paquete**

Genera el QR PNG del comercio en base64. Usa el campo `qrcode_slug` que
ya existe en el modelo `Store` — no hay que agregar ningún campo.

### 3.3 `apps/api/cashback/payment_views.py`
**→ Copiar el contenido de `backend_payment_views.py` de este paquete**

Contiene 4 vistas:
- `StoreQRView` — devuelve el QR image al merchant/admin
- `StoreBySlugView` — devuelve datos del comercio por slug (para el frontend del consumer)
- `InitiateQRPaymentView` — crea la Purchase y la preference MP
- `MPWebhookView` — recibe y procesa la notificación de pago de MP

---

## 4. Backend — Archivos EXISTENTES a modificar

### 4.1 `apps/api/cashback/models.py`
**→ AGREGAR al FINAL del archivo (después de `ReceiptUpload`):**

Copiar el bloque de `backend_models_addition.py` de este paquete.
Es la clase `MPPaymentData` con sus campos y choices.

**NO tocar nada de lo que ya existe en el archivo.**

### 4.2 `apps/api/cashback/urls.py`
**→ AGREGAR las siguientes importaciones y paths:**

```python
# Al principio, agregar al bloque de imports:
from .payment_views import InitiateQRPaymentView, MPWebhookView

# En urlpatterns, agregar:
path("payments/initiate/", InitiateQRPaymentView.as_view(), name="payment-initiate"),
path("webhooks/mercadopago/", MPWebhookView.as_view(), name="webhook-mp"),
```

### 4.3 `apps/api/commerce/urls.py`
**→ AGREGAR las siguientes importaciones y paths:**

```python
# Importación a agregar:
from cashback.payment_views import StoreQRView, StoreBySlugView

# En urlpatterns, agregar ANTES de las rutas con <int:pk> o del router:
path("stores/by-slug/<str:slug>/", StoreBySlugView.as_view(), name="store-by-slug"),
path("stores/<int:store_id>/qr/", StoreQRView.as_view(), name="store-qr"),
```

> **IMPORTANTE:** `by-slug/` debe ir **antes** de cualquier ruta que capture
> `<int:pk>` o del `router.urls`, para que Django no confunda el string "by-slug"
> con un entero.

### 4.4 `apps/api/config/settings.py` (o donde estén las settings)
**→ AGREGAR al final del archivo:**

```python
import os

# Mercado Pago
MP_ACCESS_TOKEN = os.environ.get("MP_ACCESS_TOKEN", "")
MP_SANDBOX = os.environ.get("MP_SANDBOX", "true").lower() == "true"
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:8000")
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:5173")
```

---

## 5. Migración de base de datos

Después de modificar `models.py`, ejecutar:

```bash
# Opción A — dentro del container en ejecución:
docker compose -f infra/docker-compose.yml exec api python manage.py makemigrations cashback
docker compose -f infra/docker-compose.yml exec api python manage.py migrate

# Opción B — reconstruyendo desde cero:
docker compose -f infra/docker-compose.yml up --build
```

La migración crea la tabla `cashback_mppaymentdata` en PostgreSQL.

---

## 6. Frontend — Archivos NUEVOS (crear)

### 6.1 `apps/web/src/components/QRScanner.tsx`
**→ Copiar el contenido de `frontend_QRScanner.tsx` de este paquete**

Componente reutilizable que activa la cámara y lee QR codes usando
`html5-qrcode`. Se limpia automáticamente al desmontar.

### 6.2 `apps/web/src/pages/app/ScanQR.tsx`
**→ Copiar el contenido de `frontend_ScanQR.tsx` de este paquete**

Pantalla de introducción + activación del scanner. Parsea la URL del QR
y redirige a `/app/pagar/{slug}`.

### 6.3 `apps/web/src/pages/app/PagarComercio.tsx`
**→ Copiar el contenido de `frontend_PagarComercio.tsx` de este paquete**

Pantalla de pago:
- Carga datos del comercio por slug
- Muestra el cashback activo y el preview en tiempo real
- Permite seleccionar la causa beneficiaria
- Llama a `POST /api/cashback/payments/initiate/`
- Redirige al checkout de MP

### 6.4 `apps/web/src/pages/app/PagoExitoso.tsx`
**→ Copiar la primera mitad de `frontend_PagoExitoso_y_Fallido.tsx`**

Pantalla de éxito con contador animado del cashback generado.
MP redirige acá con `?status=approved&payment_id=XXX`.

### 6.5 `apps/web/src/pages/app/PagoFallido.tsx`
**→ Copiar el bloque comentado al final de `frontend_PagoExitoso_y_Fallido.tsx`**
**(quitar los comentarios /* ... */)**

Pantalla cuando el pago es rechazado o cancelado.

---

## 7. Frontend — Archivos EXISTENTES a modificar

### 7.1 `apps/web/src/App.tsx`
**→ AGREGAR estas importaciones y rutas:**

```tsx
// Agregar a los imports (con los otros imports de páginas):
import ScanQR from './pages/app/ScanQR'
import PagarComercio from './pages/app/PagarComercio'
import PagoExitoso from './pages/app/PagoExitoso'
import PagoFallido from './pages/app/PagoFallido'

// Agregar dentro del bloque de rutas autenticadas (bajo AppLayout / /app):
<Route path="scan" element={<ScanQR />} />
<Route path="pagar/:slug" element={<PagarComercio />} />
<Route path="pago-exitoso" element={<PagoExitoso />} />
<Route path="pago-fallido" element={<PagoFallido />} />
<Route path="pago-pendiente" element={<PagoExitoso />} />
```

> La ruta `pago-pendiente` usa el mismo componente `PagoExitoso` —
> ese componente ya detecta el estado "pending" via query params de MP
> y muestra un mensaje diferente.

### 7.2 `apps/web/src/styles/globals.css`
**→ AGREGAR esta animación (para la línea de scan en ScanQR):**

```css
@keyframes scanLine {
  0%, 100% { transform: translateY(-48px); opacity: 0; }
  20%, 80%  { opacity: 1; }
  50%       { transform: translateY(48px); }
}
```

### 7.3 AppLayout / Navegación (archivo que contiene el nav de la app autenticada)
**→ AGREGAR un botón de acceso rápido al scanner QR**

Buscar el archivo de navegación de la app autenticada (probablemente
`apps/web/src/layouts/AppLayout.tsx` o similar) y agregar:

```tsx
import { QrCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// En el nav o barra de acciones:
<button
  onClick={() => navigate('/app/scan')}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white
             rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
>
  <QrCode size={16} />
  Pagar con QR
</button>
```

---

## 8. Probar el flujo completo

### Paso 1 — Configurar credenciales de prueba de MP
1. Crear cuenta en https://www.mercadopago.com.ar/developers
2. Crear una App en el Developer Panel
3. Copiar el Access Token de prueba (TEST-...) al `.env`

### Paso 2 — Reiniciar el stack
```bash
docker compose -f infra/docker-compose.yml up --build
```

### Paso 3 — Generar el QR de una tienda
1. Loguearse como admin (admin@example.com)
2. Ir a `GET http://localhost:8000/api/commerce/stores/1/qr/`
3. Copiar el `payment_url` del response: `http://localhost:5173/app/pagar/{slug}`

### Paso 4 — Simular el flujo del consumer
1. Loguearse como consumer (consumer@example.com)
2. Ir directamente a `http://localhost:5173/app/pagar/{slug}` (o usar el scanner)
3. Ingresar un monto (ej: 1000)
4. Elegir una causa
5. Hacer click en "Pagar con Mercado Pago"
6. Completar el pago en el sandbox de MP con las tarjetas de prueba:
   - Tarjeta aprobada: 5031 7557 3453 0604 — CVV: 123 — Vencimiento: 11/25
7. MP redirige a `/app/pago-exitoso`
8. El webhook de MP dispara la aprobación automática en el backend

### Paso 5 — Verificar el cashback
- En la DB: tabla `cashback_cashbacktransaction` debe tener un nuevo registro
- En la app: `/app/causes` debe mostrar el cashback acumulado actualizado
- En la API: `GET /api/profile/donations/` debe incluir la nueva transacción

### Para testear el webhook manualmente (sin pasar por MP):
```bash
curl -X POST http://localhost:8000/api/cashback/webhooks/mercadopago/ \
  -H "Content-Type: application/json" \
  -d '{"type": "payment", "data": {"id": "PAYMENT_ID_REAL_DE_MP"}}'
```

---

## 9. Notas para la demo con el municipio

**Lo que funciona en Fase 1:**
- QR generation y scanning ✅
- Deep link / redirect a Mercado Pago ✅
- Pago real con cualquier cuenta de MP ✅
- Webhook y cashback automático ✅
- Pantalla de impacto post-pago ✅

**Lo que simula Fase 2 (para la demo no importa):**
- El dinero va 100% al comercio (sin split automático)
- El cashback es virtual (registrado en la DB, aún sin transferencia real al club)
- El split real (95/5) se activa con MP Marketplace → requiere acuerdo con MP

**Argumento comercial:** la UX del vecino es EXACTAMENTE la misma en Fase 1 y Fase 2.
La diferencia es operativa (quién mueve los fondos), no visible para el usuario.

---

## 10. Estructura de archivos del paquete

```
dascash-qr-handoff/
├── HANDOFF.md                          ← Este archivo
├── backend_mp_service.py               → apps/api/cashback/mp_service.py (NUEVO)
├── backend_qr_service.py               → apps/api/cashback/qr_service.py (NUEVO)
├── backend_payment_views.py            → apps/api/cashback/payment_views.py (NUEVO)
├── backend_models_addition.py          → Agregar al final de apps/api/cashback/models.py
├── backend_urls_and_settings.py        → Instrucciones para urls.py y settings.py
├── frontend_QRScanner.tsx              → apps/web/src/components/QRScanner.tsx (NUEVO)
├── frontend_ScanQR.tsx                 → apps/web/src/pages/app/ScanQR.tsx (NUEVO)
├── frontend_PagarComercio.tsx          → apps/web/src/pages/app/PagarComercio.tsx (NUEVO)
└── frontend_PagoExitoso_y_Fallido.tsx  → apps/web/src/pages/app/PagoExitoso.tsx (NUEVO)
                                           apps/web/src/pages/app/PagoFallido.tsx (NUEVO)
```
