function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function stringParaNumero(str) {
    if (typeof str === 'number') return str;
    if (!str || typeof str !== 'string') return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

async function buscarDados() {
    const corpo = document.getElementById("tabela-corpo");
    const tipoSelect = document.getElementById("filtro-tipo");
    
    if (!corpo || !tipoSelect) return;

    const tipo = tipoSelect.value;
    const dataInicio = document.getElementById("data-inicio")?.value || "";
    const dataFim = document.getElementById("data-fim")?.value || "";
    
    corpo.innerHTML = '<tr><td colspan="6" style="text-align:center">Buscando no Nomus...</td></tr>';

    try {
        let url = `/api/consultar?endpoint=${tipo}`;
        if (dataInicio) url += `&dataVencimentoDe=${dataInicio}`;
        if (dataFim) url += `&dataVencimentoAte=${dataFim}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        
        const dados = await response.json();
        let lista = Array.isArray(dados) ? dados : (dados.content || []);

        // Ordenação por data
        lista.sort((a, b) => {
            const extrair = (item) => {
                const p = (item.dataVencimento || "01/01/1900").split('/');
                return new Date(p[2], p[1] - 1, p[0]);
            };
            return extrair(a) - extrair(b);
        });

        let totalPrevisto = 0, totalRealizado = 0;
        corpo.innerHTML = "";
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        lista.forEach(item => {
            // Lógica unificada para Pagar ou Receber
            const vPrev = stringParaNumero(item.valorReceber || item.valorPagar);
            const vReal = stringParaNumero(item.valorRecebido || item.valorPago);
            const vSaldo = stringParaNumero(item.saldoReceber || item.saldoPagar || (vPrev - vReal));

            totalPrevisto += vPrev; 
            totalRealizado += vReal;

            const partes = (item.dataVencimento || "01/01/1900").split('/');
            const dataVenc = new Date(partes[2], partes[1] - 1, partes[0]);
            
            // Regra: Vencido se Data < Hoje E ainda tem saldo
            const estaVencido = dataVenc < hoje && vSaldo > 0.05;

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

        // Atualiza Resumo
        const saldoFinal = totalPrevisto - totalRealizado;
        document.getElementById("resumo-previsto").innerText = formatarMoeda(totalPrevisto);
        document.getElementById("resumo-realizado").innerText = formatarMoeda(totalRealizado);
        const resumoSaldo = document.getElementById("resumo-saldo");
        resumoSaldo.innerText = formatarMoeda(saldoFinal);
        
        // Cor do saldo: Verde se Receber, Vermelho se Pagar
        resumoSaldo.style.color = tipo === "contasReceber" ? "#2e7d32" : "#cf1322";

    } catch (error) {
        console.error("Erro na busca:", error);
        corpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">Erro ao carregar: ${error.message}</td></tr>`;
    }
}
