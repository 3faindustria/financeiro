function formatarMoeda(valor) {
    // Garante que o valor exibido seja sempre positivo visualmente se você preferir, 
    // ou mantenha o sinal se quiser indicar saída de caixa.
    return Math.abs(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function stringParaNumero(str) {
    if (typeof str === 'number') return str;
    if (!str || typeof str !== 'string') return 0;
    
    // Remove tudo que não é número, vírgula ou o sinal de menos inicial
    // Isso trata o "-R$ 150,00" transformando em "-150,00"
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

        // Ordenação
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
            // Pegamos o valor absoluto para o cálculo de saldo não bugar com sinais negativos 
            const vPrev = Math.abs(stringParaNumero(item.valorReceber || item.valorPagar));
            const vReal = Math.abs(stringParaNumero(item.valorRecebido || item.valorPago));
            
            // O saldo é o que falta pagar ou receber
            const vSaldo = vPrev - vReal;

            totalPrevisto += vPrev; 
            totalRealizado += vReal;

            const partes = (item.dataVencimento || "01/01/1900").split('/');
            const dataVenc = new Date(partes[2], partes[1] - 1, partes[0]);
            
            // REGRA: Vencido se Data < Hoje E ainda existe saldo significativo 
            const estaVencido = dataVenc < hoje && vSaldo > 0.10;

            if (estaVencido) {
                totalAtrasado += vSaldo;
            }

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

        // Atualiza Resumo (Tratando como Contas a Pagar = Saída/Negativo no Saldo se desejar)
        const saldoFinal = totalPrevisto - totalRealizado;
        document.getElementById("resumo-previsto").innerText = formatarMoeda(totalPrevisto);
        document.getElementById("resumo-realizado").innerText = formatarMoeda(totalRealizado);
        
        const resSaldo = document.getElementById("resumo-saldo");
        resSaldo.innerText = formatarMoeda(saldoFinal);
        resSaldo.style.color = tipo === "contasReceber" ? "#2e7d32" : "#cf1322";

        const resAtrasado = document.getElementById("resumo-atrasado");
        if (resAtrasado) {
            resAtrasado.innerText = formatarMoeda(totalAtrasado);
        }

    } catch (error) {
        corpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">Erro: ${error.message}</td></tr>`;
    }
}
