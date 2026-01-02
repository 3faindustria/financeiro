export default async function handler(req, res) {
  const BASE_URL = "https://3fa.nomus.com.br/3fa/rest";
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  const { endpoint, dataInicio, dataFim, pagina = 0 } = req.query;

  if (!endpoint) return res.status(400).json({ error: "Endpoint não informado" });

  const formatarParaNomus = (dataISO) => {
    if (!dataISO) return null;
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  try {
    const dIni = formatarParaNomus(dataInicio);
    const dFim = formatarParaNomus(dataFim);

    let queryStr = "";
    if (dIni && dFim) {
      queryStr = `dataVencimento>=${dIni};dataVencimento<=${dFim}`;
    } else if (dIni) {
      queryStr = `dataVencimento>=${dIni}`;
    } else if (dFim) {
      queryStr = `dataVencimento<=${dFim}`;
    }

    // O segredo: encodeURIComponent transforma os símbolos em códigos que a URL aceita (ex: ; vira %3B)
    const urlFinal =  `https://3fa.nomus.com.br/3fa/rest/contasReceber`; // `${BASE_URL}/${endpoint}?pagina=${pagina}${queryStr ? `&query=${encodeURIComponent(queryStr)}` : ""}`;

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





