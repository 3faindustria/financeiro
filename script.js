function logDebug(mensagem) {
    const logElem = document.getElementById("debug-log");
    logElem.style.display = "block";
    const span = document.createElement("div");
    span.innerText = `[${new Date().toLocaleTimeString()}] ${mensagem}`;
    logElem.appendChild(span);
    logElem.scrollTop = logElem.scrollHeight;
}

function formatarMoeda(valor) {
    return Math.abs(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function stringParaNumero(str) {
    if (typeof str === 'number') return str;
    if (!str || typeof str !== 'string') return 0;
    let limpeza = str.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(limpeza) || 0;
}

async function buscarDados() {
    const corpo = document.getElementById("tabela-corpo");
    const tipo = document.getElementById("filtro-tipo").value;
    const dInicio = document.getElementById("data-inicio").value;
    const dFim = document.getElementById("data-fim").value;
    
    corpo.innerHTML = '<tr><td colspan="6" style="text-align:center">Conectando ao Nomus...</td></tr>';
    
    logDebug(`--- Nova Consulta ---`);
    logDebug(`Filtro: ${tipo} | Período: ${dInicio || 'S/D'} até ${dFim || 'S/D'}`);

    let todasAsContas = [];
    let paginaAtual = 0;
    let continuaBuscando = true;

    try {
        while (continuaBuscando) {
            const url = `/api/consultar?endpoint=${tipo}&dataInicio=${dInicio}&dataFim=${dFim}&pagina=${paginaAtual}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`Status ${response.status}`);

            const dados = await response.json();
            const listaDaPagina = Array.isArray(dados) ? dados : (dados.content || []);
            
            logDebug(`Página ${paginaAtual}: ${listaDaPagina.length} itens encontrados.`);

            if (listaDaPagina.length > 0) {
                todasAsContas = todasAsContas.concat(listaDaPagina);
                paginaAtual++;
                if (listaDaPagina.length < 50) continuaBuscando = false;
            } else {
                continuaBuscando = false;
            }
            
            if (paginaAtual > 15) continuaBuscando = false; 
        }

        if (todasAsContas.length === 0) {
            corpo.innerHTML = '<tr><td colspan="6" style="text-align:center">Nenhum dado retornado para este período.</td></tr>';
        } else {
            renderizarTabela(todasAsContas, tipo);
        }

    } catch (error) {
        logDebug(`ERRO: ${error.message}`);
        corpo.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">Falha na comunicação.</td></tr>`;
    }
}

function renderizarTabela(lista, tipo) {
    const corpo = document.getElementById("tabela-corpo");
    corpo.innerHTML = "";
    
    lista.sort((a, b) => {
        const c = (s) => { const p = (s || "01/01/1900").split('/'); return new Date(p[2], p[1]-1, p[0]); };
        return c(a.dataVencimento) - c(b.dataVencimento);
    });

    let tPrev = 0, tReal = 0, tAtrasado = 0;
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    lista.forEach(item => {
        const vP = Math.abs(stringParaNumero(item.valorReceber || item.valorPagar));
        const vR = Math.abs(stringParaNumero(item.valorRecebido || item.valorPago));
        const vSaldo = vP - vR;

        tPrev += vP; tReal += vR;

        const pD = (item.dataVencimento || "01/01/1900").split('/');
        const dVenc = new Date(pD[2], pD[1]-1, pD[0]);
        const vencido = dVenc < hoje && vSaldo > 0.10;

        if (vencido) tAtrasado += vSaldo;

        const tr = document.createElement("tr");
        if (vencido) tr.classList.add("linha-vencida");

        tr.innerHTML = `
            <td>${item.nomeClassificacaoFinanceira || item.classificacao || '-'}</td>
            <td>${item.nomePessoa || '-'}</td>
            <td style="font-weight:bold">${item.dataVencimento} ${vencido ? '<span class="atraso-badge">VENCIDO</span>' : ''}</td>
            <td>${item.descricaoLancamento || '-'}</td>
            <td>${formatarMoeda(vP)}</td>
            <td>${formatarMoeda(vR)}</td>
        `;
        corpo.appendChild(tr);
    });

    document.getElementById("resumo-previsto").innerText = formatarMoeda(tPrev);
    document.getElementById("resumo-realizado").innerText = formatarMoeda(tReal);
    document.getElementById("resumo-saldo").innerText = formatarMoeda(tPrev - tReal);
    document.getElementById("resumo-atrasado").innerText = formatarMoeda(tAtrasado);
}
