export default async function handler(req, res) {
  const BASE_URL = "https://3fa.nomus.com.br/3fa/rest";
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  const { endpoint, dataInicio, dataFim } = req.query;

  if (!endpoint) return res.status(400).json({ error: "Endpoint não informado" });

  try {
    // Constrói a query de data: dataVencimento>=2026-01-01;dataVencimento<=2026-01-31
    let queryParams = "";
    if (dataInicio && dataFim) {
      queryParams = `?query=dataVencimento>=${dataInicio};dataVencimento<=${dataFim}`;
    } else if (dataInicio) {
      queryParams = `?query=dataVencimento>=${dataInicio}`;
    } else if (dataFim) {
      queryParams = `?query=dataVencimento<=${dataFim}`;
    }

    const response = await fetch(`${BASE_URL}/${endpoint}${queryParams}`, {
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
