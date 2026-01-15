import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Importamos el JSON de esta forma para evitar errores de permisos en ES Modules
const serviceAccount = require('./serviceAccountKey.json');
const data = require('./datos.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadData() {
  for (const hotelId in data.hotels) {
    // Usamos set() para sobrescribir o crear el documento
    await db.collection('hotels').doc(hotelId).set(data.hotels[hotelId]);
    console.log(`✅ Hotel ${hotelId} subido con éxito`);
  }
  console.log('🚀 Proceso finalizado');
}

uploadData();