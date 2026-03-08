export const adminLocale = {
  en: {
    // ── Auth ────────────────────────────────────────────────────────────────
    adminPanel: 'Admin Panel',
    enterPasscode: 'Enter passcode',
    signIn: 'Sign In',
    signOut: 'Sign out',
    incorrectPasscode: 'Incorrect passcode.',
    envHint: 'Set VITE_ADMIN_PASS in your environment variables.',

    // ── Navigation ──────────────────────────────────────────────────────────
    admin: 'Admin',
    allHotels: 'All Hotels',
    newHotel: 'New Hotel',
    globalInsights: 'Global Insights',

    // ── Hotel list ──────────────────────────────────────────────────────────
    hotels: 'Hotels',
    hotelsCount: (n) => `${n} hotel${n !== 1 ? 's' : ''} configured`,
    noHotelsYet: 'No hotels yet',
    noHotelsDesc: 'Create your first hotel profile to get started.',

    // ── Form ────────────────────────────────────────────────────────────────
    editHotel: 'Edit Hotel',
    delete: 'Delete',
    deleting: 'Deleting…',
    save: 'Save',
    saving: 'Saving…',
    saved: 'Saved!',
    saveHotel: 'Save Hotel',
    rememberSave: 'Remember to save your changes',
    changesSaved: 'Changes saved successfully',
    selectOption: '— Select —',
    auto: 'Auto',

    // ── Tabs ────────────────────────────────────────────────────────────────
    tabProfile: 'Profile',
    tabInfo: 'Info',
    tabPartners: 'Partners',
    tabInsights: 'Insights',
    tabLink: 'Links',

    // ── Field group titles ──────────────────────────────────────────────────
    groupIdentity: 'Identity',
    groupBranding: 'Branding',
    groupGuestInfo: 'Guest Information',
    groupFacilities: 'Facilities & Services',

    // ── Field labels ────────────────────────────────────────────────────────
    labelName: 'Hotel Name',
    labelCity: 'City',
    labelNeighborhood: 'Neighborhood / District',
    labelCategory: 'Hotel Category',
    labelStars: 'Star Rating',
    labelDescription: 'Description',
    labelAiContext: 'AI Context (injected into guest recommendations)',
    labelAddress: 'Address',
    labelMapsUrl: 'Google Maps URL',
    labelLogoUrl: 'Logo URL',
    labelCoverUrl: 'Cover Image URL',
    labelSlug: 'URL Slug',
    labelReception: 'Reception Phone',
    labelCheckin: 'Check-in Time',
    labelCheckout: 'Check-out Time',
    labelWifiName: 'WiFi Network Name',
    labelWifiPass: 'WiFi Password',
    labelBreakfast: 'Breakfast Hours & Location',
    labelPool: 'Pool',
    labelGym: 'Gym / Fitness',
    labelSpa: 'Spa & Wellness',
    labelParking: 'Parking',
    labelRestaurant: 'Restaurant',
    labelRoomService: 'Room Service',
    labelFacilities: 'Other Facilities',

    // ── Hints ───────────────────────────────────────────────────────────────
    hintCheckin: 'Select check-in time',
    hintCheckout: 'Select check-out time',

    // ── Select options (category/stars stored in Firestore — keep EN values) ─
    catOptions: ['Boutique', 'Luxury', 'Business', 'Budget', 'Resort', 'Hostel', 'Aparthotel', 'Other'],
    starOptions: ['Unrated', '1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],

    // ── Partner category display labels (values stored in EN) ───────────────
    partnerCatDisplay: [
      'Restaurant / Café',
      'Bar / Nightlife',
      'Shop / Boutique',
      'Tour / Experience',
      'Spa / Wellness',
      'Transport / Transfer',
      'Museum / Culture',
      'Other',
    ],

    // ── FAQ ─────────────────────────────────────────────────────────────────
    customFaqs: 'Custom FAQs',
    faqsDesc: "Each FAQ becomes a quick-action pill in the chatbot · Answers are auto-translated to the guest's language",
    addFaq: 'Add FAQ',
    noFaqs: 'No FAQs yet. Add questions guests frequently ask (pool hours, airport shuttle, parking instructions...).',
    pillPh: 'Button label — short, shown on chat pill (e.g. Pool hours? · Horario piscina?)',
    questionPh: 'Full question for AI (English recommended) — e.g. What are the pool opening hours?',
    answerPh: "Answer in English — AI will translate automatically into the guest's language",

    // ── Partners ─────────────────────────────────────────────────────────────
    partnersTitle: 'Partners & Affiliates',
    partnersDesc: 'Local businesses to recommend to guests (restaurants, tours, shops...)',
    addPartner: 'Add Partner',
    noPartners: 'No partners yet. Add local restaurants, tours, or shops to recommend to your guests.',
    partnerNamePh: 'Partner name',
    partnerDescPh: 'Short description (e.g. Rooftop terrace with city views, 10 min walk)',
    guestPerkPh: 'Guest perk (e.g. 10% off with hotel key card)',
    mapsUrlPh: 'Google Maps URL (optional)',
    websitePh: 'Website URL (optional)',

    // ── Insights ─────────────────────────────────────────────────────────────
    insightsTitle: 'Insights',
    insightsDesc: 'Guest activity — last 30 days',
    copyReport: 'Copy Report',
    copied: 'Copied!',
    loading: 'Loading…',
    noActivity: 'No guest activity yet.',
    noActivityDesc: 'Data appears once guests start using the concierge.',
    sessions: 'Sessions',
    itineraries: 'Itineraries',
    chatOpens: 'Chat opens',
    favorites: 'Favorites',
    shares: 'Shares',
    topTopics: 'Top chatbot topics',
    languages: 'Languages',
    guestPrefs: 'Guest Preferences',
    questionnaires: 'questionnaires',
    travelingAs: 'Traveling as',
    budget: 'Budget',
    lengthOfStay: 'Length of stay',
    travelStyle: 'Travel style',
    top5: '(top 5)',
    foodPrefs: 'Food preferences',
    transport: 'Transport',

    // ── Global Insights ───────────────────────────────────────────────────────
    globalTitle: 'Global Insights',
    globalSubtitle: 'All hotels · Last 30 days',
    noData: 'No data available.',
    conversionFunnel: 'Conversion funnel',
    questionnairesRow: 'Questionnaires',
    itinerariesGenerated: 'Itineraries generated',
    sharedItineraries: 'Shared itineraries',
    topHotels: 'Top hotels by sessions',
    acrossAllHotels: (n) => `${n} questionnaires across all hotels`,

    // ── Links ─────────────────────────────────────────────────────────────────
    guestLinkQr: 'Guest Link & QR Code',
    shareLinkWith: 'Share this link with guests via QR code, NFC, or staff:',
    copy: 'Copy',
    hotelId: 'Hotel ID',
    scanToTest: 'Scan to test',
    logoPreview: 'Logo preview:',
    deploymentKit: 'Deployment Kit',
    deploymentDesc: 'Ready-to-use copy for emails, front desk & WhatsApp. Just copy and paste.',
    bookingEmail: 'Booking confirmation email',
    frontDeskCard: 'Front desk card / room table tent',
    whatsappSms: 'WhatsApp / SMS message',
    whatsappHint: 'Paste into WhatsApp Business templates, Cloudbeds/Mews automated messages, or booking.com pre-arrival messages.',

    // ── Deployment templates ──────────────────────────────────────────────────
    emailTpl: (name, url) => `Subject: Your personalized city guide is ready 📍

Dear Guest,

Welcome to ${name}! We've prepared a personalized AI travel guide for your stay.

Tap the link below to get a custom itinerary — activities, restaurants, transport and local tips matched to your interests:

${url}

No app download needed. Works on any phone.

See you soon,
The ${name} Team`,

    frontDeskTpl: (name, url, city) => `YOUR DIGITAL CONCIERGE

Scan the QR code or visit:
${url}

Get a personalized AI itinerary for ${city || 'the city'} — activities, restaurants & local tips.

Crafted by ${name}`,

    whatsappTpl: (name, url) => `Hi! Welcome to ${name} 👋

We've set up your personal city guide — just tap the link to get a custom itinerary with activities, restaurants and local tips.

${url}

No app needed. Enjoy your stay!`,

    // ── Analytics report ──────────────────────────────────────────────────────
    reportTitle: (name) => `GUEST INSIGHTS REPORT — ${name.toUpperCase()}`,
    reportLast30: 'Last 30 days',
    reportOverview: 'OVERVIEW',
    reportSessions: 'Sessions',
    reportItineraries: 'Itineraries generated',
    reportChatOpens: 'Chat opens',
    reportFavorites: 'Favorites saved',
    reportShares: 'Itineraries shared',
    reportGuestPrefs: (n) => `GUEST PREFERENCES (${n} questionnaires)`,
    reportTravelingAs: 'Traveling as',
    reportBudget: 'Budget',
    reportStay: 'Length of stay',
    reportStyle: 'Travel style',
    reportFood: 'Food',
    reportTransport: 'Transport',
    reportLanguages: 'LANGUAGES',
    reportTopics: 'TOP CHATBOT TOPICS',
    reportFooter: '— Mi Concierge',

    // ── Send report modal ─────────────────────────────────────────────────────
    sendReport: 'Send Monthly Report',
    sendReportDesc: 'Email the full analytics dashboard to the hotel.',
    recipientEmailLabel: 'Recipient email',
    sendReportBtn: 'Send Report',
    sendingReport: 'Sending…',
    reportSentOk: '✓ Report sent!',
    cancel: 'Cancel',
    emailNotSetup: 'Email not configured — add RESEND_API_KEY to Vercel env vars.',
  },

  es: {
    // ── Auth ────────────────────────────────────────────────────────────────
    adminPanel: 'Panel de Administración',
    enterPasscode: 'Introduce el código de acceso',
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    incorrectPasscode: 'Código incorrecto.',
    envHint: 'Define VITE_ADMIN_PASS en tus variables de entorno.',

    // ── Navigation ──────────────────────────────────────────────────────────
    admin: 'Admin',
    allHotels: 'Todos los Hoteles',
    newHotel: 'Nuevo Hotel',
    globalInsights: 'Estadísticas Globales',

    // ── Hotel list ──────────────────────────────────────────────────────────
    hotels: 'Hoteles',
    hotelsCount: (n) => `${n} hotel${n !== 1 ? 'es' : ''} configurado${n !== 1 ? 's' : ''}`,
    noHotelsYet: 'Aún no hay hoteles',
    noHotelsDesc: 'Crea tu primer perfil de hotel para empezar.',

    // ── Form ────────────────────────────────────────────────────────────────
    editHotel: 'Editar Hotel',
    delete: 'Eliminar',
    deleting: 'Eliminando…',
    save: 'Guardar',
    saving: 'Guardando…',
    saved: '¡Guardado!',
    saveHotel: 'Guardar Hotel',
    rememberSave: 'Recuerda guardar los cambios',
    changesSaved: 'Cambios guardados correctamente',
    selectOption: '— Seleccionar —',
    auto: 'Auto',

    // ── Tabs ────────────────────────────────────────────────────────────────
    tabProfile: 'Perfil',
    tabInfo: 'Info',
    tabPartners: 'Partners',
    tabInsights: 'Estadísticas',
    tabLink: 'Enlaces',

    // ── Field group titles ──────────────────────────────────────────────────
    groupIdentity: 'Identidad',
    groupBranding: 'Marca',
    groupGuestInfo: 'Información para el Huésped',
    groupFacilities: 'Instalaciones y Servicios',

    // ── Field labels ────────────────────────────────────────────────────────
    labelName: 'Nombre del Hotel',
    labelCity: 'Ciudad',
    labelNeighborhood: 'Barrio / Distrito',
    labelCategory: 'Categoría del Hotel',
    labelStars: 'Clasificación por Estrellas',
    labelDescription: 'Descripción',
    labelAiContext: 'Contexto para la IA (incluido en las recomendaciones al huésped)',
    labelAddress: 'Dirección',
    labelMapsUrl: 'URL de Google Maps',
    labelLogoUrl: 'URL del Logo',
    labelCoverUrl: 'URL de la Imagen de Portada',
    labelSlug: 'Slug de URL',
    labelReception: 'Teléfono de Recepción',
    labelCheckin: 'Hora de Check-in',
    labelCheckout: 'Hora de Check-out',
    labelWifiName: 'Nombre de la Red WiFi',
    labelWifiPass: 'Contraseña WiFi',
    labelBreakfast: 'Horario y Lugar del Desayuno',
    labelPool: 'Piscina',
    labelGym: 'Gimnasio / Fitness',
    labelSpa: 'Spa y Bienestar',
    labelParking: 'Aparcamiento',
    labelRestaurant: 'Restaurante',
    labelRoomService: 'Servicio de Habitaciones',
    labelFacilities: 'Otras Instalaciones',

    // ── Hints ───────────────────────────────────────────────────────────────
    hintCheckin: 'Selecciona la hora de check-in',
    hintCheckout: 'Selecciona la hora de check-out',

    // ── Select options ────────────────────────────────────────────────────────
    catOptions: ['Boutique', 'Luxury', 'Business', 'Budget', 'Resort', 'Hostel', 'Aparthotel', 'Other'],
    starOptions: ['Sin clasificar', '1 Estrella', '2 Estrellas', '3 Estrellas', '4 Estrellas', '5 Estrellas'],

    // ── Partner category display labels ──────────────────────────────────────
    partnerCatDisplay: [
      'Restaurante / Café',
      'Bar / Vida nocturna',
      'Tienda / Boutique',
      'Tour / Experiencia',
      'Spa / Bienestar',
      'Transporte / Transfer',
      'Museo / Cultura',
      'Otro',
    ],

    // ── FAQ ─────────────────────────────────────────────────────────────────
    customFaqs: 'Preguntas Frecuentes Personalizadas',
    faqsDesc: 'Cada FAQ se convierte en un botón de acción rápida en el chatbot · Las respuestas se traducen automáticamente al idioma del huésped',
    addFaq: 'Añadir FAQ',
    noFaqs: 'Aún no hay FAQs. Añade preguntas frecuentes de los huéspedes (horario piscina, shuttle aeropuerto, instrucciones de aparcamiento...).',
    pillPh: 'Etiqueta del botón — corta, se muestra en el chatbot (ej. ¿Hora piscina? · Pool hours?)',
    questionPh: 'Pregunta completa para la IA (recomendado en inglés) — ej. ¿Cuál es el horario de la piscina?',
    answerPh: 'Respuesta en inglés — la IA la traducirá automáticamente al idioma del huésped',

    // ── Partners ─────────────────────────────────────────────────────────────
    partnersTitle: 'Partners y Colaboradores',
    partnersDesc: 'Negocios locales para recomendar a los huéspedes (restaurantes, tours, tiendas...)',
    addPartner: 'Añadir Partner',
    noPartners: 'Aún no hay partners. Añade restaurantes, tours o tiendas locales para recomendar a tus huéspedes.',
    partnerNamePh: 'Nombre del partner',
    partnerDescPh: 'Descripción corta (ej. Terraza en el tejado con vistas a la ciudad, 10 min a pie)',
    guestPerkPh: 'Ventaja para huéspedes (ej. 10% de descuento con la tarjeta del hotel)',
    mapsUrlPh: 'URL de Google Maps (opcional)',
    websitePh: 'URL del sitio web (opcional)',

    // ── Insights ─────────────────────────────────────────────────────────────
    insightsTitle: 'Estadísticas',
    insightsDesc: 'Actividad de huéspedes — últimos 30 días',
    copyReport: 'Copiar Informe',
    copied: '¡Copiado!',
    loading: 'Cargando…',
    noActivity: 'Aún no hay actividad de huéspedes.',
    noActivityDesc: 'Los datos aparecen cuando los huéspedes empiecen a usar el concierge.',
    sessions: 'Sesiones',
    itineraries: 'Itinerarios',
    chatOpens: 'Chats abiertos',
    favorites: 'Favoritos',
    shares: 'Compartidos',
    topTopics: 'Temas más consultados',
    languages: 'Idiomas',
    guestPrefs: 'Preferencias del Huésped',
    questionnaires: 'cuestionarios',
    travelingAs: 'Viajando como',
    budget: 'Presupuesto',
    lengthOfStay: 'Duración de la estancia',
    travelStyle: 'Estilo de viaje',
    top5: '(top 5)',
    foodPrefs: 'Preferencias alimentarias',
    transport: 'Transporte',

    // ── Global Insights ───────────────────────────────────────────────────────
    globalTitle: 'Estadísticas Globales',
    globalSubtitle: 'Todos los hoteles · Últimos 30 días',
    noData: 'No hay datos disponibles.',
    conversionFunnel: 'Embudo de conversión',
    questionnairesRow: 'Cuestionarios',
    itinerariesGenerated: 'Itinerarios generados',
    sharedItineraries: 'Itinerarios compartidos',
    topHotels: 'Hoteles con más sesiones',
    acrossAllHotels: (n) => `${n} cuestionarios en todos los hoteles`,

    // ── Links ─────────────────────────────────────────────────────────────────
    guestLinkQr: 'Enlace para Huéspedes y Código QR',
    shareLinkWith: 'Comparte este enlace con huéspedes vía código QR, NFC o recepción:',
    copy: 'Copiar',
    hotelId: 'ID del Hotel',
    scanToTest: 'Escanear para probar',
    logoPreview: 'Vista previa del logo:',
    deploymentKit: 'Kit de Distribución',
    deploymentDesc: 'Textos listos para usar en emails, recepción y WhatsApp. Solo copia y pega.',
    bookingEmail: 'Email de confirmación de reserva',
    frontDeskCard: 'Tarjeta de recepción / tent card de habitación',
    whatsappSms: 'Mensaje de WhatsApp / SMS',
    whatsappHint: 'Pega en plantillas de WhatsApp Business, mensajes automáticos de Cloudbeds/Mews o mensajes de pre-llegada de booking.com.',

    // ── Deployment templates ──────────────────────────────────────────────────
    emailTpl: (name, url) => `Asunto: Tu guía personalizada de la ciudad está lista 📍

Estimado huésped,

¡Bienvenido a ${name}! Hemos preparado una guía de viaje con IA personalizada para tu estancia.

Toca el enlace para obtener un itinerario a medida — actividades, restaurantes, transporte y consejos locales según tus intereses:

${url}

Sin necesidad de descargar ninguna app. Funciona en cualquier teléfono.

Hasta pronto,
El equipo de ${name}`,

    frontDeskTpl: (name, url, city) => `TU CONCIERGE DIGITAL

Escanea el código QR o visita:
${url}

Obtén un itinerario con IA personalizado para ${city || 'la ciudad'} — actividades, restaurantes y consejos locales.

Elaborado por ${name}`,

    whatsappTpl: (name, url) => `¡Hola! Bienvenido a ${name} 👋

Hemos preparado tu guía personal de la ciudad — toca el enlace para obtener un itinerario a medida con actividades, restaurantes y consejos locales.

${url}

Sin necesidad de app. ¡Que disfrutes tu estancia!`,

    // ── Analytics report ──────────────────────────────────────────────────────
    reportTitle: (name) => `INFORME DE ESTADÍSTICAS DE HUÉSPEDES — ${name.toUpperCase()}`,
    reportLast30: 'Últimos 30 días',
    reportOverview: 'RESUMEN',
    reportSessions: 'Sesiones',
    reportItineraries: 'Itinerarios generados',
    reportChatOpens: 'Chats abiertos',
    reportFavorites: 'Favoritos guardados',
    reportShares: 'Itinerarios compartidos',
    reportGuestPrefs: (n) => `PREFERENCIAS DE HUÉSPEDES (${n} cuestionarios)`,
    reportTravelingAs: 'Viajando como',
    reportBudget: 'Presupuesto',
    reportStay: 'Duración de la estancia',
    reportStyle: 'Estilo de viaje',
    reportFood: 'Alimentación',
    reportTransport: 'Transporte',
    reportLanguages: 'IDIOMAS',
    reportTopics: 'TEMAS MÁS CONSULTADOS EN EL CHATBOT',
    reportFooter: '— Mi Concierge',

    // ── Send report modal ─────────────────────────────────────────────────────
    sendReport: 'Enviar Informe Mensual',
    sendReportDesc: 'Envía el panel de análisis completo al hotel por email.',
    recipientEmailLabel: 'Email del destinatario',
    sendReportBtn: 'Enviar Informe',
    sendingReport: 'Enviando…',
    reportSentOk: '✓ ¡Informe enviado!',
    cancel: 'Cancelar',
    emailNotSetup: 'Email no configurado — añade RESEND_API_KEY a las variables de entorno de Vercel.',

    // ── Questionnaire answer label map (EN stored value → ES display) ─────────
    answerLabelMap: {
      // Group
      'Solo': 'Solo',
      'Couple': 'Pareja',
      'Family': 'Familia',
      'Friends': 'Amigos',
      'Business': 'Negocios',
      // Budget
      'Budget': 'Económico',
      'Balanced': 'Equilibrado',
      'Luxury': 'Lujo',
      // Days buckets
      '1–2 days': '1–2 días',
      '3–5 days': '3–5 días',
      '6–7 days': '6–7 días',
      '8+ days': '8+ días',
      // Style
      'Nightlife': 'Vida nocturna',
      'Nature': 'Naturaleza',
      'Mountains': 'Montañas',
      'Beach': 'Playa',
      'Rooftops': 'Azoteas',
      'Parks': 'Parques',
      'Live Music': 'Música en vivo',
      'Theater & Shows': 'Teatro y Espectáculos',
      'Guided Tours': 'Tours Guiados',
      'Museums & Culture': 'Museos y Cultura',
      'Local Experiences': 'Experiencias Locales',
      'Luxury Shopping': 'Compras de Lujo',
      'Handicrafts': 'Artesanía',
      'Architecture': 'Arquitectura',
      'Wellness & Spa': 'Bienestar y Spa',
      'Sports': 'Deportes',
      'History': 'Historia',
      'Relax': 'Relax',
      'Gastronomy': 'Gastronomía',
      // Food
      'Local / Traditional': 'Local / Tradicional',
      'Fusion': 'Fusión',
      'Italian': 'Italiana',
      'Asian': 'Asiática',
      'Mexican': 'Mexicana',
      'Peruvian': 'Peruana',
      'Mediterranean': 'Mediterránea',
      'Steakhouse': 'Asador',
      'Bakery & Pastry': 'Panadería y Pastelería',
      'Michelin Star': 'Estrella Michelin',
      'Healthy / Sustainable': 'Saludable / Sostenible',
      'Street Food': 'Comida Callejera',
      'Vegan / Vegetarian': 'Vegano / Vegetariano',
      'Seafood': 'Mariscos',
      'Brunch': 'Brunch',
      'Wine & Tapas': 'Vino y Tapas',
      // Transport
      'Public Transport': 'Transporte Público',
      'Uber / Taxi': 'Uber / Taxi',
      'Car Rental': 'Alquiler de Coche',
      'Train': 'Tren',
      'Ferry': 'Ferry',
      'Bicycle': 'Bicicleta',
      'Walking': 'A pie',
      'Electric Scooter': 'Patinete Eléctrico',
      // Chatbot quick-action pills (EN values stored when guest uses English)
      'Checkout time': 'Hora de salida',
      'Breakfast hours': 'Horario desayuno',
      'WiFi password': 'Contraseña WiFi',
      'Reception': 'Recepción',
      'Gym & Pool': 'Gimnasio y Piscina',
      'Pool & Spa': 'Piscina y Spa',
      'Parking': 'Aparcamiento',
      'Spa & Wellness': 'Spa y Bienestar',
      'Restaurant': 'Restaurante',
      'Room Service': 'Servicio de habitaciones',
      'Facilities': 'Instalaciones',
    },
  },
};
