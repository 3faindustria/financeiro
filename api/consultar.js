export default async function handler(req, res) {
  const BASE_URL = "https://3fa.nomus.com.br/3fa/rest";
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  const { endpoint, dataInicio, dataFim, pagina = 0 } = req.query;

  if (!endpoint) return res.status(400).json({ error: "Endpoint não informado" });

  try {
    // MONTAGEM DA SINTAXE NOMUS: query=dataVencimento>=AAAA-MM-DD;dataVencimento<=AAAA-MM-DD
    let filtroQuery = "";
    if (dataInicio && dataFim) {
      filtroQuery = `&query=dataVencimento>=${dataInicio};dataVencimento<=${dataFim}`;
    } else if (dataInicio) {
      filtroQuery = `&query=dataVencimento>=${dataInicio}`;
    } else if (dataFim) {
      filtroQuery = `&query=dataVencimento<=${dataFim}`;
    }

    // A URL final enviada ao Nomus será: .../contasReceber?pagina=0&query=...
    const urlFinal = `${BASE_URL}/${endpoint}?pagina=${pagina}${filtroQuery}`;

    const response = await fetch(urlFinal, {
      method: "GET",
      headers: {
        "Authorization": AUTH_KEY,
        "Accept": "application/json"
      }
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
