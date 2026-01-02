export default async function handler(req, res) {
  const BASE_URL = "https://3fa.nomus.com.br/3fa/rest";
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  const { endpoint, dataInicio, dataFim, pagina = 0 } = req.query;

  if (!endpoint) return res.status(400).json({ error: "Endpoint não informado" });

  // Função interna para converter AAAA-MM-DD para DD/MM/AAAA
  const formatarParaNomus = (dataISO) => {
    if (!dataISO) return null;
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  try {
    const dIniFormatada = formatarParaNomus(dataInicio);
    const dFimFormatada = formatarParaNomus(dataFim);

    // MONTAGEM DA SINTAXE NOMUS (dd/mm/aaaa)
    let filtroQuery = "";
    if (dIniFormatada && dFimFormatada) {
      filtroQuery = `&query=dataVencimento>=${dIniFormatada};dataVencimento<=${dFimFormatada}`;
    } else if (dIniFormatada) {
      filtroQuery = `&query=dataVencimento>=${dIniFormatada}`;
    } else if (dFimFormatada) {
      filtroQuery = `&query=dataVencimento<=${dFimFormatada}`;
    }

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
