<script setup>
import { ref } from 'vue';
const lang = ref('es');
</script>

<template>
  <div class="min-h-screen cosy-gradient">
    <div class="max-w-2xl mx-auto px-6 py-16">

      <!-- Back link -->
      <a href="/" class="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-stone-500 hover:text-stone-800 mb-10 transition-colors">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        {{ lang === 'es' ? 'Volver' : 'Back' }}
      </a>

      <!-- Language toggle -->
      <div class="flex gap-2 mb-10">
        <button
          @click="lang = 'es'"
          :class="lang === 'es' ? 'bg-stone-800 text-white' : 'bg-white/50 text-stone-500 hover:bg-white'"
          class="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
        >ES</button>
        <button
          @click="lang = 'en'"
          :class="lang === 'en' ? 'bg-stone-800 text-white' : 'bg-white/50 text-stone-500 hover:bg-white'"
          class="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
        >EN</button>
      </div>

      <!-- ─── SPANISH ─────────────────────────────────────────────────────────── -->
      <template v-if="lang === 'es'">
        <h1 class="font-serif text-3xl font-bold text-stone-800 mb-2">Política de Privacidad</h1>
        <p class="text-stone-400 text-sm mb-10">Última actualización: abril 2026</p>

        <div class="space-y-10 text-stone-700 leading-relaxed">

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos personales recogidos a través de este sitio web es
              <strong>Agustín Ponce</strong>, titular del servicio <strong>Consergi</strong>
              (consergi.com), con correo electrónico de contacto
              <a href="mailto:agustin@consergi.com" class="underline text-stone-500 hover:text-stone-800">agustin@consergi.com</a>.
            </p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">2. Datos que recopilamos</h2>
            <p class="mb-3">Recopilamos únicamente los datos que tú nos facilitas de forma voluntaria:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Formulario de contacto / solicitud de demo:</strong> nombre, nombre del hotel, correo electrónico y teléfono (opcional).</li>
              <li><strong>Datos de uso anónimos:</strong> eventos de sesión, idioma seleccionado, interacciones con el asistente virtual (sin identificación personal del huésped).</li>
              <li><strong>Cookies técnicas y analíticas:</strong> almacenamos una preferencia de cookies en tu navegador (<code>mc_cookies</code>) y podemos utilizar herramientas de analítica de uso.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">3. Finalidad del tratamiento</h2>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Gestionar tu solicitud de demo</strong> y contactar contigo para ofrecerte información sobre Consergi.</li>
              <li><strong>Mejorar el servicio</strong> mediante datos de uso agregados y anónimos.</li>
              <li><strong>Cumplir obligaciones legales</strong> aplicables.</li>
            </ul>
            <p class="mt-3">No utilizamos tus datos para envío de publicidad masiva sin tu consentimiento expreso.</p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">4. Base jurídica</h2>
            <p>
              El tratamiento se basa en el <strong>consentimiento</strong> que otorgas al completar el formulario de contacto
              (art. 6.1.a RGPD) y en el <strong>interés legítimo</strong> de Consergi para mejorar su servicio
              (art. 6.1.f RGPD).
            </p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">5. Conservación de datos</h2>
            <p>
              Los datos del formulario de contacto se conservan durante el tiempo necesario para gestionar tu solicitud
              y, si se establece una relación contractual, durante el plazo legal aplicable.
              Los datos de uso anónimos pueden conservarse indefinidamente al no ser identificables.
            </p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">6. Destinatarios</h2>
            <p class="mb-3">Tus datos pueden ser tratados por los siguientes proveedores de servicios, que actúan como encargados del tratamiento:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Resend</strong> (resend.com) — envío de correo electrónico.</li>
              <li><strong>Vercel</strong> (vercel.com) — alojamiento web y funciones serverless.</li>
              <li><strong>Google Firebase / Firestore</strong> — base de datos del servicio.</li>
              <li><strong>OpenAI</strong> — generación de itinerarios y respuestas del asistente virtual.</li>
            </ul>
            <p class="mt-3">Todos estos proveedores operan bajo sus propias políticas de privacidad y garantías de cumplimiento del RGPD.</p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">7. Tus derechos</h2>
            <p class="mb-3">Tienes derecho a:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Acceso:</strong> conocer qué datos tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos.</li>
              <li><strong>Oposición y limitación</strong> del tratamiento.</li>
              <li><strong>Portabilidad</strong> de tus datos.</li>
              <li><strong>Retirar el consentimiento</strong> en cualquier momento, sin efecto retroactivo.</li>
            </ul>
            <p class="mt-3">
              Para ejercer cualquiera de estos derechos, escríbenos a
              <a href="mailto:agustin@consergi.com" class="underline text-stone-500 hover:text-stone-800">agustin@consergi.com</a>.
              También puedes presentar una reclamación ante la
              <a href="https://www.aepd.es" target="_blank" rel="noopener" class="underline text-stone-500 hover:text-stone-800">Agencia Española de Protección de Datos (AEPD)</a>.
            </p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">8. Cookies</h2>
            <p class="mb-3">
              Este sitio utiliza una cookie técnica propia (<code>mc_cookies</code>) para recordar tu preferencia
              de consentimiento. No se instalan cookies de terceros hasta que aceptes el uso de analítica.
            </p>
            <p>Puedes revocar tu consentimiento en cualquier momento borrando las cookies de tu navegador.</p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">9. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política para reflejar cambios en el servicio o la legislación.
              Te recomendamos revisarla periódicamente. La fecha de última actualización aparece al inicio del documento.
            </p>
          </section>

        </div>
      </template>

      <!-- ─── ENGLISH ─────────────────────────────────────────────────────────── -->
      <template v-else>
        <h1 class="font-serif text-3xl font-bold text-stone-800 mb-2">Privacy Policy</h1>
        <p class="text-stone-400 text-sm mb-10">Last updated: April 2026</p>

        <div class="space-y-10 text-stone-700 leading-relaxed">

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">1. Data Controller</h2>
            <p>
              The data controller for personal data collected through this website is
              <strong>Agustín Ponce</strong>, owner of the service <strong>Consergi</strong>
              (consergi.com), reachable at
              <a href="mailto:agustin@consergi.com" class="underline text-stone-500 hover:text-stone-800">agustin@consergi.com</a>.
            </p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">2. Data We Collect</h2>
            <p class="mb-3">We only collect data you voluntarily provide:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Contact / demo request form:</strong> name, hotel name, email address, and phone number (optional).</li>
              <li><strong>Anonymous usage data:</strong> session events, selected language, interactions with the virtual assistant (no personal guest identification).</li>
              <li><strong>Technical and analytics cookies:</strong> we store a cookie preference in your browser (<code>mc_cookies</code>) and may use usage analytics tools.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">3. Purpose of Processing</h2>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Handle your demo request</strong> and contact you to provide information about Consergi.</li>
              <li><strong>Improve the service</strong> through aggregated, anonymous usage data.</li>
              <li><strong>Comply with applicable legal obligations.</strong></li>
            </ul>
            <p class="mt-3">We do not use your data for mass marketing without your explicit consent.</p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">4. Legal Basis</h2>
            <p>
              Processing is based on the <strong>consent</strong> you give by completing the contact form
              (Art. 6.1.a GDPR) and on the <strong>legitimate interest</strong> of Consergi to improve its service
              (Art. 6.1.f GDPR).
            </p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">5. Data Retention</h2>
            <p>
              Contact form data is retained for as long as necessary to handle your request and, if a contractual
              relationship is established, for the applicable legal period.
              Anonymous usage data may be retained indefinitely as it is not personally identifiable.
            </p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">6. Recipients</h2>
            <p class="mb-3">Your data may be processed by the following service providers acting as data processors:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Resend</strong> (resend.com) — email delivery.</li>
              <li><strong>Vercel</strong> (vercel.com) — web hosting and serverless functions.</li>
              <li><strong>Google Firebase / Firestore</strong> — service database.</li>
              <li><strong>OpenAI</strong> — itinerary generation and virtual assistant responses.</li>
            </ul>
            <p class="mt-3">All providers operate under their own privacy policies and GDPR compliance guarantees.</p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">7. Your Rights</h2>
            <p class="mb-3">You have the right to:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> know what data we hold about you.</li>
              <li><strong>Rectification:</strong> correct inaccurate data.</li>
              <li><strong>Erasure:</strong> request deletion of your data.</li>
              <li><strong>Objection and restriction</strong> of processing.</li>
              <li><strong>Data portability.</strong></li>
              <li><strong>Withdraw consent</strong> at any time, without retroactive effect.</li>
            </ul>
            <p class="mt-3">
              To exercise any of these rights, contact us at
              <a href="mailto:agustin@consergi.com" class="underline text-stone-500 hover:text-stone-800">agustin@consergi.com</a>.
              You may also lodge a complaint with the
              <a href="https://www.aepd.es" target="_blank" rel="noopener" class="underline text-stone-500 hover:text-stone-800">Spanish Data Protection Agency (AEPD)</a>.
            </p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">8. Cookies</h2>
            <p class="mb-3">
              This site uses a first-party technical cookie (<code>mc_cookies</code>) to remember your consent preference.
              No third-party cookies are set until you accept analytics use.
            </p>
            <p>You can withdraw consent at any time by clearing your browser cookies.</p>
          </section>

          <section>
            <h2 class="text-base font-bold uppercase tracking-widest text-stone-800 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this policy to reflect changes to the service or applicable law.
              We recommend reviewing it periodically. The last updated date appears at the top of this document.
            </p>
          </section>

        </div>
      </template>

      <!-- Footer -->
      <div class="mt-16 pt-8 border-t border-stone-200 flex items-center justify-between text-xs text-stone-400">
        <span>© 2026 Consergi</span>
        <a href="mailto:agustin@consergi.com" class="hover:text-stone-700 transition-colors">agustin@consergi.com</a>
      </div>

    </div>
  </div>
</template>
