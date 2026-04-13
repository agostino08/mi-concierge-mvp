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
const DEMO_URL = 'https://consergi.com/welcome?hotel=hotel-nova-gracia';
const qrDataUrl = ref('');

// ─── WhatsApp ──────────────────────────────────────────────────────────────────
// ↓ Replace XXXXXXXXXX with your number without + (e.g. 34612345678)
const WHATSAPP_NUMBER = '34667310019';
const waMessages = { es: 'Hola, me interesa Consergi para mi hotel', ca: "Hola, m'interessa Consergi per al meu hotel", en: 'Hi, I\'m interested in Consergi for my hotel' };
const whatsappUrl = computed(() => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessages[lang.value])}`);

// ─── Contact modal ─────────────────────────────────────────────────────────────
const showModal = ref(false);
const contactForm = ref({ name: '', hotel: '', email: '', phone: '' });
const formStatus = ref('idle'); // idle | sending | success | error

function openModal() { showModal.value = true; document.body.style.overflow = 'hidden'; }
function closeModal() { showModal.value = false; formStatus.value = 'idle'; contactForm.value = { name: '', hotel: '', email: '', phone: '' }; document.body.style.overflow = ''; }

async function submitForm() {
  formStatus.value = 'sending';
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...contactForm.value, lang: lang.value }),
    });
    formStatus.value = res.ok ? 'success' : 'error';
  } catch {
    formStatus.value = 'error';
  }
}

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
      sub: 'Consergi libera a tu equipo de las preguntas repetitivas, crea itinerarios con IA para cada huésped y convierte visitas en ingresos reales a través de socios locales. Sin descargas. Sin integraciones. Listo en 15 minutos.',
      cta1: 'Ver demo en vivo',
      cta2: 'Agenda tu demo',
      whatsapp: 'O escríbenos por WhatsApp',
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
    roi: {
      eyebrow: 'El impacto real',
      h2: 'Lo que cambia en tu hotel desde el primer día',
      stats: [
        {
          stat: '+2h',
          label: 'ahorradas al día en recepción',
          desc: 'WiFi, check-out, desayuno... tu equipo responde las mismas preguntas más de 30 veces al día. Consergi las resuelve al instante, en el idioma del huésped, sin que nadie tenga que intervenir.',
        },
        {
          stat: '+€800/mes',
          label: 'en ingresos que antes no existían',
          desc: 'Si el 10% de tus huéspedes visita un socio y gasta €40 de media, un hotel de 30 habitaciones genera más de €800 al mes en ventas nuevas. Restaurantes, tours, upgrades — sin comisión para nosotros.',
        },
        {
          stat: '3×',
          label: 'más conocimiento de tus huéspedes',
          desc: '¿Familias, parejas o viajeros solos? Descubre quién te visita, qué idiomas hablan y qué quieren hacer. Diseña paquetes y ofertas que de verdad se venden.',
        },
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
    reviews: {
      eyebrow: 'Hoteles que ya lo usan',
      h2: 'Lo que dicen nuestros clientes',
      items: [
        { quote: 'Antes pasábamos más de dos horas al día respondiendo las mismas preguntas con el traductor. Ahora los huéspedes lo resuelven solos en su idioma y la recepción puede crear experiencias de verdad. Las valoraciones en Booking subieron en menos de un mes.', name: 'Laura M.', role: 'Directora', location: 'Hotel rural boutique · Girona' },
        { quote: 'Ver a un grupo de turistas japoneses manejando el chatbot solos fue increíble. Jamás podríamos haberlos atendido así antes. Lo tuvimos funcionando en menos de una hora, y la puntuación media en Google subió medio punto.', name: 'Javier C.', role: 'Propietario', location: 'Finca boutique · Mallorca' },
        { quote: 'Los huéspedes llegan ya sabiendo el WiFi, el check-out y qué ver. Las interrupciones en recepción bajaron más de un 60%. Y los socios que recomendamos generan ingresos extra sin ningún esfuerzo por nuestra parte.', name: 'Ana S.', role: 'Recepcionista', location: 'Casa boutique · Granada' },
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
        { name: 'Starter', price: '€49', per: '/mes', desc: 'Para hoteles que empiezan', features: ['1 hotel', 'Chatbot + 10 idiomas', 'Itinerarios con IA', 'Soporte por email'], cta: 'Habla con nosotros', highlight: false },
        { name: 'Growth', price: '€99', per: '/mes', desc: 'Para hoteles que quieren crecer', features: ['1 hotel', 'Todo en Starter', 'Panel de analítica', 'Portal de socios', 'Marca personalizada', 'Soporte prioritario'], cta: 'Habla con nosotros', highlight: true },
      ],
    },
    cta: {
      h2: '¿Listo para convertir cada estancia en una experiencia —y en un ingreso?',
      sub: 'Sé de los primeros hoteles boutique en dar el salto. Tu equipo lo agradecerá.',
      btn: 'Agenda tu demo gratuita',
    },
    contact: {
      title: 'Agenda tu demo personal',
      sub: 'Agustín te escribirá personalmente en menos de 24h. Sin compromiso.',
      namePlaceholder: 'Tu nombre',
      hotelPlaceholder: 'Nombre del hotel',
      emailPlaceholder: 'Email',
      phonePlaceholder: 'Teléfono (opcional)',
      btn: 'Enviar',
      sending: 'Enviando...',
      success: '¡Perfecto! Te escribiremos muy pronto.',
      error: 'Algo fue mal. Escríbenos a agustin@consergi.com',
      or: 'O si lo prefieres, escríbenos directamente por WhatsApp',
      whatsappBtn: 'Abrir WhatsApp',
    },
    footer: { tagline: 'El conserje virtual para hoteles boutique.', contact: 'agustin@consergi.com', demo: 'Demo', privacy: 'Privacidad', onboard: 'Solicitar acceso' },
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
      sub: "Consergi allibera el teu equip de les preguntes repetitives, crea itineraris amb IA per a cada hoste i converteix visites en ingressos reals gràcies als socis locals. Sense descàrregues. Sense integracions. Llest en 15 minuts.",
      cta1: 'Veure demo en viu',
      cta2: 'Agenda la demo',
      whatsapp: 'O escriu-nos per WhatsApp',
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
    roi: {
      eyebrow: "L'impacte real",
      h2: 'El que canvia al teu hotel des del primer dia',
      stats: [
        {
          stat: '+2h',
          label: 'estalviades al dia a recepció',
          desc: "WiFi, check-out, desdejuni... el teu equip respon les mateixes preguntes més de 30 vegades al dia. Consergi les resol a l'instant, en l'idioma de l'hoste, sense que ningú hagi d'intervenir.",
        },
        {
          stat: '+€800/mes',
          label: "en ingressos que abans no existien",
          desc: "Si el 10% dels teus hostes visita un soci i gasta €40 de mitjana, un hotel de 30 habitacions genera més de €800 al mes en vendes noves. Restaurants, tours, upgrades — sense comissió per a nosaltres.",
        },
        {
          stat: '3×',
          label: 'més coneixement dels teus hostes',
          desc: "Famílies, parelles o viatgers sols? Descobreix qui et visita, quins idiomes parlen i què volen fer. Dissenya paquets i ofertes que de debò es venen.",
        },
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
    reviews: {
      eyebrow: 'Hotels que ja ho fan servir',
      h2: 'El que diuen els nostres clients',
      items: [
        { quote: "Abans passàvem més de dues hores al dia responent les mateixes preguntes amb el traductor. Ara els hostes ho resolen sols en el seu idioma i la recepció pot crear experiències de debò. Les valoracions a Booking van pujar en menys d'un mes.", name: 'Laura M.', role: 'Directora', location: 'Hotel rural boutique · Girona' },
        { quote: "Veure un grup de turistes japonesos usant el chatbot tot sols va ser increïble. Mai hauríem pogut atendre'ls així. Ho vam tenir en marxa en menys d'una hora, i la puntuació a Google va pujar mig punt.", name: 'Javier C.', role: 'Propietari', location: 'Finca boutique · Mallorca' },
        { quote: "Els hostes arriben ja sabent el WiFi, el check-out i què fer a la ciutat. Les interrupcions a recepció van baixar més d'un 60%. I els socis que recomanem generen ingressos extra sense cap esforç per part nostra.", name: 'Ana S.', role: 'Recepcionista', location: 'Casa boutique · Granada' },
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
        { name: 'Starter', price: '€49', per: '/mes', desc: 'Per a hotels que comencen', features: ['1 hotel', 'Chatbot + 10 idiomes', 'Itineraris amb IA', 'Suport per email'], cta: 'Parla amb nosaltres', highlight: false },
        { name: 'Growth', price: '€99', per: '/mes', desc: 'Per a hotels que volen créixer', features: ['1 hotel', 'Tot a Starter', "Panell d'analítica", 'Portal de socis', 'Marca personalitzada', 'Suport prioritari'], cta: 'Parla amb nosaltres', highlight: true },
      ],
    },
    cta: {
      h2: "Llest per convertir cada estada en una experiència — i en uns ingressos?",
      sub: "Sigues dels primers hotels boutique a fer el salt. El teu equip t'ho agrairà.",
      btn: 'Agenda la teva demo gratuïta',
    },
    contact: {
      title: 'Agenda la teva demo personal',
      sub: "L'Agustín t'escriurà personalment en menys de 24h. Sense compromís.",
      namePlaceholder: 'El teu nom',
      hotelPlaceholder: "Nom de l'hotel",
      emailPlaceholder: 'Email',
      phonePlaceholder: 'Telèfon (opcional)',
      btn: 'Enviar',
      sending: 'Enviant...',
      success: 'Perfecte! T\'escriurem molt aviat.',
      error: 'Alguna cosa ha anat malament. Escriu-nos a agustin@consergi.com',
      or: 'O si ho prefereixes, escriu-nos directament per WhatsApp',
      whatsappBtn: 'Obrir WhatsApp',
    },
    footer: { tagline: 'El concierge virtual per a hotels boutique.', contact: 'agustin@consergi.com', demo: 'Demo', privacy: 'Privacitat', onboard: 'Sol·licitar accés' },
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
      sub: "Consergi frees your team from repetitive questions, creates AI-powered itineraries for every guest, and turns visits into real revenue through local partners. No downloads. No integrations. Ready in 15 minutes.",
      cta1: 'See live demo',
      cta2: 'Book your demo',
      whatsapp: 'Or message us on WhatsApp',
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
    roi: {
      eyebrow: 'Real impact',
      h2: 'What changes in your hotel from day one',
      stats: [
        {
          stat: '+2h',
          label: 'saved per day at reception',
          desc: 'WiFi, checkout, breakfast... your team answers the same questions 30+ times a day. Consergi handles them instantly, in the guest\'s own language, without anyone having to step in.',
        },
        {
          stat: '+€800/mo',
          label: 'in revenue that didn\'t exist before',
          desc: 'If 10% of your guests visit a partner and spend an average of €40, a 30-room hotel generates over €800/month in new sales. Restaurants, tours, upgrades — no commission for us.',
        },
        {
          stat: '3×',
          label: 'better insight into your guests',
          desc: 'Families, couples or solo travelers? Know who visits you, what languages they speak, and what they want to do. Build packages and offers that actually sell.',
        },
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
    reviews: {
      eyebrow: 'Hotels already using it',
      h2: 'What our customers say',
      items: [
        { quote: 'We used to spend over two hours a day answering the same questions. Now guests sort it out themselves in their own language, and reception can focus on creating real experiences. Our Booking.com score went up within the first month.', name: 'Laura M.', role: 'Hotel Director', location: 'Rural boutique hotel · Girona' },
        { quote: 'Watching a group of Japanese tourists navigate the chatbot on their own was incredible. We never could have served them that way before. It was live in under an hour — and our Google rating went up half a point.', name: 'Javier C.', role: 'Owner', location: 'Boutique finca · Mallorca' },
        { quote: 'Guests arrive already knowing the WiFi, check-out time, and what to do in the city. Interruptions at reception dropped over 60%. And the partners we recommend generate extra income with zero effort on our part.', name: 'Ana S.', role: 'Receptionist', location: 'Boutique guesthouse · Granada' },
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
        { name: 'Starter', price: '€49', per: '/mo', desc: 'For hotels getting started', features: ['1 hotel', 'Chatbot + 10 languages', 'AI itineraries', 'Email support'], cta: 'Talk to us', highlight: false },
        { name: 'Growth', price: '€99', per: '/mo', desc: 'For hotels that want to grow', features: ['1 hotel', 'Everything in Starter', 'Analytics dashboard', 'Partners portal', 'Custom branding', 'Priority support'], cta: 'Talk to us', highlight: true },
      ],
    },
    cta: {
      h2: 'Ready to turn every stay into an experience — and into revenue?',
      sub: 'Be among the first boutique hotels to make the leap. Your team will thank you.',
      btn: 'Book your free demo',
    },
    contact: {
      title: 'Book your personal demo',
      sub: 'Agustín will write to you personally within 24h. No commitment.',
      namePlaceholder: 'Your name',
      hotelPlaceholder: 'Hotel name',
      emailPlaceholder: 'Email',
      phonePlaceholder: 'Phone (optional)',
      btn: 'Send',
      sending: 'Sending...',
      success: 'Perfect! We\'ll be in touch very soon.',
      error: 'Something went wrong. Email us at agustin@consergi.com',
      or: 'Or if you prefer, message us directly on WhatsApp',
      whatsappBtn: 'Open WhatsApp',
    },
    footer: { tagline: 'The AI concierge for boutique hotels.', contact: 'agustin@consergi.com', demo: 'Demo', privacy: 'Privacy', onboard: 'Request access' },
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
            @click="openModal()"
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
            <button
              @click="openModal()"
              class="inline-flex items-center justify-center px-7 py-4 bg-stone-800 text-white rounded-2xl text-base font-bold tracking-wide hover:bg-stone-700 transition-all shadow-xl hover:shadow-2xl active:scale-95"
            >{{ t.hero.cta2 }}</button>
            <a
              :href="DEMO_URL"
              class="inline-flex items-center justify-center px-7 py-4 bg-white/60 backdrop-blur-sm border border-white text-stone-700 rounded-2xl text-base font-bold tracking-wide hover:bg-white hover:shadow-lg transition-all active:scale-95"
            >{{ t.hero.cta1 }}</a>
          </div>
          <!-- WhatsApp secondary -->
          <a
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm font-medium transition-colors pt-1"
          >
            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            {{ t.hero.whatsapp }}
          </a>
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

    <!-- ═══ LIFESTYLE IMAGE ═════════════════════════════════════════════════ -->
    <div class="lifestyle-img-wrap reveal">
      <div class="max-w-6xl mx-auto px-6">
        <img
          src="/img/hotel-room-qr-use.png"
          alt="Hotel guests using Consergi on their phone"
          class="lifestyle-img"
        />
      </div>
    </div>

    <!-- ═══ ROI / IMPACT ═════════════════════════════════════════════════════ -->
    <section class="section roi-section reveal">
      <div class="section-inner">
        <div class="section-header">
          <p class="eyebrow">{{ t.roi.eyebrow }}</p>
          <h2 class="section-title">{{ t.roi.h2 }}</h2>
        </div>
        <div class="roi-grid">
          <div
            v-for="(item, i) in t.roi.stats" :key="i"
            class="roi-card reveal"
            :style="`animation-delay: ${i * 0.12}s`"
          >
            <div class="roi-stat">{{ item.stat }}</div>
            <div class="roi-stat-label">{{ item.label }}</div>
            <p class="roi-desc">{{ item.desc }}</p>
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

        <!-- QR stand photo -->
        <div class="mt-12 reveal">
          <img
            src="/img/qr-code-stand.png"
            alt="Consergi QR code stand at hotel reception"
            class="qr-stand-img"
          />
        </div>
      </div>
    </section>

    <!-- ═══ REVIEWS ═════════════════════════════════════════════════════════════ -->
    <section class="section reveal">
      <div class="section-inner">
        <div class="section-header">
          <p class="eyebrow">{{ t.reviews.eyebrow }}</p>
          <h2 class="section-title">{{ t.reviews.h2 }}</h2>
        </div>
        <div class="reviews-grid">
          <div
            v-for="(review, i) in t.reviews.items" :key="i"
            class="review-card reveal"
            :style="`animation-delay: ${i * 0.12}s`"
          >
            <!-- Stars -->
            <div class="review-stars">
              <span v-for="s in 5" :key="s" class="star">★</span>
            </div>
            <p class="review-quote">"{{ review.quote }}"</p>
            <div class="review-author">
              <div class="review-avatar">{{ review.name[0] }}</div>
              <div>
                <p class="review-name">{{ review.name }}</p>
                <p class="review-role">{{ review.role }} · {{ review.location }}</p>
              </div>
            </div>
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
              @click="openModal()"
              class="plan-cta"
              :class="plan.highlight ? 'plan-cta-highlight' : 'plan-cta-base'"
            >{{ plan.cta }}</button>
          </div>
        </div>
        <div class="trial-banner reveal">
          <svg class="trial-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ t.pricing.trial }}</span>
        </div>
      </div>
    </section>

    <!-- ═══ FOOTER CTA ════════════════════════════════════════════════════════ -->
    <section class="footer-cta-section reveal">
      <div class="section-inner text-center">
        <h2 class="footer-cta-title">{{ t.cta.h2 }}</h2>
        <p class="footer-cta-sub">{{ t.cta.sub }}</p>
        <button
          @click="openModal()"
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
          <a href="/privacy" class="footer-link">{{ t.footer.privacy }}</a>
          <button @click="openModal()" class="footer-link">{{ t.footer.onboard }}</button>
        </div>
        <div class="footer-contact">
          <a :href="`mailto:${t.footer.contact}`" class="footer-email">{{ t.footer.contact }}</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 Consergi · <a :href="`mailto:${t.footer.contact}`" class="hover:text-stone-600 transition-colors">{{ t.footer.contact }}</a></p>
      </div>
    </footer>

    <!-- ═══ CONTACT MODAL ══════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-backdrop" @click.self="closeModal()">
          <div class="modal-box">
            <!-- Close -->
            <button @click="closeModal()" class="modal-close" aria-label="Cerrar">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <!-- Success state -->
            <div v-if="formStatus === 'success'" class="modal-success">
              <div class="success-icon">✓</div>
              <p class="success-msg">{{ t.contact.success }}</p>
            </div>

            <!-- Form state -->
            <template v-else>
              <p class="eyebrow mb-1">{{ t.nav.cta }}</p>
              <h3 class="modal-title">{{ t.contact.title }}</h3>
              <p class="modal-sub">{{ t.contact.sub }}</p>

              <form @submit.prevent="submitForm()" class="modal-form">
                <input
                  v-model="contactForm.name"
                  :placeholder="t.contact.namePlaceholder"
                  required
                  class="modal-input"
                />
                <input
                  v-model="contactForm.hotel"
                  :placeholder="t.contact.hotelPlaceholder"
                  required
                  class="modal-input"
                />
                <input
                  v-model="contactForm.email"
                  type="email"
                  :placeholder="t.contact.emailPlaceholder"
                  required
                  class="modal-input"
                />
                <input
                  v-model="contactForm.phone"
                  type="tel"
                  :placeholder="t.contact.phonePlaceholder"
                  class="modal-input"
                />

                <p v-if="formStatus === 'error'" class="modal-error">{{ t.contact.error }}</p>

                <button
                  type="submit"
                  :disabled="formStatus === 'sending'"
                  class="modal-submit"
                >
                  {{ formStatus === 'sending' ? t.contact.sending : t.contact.btn }}
                </button>
              </form>

              <!-- WhatsApp divider -->
              <div class="modal-divider">
                <span>{{ t.contact.or }}</span>
              </div>
              <a
                :href="whatsappUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="modal-whatsapp"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                {{ t.contact.whatsappBtn }}
              </a>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

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

/* ─── Lifestyle image ─────────────────────────────────────────────────────── */
.lifestyle-img-wrap {
  padding: 0 0 64px;
}
.lifestyle-img {
  width: 100%;
  max-height: 480px;
  object-fit: cover;
  object-position: center 30%;
  border-radius: 28px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.12);
}

/* ─── QR stand photo ──────────────────────────────────────────────────────── */
.qr-stand-img {
  display: block;
  width: 100%;
  max-width: 480px;
  max-height: 340px;
  object-fit: cover;
  object-position: center;
  border-radius: 24px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.10);
  margin: 0 auto;
}

/* ─── Features grid ───────────────────────────────────────────────────────── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 768px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .features-grid { grid-template-columns: 1fr; }
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
.trial-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 2rem;
  padding: 1rem 1.5rem;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #15803d;
  letter-spacing: 0.01em;
}
.trial-icon {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
  color: #16a34a;
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

/* ─── Reviews ────────────────────────────────────────────────────────────── */
.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
.review-card {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.9);
  border-radius: 24px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.review-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
.review-stars { display: flex; gap: 2px; }
.star { color: #f59e0b; font-size: 1rem; }
.review-quote {
  font-size: 0.92rem;
  color: #44403c;
  line-height: 1.7;
  flex: 1;
  font-style: italic;
}
.review-author { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
.review-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1c1917;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}
.review-name { font-size: 0.875rem; font-weight: 700; color: #1c1917; }
.review-role { font-size: 0.75rem; color: #a8a29e; margin-top: 2px; }

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

/* ─── Contact Modal ───────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(28, 25, 23, 0.6);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.modal-box {
  position: relative;
  background: white;
  border-radius: 32px;
  padding: 40px 36px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 40px 80px rgba(0,0,0,0.2);
}
.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f5f5f4;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #78716c;
  transition: background 0.15s;
}
.modal-close:hover { background: #e7e5e4; color: #1c1917; }
.modal-title {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 1.6rem;
  color: #1c1917;
  margin: 6px 0 8px;
  line-height: 1.2;
}
.modal-sub {
  font-size: 0.875rem;
  color: #78716c;
  line-height: 1.6;
  margin-bottom: 24px;
}
.modal-form { display: flex; flex-direction: column; gap: 12px; }
.modal-input {
  width: 100%;
  padding: 13px 16px;
  border: 1.5px solid #e7e5e4;
  border-radius: 14px;
  font-size: 0.95rem;
  font-family: inherit;
  color: #1c1917;
  background: #fafaf9;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.modal-input:focus { outline: none; border-color: #78716c; background: white; }
.modal-input::placeholder { color: #a8a29e; }
.modal-error {
  font-size: 0.8rem;
  color: #e11d48;
  padding: 8px 12px;
  background: #fff1f2;
  border-radius: 10px;
}
.modal-submit {
  padding: 14px;
  background: #1c1917;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}
.modal-submit:hover { background: #292524; }
.modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.modal-divider {
  margin: 20px 0 14px;
  text-align: center;
  position: relative;
  font-size: 0.75rem;
  color: #a8a29e;
  line-height: 1.4;
}
.modal-whatsapp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 16px;
  color: #15803d;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
}
.modal-whatsapp:hover { background: #dcfce7; }
.modal-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px 0;
  text-align: center;
}
.success-icon {
  width: 56px;
  height: 56px;
  background: #f0fdf4;
  border: 2px solid #bbf7d0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #15803d;
}
.success-msg {
  font-size: 1rem;
  font-weight: 600;
  color: #1c1917;
  line-height: 1.5;
}

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

/* ─── ROI / Impact section ──────────────────────────────────────────────── */
.roi-section {
  background: #1c1917;
}
.roi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 768px) {
  .roi-grid { grid-template-columns: 1fr; }
}
.roi-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.roi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 2rem;
  right: 2rem;
  height: 2px;
  background: linear-gradient(90deg, transparent, #b45309, transparent);
  border-radius: 999px;
}
.roi-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.14);
}
.roi-stat {
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 3.2rem;
  font-weight: 800;
  color: #fafaf9;
  line-height: 1;
  letter-spacing: -0.02em;
}
.roi-stat-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #b45309;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.5rem;
}
.roi-desc {
  font-size: 0.9rem;
  color: #a8a29e;
  margin-top: 1.25rem;
  line-height: 1.7;
}
.roi-section .section-title {
  color: #fafaf9;
}
.roi-section .eyebrow {
  color: #b45309;
}
</style>
