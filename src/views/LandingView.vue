<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';

const router = useRouter();

// ─── Language ──────────────────────────────────────────────────────────────────
const lang = ref('es');
const LANGS = ['es', 'ca', 'en'];

// ─── Scroll-based nav opacity ──────────────────────────────────────────────────
const scrolled = ref(false);
function onScroll() { scrolled.value = window.scrollY > 40; }
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));

// ─── QR Code ──────────────────────────────────────────────────────────────────
const DEMO_URL = `${window.location.origin}/?hotel=demo`;
const qrDataUrl = ref('');

onMounted(async () => {
  try {
    qrDataUrl.value = await QRCode.toDataURL(DEMO_URL, {
      width: 200, margin: 1,
      color: { dark: '#292524', light: '#fdfcfb' },
    });
  } catch { /* ignore */ }

  // Scroll-reveal
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
    }),
    { threshold: 0.08 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
});

// ─── Translations ──────────────────────────────────────────────────────────────
const T = {
  es: {
    nav: { cta: 'Solicitar demo' },
    hero: {
      eyebrow: 'Conserje virtual para hoteles boutique',
      h1a: 'Tu hotel.',
      h1b: 'En el idioma de cada huésped.',
      sub: 'Consergi responde las preguntas de tus huéspedes al instante, genera itinerarios personalizados y funciona en 10 idiomas. Sin descargas. Sin integraciones. Listo en 15 minutos.',
      cta1: 'Ver demo en vivo',
      cta2: 'Empezar gratis',
      qrLabel: 'Escanea para probarlo ahora',
    },
    trust: 'Diseñado para hoteles boutique independientes',
    problem: {
      eyebrow: 'El problema',
      h2: 'Tus huéspedes hablan 15 idiomas. Tu equipo, 2.',
      cards: [
        { icon: '🌍', t: 'Barreras de idioma', d: 'El 40% de tus huéspedes no habla español. Las preguntas se pierden en traducciones torpes. La experiencia también.' },
        { icon: '🔁', t: 'Las mismas 20 preguntas', d: '¿WiFi? ¿Desayuno? ¿Check-out? Tu equipo responde lo mismo 30 veces al día, en lugar de crear momentos memorables.' },
        { icon: '💎', t: 'Experiencias perdidas', d: 'Tus huéspedes se van sin conocer el restaurante de tu socio, el tour exclusivo o los descuentos que podrías ofrecerles.' },
      ],
    },
    features: {
      eyebrow: 'Funcionalidades',
      h2: 'Todo lo que necesita un hotel boutique moderno',
      items: [
        { icon: '💬', t: 'Chatbot 24/7', d: 'Responde preguntas sobre WiFi, desayuno, check-out, instalaciones y más al instante.' },
        { icon: '🌐', t: '10 idiomas', d: 'ES · EN · FR · DE · IT · PT · CA · RU · ZH · JA — sin configuración adicional.' },
        { icon: '🗺️', t: 'Itinerarios con IA', d: 'Planes personalizados según el grupo, días disponibles, estilo y presupuesto.' },
        { icon: '🤝', t: 'Socios y descuentos', d: 'Muestra restaurantes y experiencias locales con descuentos exclusivos para tus huéspedes.' },
        { icon: '📊', t: 'Analítica', d: 'Saber qué preguntan tus huéspedes, qué idiomas usan y qué experiencias les interesan más.' },
        { icon: '⚡', t: 'Sin fricciones', d: 'Los huéspedes acceden con un QR. Sin descargas, sin registro, sin complicaciones.' },
      ],
    },
    how: {
      eyebrow: 'Cómo funciona',
      h2: 'De cero a listo en 15 minutos',
      steps: [
        { n: '01', t: 'Configura tu hotel', d: 'Añade la información de tu hotel, preguntas frecuentes y socios locales desde el panel de administración.' },
        { n: '02', t: 'Pon el QR en recepción', d: 'Imprime el código QR y colócalo en recepción, en la habitación o en tu email de bienvenida.' },
        { n: '03', t: 'Tus huéspedes lo usan', d: 'Escanean el QR y acceden al conserje en su propio idioma. Sin descargas, sin cuentas.' },
      ],
    },
    demo: {
      eyebrow: 'Demo en vivo',
      h2: 'Pruébalo ahora mismo',
      sub: 'Escanea el QR o haz clic en el enlace para ver Consergi funcionando con un hotel de ejemplo real.',
      link: 'Abrir demo en el navegador →',
    },
    pricing: {
      eyebrow: 'Precios',
      h2: 'Sencillo y transparente',
      sub: 'Empieza gratis. Sin tarjeta de crédito.',
      trial: '30 días gratis en cualquier plan · Sin tarjeta de crédito · Cancela cuando quieras',
      plans: [
        { name: 'Starter', price: '€49', per: '/mes', desc: 'Para hoteles que empiezan', features: ['1 hotel', 'Chatbot + 10 idiomas', 'Itinerarios con IA', 'Soporte por email'], cta: 'Empezar gratis', highlight: false },
        { name: 'Growth', price: '€99', per: '/mes', desc: 'Para hoteles que quieren crecer', features: ['1 hotel', 'Todo en Starter', 'Panel de analítica', 'Portal de socios', 'Marca personalizada', 'Soporte prioritario'], cta: 'Empezar gratis', highlight: true },
      ],
    },
    cta: {
      h2: '¿Listo para transformar la experiencia de tus huéspedes?',
      sub: 'Únete a los primeros hoteles boutique que ya usan Consergi.',
      btn: 'Solicitar acceso gratuito',
    },
    footer: { tagline: 'El conserje virtual para hoteles boutique.', contact: 'agustin@consergi.com', demo: 'Demo', admin: 'Panel Admin', onboard: 'Solicitar acceso' },
    chat: {
      greeting: '¡Hola! ¿En qué puedo ayudarte hoy?',
      q: '¿Cuál es la contraseña del WiFi?',
      a: 'Red: HotelMirlo\nClave: MIRLO2024 🔑\n¿Algo más en lo que pueda ayudarte?',
    },
  },
  ca: {
    nav: { cta: 'Sol·licitar demo' },
    hero: {
      eyebrow: 'Concierge virtual per a hotels boutique',
      h1a: 'El teu hotel.',
      h1b: "En l'idioma de cada hoste.",
      sub: "Consergi respon les preguntes dels teus hostes a l'instant, genera itineraris personalitzats i funciona en 10 idiomes. Sense descàrregues. Sense integracions. Llest en 15 minuts.",
      cta1: 'Veure demo en viu',
      cta2: 'Començar gratis',
      qrLabel: 'Escaneja per provar-ho ara',
    },
    trust: "Dissenyat per a hotels boutique independents",
    problem: {
      eyebrow: 'El problema',
      h2: "Els teus hostes parlen 15 idiomes. El teu equip, 2.",
      cards: [
        { icon: '🌍', t: "Barreres d'idioma", d: "El 40% dels teus hostes no parla català ni castellà. Les preguntes es perden en traduccions pobres. L'experiència també." },
        { icon: '🔁', t: 'Les mateixes 20 preguntes', d: "WiFi? Desdejuni? Check-out? El teu equip respon el mateix 30 vegades al dia, en lloc de crear moments memorables." },
        { icon: '💎', t: 'Experiències perdudes', d: "Els teus hostes marxen sense conèixer el restaurant del teu soci, el tour exclusiu o els descomptes que podries oferir-los." },
      ],
    },
    features: {
      eyebrow: 'Funcionalitats',
      h2: 'Tot el que necessita un hotel boutique modern',
      items: [
        { icon: '💬', t: 'Chatbot 24/7', d: "Respon preguntes sobre WiFi, desdejuni, check-out, instal·lacions i més a l'instant." },
        { icon: '🌐', t: '10 idiomes', d: "ES · EN · FR · DE · IT · PT · CA · RU · ZH · JA — sense configuració addicional." },
        { icon: '🗺️', t: 'Itineraris amb IA', d: "Plans personalitzats segons el grup, dies disponibles, estil i pressupost." },
        { icon: '🤝', t: 'Socis i descomptes', d: "Mostra restaurants i experiències locals amb descomptes exclusius per als teus hostes." },
        { icon: '📊', t: 'Analítica', d: "Saber què pregunten els teus hostes, quins idiomes fan servir i quines experiències els interessen més." },
        { icon: '⚡', t: 'Sense friccions', d: "Els hostes accedeixen amb un QR. Sense descàrregues, sense registre, sense complicacions." },
      ],
    },
    how: {
      eyebrow: 'Com funciona',
      h2: 'De zero a llest en 15 minuts',
      steps: [
        { n: '01', t: 'Configura el teu hotel', d: "Afegeix la informació del teu hotel, preguntes freqüents i socis locals des del panell d'administració." },
        { n: '02', t: "Posa el QR a recepció", d: "Imprimeix el codi QR i col·loca'l a recepció, a l'habitació o al teu correu de benvinguda." },
        { n: '03', t: "Els teus hostes l'usen", d: "Escanegen el QR i accedeixen al concierge en el seu propi idioma. Sense descàrregues, sense comptes." },
      ],
    },
    demo: {
      eyebrow: 'Demo en viu',
      h2: 'Prova-ho ara mateix',
      sub: "Escaneja el QR o fes clic a l'enllaç per veure Consergi funcionant amb un hotel d'exemple real.",
      link: 'Obrir demo al navegador →',
    },
    pricing: {
      eyebrow: 'Preus',
      h2: 'Senzill i transparent',
      sub: 'Comença gratis. Sense targeta de crèdit.',
      trial: '30 dies gratis en qualsevol pla · Sense targeta de crèdit · Cancel·la quan vulguis',
      plans: [
        { name: 'Starter', price: '€49', per: '/mes', desc: 'Per a hotels que comencen', features: ['1 hotel', 'Chatbot + 10 idiomes', 'Itineraris amb IA', 'Suport per email'], cta: 'Començar gratis', highlight: false },
        { name: 'Growth', price: '€99', per: '/mes', desc: 'Per a hotels que volen créixer', features: ['1 hotel', 'Tot a Starter', "Panell d'analítica", 'Portal de socis', 'Marca personalitzada', 'Suport prioritari'], cta: 'Començar gratis', highlight: true },
      ],
    },
    cta: {
      h2: "Llest per transformar l'experiència dels teus hostes?",
      sub: "Uneix-te als primers hotels boutique que ja fan servir Consergi.",
      btn: 'Sol·licitar accés gratuït',
    },
    footer: { tagline: 'El concierge virtual per a hotels boutique.', contact: 'agustin@consergi.com', demo: 'Demo', admin: 'Panell Admin', onboard: 'Sol·licitar accés' },
    chat: {
      greeting: 'Hola! En què puc ajudar-te avui?',
      q: 'Quina és la contrasenya del WiFi?',
      a: 'Xarxa: HotelMirlo\nClau: MIRLO2024 🔑\nEn què més puc ajudar-te?',
    },
  },
  en: {
    nav: { cta: 'Request demo' },
    hero: {
      eyebrow: 'AI concierge for boutique hotels',
      h1a: 'Your hotel.',
      h1b: "In every guest's language.",
      sub: "Consergi answers guest questions instantly, generates personalized city itineraries, and works in 10 languages. No downloads. No integrations. Ready in 15 minutes.",
      cta1: 'See live demo',
      cta2: 'Start for free',
      qrLabel: 'Scan to try it now',
    },
    trust: 'Built for independent boutique hotels',
    problem: {
      eyebrow: 'The problem',
      h2: 'Your guests speak 15 languages. Your team speaks 2.',
      cards: [
        { icon: '🌍', t: 'Language barriers', d: "40% of your guests don't speak Spanish. Questions get lost in awkward translations. So does the experience." },
        { icon: '🔁', t: 'The same 20 questions', d: 'WiFi? Breakfast? Checkout? Your team answers the same questions 30 times a day instead of creating memorable moments.' },
        { icon: '💎', t: 'Missed experiences', d: "Guests leave without knowing about your partner restaurant, the exclusive tour, or the discounts you could offer them." },
      ],
    },
    features: {
      eyebrow: 'Features',
      h2: 'Everything a modern boutique hotel needs',
      items: [
        { icon: '💬', t: '24/7 Chatbot', d: 'Instant answers about WiFi, breakfast, checkout, facilities and more.' },
        { icon: '🌐', t: '10 languages', d: 'ES · EN · FR · DE · IT · PT · CA · RU · ZH · JA — with no extra configuration.' },
        { icon: '🗺️', t: 'AI Itineraries', d: 'Personalized plans based on group size, available days, style and budget.' },
        { icon: '🤝', t: 'Partners & discounts', d: 'Showcase local restaurants and experiences with exclusive guest discounts.' },
        { icon: '📊', t: 'Analytics', d: "Know what guests ask, what languages they speak, and what they're most interested in." },
        { icon: '⚡', t: 'Zero friction', d: 'Guests access via QR code. No downloads, no signup, no hassle.' },
      ],
    },
    how: {
      eyebrow: 'How it works',
      h2: 'From zero to live in 15 minutes',
      steps: [
        { n: '01', t: 'Configure your hotel', d: 'Add your hotel info, FAQs and local partners from the admin panel.' },
        { n: '02', t: 'Place the QR at reception', d: 'Print the QR code and place it at reception, in rooms, or in your welcome email.' },
        { n: '03', t: 'Guests use it', d: 'They scan the QR and access the concierge in their own language. No downloads, no accounts.' },
      ],
    },
    demo: {
      eyebrow: 'Live demo',
      h2: 'Try it right now',
      sub: 'Scan the QR or click the link to see Consergi working with a real sample hotel.',
      link: 'Open demo in browser →',
    },
    pricing: {
      eyebrow: 'Pricing',
      h2: 'Simple and transparent',
      sub: 'Start free. No credit card needed.',
      trial: '30 days free on any plan · No credit card · Cancel anytime',
      plans: [
        { name: 'Starter', price: '€49', per: '/mo', desc: 'For hotels getting started', features: ['1 hotel', 'Chatbot + 10 languages', 'AI itineraries', 'Email support'], cta: 'Start for free', highlight: false },
        { name: 'Growth', price: '€99', per: '/mo', desc: 'For hotels that want to grow', features: ['1 hotel', 'Everything in Starter', 'Analytics dashboard', 'Partners portal', 'Custom branding', 'Priority support'], cta: 'Start for free', highlight: true },
      ],
    },
    cta: {
      h2: 'Ready to transform your guest experience?',
      sub: 'Join the first boutique hotels already using Consergi.',
      btn: 'Request free access',
    },
    footer: { tagline: 'The AI concierge for boutique hotels.', contact: 'agustin@consergi.com', demo: 'Demo', admin: 'Admin Panel', onboard: 'Request access' },
    chat: {
      greeting: 'Hello! How can I help you today?',
      q: "What's the WiFi password?",
      a: 'Network: HotelMirlo\nPassword: MIRLO2024 🔑\nAnything else I can help with?',
    },
  },
};

const t = computed(() => T[lang.value]);
</script>

<template>
  <div class="landing-page">

    <!-- ═══ NAV ════════════════════════════════════════════════════════════════ -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      :class="scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-stone-100' : 'bg-transparent'"
    >
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <span class="font-serif italic text-2xl text-stone-800 tracking-tight">Consergi</span>

        <!-- Right side: lang toggle + CTA -->
        <div class="flex items-center gap-3">
          <!-- Language toggle -->
          <div class="flex items-center bg-white/60 backdrop-blur-sm border border-stone-200/80 rounded-full p-1 gap-0.5">
            <button
              v-for="l in LANGS" :key="l"
              @click="lang = l"
              class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
              :class="lang === l ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'"
            >{{ l }}</button>
          </div>

          <!-- CTA -->
          <button
            @click="router.push('/onboard')"
            class="hidden sm:block px-5 py-2 bg-stone-800 text-white rounded-full text-sm font-bold tracking-wide hover:bg-stone-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >{{ t.nav.cta }}</button>
        </div>
      </div>
    </nav>

    <!-- ═══ HERO ═══════════════════════════════════════════════════════════════ -->
    <section class="hero-section min-h-screen flex items-center pt-20 pb-16 px-6">
      <div class="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        <!-- Left: copy -->
        <div class="hero-copy space-y-6">
          <p class="eyebrow">{{ t.hero.eyebrow }}</p>

          <h1 class="font-serif italic text-stone-800 leading-[1.1] text-5xl sm:text-6xl lg:text-7xl">
            <span class="block">{{ t.hero.h1a }}</span>
            <span class="block text-gradient">{{ t.hero.h1b }}</span>
          </h1>

          <p class="text-stone-500 text-lg leading-relaxed max-w-lg">{{ t.hero.sub }}</p>

          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              :href="DEMO_URL"
              class="inline-flex items-center justify-center px-7 py-4 bg-stone-800 text-white rounded-2xl text-base font-bold tracking-wide hover:bg-stone-700 transition-all shadow-xl hover:shadow-2xl active:scale-95"
            >{{ t.hero.cta1 }}</a>
            <button
              @click="router.push('/onboard')"
              class="inline-flex items-center justify-center px-7 py-4 bg-white/60 backdrop-blur-sm border border-white text-stone-700 rounded-2xl text-base font-bold tracking-wide hover:bg-white hover:shadow-lg transition-all active:scale-95"
            >{{ t.hero.cta2 }}</button>
          </div>
        </div>

        <!-- Right: phone mockup -->
        <div class="flex justify-center lg:justify-end">
          <div class="phone-frame">
            <div class="phone-notch"></div>
            <div class="phone-screen">
              <!-- Chat header -->
              <div class="chat-header">
                <div class="chat-avatar">C</div>
                <div>
                  <div class="chat-name">Consergi</div>
                  <div class="chat-status">
                    <span class="status-dot"></span>
                    <span>Hotel Mirlo Boutique</span>
                  </div>
                </div>
              </div>

              <!-- Messages -->
              <div class="chat-body">
                <!-- Bot greeting -->
                <div class="msg-row bot">
                  <div class="msg bot-msg">{{ t.chat.greeting }}</div>
                </div>

                <!-- Language chips -->
                <div class="lang-chips">
                  <span class="chip active-chip">ES</span>
                  <span class="chip">EN</span>
                  <span class="chip">FR</span>
                  <span class="chip">DE</span>
                  <span class="chip">+6</span>
                </div>

                <!-- User question -->
                <div class="msg-row user">
                  <div class="msg user-msg">{{ t.chat.q }}</div>
                </div>

                <!-- Bot answer -->
                <div class="msg-row bot">
                  <div class="msg bot-msg whitespace-pre-line">{{ t.chat.a }}</div>
                </div>

                <!-- Typing dots (decorative) -->
                <div class="msg-row bot">
                  <div class="msg typing-msg">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>
              </div>

              <!-- QR + label at bottom -->
              <div class="phone-footer">
                <p class="qr-label">{{ t.hero.qrLabel }}</p>
                <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Demo" class="qr-mini" />
                <div v-else class="qr-mini qr-placeholder"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ TRUST STRIP ═══════════════════════════════════════════════════════ -->
    <div class="trust-strip reveal">
      <div class="trust-inner">
        <span class="trust-diamond">✦</span>
        <span class="trust-text">{{ t.trust }}</span>
        <span class="trust-diamond">✦</span>
      </div>
    </div>

    <!-- ═══ PROBLEM ════════════════════════════════════════════════════════════ -->
    <section class="section reveal">
      <div class="section-inner">
        <div class="section-header">
          <p class="eyebrow">{{ t.problem.eyebrow }}</p>
          <h2 class="section-title">{{ t.problem.h2 }}</h2>
        </div>
        <div class="cards-grid">
          <div
            v-for="(card, i) in t.problem.cards" :key="i"
            class="glass-card reveal"
            :style="`animation-delay: ${i * 0.1}s`"
          >
            <span class="card-icon">{{ card.icon }}</span>
            <h3 class="card-title">{{ card.t }}</h3>
            <p class="card-desc">{{ card.d }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ FEATURES ══════════════════════════════════════════════════════════ -->
    <section class="section reveal">
      <div class="section-inner">
        <div class="section-header">
          <p class="eyebrow">{{ t.features.eyebrow }}</p>
          <h2 class="section-title">{{ t.features.h2 }}</h2>
        </div>
        <div class="features-grid">
          <div
            v-for="(f, i) in t.features.items" :key="i"
            class="feature-card reveal"
            :style="`animation-delay: ${i * 0.07}s`"
          >
            <span class="feature-icon">{{ f.icon }}</span>
            <h3 class="feature-title">{{ f.t }}</h3>
            <p class="feature-desc">{{ f.d }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ HOW IT WORKS ══════════════════════════════════════════════════════ -->
    <section class="section how-section reveal">
      <div class="section-inner">
        <div class="section-header">
          <p class="eyebrow">{{ t.how.eyebrow }}</p>
          <h2 class="section-title">{{ t.how.h2 }}</h2>
        </div>
        <div class="steps-grid">
          <div
            v-for="(step, i) in t.how.steps" :key="i"
            class="step-card reveal"
            :style="`animation-delay: ${i * 0.12}s`"
          >
            <span class="step-num">{{ step.n }}</span>
            <h3 class="step-title">{{ step.t }}</h3>
            <p class="step-desc">{{ step.d }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ DEMO ═══════════════════════════════════════════════════════════════ -->
    <section class="demo-section reveal">
      <div class="section-inner">
        <div class="demo-card">
          <div class="demo-copy">
            <p class="eyebrow">{{ t.demo.eyebrow }}</p>
            <h2 class="demo-title">{{ t.demo.h2 }}</h2>
            <p class="demo-sub">{{ t.demo.sub }}</p>
            <a :href="DEMO_URL" class="demo-link">{{ t.demo.link }}</a>
          </div>
          <div class="demo-qr">
            <div class="qr-card">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Demo" class="qr-img" />
              <div v-else class="qr-img qr-placeholder-large"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ PRICING ════════════════════════════════════════════════════════════ -->
    <section class="section reveal">
      <div class="section-inner">
        <div class="section-header">
          <p class="eyebrow">{{ t.pricing.eyebrow }}</p>
          <h2 class="section-title">{{ t.pricing.h2 }}</h2>
          <p class="section-sub">{{ t.pricing.sub }}</p>
        </div>
        <div class="pricing-grid">
          <div
            v-for="(plan, i) in t.pricing.plans" :key="i"
            class="pricing-card reveal"
            :class="plan.highlight ? 'pricing-highlight' : 'pricing-base'"
            :style="`animation-delay: ${i * 0.1}s`"
          >
            <div class="plan-header">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <p class="plan-desc" :class="plan.highlight ? 'text-stone-300' : 'text-stone-400'">{{ plan.desc }}</p>
            </div>
            <div class="plan-price">
              <span class="price-amount">{{ plan.price }}</span>
              <span class="price-per" :class="plan.highlight ? 'text-stone-300' : 'text-stone-400'">{{ plan.per }}</span>
            </div>
            <ul class="plan-features">
              <li v-for="(feat, j) in plan.features" :key="j" class="plan-feat">
                <svg class="feat-check" :class="plan.highlight ? 'text-amber-400' : 'text-stone-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {{ feat }}
              </li>
            </ul>
            <button
              @click="router.push('/onboard')"
              class="plan-cta"
              :class="plan.highlight ? 'plan-cta-highlight' : 'plan-cta-base'"
            >{{ plan.cta }}</button>
          </div>
        </div>
        <p class="trial-note reveal">{{ t.pricing.trial }}</p>
      </div>
    </section>

    <!-- ═══ FOOTER CTA ════════════════════════════════════════════════════════ -->
    <section class="footer-cta-section reveal">
      <div class="section-inner text-center">
        <h2 class="footer-cta-title">{{ t.cta.h2 }}</h2>
        <p class="footer-cta-sub">{{ t.cta.sub }}</p>
        <button
          @click="router.push('/onboard')"
          class="footer-cta-btn"
        >{{ t.cta.btn }}</button>
      </div>
    </section>

    <!-- ═══ FOOTER ════════════════════════════════════════════════════════════ -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="font-serif italic text-xl text-stone-800 tracking-tight">Consergi</span>
          <p class="footer-tagline">{{ t.footer.tagline }}</p>
        </div>
        <div class="footer-links">
          <a :href="DEMO_URL" class="footer-link">{{ t.footer.demo }}</a>
          <a href="/admin" class="footer-link">{{ t.footer.admin }}</a>
          <button @click="router.push('/onboard')" class="footer-link">{{ t.footer.onboard }}</button>
        </div>
        <div class="footer-contact">
          <a :href="`mailto:${t.footer.contact}`" class="footer-email">{{ t.footer.contact }}</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 Consergi · <a :href="`mailto:${t.footer.contact}`" class="hover:text-stone-600 transition-colors">{{ t.footer.contact }}</a></p>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* ─── Base ──────────────────────────────────────────────────────────────────── */
.landing-page {
  min-height: 100vh;
  font-family: "Plus Jakarta Sans", sans-serif;
}

/* ─── Eyebrow ─────────────────────────────────────────────────────────────── */
.eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #b45309; /* amber-700 */
}

/* ─── Gradient text ───────────────────────────────────────────────────────── */
.text-gradient {
  background: linear-gradient(135deg, #292524 0%, #78716c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
.hero-section {
  position: relative;
}
.hero-copy {
  animation: heroIn 0.8s ease both;
}
@keyframes heroIn {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─── Phone mockup ────────────────────────────────────────────────────────── */
.phone-frame {
  width: 280px;
  background: #1c1917;
  border-radius: 42px;
  padding: 12px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08),
    0 40px 80px rgba(0,0,0,0.35),
    0 8px 24px rgba(0,0,0,0.2);
  animation: phoneIn 1s 0.2s ease both;
}
@keyframes phoneIn {
  from { opacity: 0; transform: translateY(32px) rotate(-1deg); }
  to   { opacity: 1; transform: translateY(0) rotate(0deg); }
}
.phone-notch {
  width: 80px;
  height: 24px;
  background: #0c0a09;
  border-radius: 12px;
  margin: 0 auto 10px;
}
.phone-screen {
  background: #fdfcfb;
  border-radius: 32px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 12px;
  background: white;
  border-bottom: 1px solid #f5f5f4;
}
.chat-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #292524;
  color: white;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  flex-shrink: 0;
}
.chat-name {
  font-size: 13px;
  font-weight: 700;
  color: #1c1917;
  line-height: 1.2;
}
.chat-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #78716c;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
}
.chat-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 220px;
}
.msg-row { display: flex; }
.msg-row.bot { justify-content: flex-start; }
.msg-row.user { justify-content: flex-end; }
.msg {
  padding: 9px 12px;
  border-radius: 16px;
  font-size: 12px;
  line-height: 1.4;
  max-width: 85%;
}
.bot-msg {
  background: #f5f5f4;
  color: #292524;
  border-bottom-left-radius: 4px;
}
.user-msg {
  background: #292524;
  color: white;
  border-bottom-right-radius: 4px;
}
.lang-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.chip {
  padding: 2px 8px;
  border-radius: 999px;
  background: #f5f5f4;
  border: 1px solid #e7e5e4;
  font-size: 10px;
  font-weight: 700;
  color: #78716c;
  letter-spacing: 0.05em;
}
.active-chip {
  background: #292524;
  color: white;
  border-color: #292524;
}

/* Typing indicator */
.typing-msg {
  background: #f5f5f4;
  border-bottom-left-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a8a29e;
  animation: bounce 1.2s infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
}

/* Phone footer (QR) */
.phone-footer {
  padding: 10px 14px 14px;
  border-top: 1px solid #f5f5f4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}
.qr-label {
  font-size: 9px;
  color: #a8a29e;
  font-weight: 600;
  letter-spacing: 0.03em;
  max-width: 100px;
  line-height: 1.3;
}
.qr-mini {
  width: 52px;
  height: 52px;
  border-radius: 8px;
}
.qr-placeholder {
  background: #f5f5f4;
  border: 1px dashed #d6d3d1;
}

/* ─── Trust strip ─────────────────────────────────────────────────────────── */
.trust-strip {
  padding: 20px 24px;
  border-top: 1px solid rgba(255,255,255,0.6);
  border-bottom: 1px solid rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.3);
  backdrop-filter: blur(8px);
}
.trust-inner {
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.trust-text {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #78716c;
}
.trust-diamond {
  color: #d97706;
  font-size: 10px;
}

/* ─── Sections ────────────────────────────────────────────────────────────── */
.section {
  padding: 80px 24px;
}
.section-inner {
  max-width: 72rem;
  margin: 0 auto;
}
.section-header {
  text-align: center;
  margin-bottom: 56px;
  space-y: 3;
}
.section-title {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  color: #1c1917;
  line-height: 1.2;
  margin-top: 12px;
}
.section-sub {
  margin-top: 12px;
  color: #78716c;
  font-size: 1rem;
}

/* ─── Cards (problem) ─────────────────────────────────────────────────────── */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}
.glass-card {
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 24px;
  padding: 28px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
}
.card-icon { font-size: 2rem; display: block; margin-bottom: 14px; }
.card-title {
  font-weight: 700;
  font-size: 1.05rem;
  color: #1c1917;
  margin-bottom: 8px;
}
.card-desc {
  color: #78716c;
  font-size: 0.9rem;
  line-height: 1.6;
}

/* ─── Features grid ───────────────────────────────────────────────────────── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.feature-card {
  background: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 20px;
  padding: 24px;
  transition: all 0.2s;
}
.feature-card:hover {
  background: rgba(255,255,255,0.7);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(0,0,0,0.07);
}
.feature-icon { font-size: 1.6rem; display: block; margin-bottom: 10px; }
.feature-title { font-weight: 700; font-size: 0.95rem; color: #1c1917; margin-bottom: 6px; }
.feature-desc { color: #78716c; font-size: 0.85rem; line-height: 1.5; }

/* ─── How it works ────────────────────────────────────────────────────────── */
.how-section { background: rgba(255,255,255,0.15); }
.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  position: relative;
}
.step-card {
  position: relative;
  padding: 32px;
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 24px;
}
.step-num {
  display: block;
  font-family: 'Playfair Display', serif;
  font-size: 4rem;
  font-weight: 700;
  color: #e7e5e4;
  line-height: 1;
  margin-bottom: 8px;
}
.step-title { font-weight: 700; font-size: 1.05rem; color: #1c1917; margin-bottom: 8px; }
.step-desc { color: #78716c; font-size: 0.9rem; line-height: 1.6; }

/* ─── Demo section ────────────────────────────────────────────────────────── */
.demo-section { padding: 80px 24px; }
.demo-card {
  background: #1c1917;
  border-radius: 32px;
  padding: 56px 48px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 48px;
  align-items: center;
  box-shadow: 0 40px 80px rgba(0,0,0,0.2);
}
@media (max-width: 640px) {
  .demo-card { grid-template-columns: 1fr; padding: 36px 28px; text-align: center; }
  .demo-qr { display: flex; justify-content: center; }
}
.demo-copy { space-y: 4; }
.demo-copy .eyebrow { color: #d97706; }
.demo-title {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  color: white;
  line-height: 1.2;
  margin-top: 12px;
  margin-bottom: 16px;
}
.demo-sub { color: #a8a29e; font-size: 1rem; line-height: 1.6; margin-bottom: 24px; }
.demo-link {
  display: inline-block;
  color: #fbbf24;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  text-decoration: none;
  transition: color 0.2s;
}
.demo-link:hover { color: #fde68a; }
.qr-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 20px;
}
.qr-img {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  display: block;
}
.qr-placeholder-large {
  background: #292524;
  border: 1px dashed #44403c;
}

/* ─── Pricing ─────────────────────────────────────────────────────────────── */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 680px;
  margin: 0 auto;
}
.pricing-card {
  border-radius: 28px;
  padding: 36px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.pricing-base {
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.8);
}
.pricing-highlight {
  background: #1c1917;
  border: 1px solid #44403c;
  box-shadow: 0 24px 56px rgba(0,0,0,0.25);
}
.plan-header { display: flex; flex-direction: column; gap: 4px; }
.plan-name {
  font-weight: 800;
  font-size: 1.2rem;
  color: #1c1917;
}
.pricing-highlight .plan-name { color: white; }
.plan-desc { font-size: 0.85rem; }
.plan-price { display: flex; align-items: baseline; gap: 4px; }
.price-amount {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  font-weight: 700;
  color: #1c1917;
  line-height: 1;
}
.pricing-highlight .price-amount { color: white; }
.price-per { font-size: 0.9rem; }
.plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.plan-feat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #44403c;
}
.pricing-highlight .plan-feat { color: #d6d3d1; }
.feat-check { width: 16px; height: 16px; flex-shrink: 0; }
.plan-cta {
  margin-top: auto;
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.03em;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}
.plan-cta:active { transform: scale(0.97); }
.plan-cta-base {
  background: #1c1917;
  color: white;
}
.plan-cta-base:hover { background: #292524; }
.plan-cta-highlight {
  background: white;
  color: #1c1917;
}
.plan-cta-highlight:hover { background: #f5f5f4; }
.trial-note {
  text-align: center;
  margin-top: 28px;
  font-size: 0.8rem;
  color: #a8a29e;
  letter-spacing: 0.03em;
}

/* ─── Footer CTA ──────────────────────────────────────────────────────────── */
.footer-cta-section {
  padding: 96px 24px;
  text-align: center;
}
.footer-cta-title {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: clamp(1.8rem, 4vw, 3rem);
  color: #1c1917;
  line-height: 1.2;
  margin-bottom: 16px;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}
.footer-cta-sub {
  color: #78716c;
  font-size: 1rem;
  margin-bottom: 32px;
}
.footer-cta-btn {
  display: inline-block;
  padding: 16px 40px;
  background: #1c1917;
  color: white;
  border-radius: 24px;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.04em;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 16px 40px rgba(0,0,0,0.2);
}
.footer-cta-btn:hover { background: #292524; box-shadow: 0 20px 48px rgba(0,0,0,0.25); transform: translateY(-2px); }
.footer-cta-btn:active { transform: scale(0.97); }

/* ─── Footer ──────────────────────────────────────────────────────────────── */
.footer {
  border-top: 1px solid rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.3);
  backdrop-filter: blur(8px);
  padding: 40px 24px 24px;
}
.footer-inner {
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}
.footer-brand { display: flex; flex-direction: column; gap: 6px; }
.footer-tagline { font-size: 0.8rem; color: #a8a29e; }
.footer-links { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
.footer-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: #78716c;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
  font-family: inherit;
}
.footer-link:hover { color: #1c1917; }
.footer-email {
  font-size: 0.85rem;
  font-weight: 600;
  color: #78716c;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-email:hover { color: #1c1917; }
.footer-bottom {
  max-width: 72rem;
  margin: 0 auto;
  padding-top: 20px;
  border-top: 1px solid rgba(0,0,0,0.06);
  font-size: 0.75rem;
  color: #a8a29e;
  text-align: center;
}

/* ─── Scroll reveal ───────────────────────────────────────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}
</style>
