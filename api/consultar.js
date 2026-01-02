export default async function handler(req, res) {
  const BASE_URL = process.env.NOMUS_BASE_URL.replace(/\/$/, ""); 
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;

  // Forçamos o endpoint padrão para teste de conexão
  const urlFinal = `${BASE_URL}/contasReceber`;

  try {
    const response = await fetch(urlFinal, {
      method: "GET",
      headers: {
        "Authorization": AUTH_KEY,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const detalheErro = await response.text();
      return res.status(response.status).json({ 
        error: `Nomus recusou o acesso (${response.status})`,
        url_tentada: urlFinal,
        resposta_servidor: detalheErro
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Falha de rede ao tentar alcançar o Nomus." });
  }
}
