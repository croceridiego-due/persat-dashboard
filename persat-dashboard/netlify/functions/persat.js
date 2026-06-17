// netlify/functions/persat.js
// Proxy seguro entre el dashboard y la API de Persat.
const BASE_URL = "https://api.persat.com.ar/v1";

exports.handler = async function (event) {
  const API_KEY = process.env.PERSAT_API_KEY;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: { userMessage: "PERSAT_API_KEY no está configurada en Netlify." },
      }),
    };
  }

  const params = event.queryStringParameters || {};
  const { endpoint = "deliveries" } = params;

  let persatUrl;

  if (endpoint === "deliveries") {
    // Listar entregas con paginación cursor
    const { limit = 100, next, uid_client } = params;
    persatUrl = `${BASE_URL}/deliveries?limit=${limit}`;
    if (next) persatUrl += `&next=${encodeURIComponent(next)}`;
    if (uid_client) persatUrl += `&uid_client=${encodeURIComponent(uid_client)}`;

  } else if (endpoint === "devices") {
    // Listar dispositivos (para obtener sus IDs)
    persatUrl = `${BASE_URL}/devices`;

  } else if (endpoint === "tracking") {
    // Estadísticas de rastreo: KM por dispositivo por día
    // Requiere: device_id y date (YYYY-MM-DD)
    const { device_id, date } = params;
    if (!device_id || !date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: { userMessage: "Se requieren device_id y date (YYYY-MM-DD)" } }),
      };
    }
    persatUrl = `${BASE_URL}/devices-pathtrack-sumary/${date}/${device_id}`;

  } else {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: { userMessage: `Endpoint desconocido: ${endpoint}` } }),
    };
  }

  try {
    const response = await fetch(persatUrl, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return { statusCode: response.status, headers, body: JSON.stringify(data) };
  } catch (err) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        success: false,
        error: { userMessage: "Error al contactar la API de Persat: " + err.message },
      }),
    };
  }
};
