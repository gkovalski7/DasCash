import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import BrandCarousel from '../components/BrandCarousel'
import FeaturedCauses from '../features/causes/components/FeaturedCauses'

const impactStats = [
    { value: '800+', label: 'Marcas aliadas'      },
    { value: '4',    label: 'Causas activas'       },
    { value: '$0',   label: 'Costo para usuarios'  },
    { value: '100%', label: 'Cashback donado'       },
]

const steps = [
    {
        number: '01',
        title:  'Elegí tu causa',
        desc:   'Seleccioná el proyecto que querés apoyar: deporte, educación, salud o ambiente.',
    },
    {
        number: '02',
        title:  'Comprá donde siempre',
        desc:   'Hacé tus compras diarias en más de 800 comercios y tiendas adheridas a la red.',
    },
    {
        number: '03',
        title:  'Tu cashback va a la causa',
        desc:   'El cashback se acredita automáticamente a la causa que elegiste. Sin costo, sin fricción.',
    },
]

const audienceBlocks = [
    {
        eyebrow: 'Para usuarios',
        title:   'Comprás igual. Ayudás sin esfuerzo.',
        desc:    'Accedé a beneficios de comercios aliados y convertí cada compra en un aporte real para la causa que elegís.',
        link:    '/for-consumers',
        cta:     'Cómo funciona',
    },
    {
        eyebrow: 'Para clubes y equipos',
        title:   'Recaudá fondos sin pedir plata.',
        desc:    'Cada compra de tus socios se convierte en una donación para el club. Sin rifas, sin eventos, sin fricción.',
        link:    '/for-teams',
        cta:     'Para mi equipo',
    },
    {
        eyebrow: 'Para comercios',
        title:   'Sumá clientes que valoran el impacto.',
        desc:    'Convertite en aliado de la comunidad. Atraé nuevos clientes y fidelizá los que ya tenés con propósito.',
        link:    '/for-merchants',
        cta:     'Ser comercio aliado',
    },
]

const testimonials = [
    {
        quote:    'Recaudar fondos siempre fue un desafío. Con DasCash, nuestros socios simplemente compran y el dinero llega solo.',
        name:     'Carlos Rodríguez',
        role:     'Capitán de equipo',
        initials: 'CR',
    },
    {
        quote:    'Me encanta saber que mis compras de todos los días están ayudando a algo real. Es simple, sin complicaciones.',
        name:     'Ana Gómez',
        role:     'Usuaria DasCash',
        initials: 'AG',
    },
    {
        quote:    'Como comercio, es una forma genuina de conectarnos con la comunidad. Nuestros clientes lo valoran muchísimo.',
        name:     'Javier Fernández',
        role:     'Comercio aliado',
        initials: 'JF',
    },
]

export default function IndexPage() {
    return (
        <div className="bg-white font-body">

            {/* ── HERO ──────────────────────────────────────────── */}
            <section className="relative -mt-16 min-h-screen flex flex-col justify-center bg-[linear-gradient(150deg,#0A2236_0%,#0F2E48_60%,#0A2236_100%)] text-white overflow-hidden">
                {/* Decorative glow orbs */}
                <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-brand-blue-600/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/3 left-[-100px] w-80 h-80 rounded-full bg-brand-lime-400/5 blur-3xl pointer-events-none" />

                <div className="relative mx-auto max-w-7xl w-full px-6 sm:px-8 pt-28 pb-20">

                    {/* Eyebrow pill */}
                    <div className="inline-flex items-center gap-2.5 bg-white/[0.08] border border-white/15 rounded-full px-4 py-2 mb-8">
                        <span className="w-2 h-2 rounded-full bg-brand-lime-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-white/80 font-body">
                            Plataforma de cashback con propósito social
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="font-display font-extrabold leading-[1.05] tracking-tight text-[clamp(32px,5.5vw,64px)] max-w-3xl">
                        <span className="block text-white">Comprás como siempre.</span>
                        <span className="block text-brand-lime-400">Ayudás a la causa</span>
                        <span className="block text-white">que elegís.</span>
                    </h1>

                    <p className="mt-6 text-white/65 text-lg max-w-lg leading-relaxed font-body">
                        Cada compra en comercios aliados genera cashback que se dona automáticamente
                        a la causa social que elegís. Sin costo. Sin fricción. Con impacto real.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-4 items-center">
                        <Link to="/signup">
                            <Button variant="lime" size="lg" className="rounded-full shadow-lg">
                                Crear cuenta gratis
                            </Button>
                        </Link>
                        <Link to="/causas">
                            <Button
                                size="lg"
                                variant="ghost"
                                className="rounded-full border border-white/25 text-white hover:bg-white/10"
                            >
                                Ver causas →
                            </Button>
                        </Link>
                    </div>

                    {/* Impact stats strip */}
                    <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
                        {impactStats.map((stat) => (
                            <div key={stat.label}>
                                <div className="text-3xl font-display font-bold text-white">{stat.value}</div>
                                <div className="text-sm text-white/50 mt-1 font-body">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BRAND CAROUSEL ─────────────────────────────────── */}
            <section className="pt-10 pb-8 bg-brand-sky-50 overflow-x-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-[11px] tracking-[0.14em] uppercase text-brand-gray-500 font-semibold mb-2 font-body">
                        Comprá en tus marcas favoritas
                    </p>
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-center text-brand-navy-900 mb-6">
                        Más de 800 marcas aliadas
                    </h3>
                </div>
                <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] overflow-x-hidden">
                    <BrandCarousel speedMs={28000} />
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-4 text-center">
                    <Link to="/for-consumers"
                        className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold font-body transition-colors">
                        Ver todas las marcas →
                    </Link>
                </div>
            </section>

            {/* ── FEATURED CAUSES ─────────────────────────────────── */}
            <FeaturedCauses limit={6} title="Causas que podés apoyar" />

            {/* ── HOW IT WORKS ─────────────────────────────────────── */}
            <section className="py-20 md:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-6 sm:px-8">
                    <div className="text-center mb-16">
                        <p className="text-xs uppercase tracking-widest text-brand-blue-600 font-semibold mb-3 font-body">
                            Simple y sin costo
                        </p>
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-brand-navy-900 leading-tight">
                            ¿Cómo funciona?
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                className="relative p-8 rounded-2xl bg-brand-sky-50 border border-transparent
                                    hover:bg-white hover:border-gray-100 hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className="text-6xl font-display font-bold text-brand-blue-600/15 mb-5
                                    group-hover:text-brand-blue-600/25 transition-colors select-none">
                                    {step.number}
                                </div>
                                <h3 className="font-display text-xl font-bold text-brand-navy-900 mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-brand-gray-500 leading-relaxed text-sm font-body">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link to="/how-it-works">
                            <Button variant="secondary" size="lg" className="rounded-full">
                                Ver explicación completa
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── AUDIENCE BLOCKS — dark section ──────────────────── */}
            <section className="py-20 md:py-28 bg-brand-navy-900">
                <div className="max-w-7xl mx-auto px-6 sm:px-8">
                    <div className="text-center mb-16">
                        <p className="text-xs uppercase tracking-widest text-brand-lime-400 font-semibold mb-3 font-body">
                            Un ecosistema para todos
                        </p>
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
                            ¿Para quién es DasCash?
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {audienceBlocks.map((block, i) => (
                            <div
                                key={i}
                                className="bg-white/[0.05] border border-white/10 rounded-2xl p-8
                                    hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex flex-col group"
                            >
                                <span className="text-xs uppercase tracking-widest text-brand-lime-400 font-semibold mb-4 font-body">
                                    {block.eyebrow}
                                </span>
                                <h3 className="font-display text-xl font-bold text-white mb-4 leading-snug">
                                    {block.title}
                                </h3>
                                <p className="text-white/55 leading-relaxed text-sm flex-1 mb-6 font-body">
                                    {block.desc}
                                </p>
                                <Link
                                    to={block.link}
                                    className="inline-flex items-center gap-1.5 text-brand-lime-400 font-semibold text-sm
                                        hover:gap-3 transition-all duration-200 font-body"
                                >
                                    {block.cta} <span>→</span>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SPONSORS / INSTITUTIONS ─────────────────────────── */}
            <section className="py-20 md:py-24 bg-brand-sky-50">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-xs uppercase tracking-widest text-brand-blue-600 font-semibold mb-4 font-body">
                        Para sponsors, municipios e instituciones
                    </p>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-navy-900 mb-6 leading-snug">
                        Medí el impacto de tus alianzas.{' '}
                        <span className="text-brand-blue-600">Conectá con la comunidad que importa.</span>
                    </h2>
                    <p className="text-brand-gray-500 text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-body">
                        DasCash permite a sponsors, municipios y organizaciones gestionar campañas,
                        medir donaciones generadas y visibilizar su impacto social en tiempo real.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/for-business">
                            <Button size="lg" className="rounded-full">
                                Sumar mi organización
                            </Button>
                        </Link>
                        <Link to="/for-merchants">
                            <Button variant="secondary" size="lg" className="rounded-full">
                                Ser comercio aliado
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ─────────────────────────────────────── */}
            <section className="py-20 md:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-6 sm:px-8">
                    <div className="text-center mb-16">
                        <p className="text-xs uppercase tracking-widest text-brand-blue-600 font-semibold mb-3 font-body">
                            Comunidad
                        </p>
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-brand-navy-900 leading-tight">
                            Lo que dice nuestra comunidad
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-brand-sky-50 flex flex-col">
                                <div className="text-5xl font-display font-bold text-brand-blue-600/20 mb-3 select-none leading-none">
                                    "
                                </div>
                                <p className="text-brand-gray-700 leading-relaxed mb-8 flex-1 font-body">
                                    {t.quote}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-blue-600 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-bold font-display">{t.initials}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-brand-navy-900 text-sm font-body">{t.name}</p>
                                        <p className="text-brand-gray-500 text-xs font-body">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ─────────────────────────────────────────── */}
            <section className="py-20 bg-[linear-gradient(150deg,#0A2236_0%,#0F2E48_100%)] text-white">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
                        Empezá hoy.<br />
                        Es gratis y tarda 2 minutos.
                    </h2>
                    <p className="text-white/60 text-lg mb-10 font-body leading-relaxed">
                        Creá tu cuenta, elegí una causa y empezá a convertir tus compras
                        en impacto real para la comunidad.
                    </p>
                    <Link to="/signup">
                        <Button variant="lime" size="lg" className="rounded-full shadow-2xl px-10 text-base">
                            Crear cuenta gratis →
                        </Button>
                    </Link>
                </div>
            </section>

        </div>
    )
}
