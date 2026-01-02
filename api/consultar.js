export default async function handler(req, res) {
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  const { endpoint, params } = req.query;

  // Lista de URLs prováveis que o Nomus usa
  const basesParaTestar = [
    `https://3fa.nomus.com.br/erp/rest`,
    `https://3fa.nomus.com.br/nomus-erp/rest`,
    `https://3fa.nomus.com.br/rest`
  ];

  for (let base of basesParaTestar) {
    const urlFinal = `${base}/${endpoint}?${params || ""}`;
    try {
      const response = await fetch(urlFinal, {
        headers: { "Authorization": AUTH_KEY, "Accept": "application/json" }
      });

      if (response.status === 200) {
        const data = await response.json();
        return res.status(200).json(data);
      }
      
      console.log(`Tentativa em ${base} resultou em: ${response.status}`);
    } catch (e) {
      continue;
    }
  }

  return res.status(404).json({ 
    error: "O Nomus recusou todas as variações de URL. Verifique o caminho correto no seu suporte TI." 
  });
}
