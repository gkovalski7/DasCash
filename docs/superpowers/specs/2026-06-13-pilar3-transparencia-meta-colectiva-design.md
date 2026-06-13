# Pilar 3 — Transparencia real + meta colectiva — Diseño

**Fecha:** 2026-06-13
**Estado:** aprobado para planificación
**Spec previa relacionada:** `docs/superpowers/specs/2026-06-12-estrategia-piloto-design.html` (estrategia del piloto)

---

## Contexto y objetivo

DasCash tiene el loop de pago QR + cashback a una causa funcionando (Fase 1: el pago va al comercio, el cashback es un registro virtual que se liquida manualmente). Este sub-proyecto es el **Pilar 3** del análisis de producto: hacer que el usuario **vea el impacto real de su compra** y que ese impacto se acumule en una **meta colectiva** visible (barra de progreso) que el club usa para movilizar a su comunidad.

Es la "transparencia que vende" del piloto. Es el de mayor impacto directo en la experiencia del usuario, y se construye sobre datos que la app **ya captura** (`CashbackTransaction`), sin depender de Fase 2 (MP Marketplace split).

**Alcance deliberadamente acotado al piloto (YAGNI):**
- **Una meta activa por causa** a la vez (no metas por deportista, no jerarquía Atleta/Club/Federación, no geo — eso se difiere a cuando se construyan los Pilares 2 y 4).
- **Notificación in-app únicamente** (no push, no email — eso espera al trabajo de PWA).
- **La meta la gestiona el ADMIN** (German) desde el panel admin existente, no el club todavía.

---

## Hallazgo de código que condiciona el diseño

Cuando se genera un `CashbackTransaction`, nace con status `PENDING` — pero ese `PENDING` significa **"falta liquidarlo a la causa"**, NO "el pago está pendiente". El `CashbackTransaction` **solo se crea después** de que Mercado Pago aprobó el pago (en `cashback/views.py::approve` y en `payment_views.py::_approve_and_generate_cashback`).

**Consecuencia de diseño:** la *existencia* del `CashbackTransaction` = aporte confirmado. El progreso de la meta cuenta **todos** los `CashbackTransaction` de la causa desde `starts_at`, **sin filtrar por status**. Filtrar por status (esperando "APPROVED") sería el error natural y dejaría la barra siempre en cero.

**Segundo hallazgo:** la generación de cashback está **duplicada** en dos rutas (`approve` manual y webhook de MP). Por eso el progreso se **calcula sumando** (no se guarda un contador incrementado): un contador se desincronizaría si solo una de las dos rutas lo actualizara.

---

## Sección 1 — Modelo de datos

Modelo nuevo `Goal` (Meta) en la app `cashback` (donde vive `CashbackTransaction`, que es lo que agrega):

```python
# apps/api/apps/cashback/models.py

class Goal(models.Model):
    cause = models.ForeignKey(
        "causes.Cause", on_delete=models.CASCADE, related_name="goals"
    )
    title = models.CharField(max_length=200)  # "Camisetas nuevas para el torneo"
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.title} ({self.cause.title})"

    @property
    def current_amount(self) -> Decimal:
        """Suma de cashback de la causa desde que arrancó la meta.
        La existencia del CashbackTransaction = aporte confirmado (se crea
        recién al aprobarse el pago), así que NO se filtra por status."""
        total = (
            CashbackTransaction.objects.filter(
                cause=self.cause,
                purchase__created_at__gte=self.starts_at,
            ).aggregate(s=models.Sum("amount"))["s"]
        )
        return (total or Decimal("0")).quantize(Decimal("0.01"))

    @property
    def percent(self) -> int:
        """Porcentaje 0–100 (capeado)."""
        if self.target_amount <= 0:
            return 0
        raw = (self.current_amount / self.target_amount) * 100
        return min(int(raw), 100)
```

**Meta activa de una causa** (helper de acceso único, usado por endpoint y serializer):

```python
def active_goal_for(cause) -> "Goal | None":
    return cause.goals.filter(active=True).order_by("-starts_at").first()
```

**Decisiones:**
- **Una meta activa por causa a la vez:** se resuelve por consulta (`active=True`, la más reciente por `starts_at`), no por constraint de DB. Suficiente para el piloto; `starts_at` deja la puerta abierta a metas sucesivas sin migración futura.
- **Progreso calculado, no almacenado:** `current_amount`/`percent` son properties. A escala piloto la agregación es trivial y no puede desincronizarse con las dos rutas de cashback.
- **Acotado por `starts_at`:** el progreso no arrastra cashback histórico anterior a la creación de la meta.
- **Admin del panel:** registrar `Goal` en `cashback/admin.py` para que German la cree/edite. CRUD admin estándar, sin UI nueva de gestión.

---

## Sección 2 — Backend

### Shape compartido de la meta

Tanto el endpoint de impacto como el serializer de causa devuelven la meta con este shape (o `null` si la causa no tiene meta activa):

```json
{
  "title": "Camisetas nuevas",
  "target_amount": "300000.00",
  "current_amount": "84200.00",
  "percent": 28
}
```

Se construye con un único serializer `GoalSerializer` (campos: `title`, `target_amount`, `current_amount`, `percent`; los dos últimos son properties read-only) para no duplicar el shape.

### Endpoint de reconciliación

`GET /api/cashback/purchases/<id>/impact/` — un `@action(detail=True, methods=["get"])` sobre `PurchaseViewSet`. El `get_queryset` existente ya limita las compras al dueño (consumer ve `user=user`), así que el scoping es automático.

Respuesta:

```json
{
  "status": "APPROVED",
  "contribution": "75.00",
  "cause_title": "Club Deportivo Barrial",
  "goal": { "title": "...", "target_amount": "...", "current_amount": "...", "percent": 28 }
}
```

- `status`: el `purchase.status` (`PENDING` | `APPROVED` | `REJECTED`).
- `contribution`: el `amount` del `CashbackTransaction` de esa compra si existe; `null` si el webhook todavía no llegó.
- `cause_title` y `goal` derivan de **la misma causa**: la del `CashbackTransaction` si ya existe (la causa real del cashback = `campaign.cause`, que puede diferir de la preferencia del usuario), o `purchase.selected_cause` como fallback optimista mientras no hay transacción. Esto evita mostrar la meta de una causa y el aporte de otra.
- `goal`: meta activa de esa causa (shape de arriba), o `null`.

### Meta en el detalle de causa

Agregar un campo `active_goal` (SerializerMethodField, usa `active_goal_for` + `GoalSerializer`) al serializer de detalle de causa en la app `causes`, para que la barra aparezca en la pantalla de impacto / detalle de causa. Devuelve el mismo shape o `null`.

**Import circular:** la app `causes` no puede importar de `cashback` a nivel de módulo (`cashback` ya importa de `causes` → ciclo). El import de `active_goal_for`/`GoalSerializer` dentro del serializer de causa debe ser **function-local** (dentro del método `get_active_goal`), siguiendo el patrón que ya usa `accounts/serializers.py` para modelos de `cashback`.

---

## Sección 3 — Frontend

### Componente `GoalProgress`

Barra reutilizable con la identidad verde (tokens `brand-green-*`). Props: `title`, `currentAmount`, `targetAmount`, `percent`. Muestra título de la meta, `$actual / $objetivo` y la barra al `percent`. Si `percent >= 100`, muestra "¡Meta cumplida! 🎉". Se usa en `PagoExitoso` y en el detalle de causa / Mi Impacto.

Tipo TS del shape de meta (en `lib/api.ts`):

```ts
export type ApiGoal = {
  title: string
  target_amount: string
  current_amount: string
  percent: number
}
```

### `PagoExitoso` — optimista + reconciliar

Mantiene el comportamiento actual (muestra el estimado de `sessionStorage` al instante con su animación de conteo). Agrega un `useEffect` que reconcilia contra el backend:

- Lee `dc_purchase_id` de `sessionStorage`. Si no existe (entró directo a la URL), no poolea — comportamiento actual.
- Poolea `GET /api/cashback/purchases/<id>/impact/` cada **2s**, máximo **6 intentos** (~12s), con el patrón `cancelled`-flag (return de cleanup) que ya usa el resto del código (p. ej. HomePage).
- Cuando la respuesta trae `status === "APPROVED"` y `contribution !== null`: reemplaza el monto estimado por el real (re-dispara la animación de conteo existente), muestra `GoalProgress` con la meta real animándose hasta `percent`, y corta el pooling.
- Si la respuesta trae `goal !== null` pero todavía no hay `contribution`, puede mostrar la barra (dato de causa) mientras espera el aporte.
- Si se agotan los 6 intentos sin confirmación: deja el estimado optimista con una nota sutil ("Confirmando tu aporte…"), sin romper la pantalla.

### Mensaje narrativo

Usa el `title` de la meta: *"¡Gracias! Tu compra sumó **$75** a **camisetas nuevas** del Club Deportivo Barrial"* — con `contribution` + `goal.title` + `cause_title`.

### Detalle de causa / Mi Impacto

Renderiza `GoalProgress` leyendo `active_goal` del payload de causa. Si es `null`, no muestra barra.

**Sin push ni email** (in-app only). Degradación: causa sin meta → `active_goal`/`goal` null → no se muestra barra, cae al texto de aporte actual.

---

## Sección 4 — Edge cases y testing

### Edge cases contemplados

| Caso | Comportamiento |
|---|---|
| Causa sin meta activa | `goal`/`active_goal` = `null` → no se muestra barra; cae al texto de aporte actual |
| Webhook no llega / demora | Pooling se agota a ~12s; queda el estimado + nota "Confirmando…" |
| Pago rechazado (`status=REJECTED`) | No se muestra aporte |
| Meta superada (`current > target`) | `percent` capeado a 100 en backend; barra 100% + "¡Meta cumplida! 🎉" |
| Doble conteo entre las 2 rutas de cashback | Imposible: progreso se calcula sumando, no incrementando |
| Entrar directo a `/app/pago-exitoso` sin `dc_purchase_id` | No poolea; comportamiento actual |
| `target_amount = 0` | `percent` devuelve 0 (guard de división) |

### Testing

**Backend (pytest, contra Postgres dockerizado):**
- `Goal.current_amount`: suma correcta de cashback de la causa; acotada por `starts_at` (cashback anterior no cuenta); causa sin cashback → 0.
- `Goal.percent`: cálculo correcto; capeo a 100 si supera; 0 si `target_amount = 0`.
- `active_goal_for`: devuelve la meta activa más reciente; `None` si no hay activa.
- Endpoint `impact/`: dueño ve su compra; `contribution` null antes del cashback y con valor después; `status` correcto; shape del `goal` (o null sin meta); un usuario NO ve la compra de otro (scoping).
- Serializer de causa: `active_goal` presente con meta / null sin meta.

**Frontend (vitest + testing-library, mock del endpoint, sin red real):**
- `GoalProgress`: renderiza título/montos/porcentaje; capeo visual a 100 + mensaje de meta cumplida; no rompe con datos null.
- `PagoExitoso`: muestra estimado al instante; tras mock de `impact` con `APPROVED`+`contribution`, swap al monto real + barra; `goal` null → sin barra; timeout (mock que nunca confirma) → deja estimado + nota.

### Migración

`Goal` es tabla nueva (`CREATE TABLE` puro) — cero riesgo sobre datos existentes. Registrar en `cashback/admin.py`.

---

## Fuera de alcance (diferido explícitamente)

- Jerarquía de beneficiario (Atleta / Club / Federación / Municipio) y geo → Pilares 0/2, post-piloto.
- Metas por deportista o múltiples metas simultáneas por causa → el `starts_at` deja la puerta abierta, pero no se construye ahora.
- Gestión de metas por el club (self-service) → admin-only en el piloto.
- Push / email / PWA → trabajo de notificaciones futuro.
- Split multi-receptor (Pilar 4) y propina tipo PedidosYa → Fase 2 (MP Marketplace).
