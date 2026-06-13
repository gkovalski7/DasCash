# Piloto técnico: causa preferida + hosting VPS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar DasCash listo para el piloto: el flujo en caja queda en escanear → monto → pagar (causa preferida preseleccionada) y la app corre en https://dascash.com.ar en un VPS, con webhook de Mercado Pago operativo.

**Architecture:** Fase A agrega `preferred_cause` al usuario (FK a Cause), se setea en el registro o se aprende automáticamente al iniciar un pago, y el frontend la preselecciona en la pantalla de pago. Fase B completa el stack de producción **ya existente y smoke-testeado** (v1.2: `infra/docker-compose.prod.yml` con gunicorn + nginx + build de Vite, `infra/nginx/dascash.conf`, `infra/.env.prod.example`, dominio dascash.com.ar ya en propiedad): solo falta TLS (certbot webroot) y el deploy real al VPS.

**Tech Stack:** Django 5/DRF + pytest-django, React/Vite + vitest/testing-library, Docker Compose, nginx + certbot (Let's Encrypt), Mercado Pago Checkout Pro.

**Spec:** `docs/superpowers/specs/2026-06-12-estrategia-piloto-design.html`

**Convenciones de ejecución:**
- Los tests de API corren en Docker: levantar la DB una vez con `docker compose -f infra/docker-compose.yml up -d db`.
- Comando pytest: `docker compose -f infra/docker-compose.yml run --rm api pytest <ruta> -v`
- Comando vitest: `docker compose -f infra/docker-compose.yml run --rm web npx vitest run <ruta>`
- Todos los comandos se ejecutan desde la raíz del repo (`DasCash/`).

---

## Fase A — Feature «causa preferida»

### Task 1: Backend — campo `preferred_cause` en el usuario + exposición en perfil

**Files:**
- Modify: `apps/api/apps/accounts/models.py`
- Modify: `apps/api/apps/accounts/serializers.py`
- Create: `apps/api/apps/accounts/migrations/0002_customuser_preferred_cause.py` (vía makemigrations)
- Test: `apps/api/apps/accounts/tests.py`

- [ ] **Step 1: Write the failing tests**

Agregar al final de `apps/api/apps/accounts/tests.py`. Asegurarse de que estos imports existan al tope del archivo (agregarlos si faltan):

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.causes.models import Cause

User = get_user_model()
```

Tests nuevos:

```python
class PreferredCauseProfileTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="pc@t.com", email="pc@t.com", password="Pass1234!", role="CONSUMER"
        )
        cls.cause = Cause.objects.create(title="Club Test", category="Deporte", is_active=True)
        cls.cause_inactive = Cause.objects.create(title="Inactiva", category="Salud", is_active=False)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_profile_incluye_preferred_cause_null_por_defecto(self):
        res = self.client.get("/api/profile/")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data["preferred_cause"])
        self.assertIsNone(res.data["preferred_cause_title"])

    def test_patch_setea_preferred_cause(self):
        res = self.client.patch(
            "/api/profile/", {"preferred_cause": self.cause.id}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["preferred_cause"], self.cause.id)
        self.assertEqual(res.data["preferred_cause_title"], "Club Test")
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_cause_id, self.cause.id)

    def test_patch_acepta_null_para_limpiar(self):
        self.user.preferred_cause = self.cause
        self.user.save(update_fields=["preferred_cause"])
        res = self.client.patch("/api/profile/", {"preferred_cause": None}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data["preferred_cause"])

    def test_patch_rechaza_causa_inactiva(self):
        res = self.client.patch(
            "/api/profile/", {"preferred_cause": self.cause_inactive.id}, format="json"
        )
        self.assertEqual(res.status_code, 400)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose -f infra/docker-compose.yml up -d db` (si no está corriendo) y luego
`docker compose -f infra/docker-compose.yml run --rm api pytest apps/accounts/tests.py -v -k PreferredCause`
Expected: FAIL — `FieldError`/`KeyError: 'preferred_cause'` (el campo no existe).

- [ ] **Step 3: Implement — modelo**

En `apps/api/apps/accounts/models.py`, dentro de `CustomUser`, después de `role`:

```python
    preferred_cause = models.ForeignKey(
        "causes.Cause",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="preferred_by",
        help_text="Causa que el usuario apoya por defecto; se preselecciona al pagar.",
    )
```

- [ ] **Step 4: Generate migration**

Run: `docker compose -f infra/docker-compose.yml run --rm api python manage.py makemigrations accounts`
Expected: crea `apps/accounts/migrations/0002_customuser_preferred_cause.py` (el número puede variar; usar el que genere).

- [ ] **Step 5: Implement — serializer**

En `apps/api/apps/accounts/serializers.py`:

Agregar import al tope:

```python
from apps.causes.models import Cause
```

En `ProfileSerializer`, agregar los campos (antes de `class Meta`):

```python
    preferred_cause = serializers.PrimaryKeyRelatedField(
        queryset=Cause.objects.filter(is_active=True),
        allow_null=True,
        required=False,
    )
    preferred_cause_title = serializers.CharField(
        source="preferred_cause.title", read_only=True, default=None
    )
```

Y en `Meta.fields` agregar ambos nombres:

```python
        fields = (
            "id", "email", "username", "first_name", "last_name", "role",
            "preferred_cause", "preferred_cause_title",
            "total_donated", "causes_count", "purchases_count",
        )
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/accounts/tests.py -v -k PreferredCause`
Expected: 4 PASS.

- [ ] **Step 7: Run the full API suite (no regressions)**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest -v`
Expected: todo PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/api/apps/accounts/
git commit -m "feat(api): campo preferred_cause en usuario, expuesto en perfil"
```

---

### Task 2: Backend — el registro acepta `preferred_cause`

**Files:**
- Modify: `apps/api/apps/accounts/serializers.py` (RegisterSerializer)
- Test: `apps/api/apps/accounts/tests.py`

- [ ] **Step 1: Write the failing tests**

Agregar al final de `apps/api/apps/accounts/tests.py`:

```python
class RegisterPreferredCauseTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.cause = Cause.objects.create(title="Club Registro", category="Deporte", is_active=True)

    def setUp(self):
        self.client = APIClient()

    def test_registro_con_preferred_cause(self):
        res = self.client.post(
            "/api/auth/register",
            {"email": "nuevo@t.com", "password": "Pass1234!", "preferred_cause": self.cause.id},
            format="json",
        )
        self.assertIn(res.status_code, (200, 201))
        user = User.objects.get(email="nuevo@t.com")
        self.assertEqual(user.preferred_cause_id, self.cause.id)

    def test_registro_sin_preferred_cause_sigue_funcionando(self):
        res = self.client.post(
            "/api/auth/register",
            {"email": "n2@t.com", "password": "Pass1234!"},
            format="json",
        )
        self.assertIn(res.status_code, (200, 201))
        self.assertIsNone(User.objects.get(email="n2@t.com").preferred_cause)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/accounts/tests.py -v -k RegisterPreferred`
Expected: `test_registro_con_preferred_cause` FAIL (el serializer ignora el campo → queda None). El segundo puede pasar ya.

- [ ] **Step 3: Implement**

En `RegisterSerializer` (`apps/api/apps/accounts/serializers.py`), agregar el campo (junto a `role`):

```python
    preferred_cause = serializers.PrimaryKeyRelatedField(
        queryset=Cause.objects.filter(is_active=True),
        allow_null=True,
        required=False,
    )
```

Y en `Meta.fields`:

```python
        fields = ("id", "email", "username", "password", "role", "preferred_cause")
```

No hace falta tocar `create()`: `preferred_cause` es un campo del modelo y `User(**validated_data)` lo asigna.

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/accounts/tests.py -v -k RegisterPreferred`
Expected: 2 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/apps/accounts/
git commit -m "feat(api): registro acepta causa preferida"
```

---

### Task 3: Backend — iniciar un pago aprende la causa elegida

**Files:**
- Modify: `apps/api/apps/cashback/payment_views.py` (InitiateQRPaymentView.post)
- Test: `apps/api/apps/cashback/tests.py`

- [ ] **Step 1: Write the failing test**

Agregar al final de `apps/api/apps/cashback/tests.py` (el archivo ya tiene `BaseTestCase` con `consumer`, `store` con slug `ts-1`, `cause_a`, y ya importa `patch` y `APIClient`):

```python
class PaymentLearnsPreferredCauseTests(BaseTestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.consumer)

    @patch("apps.cashback.payment_views.MercadoPagoService")
    def test_initiate_actualiza_preferred_cause_del_usuario(self, mock_mp):
        mock_mp.return_value.create_checkout_preference.return_value = {
            "preference_id": "pref-test-1",
            "checkout_url": "https://mp.test/checkout/pref-test-1",
        }
        res = self.client.post(
            "/api/cashback/payments/initiate/",
            {
                "store_slug": self.store.qrcode_slug,
                "amount": 1000,
                "selected_cause_id": self.cause_a.id,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.consumer.refresh_from_db()
        self.assertEqual(self.consumer.preferred_cause_id, self.cause_a.id)

    @patch("apps.cashback.payment_views.MercadoPagoService")
    def test_initiate_sin_causa_no_pisa_la_preferida(self, mock_mp):
        mock_mp.return_value.create_checkout_preference.return_value = {
            "preference_id": "pref-test-2",
            "checkout_url": "https://mp.test/checkout/pref-test-2",
        }
        self.consumer.preferred_cause = self.cause_b
        self.consumer.save(update_fields=["preferred_cause"])
        res = self.client.post(
            "/api/cashback/payments/initiate/",
            {"store_slug": self.store.qrcode_slug, "amount": 500},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.consumer.refresh_from_db()
        self.assertEqual(self.consumer.preferred_cause_id, self.cause_b.id)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/cashback/tests.py -v -k LearnsPreferred`
Expected: el primero FAIL (`preferred_cause_id` queda None); el segundo puede pasar ya.

- [ ] **Step 3: Implement**

En `apps/api/apps/cashback/payment_views.py`, dentro de `InitiateQRPaymentView.post`, inmediatamente después del bloque `purchase = Purchase.objects.create(...)`:

```python
        # La causa elegida al pagar se vuelve la preferida del usuario
        # (preselección en el próximo pago).
        if cause and request.user.preferred_cause_id != cause.id:
            request.user.preferred_cause = cause
            request.user.save(update_fields=["preferred_cause"])
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm api pytest apps/cashback/tests.py -v`
Expected: todo PASS (los nuevos y los existentes).

- [ ] **Step 5: Commit**

```bash
git add apps/api/apps/cashback/
git commit -m "feat(api): iniciar pago aprende la causa preferida del usuario"
```

---

### Task 4: Web — PagarComercio preselecciona la causa preferida

**Files:**
- Modify: `apps/web/src/lib/api.ts` (tipo ApiProfile + patchProfile)
- Modify: `apps/web/src/pages/app/PagarComercio.tsx`
- Test: `apps/web/src/pages/app/PagarComercio.test.tsx` (nuevo)

- [ ] **Step 1: Write the failing test**

Crear `apps/web/src/pages/app/PagarComercio.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PagarComercio from './PagarComercio'
import { get, getProfile } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  getProfile: vi.fn(),
}))

const storeData = {
  id: 1,
  name: 'Súper Test',
  address: 'Calle 1',
  description: '',
  logo_url: '',
  cashback_percentage: '5.00',
  supported_causes: [
    { id: 10, title: 'Club Deportivo', slug: 'club', image_url: '', category: 'Deporte' },
    { id: 20, title: 'Básquet de Base', slug: 'basquet', image_url: '', category: 'Deporte' },
  ],
}

function renderPagar() {
  return render(
    <MemoryRouter initialEntries={['/app/pagar/super-test']}>
      <Routes>
        <Route path="/app/pagar/:slug" element={<PagarComercio />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PagarComercio — causa preferida', () => {
  beforeEach(() => {
    vi.mocked(get).mockResolvedValue(storeData)
  })

  it('preselecciona la causa preferida del usuario si la tienda la soporta', async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_cause: 20 } as any)
    renderPagar()
    const btn = await screen.findByRole('button', { name: /Básquet de Base/ })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('cae a la primera causa cuando no hay preferida', async () => {
    vi.mocked(getProfile).mockResolvedValue({ preferred_cause: null } as any)
    renderPagar()
    const btn = await screen.findByRole('button', { name: /Club Deportivo/ })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('cae a la primera causa si el perfil falla (no bloquea el pago)', async () => {
    vi.mocked(getProfile).mockRejectedValue(new Error('401'))
    renderPagar()
    const btn = await screen.findByRole('button', { name: /Club Deportivo/ })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose -f infra/docker-compose.yml run --rm web npx vitest run src/pages/app/PagarComercio.test.tsx`
Expected: FAIL — `aria-pressed` es null (el atributo no existe todavía) y `getProfile` no se usa.

- [ ] **Step 3: Implement — tipos en api.ts**

En `apps/web/src/lib/api.ts`, en el type `ApiProfile`, agregar después de `role: string`:

```ts
  preferred_cause: number | null
  preferred_cause_title: string | null
```

Y ampliar `patchProfile`:

```ts
export function patchProfile(
  data: Partial<Pick<ApiProfile, 'username' | 'first_name' | 'last_name' | 'preferred_cause'>>
): Promise<ApiProfile> {
  return patch<ApiProfile>('/api/profile/', data)
}
```

- [ ] **Step 4: Implement — PagarComercio**

En `apps/web/src/pages/app/PagarComercio.tsx`:

1. Cambiar el import de api:

```tsx
import { get, post, getProfile } from '../../lib/api'
```

2. Reemplazar el `useEffect` de carga por:

```tsx
  useEffect(() => {
    if (!slug) return
    Promise.all([
      get<StoreInfo>(`/api/commerce/stores/by-slug/${slug}/`),
      getProfile().catch(() => null),
    ])
      .then(([data, profile]) => {
        setStore(data)
        if (data.supported_causes.length > 0) {
          const preferred = profile?.preferred_cause
            ? data.supported_causes.find((c) => c.id === profile.preferred_cause)
            : undefined
          setSelectedCauseId((preferred ?? data.supported_causes[0]).id)
        }
        setPageState('ready')
      })
      .catch(() => setPageState('not_found'))
  }, [slug])
```

3. En el botón de causa (el `<button>` dentro de `store.supported_causes.map`), agregar el atributo `aria-pressed` junto a `onClick`:

```tsx
                  aria-pressed={selectedCauseId === cause.id}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm web npx vitest run src/pages/app/PagarComercio.test.tsx`
Expected: 3 PASS.

- [ ] **Step 6: Run the full web suite (no regressions)**

Run: `docker compose -f infra/docker-compose.yml run --rm web npm test`
Expected: todo PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/pages/app/
git commit -m "feat(web): pagar preselecciona la causa preferida del usuario"
```

---

### Task 5: Web — selector de causa (opcional) en el registro

**Files:**
- Modify: `apps/web/src/pages/signup.tsx`
- Test: `apps/web/src/pages/signup.test.tsx` (nuevo)

- [ ] **Step 1: Write the failing test**

Crear `apps/web/src/pages/signup.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SignupPage from './signup'
import { post, fetchCauses } from '../lib/api'

vi.mock('../lib/api', () => ({
  post: vi.fn(),
  fetchCauses: vi.fn(),
}))

const causes = [
  { id: 10, title: 'Club Deportivo', slug: 'club', category: 'Deporte' },
  { id: 20, title: 'Escuela 12', slug: 'escuela-12', category: 'Educación' },
]

async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), 'nuevo@test.com')
  await user.type(screen.getByLabelText('Contraseña'), 'password123')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'password123')
  return user
}

describe('SignupPage — causa preferida', () => {
  beforeEach(() => {
    vi.mocked(fetchCauses).mockResolvedValue(causes as any)
    vi.mocked(post).mockResolvedValue({})
  })

  it('envía preferred_cause cuando se elige una causa', async () => {
    render(<MemoryRouter><SignupPage /></MemoryRouter>)
    const user = await fillAndSubmit()
    await user.click(await screen.findByRole('button', { name: /Club Deportivo/ }))
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(post).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({ preferred_cause: 10 })
    )
  })

  it('no envía preferred_cause cuando no se elige ninguna', async () => {
    render(<MemoryRouter><SignupPage /></MemoryRouter>)
    const user = await fillAndSubmit()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    const body = vi.mocked(post).mock.calls[0][1] as Record<string, unknown>
    expect(body).not.toHaveProperty('preferred_cause')
  })

  it('el registro funciona aunque las causas no carguen', async () => {
    vi.mocked(fetchCauses).mockRejectedValue(new Error('network'))
    render(<MemoryRouter><SignupPage /></MemoryRouter>)
    const user = await fillAndSubmit()
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(post).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker compose -f infra/docker-compose.yml run --rm web npx vitest run src/pages/signup.test.tsx`
Expected: FAIL — no existe el botón de causa y `post` se llama sin `preferred_cause`.

- [ ] **Step 3: Implement**

En `apps/web/src/pages/signup.tsx`:

1. Imports:

```tsx
import React, { useEffect, useState } from 'react'
import { post, fetchCauses, type ApiCause } from '../lib/api'
```

2. Estado nuevo (junto a los otros `useState`):

```tsx
    const [causes, setCauses] = useState<ApiCause[]>([])
    const [preferredCauseId, setPreferredCauseId] = useState<number | null>(null)

    useEffect(() => {
        fetchCauses().then(setCauses).catch(() => setCauses([]))
    }, [])
```

3. En `onSubmit`, reemplazar la llamada a `post` por:

```tsx
            await post('/api/auth/register', {
                email,
                username: email,
                password,
                role: 'CONSUMER',
                ...(preferredCauseId !== null ? { preferred_cause: preferredCauseId } : {}),
            })
```

4. En el JSX, después del `<div>` del campo "Confirmar contraseña" y antes del `<Button>`:

```tsx
                    {causes.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ¿Qué causa querés apoyar? <span className="text-gray-400">(opcional)</span>
                            </label>
                            <div className="space-y-2">
                                {causes.map((c) => (
                                    <button
                                        type="button"
                                        key={c.id}
                                        onClick={() =>
                                            setPreferredCauseId(preferredCauseId === c.id ? null : c.id)
                                        }
                                        aria-pressed={preferredCauseId === c.id}
                                        className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                                            preferredCauseId === c.id
                                                ? 'border-green-600 bg-green-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <span className="text-sm font-medium text-gray-900">{c.title}</span>
                                        <span className="text-xs text-gray-500 ml-2">{c.category}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker compose -f infra/docker-compose.yml run --rm web npx vitest run src/pages/signup.test.tsx`
Expected: 3 PASS.

- [ ] **Step 5: Run the full web suite (login.test.tsx usa SignupPage — verificar que no se rompa)**

Run: `docker compose -f infra/docker-compose.yml run --rm web npm test`
Expected: todo PASS. (Nota: `login.test.tsx` renderiza SignupPage y su `vi.mock('../lib/api', ...)` solo define `post`. Si falla con "fetchCauses is not a function", agregar `fetchCauses: vi.fn().mockResolvedValue([])` a ese mock.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/
git commit -m "feat(web): registro con seleccion opcional de causa preferida"
```

---

## Fase B — Hosting en VPS (dascash.com.ar)

> **Contexto:** el stack de producción ya existe desde v1.2 y fue smoke-testeado localmente: `infra/docker-compose.prod.yml` (gunicorn 3 workers, DEBUG=0, sin seeds, estáticos por volumen compartido), `apps/web/Dockerfile.prod` (build Vite → nginx), `infra/nginx/dascash.conf` (SPA + proxy /api /admin /static) y `infra/.env.prod.example` (vars obligatorias con `:?`). El dominio **dascash.com.ar ya es de German**. Lo que falta: TLS con certbot (el conf lo anticipa en su header) y el deploy real.

### Task 6: TLS — certbot webroot + configuración nginx para 443

**Files:**
- Modify: `infra/docker-compose.prod.yml`
- Modify: `infra/nginx/dascash.conf`
- Create: `infra/nginx/dascash-ssl.conf`
- Modify: `infra/.env.prod.example`

- [ ] **Step 1: Agregar el challenge ACME al conf HTTP existente**

En `infra/nginx/dascash.conf`, dentro del `server { ... }`, antes de `location / {`:

```nginx
    # Challenge ACME de Let's Encrypt (certbot webroot)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
```

- [ ] **Step 2: Crear el conf HTTPS (se activa por env var DESPUÉS de emitir el certificado)**

Crear `infra/nginx/dascash-ssl.conf`:

```nginx
# DasCash — nginx producción con TLS (dascash.com.ar)
# Activar vía NGINX_CONF=dascash-ssl.conf en infra/.env.prod, SOLO después de
# emitir el certificado (Task 8, Step 5). Si nginx no encuentra los .pem, no arranca.

server {
    listen 80;
    server_name dascash.com.ar www.dascash.com.ar;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name dascash.com.ar www.dascash.com.ar;

    ssl_certificate /etc/letsencrypt/live/dascash.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dascash.com.ar/privkey.pem;

    client_max_body_size 10M;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location /api/ {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://api:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /staticfiles/;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

- [ ] **Step 3: Compose — puerto 443, volúmenes de certbot y servicio de renovación**

En `infra/docker-compose.prod.yml`, servicio `web`: cambiar `ports` y `volumes` a:

```yaml
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/${NGINX_CONF:-dascash.conf}:/etc/nginx/conf.d/default.conf:ro
      - static_files:/staticfiles:ro
      - certbot_certs:/etc/letsencrypt:ro
      - certbot_webroot:/var/www/certbot:ro
```

Agregar el servicio `certbot` (después de `web`):

```yaml
  certbot:
    image: certbot/certbot
    volumes:
      - certbot_certs:/etc/letsencrypt
      - certbot_webroot:/var/www/certbot
    # Renovación automática cada 12 h (no hace nada si no hay certs aún).
    entrypoint: /bin/sh -c "trap exit TERM; while :; do certbot renew --webroot -w /var/www/certbot --quiet; sleep 12h & wait $${!}; done"
    restart: unless-stopped
```

Y en `volumes:` al final del archivo, agregar:

```yaml
  certbot_certs:
  certbot_webroot:
```

- [ ] **Step 4: Documentar NGINX_CONF en el env example**

En `infra/.env.prod.example`, al final de la sección "Dominio":

```bash
# Config de nginx: dascash.conf (HTTP, para el primer arranque y smoke local)
# o dascash-ssl.conf (HTTPS — activar SOLO después de emitir el certificado, ver plan Task 8)
NGINX_CONF=dascash.conf
```

- [ ] **Step 5: Validar sintaxis del compose**

Run:
```bash
cp infra/.env.prod.example /tmp/envcheck && sed -i 's/^DJANGO_SECRET_KEY=$/DJANGO_SECRET_KEY=x/;s/^POSTGRES_PASSWORD=$/POSTGRES_PASSWORD=x/;s/^MP_ACCESS_TOKEN=$/MP_ACCESS_TOKEN=x/;s/^MP_WEBHOOK_SECRET=$/MP_WEBHOOK_SECRET=x/' /tmp/envcheck
docker compose -f infra/docker-compose.prod.yml --env-file /tmp/envcheck config --quiet
```
Expected: exit 0, sin errores.

- [ ] **Step 6: Commit**

```bash
git add infra/
git commit -m "feat(infra): TLS con certbot webroot para el stack de produccion"
```

---

### Task 7: Smoke local del stack de producción (re-verificación tras los cambios de TLS)

**Files:** ninguno nuevo (usa `infra/.env.prod` local, que ya está en .gitignore).

- [ ] **Step 1: Crear env local de smoke**

```bash
cp infra/.env.prod.example infra/.env.prod
```

Editar `infra/.env.prod` con valores locales:

```bash
DJANGO_SECRET_KEY=solo-para-smoke-local
POSTGRES_PASSWORD=smoke-local
MP_ACCESS_TOKEN=TEST-xxx        # el token de test que ya usás en dev
MP_WEBHOOK_SECRET=smoke-secret
MP_SANDBOX=true
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost
FRONTEND_URL=http://localhost
BACKEND_BASE_URL=http://localhost
FRONTEND_BASE_URL=http://localhost
NGINX_CONF=dascash.conf
```

- [ ] **Step 2: Bajar dev y levantar prod**

```bash
docker compose -f infra/docker-compose.yml down
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d --build
```

Expected: 4 contenedores arriba (db, api, web, certbot). El log de certbot puede decir "no renewals were attempted" — correcto.

- [ ] **Step 3: Smoke checks**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost/             # → 200 (SPA)
curl -s http://localhost/api/causes/                                 # → [] (JSON, LOAD_SEEDS=false)
curl -s -o /dev/null -w "%{http_code}" http://localhost/admin/login/ # → 200 (admin con CSS)
curl -s -o /dev/null -w "%{http_code}" http://localhost/app/home     # → 200 (SPA fallback)
```

Expected: los códigos indicados.

- [ ] **Step 4: Bajar el stack prod local**

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod down
```

- [ ] **Step 5: Commit (solo si hubo fixes)**

```bash
git add -A
git commit -m "fix(infra): ajustes del stack de produccion tras smoke local"
```

---

### Task 8: Deploy al VPS — checklist operativo (manual, German)

**Files:** ninguno en el repo (operaciones en el VPS y paneles externos). En orden:

- [ ] **Step 1: Contratar el VPS**

Ubuntu 24.04, mínimo 2 GB RAM / 1 vCPU. Proveedores en pesos: DonWeb Cloud, Hostinger (pagan en ARS con tarjeta local). Anotar la IP pública.

- [ ] **Step 2: Apuntar el dominio (ya en propiedad)**

En el panel DNS de dascash.com.ar: registro **A** `@ → IP del VPS` y **A** `www → IP del VPS`. Verificar propagación: `nslookup dascash.com.ar` debe devolver la IP.

- [ ] **Step 3: Preparar el VPS**

```bash
ssh root@IP_DEL_VPS
curl -fsSL https://get.docker.com | sh
git clone https://github.com/gkovalski7/DasCash.git /opt/dascash
cd /opt/dascash
```

(Repo privado: crear un fine-grained token de GitHub con acceso de lectura y clonar con `https://TOKEN@github.com/gkovalski7/DasCash.git`.)

- [ ] **Step 4: Configurar y levantar (primero en HTTP)**

```bash
cp infra/.env.prod.example infra/.env.prod
python3 -c "import secrets; print(secrets.token_urlsafe(64))"   # → DJANGO_SECRET_KEY
nano infra/.env.prod   # completar SECRET_KEY, POSTGRES_PASSWORD fuerte, MP test por ahora; NGINX_CONF=dascash.conf
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d --build
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod exec api python manage.py createsuperuser
```

Verificar: `http://dascash.com.ar` carga la landing.

- [ ] **Step 5: Emitir el certificado y activar HTTPS**

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d dascash.com.ar -d www.dascash.com.ar \
  --email german.kovalski1@gmail.com --agree-tos --no-eff-email
```

Expected: "Successfully received certificate". Luego activar el conf TLS:

```bash
nano infra/.env.prod    # NGINX_CONF=dascash-ssl.conf  y  SECURE_HSTS_SECONDS=2592000
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d web api
```

Verificar: `https://dascash.com.ar` con candado; `http://` redirige a `https://`.

**⚠️ Recordatorio de renovación (importante):** el servicio `certbot` renueva el certificado en disco cada 12 h, pero nginx sólo lee el cert nuevo al reiniciarse. Agendá un `docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod restart web` **mensual** (o tras cada deploy). Si se olvida, el cert se renueva pero nginx sigue sirviendo el viejo hasta que expira (~60-90 días) y entonces el sitio deja de cargar por HTTPS.

- [ ] **Step 6: Mercado Pago a producción**

1. Panel de desarrolladores MP → activar **credenciales de producción** (requiere homologación de la app).
2. `infra/.env.prod`: `MP_ACCESS_TOKEN=APP_USR-...`, `MP_SANDBOX=false`.
3. Panel MP → Webhooks: URL `https://dascash.com.ar/api/cashback/webhooks/mercadopago/`, evento "Pagos". Copiar la clave secreta → `MP_WEBHOOK_SECRET`.
4. `docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d api`

- [ ] **Step 7: Cargar los datos reales del piloto**

Desde `https://dascash.com.ar` logueado como admin, en `/app/admin`:
1. Merchant del supermercado (usuario + entidad).
2. Store con su `qrcode_slug` (ej: `super-de-pedro`).
3. Causa del club (título, foto, categoría Deporte).
4. Asignar la causa a la store y crear la campaña con el % acordado y las fechas del piloto.

- [ ] **Step 8: Generar e imprimir el QR**

Con el access token del admin:

```bash
curl -s https://dascash.com.ar/api/commerce/stores/1/qr/ -H "Authorization: Bearer TOKEN"
```

`qr_image` es un data-URL base64 → guardar como PNG e imprimir el cartel para la caja. Verificar antes que `payment_url` apunte a `https://dascash.com.ar/app/pagar/<slug>`.

- [ ] **Step 9: Prueba end-to-end con plata real**

Compra real chica ($100) escaneando el QR impreso con un celular: registro → pago MP → volver a la app → verificar en Mi Impacto que figura la donación, y en el admin que la Purchase quedó APPROVED con su CashbackTransaction. **Esto cierra el prerequisito técnico del piloto.**

---

## Self-review (hecho al escribir el plan)

- **Cobertura del spec:** semanas 1-2 del spec piden hosting público ✔ (Tasks 6-8 sobre el stack v1.2 ya existente) y «causa preferida» para que la caja sea escanear → monto → pagar ✔ (Tasks 1-5). La métrica «tiempo de pago en caja» se mide a mano (YAGNI: sin instrumentación extra).
- **Reuso verificado contra el repo:** `docker-compose.prod.yml`, `Dockerfile.prod`, `nginx/dascash.conf`, `.env.prod.example` y el gitignore de `.env.prod` **ya existen** (v1.2, smoke-testeado) — la Fase B solo agrega TLS y el deploy; no se duplica ni se cambia de arquitectura (se descartó Caddy/whitenoise para no tirar trabajo probado).
- **Sin placeholders:** todos los pasos tienen código o comandos completos.
- **Consistencia de tipos:** `preferred_cause` (number|null en TS, FK nullable en Django) y `preferred_cause_title` usados con el mismo nombre en serializers, api.ts y tests.
- **MP_SANDBOX:** queda en test hasta Task 8 Step 6 (tras homologación de credenciales de producción).
