// api/consultar.js
export default async function handler(req, res) {
  // Limpa possíveis barras no final da URL configurada
  const BASE_URL = process.env.NOMUS_BASE_URL.replace(/\/$/, ""); 
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  const { endpoint, params } = req.query;

  // Monta a URL garantindo uma única barra entre o base e o endpoint
  const urlFinal = `${BASE_URL}/${endpoint}?${params || ""}`;

  try {
    const response = await fetch(urlFinal, {
      method: "GET",
      headers: {
        "Authorization": AUTH_KEY,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Nomus recusou a URL: ${urlFinal}`,
        status: response.status 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Erro de conexão" });
  }
}
