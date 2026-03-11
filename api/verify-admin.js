import crypto from "crypto";

// Deterministic session token — same password always produces same token.
// No server-side state needed; validated by admin-data.js using the same derivation.
function makeSessionToken(pass) {
  return crypto.createHmac("sha256", pass).update("mi-concierge-admin-session").digest("hex");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password } = req.body || {};
  const correct = process.env.ADMIN_PASS;

  if (!correct) {
    return res.status(500).json({ error: "ADMIN_PASS environment variable is not set on the server." });
  }

  if (password === correct) {
    return res.status(200).json({ ok: true, token: makeSessionToken(correct) });
  }

  return res.status(401).json({ error: "Incorrect passcode." });
}
