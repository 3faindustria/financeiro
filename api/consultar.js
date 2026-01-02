export default async function handler(req, res) {
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;
  
  // Lista de caminhos base possíveis para o Nomus
  const caminhos = [
    "https://3fa.nomus.com.br/3fa/rest",
    "https://3fa.nomus.com.br/3fa/api",
    "https://3fa.nomus.com.br/rest",
    "https://3fa.nomus.com.br/3fa"
  ];

  let logTentativas = [];

  for (let base of caminhos) {
    const urlTeste = `${base}/contasReceber`;
    try {
      const response = await fetch(urlTeste, {
        method: "GET",
        headers: { "Authorization": AUTH_KEY, "Accept": "application/json" }
      });

      if (response.status === 200) {
        const data = await response.json();
        return res.status(200).json({ 
            msg: "SUCESSO encontrado!", 
            url_correta: base, 
            dados: data 
        });
      }
      logTentativas.push(`${urlTeste} -> Erro ${response.status}`);
    } catch (e) {
      logTentativas.push(`${urlTeste} -> Falha de rede`);
    }
  }

  return res.status(404).json({ 
    error: "Nenhum caminho funcionou", 
    detalhes: logTentativas 
  });
}

