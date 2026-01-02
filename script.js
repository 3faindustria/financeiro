/**
 * Funções de utilidade para formatação e conversão
 */
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function stringParaNumero(str) {
    if (typeof str === 'number') return str;
    if (!str || typeof str !== 'string') return 0;
    // Remove pontos de milhar e troca vírgula por ponto para cálculo matemático
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

/**
 * Função principal de busca e renderização
 */
async function buscarDados() {
    const corpo = document.getElementById("tabela-corpo");
    const tipoSelect = document.getElementById("filtro-tipo");
    
    // Verifica se os elementos básicos existem na página antes de prosseguir
    if (!corpo || !tipoSelect) return;

    const tipo = tipoSelect.value;
    const dataInicio = document.getElementById("data-inicio")?.value || "";
    const dataFim = document.getElementById("data-fim")?.value || "";
    
    corpo.innerHTML = '<tr><td colspan="6" style="text-align:center">Buscando dados no Nomus...</td></tr>';

    try {
        // Constrói a URL com os filtros de data
        let url = `/api/consultar?endpoint=${tipo}`;
        if (dataInicio) url += `&dataVencimentoDe=${dataInicio}`;
        if (dataFim) url += `&dataVencimentoAte=${dataFim}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
        
        const dados = await response.json();
        let lista = Array.isArray(dados) ? dados : (dados.content || []);

        // 1. Ordenação Cronológica (Do mais antigo para o mais recente)
        lista.sort((a, b) => {
            const converter = (dStr) => {
                if (!dStr) return new Date(0);
                const p = dStr.split('/');
                return new Date(p[2], p[1] - 1, p[0]);
            };
            return converter(a.dataVencimento) - converter(b.dataVencimento);
        });

        // 2. Inicialização de acumuladores para o Resumo
        let totalPrevisto = 0;
        let totalRealizado = 0;
        let totalAtrasado = 0;
        
        corpo.innerHTML = "";
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Define base para comparação de atraso (02/01/2026)

        // 3. Processamento dos itens e montagem da tabela
        lista.forEach(item => {
            // Captura dinâmica independente do endpoint (Receber ou Pagar)
            const vPrev = stringParaNumero(item.valorReceber || item.valorPagar);
            const vReal = stringParaNumero(item.valorRecebido || item.valorPago);
            const vSaldo = stringParaNumero(item.saldoReceber || item.saldoPagar || (vPrev - vReal));

            totalPrevisto += vPrev; 
            totalRealizado += vReal;

            // Tratamento da data para lógica de destaque
            const partes = (item.dataVencimento || "01/01/1900").split('/');
            const dataVenc = new Date(partes[2], partes[1] - 1, partes[0]);
            
            // Regra de Atraso: Data no passado E saldo devedor superior a 5 centavos
            const estaVencido = dataVenc < hoje && vSaldo > 0.05;

            if (estaVencido) {
                totalAtrasado += vSaldo;
            }

            const tr = document.createElement("tr");
            if (estaVencido) {
                tr.classList.add("linha-vencida"); // Aplica o CSS vermelho
            }

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

        // 4. Atualização do Dashboard de Resumo na interface
        const saldoFinal = totalPrevisto - totalRealizado;
        
        document.getElementById("resumo-previsto").innerText = formatarMoeda(totalPrevisto);
        document.getElementById("resumo-realizado").innerText = formatarMoeda(totalRealizado);
        
        const elemSaldo = document.getElementById("resumo-saldo");
        elemSaldo.innerText = formatarMoeda(saldoFinal);
        // Verde para Receber, Vermelho para Pagar
        elemSaldo.style.color = tipo === "contasReceber" ? "#2e7d32" : "#cf1322";

        // Novo campo solicitado: Total Atrasado
        const elemAtrasado = document.getElementById("resumo-atrasado");
        if (elemAtrasado) {
            elemAtrasado.innerText = formatarMoeda(totalAtrasado);
        }

    } catch (error) {
        console.error("Falha ao buscar dados:", error);
        corpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">Erro: ${error.message}</td></tr>`;
    }
}
