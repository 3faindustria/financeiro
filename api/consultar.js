export default async function handler(req, res) {
  const BASE_URL = process.env.NOMUS_BASE_URL;
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;

  // 1. Pega os parâmetros da URL da requisição
  const { endpoint, params } = req.query;

  // 2. Verificação de segurança: se endpoint for vazio ou undefined
  if (!endpoint || endpoint === 'undefined') {
    return res.status(400).json({ error: "O tipo de consulta (endpoint) não foi selecionado corretamente." });
  }

  const urlFinal = `${BASE_URL}/${endpoint}?${params || ""}`;

  try {
    const response = await fetch(urlFinal, {
      method: "GET",
      headers: {
        "Authorization": AUTH_KEY,
        "Accept": "application/json"
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao conectar na Nomus" });
  }
}
