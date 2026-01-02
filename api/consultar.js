export default async function handler(req, res) {
  const BASE_URL = process.env.NOMUS_BASE_URL;
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;

  const { endpoint, params } = req.query;

  try {
    const urlFinal = `${BASE_URL}/${endpoint}?${params || ""}`;
    
    const response = await fetch(urlFinal, {
      method: "GET",
      headers: {
        "Authorization": AUTH_KEY,
        "Accept": "application/json"
      }
    });

    // Se a Nomus responder, mas com erro (ex: 401 ou 500)
    if (!response.ok) {
      const textoErro = await response.text();
      return res.status(response.status).json({ 
        error: `Nomus respondeu com erro ${response.status}`,
        details: textoErro 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    // Se nem sequer conseguir chegar no servidor da Nomus
    return res.status(500).json({ 
      error: "Falha física na conexão", 
      message: error.message 
    });
  }
}

