function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function stringParaNumero(str) {
    if (!str || typeof str !== 'string') return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

async function buscarDados() {
    const corpo = document.getElementById("tabela-corpo");
    const tipo = document.getElementById("filtro-tipo").value;
    const dataInicio = document.getElementById("data-inicio").value;
    const dataFim = document.getElementById("data-fim").value;
    
    corpo.innerHTML = '<tr><td colspan="6" style="text-align:center">Buscando no Nomus...</td></tr>';

    try {
        let url = `/api/consultar?endpoint=${tipo}`;
        if(dataInicio) url += `&dataVencimentoDe=${dataInicio}`;
        if(dataFim) url += `&dataVencimentoAte=${dataFim}`;

        const response = await fetch(url);
        const dados = await response.json();
        let lista = Array.isArray(dados) ? dados : (dados.content || []);

        // Ordenação
        lista.sort((a, b) => {
            const pA = a.dataVencimento.split('/');
            const pB = b.dataVencimento.split('/');
            return new Date(pA[2], pA[1]-1, pA[0]) - new Date(pB[2], pB[1]-1, pB[0]);
        });

        let totalPrevisto = 0, totalRealizado = 0;
        corpo.innerHTML = "";
        const hoje = new Date();
        hoje.setHours(0,0,0,0);

        lista.forEach(item => {
            // CAPTURA DINÂMICA: Tenta ler campo de 'Receber' ou 'Pagar'
            const vPrevStr = item.valorReceber || item.valorPagar || "0";
            const vRealStr = item.valorRecebido || item.valorPago || "0";
            const vSaldoStr = item.saldoReceber || item.saldoPagar || "0";

            const vPrev = stringParaNumero(vPrevStr);
            const vReal = stringParaNumero(vRealStr);
            const vSaldo = stringParaNumero(vSaldoStr);

            totalPrevisto += vPrev; 
            totalRealizado += vReal;

            const partes = item.dataVencimento.split('/');
            const dataVenc = new Date(partes[2], partes[1] - 1, partes[0]);
            
            // REGRA: Vencido se Data < Hoje E Saldo ainda existe
            const estaVencido = dataVenc < hoje && vSaldo > 0.01;

            const tr = document.createElement("tr");
            if (estaVencido) tr.classList.add("linha-vencida");

            tr.innerHTML = `
                <td>${item.classificacao || '-'}</td>
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

        document.getElementById("resumo-previsto").innerText = formatarMoeda(totalPrevisto);
        document.getElementById("resumo-realizado").innerText = formatarMoeda(totalRealizado);
        document.getElementById("resumo-saldo").innerText = formatarMoeda(totalPrevisto - totalRealizado);

    } catch (error) {
        corpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">Erro: ${error.message}</td></tr>`;
    }
}
