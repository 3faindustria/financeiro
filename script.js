function formatarMoeda(valor) {
    // Exibe o valor absoluto formatado como Real Brasileiro
    return Math.abs(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function stringParaNumero(str) {
    if (typeof str === 'number') return str;
    if (!str || typeof str !== 'string') return 0;
    // Remove R$, espaços e pontos, mantendo o sinal de menos e a vírgula decimal
    let limpeza = str.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(limpeza) || 0;
}

async function buscarDados() {
    const corpo = document.getElementById("tabela-corpo");
    const tipoSelect = document.getElementById("filtro-tipo");
    if (!corpo || !tipoSelect) return;

    const tipo = tipoSelect.value;
    const dataInicio = document.getElementById("data-inicio")?.value || "";
    const dataFim = document.getElementById("data-fim")?.value || "";
    
    corpo.innerHTML = '<tr><td colspan="6" style="text-align:center">Buscando dados no Nomus...</td></tr>';

    try {
        let url = `/api/consultar?endpoint=${tipo}`;
        if (dataInicio) url += `&dataVencimentoDe=${dataInicio}`;
        if (dataFim) url += `&dataVencimentoAte=${dataFim}`;

        const response = await fetch(url);
        const dados = await response.json();
        let lista = Array.isArray(dados) ? dados : (dados.content || []);

        // Ordenação por vencimento
        lista.sort((a, b) => {
            const conv = (s) => {
                const p = (s || "01/01/1900").split('/');
                return new Date(p[2], p[1]-1, p[0]);
            };
            return conv(a.dataVencimento) - conv(b.dataVencimento);
        });

        let totalPrevisto = 0, totalRealizado = 0, totalAtrasado = 0;
        corpo.innerHTML = "";
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        lista.forEach(item => {
            // Tratamento de valores negativos (Contas a Pagar) 
            const vPrev = Math.abs(stringParaNumero(item.valorReceber || item.valorPagar));
            const vReal = Math.abs(stringParaNumero(item.valorRecebido || item.valorPago));
            const vSaldo = vPrev - vReal;

            totalPrevisto += vPrev; 
            totalRealizado += vReal;

            const partes = (item.dataVencimento || "01/01/1900").split('/');
            const dataVenc = new Date(partes[2], partes[1] - 1, partes[0]);
            
            // Regra: Vencido se Data < Hoje E ainda existe saldo [cite: 10, 15]
            const estaVencido = dataVenc < hoje && vSaldo > 0.10;

            if (estaVencido) {
                totalAtrasado += vSaldo;
            }

            // AJUSTE NA CLASSIFICAÇÃO: Tenta pegar o nome/descrição, se não houver, usa o código 
            const descClassificacao = item.nomeClassificacaoFinanceira || item.nomeClassificacao || item.classificacao;

            const tr = document.createElement("tr");
            if (estaVencido) tr.classList.add("linha-vencida");

            tr.innerHTML = `
                <td>${descClassificacao || '-'}</td>
                <td>${item.nomePessoa || '-'}</td>
                <td style="font-weight: bold;">
                    ${item.dataVencimento}
                    ${estaVencido ? '<span class="atraso-badge">VENCIDO</span>' : ''}
                </td>
                <td>${item.descricaoLancamento || '-'}</td>
                <td>${formatarMoeda(vPrev)}</td>
                <td>${formatarMoeda(vReal)}</td>
            `;
            corpo.appendChild(tr);
        });

        // Atualização do Resumo [cite: 5, 9]
        document.getElementById("resumo-previsto").innerText = formatarMoeda(totalPrevisto);
        document.getElementById("resumo-realizado").innerText = formatarMoeda(totalRealizado);
        
        const resSaldo = document.getElementById("resumo-saldo");
        resSaldo.innerText = formatarMoeda(totalPrevisto - totalRealizado);
        resSaldo.style.color = tipo === "contasReceber" ? "#2e7d32" : "#cf1322";

        const resAtrasado = document.getElementById("resumo-atrasado");
        if (resAtrasado) {
            resAtrasado.innerText = formatarMoeda(totalAtrasado);
        }

    } catch (error) {
        corpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">Erro: ${error.message}</td></tr>`;
    }
}

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

