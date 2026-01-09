const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const data = require('./datos.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadData() {
  for (const hotelId in data.hotels) {
    await db.collection('hotels').doc(hotelId).set(data.hotels[hotelId]);
    console.log(`✅ Hotel ${hotelId} subido con éxito`);
  }
  console.log('🚀 Proceso finalizado');
}

uploadData();