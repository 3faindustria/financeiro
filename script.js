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
    const tipo = document.getElementById("filtro-tipo").value;
    const dataInicio = document.getElementById("data-inicio").value; // Formato AAAA-MM-DD nativo
    const dataFim = document.getElementById("data-fim").value;     // Formato AAAA-MM-DD nativo
    
    corpo.innerHTML = '<tr><td colspan="6" style="text-align:center">Buscando no Nomus...</td></tr>';

    try {
        // Envia os parâmetros para o nosso servidor na Vercel [cite: 1, 10, 16]
        const url = `/api/consultar?endpoint=${tipo}&dataInicio=${dataInicio}&dataFim=${dataFim}`;
        const response = await fetch(url);
        const dados = await response.json();
        
        let lista = Array.isArray(dados) ? dados : (dados.content || []);

        // Reutilizamos sua lógica de ordenação e limpeza de valores
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
        hoje.setHours(0,0,0,0);

        lista.forEach(item => {
            const vPrev = Math.abs(stringParaNumero(item.valorReceber || item.valorPagar));
            const vReal = Math.abs(stringParaNumero(item.valorRecebido || item.valorPago));
            const vSaldo = vPrev - vReal;

            totalPrevisto += vPrev; 
            totalRealizado += vReal;

            const partes = (item.dataVencimento || "01/01/1900").split('/');
            const dataVenc = new Date(partes[2], partes[1] - 1, partes[0]);
            const estaVencido = dataVenc < hoje && vSaldo > 0.10;

            if (estaVencido) totalAtrasado += vSaldo;

            // Busca o nome amigável da classificação
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

        // Atualização do Dashboard [cite: 5, 6, 7, 8, 9]
        document.getElementById("resumo-previsto").innerText = formatarMoeda(totalPrevisto);
        document.getElementById("resumo-realizado").innerText = formatarMoeda(totalRealizado);
        document.getElementById("resumo-saldo").innerText = formatarMoeda(totalPrevisto - totalRealizado);
        document.getElementById("resumo-atrasado").innerText = formatarMoeda(totalAtrasado);

    } catch (error) {
        corpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">Erro: ${error.message}</td></tr>`;
    }
}
