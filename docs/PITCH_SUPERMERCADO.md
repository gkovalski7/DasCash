# Pitch — Piloto con supermercado de barrio

**Fecha:** 2026-06-12
**Contexto:** primer comercio piloto. Dueño conocido (supermercado chino), relación de confianza. Objetivo: que acepte una prueba de 1-2 meses sin costo.

---

## Preparación antes de la charla

- [ ] App funcionando en el teléfono para demo en vivo (escanear QR → pagar $100 de prueba → mostrar "Mi Impacto"). La demo de 60 segundos vende más que el discurso.
- [ ] Elegir de antemano 1-2 causas del barrio que le toquen de cerca a él o a su clientela (club, escuela). Que el ejemplo no sea abstracto.
- [ ] **Prerequisito técnico:** hosting público (el QR impreso debe apuntar a una URL pública, hoy es localhost).

---

## Apertura (el gancho)

> "Che, te quiero mostrar algo que estoy armando y quiero que seas el primero en probarlo. Es una app de pagos, pero con una vuelta: cada vez que un cliente te paga con el QR de la app, un porcentajito de esa compra va como donación a una causa del barrio — el club donde juegan los pibes, la escuela, lo que el cliente elija. **Al cliente no le cuesta nada extra, y a vos te convierte en el súper del barrio que banca al club del barrio.**"

## Cómo funciona (simple, sin tecnicismos)

> "Para vos es casi igual que ahora: el cliente escanea un QR y te paga con Mercado Pago, como ya hacen todos los días. La plata de la venta te llega completa, igual que siempre. La diferencia es que la app registra la compra y calcula un porcentaje — digamos un 3 o 5%, lo definimos juntos — que figura como donación a la causa que eligió el cliente. Vos no tenés que aprender ningún sistema nuevo ni cambiar la caja."

## Qué gana él (el corazón de la venta)

> "Pensalo así: vos ya competís con el otro chino a dos cuadras y con el Carrefour Express. Los precios son parecidos, los productos son los mismos. **¿Por qué un vecino va a elegir tu local? Porque comprándote a vos, el club de su hijo recibe plata todos los meses sin que él ponga un peso extra.** Eso el Carrefour no lo tiene.
>
> Y hay otra cosa: el club, la escuela, la ONG — ellos mismos le van a decir a su gente 'compren en lo de [nombre], que nos ayuda'. Te traen clientes que hoy no te conocen. Es publicidad que trabaja sola, y encima quedás como el comercio que apoya al barrio. Ese porcentaje no es un descuento perdido: es lo que hoy gastarías en marketing, pero rindiendo el doble."

## La propuesta concreta (sin riesgo)

> "Lo que te propongo es una prueba: un mes o dos, sin costo, sin contrato, sin compromiso. Yo te configuro todo, te pongo el cartelito con el QR en la caja, elegimos juntos una o dos causas del barrio que tengan onda con tu clientela, y vemos qué pasa. Si no te suma, lo sacamos y listo, quedamos como siempre. Si funciona, vos vas a ser el primer comercio de la red — y los que entran primero siempre quedan mejor parados."

## Manejo de objeciones

| Si dice... | Responder... |
|---|---|
| "¿Y cuánto me sale?" | "La prueba, nada. Cero. Solo el porcentaje de cashback de las ventas que entren *por la app* — si nadie usa la app, no pagás nada. Es riesgo cero." |
| "El 5% es mucho" | "Lo definimos juntos, puede ser 3%. Y es solo sobre las compras que vienen por la app, no sobre toda tu venta. Compará: una promo bancaria te come 10-20% y no te deja ningún cliente fiel." |
| "Mis clientes no usan apps" | "Usan Mercado Pago todos los días en tu caja — esto es lo mismo, un QR. Y justamente para eso es la prueba: lo medimos con números reales, no con suposiciones." |
| "¿Quién garantiza que la plata llega a la causa?" | "Todo queda registrado y transparente en la app, y el cliente lo ve en tiempo real. Vos mismo vas a ver el reporte de cuánto generaste para el club — eso también lo podés mostrar en el local." |
| "Déjame pensarlo" | "Dale, obvio. Pero mirá — *(demo en vivo)* — esto ya funciona hoy. Te dejo pensarlo y la semana que viene paso y lo armamos en 20 minutos." |

## Cierre

> "Yo te lo ofrezco a vos primero porque te tengo confianza y porque tu local es perfecto para esto: compra cotidiana, gente del barrio, todos los días. ¿Te animás a probarlo un mes?"

---

## ⚠️ Honestidad comercial — estado real del producto (Fase 1)

Hoy el pago le llega **100% al comerciante** y la donación queda registrada en la plataforma pero **no se transfiere automáticamente** a la causa (eso es Fase 2, MP Marketplace con split 95/5).

**No prometer transferencia automática.** Decir: "durante el piloto, la liquidación a la causa la gestiono yo manualmente". Queda cubierto y es verdad.

## Experiencia del cliente en la caja (ya verificado en código)

1. Cliente escanea el QR impreso con la cámara nativa del celular (iOS/Android, sin instalar nada).
2. Aparece el banner del link → tap → se abre el navegador en `/app/pagar/<slug>` del comercio.
3. Si no tiene sesión: login (o registro de 30 segundos) y **vuelve directo a la pantalla de pago** (fix `b38981a` — el state.from se conserva incluso pasando por crear cuenta).
4. Paga con Mercado Pago Checkout Pro y elige la causa.
