// netlify/functions/persat.js
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

  const { endpoint = "deliveries", limit = 100, next, uid_client } = event.queryStringParameters || {};

  let persatUrl = `${BASE_URL}/${endpoint}?limit=${limit}`;
  if (next) persatUrl += `&next=${encodeURIComponent(next)}`;
  if (uid_client) persatUrl += `&uid_client=${encodeURIComponent(uid_client)}`;

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
