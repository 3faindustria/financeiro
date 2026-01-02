export default async function handler(req, res) {
  const BASE_URL = "https://3fa.nomus.com.br/3fa/rest";
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  const { endpoint, dataInicio, dataFim, pagina = 0 } = req.query;

  const formatarData = (dataISO) => {
    if (!dataISO) return null;
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  try {
    const dIni = formatarData(dataInicio);
    const dFim = formatarData(dataFim);

    // Constrói a query de data
    let queryStr = "";
    if (dIni && dFim) {
      queryStr = `dataVencimento>=${dIni};dataVencimento<=${dFim}`;
    }

    // MONTAGEM DA URL: Query primeiro, Página depois.
    // Ex: .../contasPagar?query=dataVencimento>=...;pagina=0
    let urlFinal = `${BASE_URL}/${endpoint}?`;
    if (queryStr) urlFinal += `query=${queryStr};`;
    urlFinal += `pagina=${pagina}`;

    const response = await fetch(urlFinal, {
      method: "GET",
      headers: {
        "Authorization": AUTH_KEY,
        "Accept": "application/json"
      }
    });

    // Se o Nomus retornar erro de sintaxe, capturamos aqui
    if (!response.ok) {
        const erroTexto = await response.text();
        return res.status(response.status).json({ error: erroTexto, urlGerada: urlFinal });
    }

    const data = await response.json();
    
    return res.status(200).json({
      content: Array.isArray(data) ? data : (data.content || []),
      urlGerada: urlFinal
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}


