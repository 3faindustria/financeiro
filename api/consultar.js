export default async function handler(req, res) {
  const BASE_URL = "https://3fa.nomus.com.br/3fa/rest"; 
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  const { endpoint } = req.query; // Recebe 'contasReceber' ou 'contasPagar'

  if (!endpoint) {
    return res.status(400).json({ error: "Endpoint não especificado" });
  }

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: "GET",
      headers: {
        "Authorization": AUTH_KEY,
        "Accept": "application/json"
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: "Erro na conexão", message: error.message });
  }
}
