// netlify/functions/persat.js
// Proxy seguro entre el dashboard y la API de Persat.
// El API key NUNCA llega al navegador — vive solo en variables de entorno de Netlify.

const BASE_URL = "https://api.persat.com.ar/v1";

exports.handler = async function (event) {
  const API_KEY = process.env.PERSAT_API_KEY;

  // Headers CORS: permiten que el dashboard (mismo dominio) consuma la function
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Preflight OPTIONS (requerido por CORS)
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

  // Parámetros que llegan desde el dashboard
  const { endpoint = "deliveries", limit = 100, next } = event.queryStringParameters || {};

  // Construir la URL del endpoint de Persat
  let persatUrl = `${BASE_URL}/${endpoint}?limit=${limit}`;
  if (next) persatUrl += `&next=${encodeURIComponent(next)}`;

  try {
    const response = await fetch(persatUrl, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data),
    };
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
