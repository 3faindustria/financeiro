export default async function handler(req, res) {
  // O replace remove barras extras caso você tenha digitado na Vercel por engano
  const BASE_URL = process.env.NOMUS_BASE_URL.replace(/\/$/, ""); 
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  const { endpoint, params } = req.query;

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
        error: `Erro no servidor Nomus (${response.status})`,
        url_tentada: urlFinal 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Falha na conexão com o servidor" });
  }
}
