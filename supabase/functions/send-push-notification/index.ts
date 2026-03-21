import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push utilities
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  const publicKeyBytes = urlBase64ToUint8Array(publicKeyB64);
  const privateKeyBytes = urlBase64ToUint8Array(privateKeyB64);

  const publicKey = await crypto.subtle.importKey(
    "raw",
    publicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    await convertRawToPkcs8(privateKeyBytes),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const signingKey = await crypto.subtle.importKey(
    "pkcs8",
    await convertRawToPkcs8(privateKeyBytes),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );

  return { publicKey, privateKey, signingKey, publicKeyBytes };
}

async function convertRawToPkcs8(rawKey: Uint8Array): Promise<ArrayBuffer> {
  // DER encoding for PKCS8 EC private key
  const header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const middle = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00]);

  // We need the public key too, but for simplicity we'll use a shorter format
  const result = new Uint8Array(header.length + rawKey.length);
  result.set(header);
  result.set(rawKey, header.length);

  // Simplified PKCS8 without public key component
  const pkcs8 = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
    ...rawKey,
  ]);

  return pkcs8.buffer;
}

// Simple JWT for VAPID
async function createVapidJwt(
  audience: string,
  subject: string,
  signingKey: CryptoKey
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const input = enc.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingKey,
    input
  );

  // Convert DER signature to raw r||s format
  const sigArray = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigArray.length === 64) {
    rawSig = sigArray;
  } else {
    // DER decode
    const r = extractDerInt(sigArray, 3);
    const s = extractDerInt(sigArray, 3 + 1 + sigArray[3] + 1);
    rawSig = new Uint8Array(64);
    rawSig.set(padTo32(r), 0);
    rawSig.set(padTo32(s), 32);
  }

  const sigB64 = btoa(String.fromCharCode(...rawSig))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

function extractDerInt(buf: Uint8Array, offset: number): Uint8Array {
  const len = buf[offset + 1];
  return buf.slice(offset + 2, offset + 2 + len);
}

function padTo32(buf: Uint8Array): Uint8Array {
  if (buf.length === 32) return buf;
  if (buf.length > 32) return buf.slice(buf.length - 32);
  const padded = new Uint8Array(32);
  padded.set(buf, 32 - buf.length);
  return padded;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<boolean> {
  try {
    const { signingKey, publicKeyBytes } = await importVapidKeys(
      vapidPublicKey,
      vapidPrivateKey
    );

    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await createVapidJwt(audience, vapidSubject, signingKey);

    const vapidPublicKeyB64 = btoa(String.fromCharCode(...publicKeyBytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Encrypt payload using Web Push encryption
    const clientPublicKey = urlBase64ToUint8Array(subscription.p256dh);
    const clientAuth = urlBase64ToUint8Array(subscription.auth);

    // Generate local ECDH key pair
    const localKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"]
    );

    const localPublicKeyRaw = await crypto.subtle.exportKey(
      "raw",
      localKeyPair.publicKey
    );

    // Import client public key
    const clientKey = await crypto.subtle.importKey(
      "raw",
      clientPublicKey,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );

    // ECDH shared secret
    const sharedSecret = await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey },
      localKeyPair.privateKey,
      256
    );

    // HKDF for content encryption
    const enc = new TextEncoder();
    const authInfo = enc.encode("Content-Encoding: auth\0");
    const prkKey = await crypto.subtle.importKey(
      "raw",
      sharedSecret,
      { name: "HKDF" },
      false,
      ["deriveBits"]
    );

    // IKM = HKDF(auth, sharedSecret, "Content-Encoding: auth\0", 32)
    const ikm = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: clientAuth,
        info: authInfo,
      },
      prkKey,
      256
    );

    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Build context for key/nonce derivation
    const keyInfo = createInfo("aesgcm", clientPublicKey, new Uint8Array(localPublicKeyRaw));
    const nonceInfo = createInfo("nonce", clientPublicKey, new Uint8Array(localPublicKeyRaw));

    const ikmKey = await crypto.subtle.importKey(
      "raw",
      ikm,
      { name: "HKDF" },
      false,
      ["deriveBits"]
    );

    const contentEncryptionKeyBits = await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: keyInfo },
      ikmKey,
      128
    );

    const nonceBits = await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
      ikmKey,
      96
    );

    const contentEncryptionKey = await crypto.subtle.importKey(
      "raw",
      contentEncryptionKeyBits,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    // Pad and encrypt payload
    const payloadBytes = enc.encode(payload);
    const paddedPayload = new Uint8Array(2 + payloadBytes.length);
    paddedPayload[0] = 0;
    paddedPayload[1] = 0;
    paddedPayload.set(payloadBytes, 2);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonceBits, tagLength: 128 },
      contentEncryptionKey,
      paddedPayload
    );

    // Build body
    const body = new Uint8Array(encrypted);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt}, k=${vapidPublicKeyB64}`,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aesgcm",
        Encryption: `salt=${btoa(String.fromCharCode(...salt)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`,
        "Crypto-Key": `dh=${btoa(String.fromCharCode(...new Uint8Array(localPublicKeyRaw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`,
        TTL: "86400",
      },
      body,
    });

    if (response.status === 410 || response.status === 404) {
      console.log("Subscription expired:", subscription.endpoint);
      return false;
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("Push failed:", response.status, text);
      return true; // keep subscription, might be temporary
    }

    return true;
  } catch (err) {
    console.error("Error sending push:", err);
    return true;
  }
}

function createInfo(
  type: string,
  clientPublicKey: Uint8Array,
  serverPublicKey: Uint8Array
): Uint8Array {
  const enc = new TextEncoder();
  const label = enc.encode(`Content-Encoding: ${type}\0P-256\0`);
  const info = new Uint8Array(
    label.length + 2 + clientPublicKey.length + 2 + serverPublicKey.length
  );
  let offset = 0;
  info.set(label, offset);
  offset += label.length;
  info[offset++] = 0;
  info[offset++] = clientPublicKey.length;
  info.set(clientPublicKey, offset);
  offset += clientPublicKey.length;
  info[offset++] = 0;
  info[offset++] = serverPublicKey.length;
  info.set(serverPublicKey, offset);
  return info;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all admin user IDs
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminIds = adminRoles.map((r: any) => r.user_id);

    // Get push subscriptions for admins
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", adminIds);

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      title: "Novo Agendamento! ✂️",
      body: `${record.client_name} quer agendar para ${record.appointment_date} às ${record.appointment_time?.slice(0, 5)}`,
    });

    const expiredEndpoints: string[] = [];
    let sent = 0;

    for (const sub of subscriptions) {
      const kept = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        vapidPublicKey,
        vapidPrivateKey,
        "mailto:admin@artcabelo.com"
      );
      if (!kept) {
        expiredEndpoints.push(sub.endpoint);
      } else {
        sent++;
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
