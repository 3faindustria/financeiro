export default async function handler(req, res) {
  const BASE_URL = "https://3fa.nomus.com.br/3fa/rest";
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  const { endpoint, dataInicio, dataFim, pagina = 0 } = req.query;

  if (!endpoint) return res.status(400).json({ error: "Endpoint não informado" });

  // Converte AAAA-MM-DD para DD/MM/AAAA conforme manual Nomus
  const formatarData = (dataISO) => {
    if (!dataISO) return null;
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  try {
    const dIni = formatarData(dataInicio);
    const dFim = formatarData(dataFim);

    // Constrói a query exatamente: dataVencimento>=01/01/2026;dataVencimento<=31/01/2026
    let queryParams = "";
    if (dIni && dFim) {
      queryParams = `&query=dataVencimento>=${dIni};dataVencimento<=${dFim}`;
    } else if (dIni) {
      queryParams = `&query=dataVencimento>=${dIni}`;
    } else if (dFim) {
      queryParams = `&query=dataVencimento<=${dFim}`;
    }

    // URL Final Exata
    const urlFinal = `${BASE_URL}/${endpoint}?pagina=${pagina}${queryParams}`;

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
