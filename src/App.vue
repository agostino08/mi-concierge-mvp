<script setup>
import { ref, onMounted } from "vue";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// Estados
const loading = ref(true);
const generating = ref(false);
const hotelData = ref(null);
const itinerary = ref(null);
const error = ref(null);

// Formulario
const formData = ref({
  days: 3,
  group: "Pareja",
  interests: "Gastronomía y Cultura",
});

// Al cargar la página
onMounted(async () => {
  // 1. Buscamos el ID del hotel en la URL (?hotel=id)
  const params = new URLSearchParams(window.location.search);
  const hotelId = params.get("hotel");

  if (!hotelId) {
    error.value =
      "No se especificó ningún hotel. Usa ?hotel=hotel_demo en la URL.";
    loading.value = false;
    return;
  }

  // 2. Cargamos datos de Firebase
  try {
    const docRef = doc(db, "hotels", hotelId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      hotelData.value = docSnap.data();
    } else {
      error.value = "Hotel no encontrado.";
    }
  } catch (e) {
    error.value = "Error de conexión: " + e.message;
  } finally {
    loading.value = false;
  }
});

// Función para llamar a la IA
const createItinerary = async () => {
  generating.value = true;
  itinerary.value = null;

  try {
    // Llamada a TU backend (carpeta /api)
    const response = await fetch("/api/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotel: hotelData.value,
        user: formData.value,
      }),
    });

    const data = await response.json();
    if (data.itinerary) {
      itinerary.value = data.itinerary;
    } else {
      alert("Error al generar. Intenta de nuevo.");
    }
  } catch (e) {
    alert("Error: " + e.message);
  } finally {
    generating.value = false;
  }
};
</script>

<template>
  <div class="container">
    <div v-if="error" class="error">{{ error }}</div>

    <div v-else-if="loading" class="loading">Cargando perfil del hotel...</div>

    <div v-else class="app-content">
      <header>
        <h1>Bienvenido a {{ hotelData.name }}</h1>
        <p>Tu concierge digital personal en {{ hotelData.city }}</p>
      </header>

      <div v-if="!itinerary" class="form-section">
        <h2>Diseña tu estancia perfecta</h2>

        <label>¿Cuántos días?</label>
        <select v-model="formData.days">
          <option v-for="n in 7" :key="n" :value="n">{{ n }} Días</option>
        </select>

        <label>¿Con quién viajas?</label>
        <select v-model="formData.group">
          <option>Solo</option>
          <option>Pareja</option>
          <option>Familia con niños</option>
          <option>Amigos</option>
          <option>Negocios</option>
        </select>

        <label>¿Qué te apetece? (Ej: Arte, Fiesta, Vegano...)</label>
        <input
          v-model="formData.interests"
          type="text"
          placeholder="Escribe tus intereses..."
        />

        <button
          @click="createItinerary"
          :disabled="generating"
          class="btn-primary"
        >
          {{ generating ? "✨ La IA está pensando..." : "Generar Itinerario" }}
        </button>
      </div>

      <div v-if="itinerary" class="results-section">
        <button @click="itinerary = null" class="btn-back">
          ← Volver / Cambiar datos
        </button>

        <div v-for="day in itinerary" :key="day.day" class="day-card">
          <h3>Día {{ day.day }}: {{ day.title }}</h3>
          <div class="timeline">
            <div
              v-for="(act, index) in day.activities"
              :key="index"
              class="activity"
              :class="{ partner: act.is_partner }"
            >
              <span class="time">{{ act.time }}</span>
              <div class="details">
                <strong>{{ act.title }}</strong>
                <span v-if="act.is_partner" class="badge"
                  >🌟 Recomendado Hotel</span
                >
                <p>{{ act.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Estilos básicos para MVP */
body {
  font-family: sans-serif;
  background: #f4f4f4;
  margin: 0;
  padding: 20px;
}
.container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
header {
  text-align: center;
  margin-bottom: 30px;
}
h1 {
  color: #333;
}
.btn-primary {
  width: 100%;
  padding: 15px;
  background: black;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
}
.btn-primary:disabled {
  opacity: 0.7;
}
input,
select {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
}
.day-card {
  margin-top: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}
.activity {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}
.time {
  font-weight: bold;
  color: #666;
  min-width: 50px;
}
.partner {
  background: #fff8e1;
  padding: 10px;
  border-radius: 8px;
  border-left: 4px solid #ffd700;
}
.badge {
  background: #ffd700;
  color: #000;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
  margin-left: 5px;
  font-weight: bold;
}
.btn-back {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  text-decoration: underline;
  margin-bottom: 10px;
}
</style>
