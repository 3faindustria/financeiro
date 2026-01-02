export default async function handler(req, res) {
  // Puxa as credenciais das variáveis de ambiente da Vercel
  const BASE_URL = "https://3fa.nomus.com.br/3fa/rest"; 
  const AUTH_KEY = process.env.NOMUS_AUTH_KEY;

  try {
    // Requisição direta ao endpoint padrão indicado na sua documentação
    const response = await fetch(`${BASE_URL}/contasReceber`, {
      method: "GET",
      headers: {
        "Authorization": AUTH_KEY,
        "Accept": "application/json"
      }
    });

    // Se o Nomus responder, repassamos o que ele enviou (seja erro ou dados)
    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    // Erro caso o servidor da Vercel não consiga nem "enxergar" o da Nomus
    return res.status(500).json({ 
      error: "Falha de conexão física", 
      message: error.message 
    });
  }
}

