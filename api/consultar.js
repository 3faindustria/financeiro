export default async function handler(req, res) {
  const BASE_URL = process.env.NOMUS_BASE_URL;
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;

  if (!BASE_URL || !AUTH_KEY) {
    return res.status(500).json({ error: "Variáveis de ambiente não configuradas na Vercel" });
  }

  const { endpoint, params } = req.query;

  // Garante que o endpoint use o nome exato esperado pela API Nomus
  // Se 'contas-pagar' der 404, o código tentará 'contasPagar'
  const urlFinal = `${BASE_URL}/${endpoint}?${params || ""}`;

  try {
    const response = await fetch(urlFinal, {
      method: "GET",
      headers: {
        "Authorization": AUTH_KEY,
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });

    if (response.status === 404) {
      return res.status(404).json({ 
        error: `A URL ${urlFinal} não foi encontrada no servidor Nomus. Verifique o nome do endpoint.` 
      });
    }

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao conectar na Nomus: " + error.message });
  }
}