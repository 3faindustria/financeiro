// Funções de utilidade
function logDebug(mensagem) {
    const logElem = document.getElementById("debug-log");
    if (logElem) {
        logElem.style.display = "block";
        const div = document.createElement("div");
        div.innerText = `[${new Date().toLocaleTimeString()}] ${mensagem}`;
        logElem.appendChild(div);
        logElem.scrollTop = logElem.scrollHeight;
    }
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

// Função principal de busca
let dadosGlobais = []; // Armazena os dados do período

async function buscarDados() {
    const corpo = document.getElementById("tabela-corpo");
    const tipo = document.getElementById("filtro-tipo").value;
    const dInicio = document.getElementById("data-inicio").value;
    const dFim = document.getElementById("data-fim").value;
    
    if(!dInicio || !dFim) {
        alert("Por favor, selecione as datas de início e fim.");
        return;
    }

    corpo.innerHTML = '<tr><td colspan="7" style="text-align:center">Buscando dados no Nomus...</td></tr>';
    logDebug(`--- Iniciando Busca ---`);

    let todasAsContas = [];
    let paginaAtual = 0;
    let continuaBuscando = true;
    const idsVistos = new Set();

    try {
        while (continuaBuscando) {
            const urlLocal = `/api/consultar?endpoint=${tipo}&dataInicio=${dInicio}&dataFim=${dFim}&pagina=${paginaAtual}`;
            const response = await fetch(urlLocal);
            const resultado = await response.json();
            
            if (resultado.error) {
                logDebug(`ERRO NO NOMUS: ${resultado.error}`);
                continuaBuscando = false;
                break;
            }

            logDebug(`URL: ${resultado.urlGerada}`);

            const listaDaPagina = resultado.content || [];
            
            if (listaDaPagina.length > 0) {
                listaDaPagina.forEach(item => {
                    const idUnico = item.id || item.codigo || JSON.stringify(item);
                    if (!idsVistos.has(idUnico)) {
                        todasAsContas.push(item);
                        idsVistos.add(idUnico);
                    }
                });

                logDebug(`Página ${paginaAtual}: +${listaDaPagina.length} itens.`);
                
                // Se veio 50, pode ter mais na próxima página
                if (listaDaPagina.length === 50) {
                    paginaAtual++;
                } else {
                    continuaBuscando = false;
                }
            } else {
                logDebug(`Página ${paginaAtual} veio vazia. Encerrando.`);
                continuaBuscando = false;
            }

            if (paginaAtual > 20) continuaBuscando = false;
        }

        dadosGlobais = todasAsContas;
        logDebug(`Total Consolidado: ${dadosGlobais.length} registros.`);
        
        preencherFiltrosDinâmicos(dadosGlobais);
        aplicarFiltrosSecundarios();

    } catch (error) {
        logDebug(`FALHA: ${error.message}`);
        corpo.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red">Erro na comunicação.</td></tr>';
    }
}

function preencherFiltrosDinâmicos(dados) {
    const selectClass = document.getElementById("filtro-classificacao");
    const selectPessoa = document.getElementById("filtro-pessoa");

    // Limpa opções anteriores (mantendo a primeira "Todas")
    selectClass.innerHTML = '<option value="">Todas</option>';
    selectPessoa.innerHTML = '<option value="">Todas</option>';

    const classificacoes = new Set();
    const pessoas = new Set();

    dados.forEach(item => {
        const nomeClass = item.nomeClassificacaoFinanceira || item.nomeClassificacao || item.classificacao;
        const nomePessoa = item.nomePessoa;
        if (nomeClass) classificacoes.add(nomeClass);
        if (nomePessoa) pessoas.add(nomePessoa);
    });

    // Adiciona as opções em ordem alfabética
    Array.from(classificacoes).sort().forEach(c => {
        selectClass.innerHTML += `<option value="${c}">${c}</option>`;
    });
    Array.from(pessoas).sort().forEach(p => {
        selectPessoa.innerHTML += `<option value="${p}">${p}</option>`;
    });

    // Adiciona evento para filtrar quando mudar a seleção
    selectClass.onchange = aplicarFiltrosSecundarios;
    selectPessoa.onchange = aplicarFiltrosSecundarios;
}

function aplicarFiltrosSecundarios() {
    const valClass = document.getElementById("filtro-classificacao").value;
    const valPessoa = document.getElementById("filtro-pessoa").value;

    const dadosFiltrados = dadosGlobais.filter(item => {
        const itemClass = item.nomeClassificacaoFinanceira || item.nomeClassificacao || item.classificacao;
        const matchClass = valClass === "" || itemClass === valClass;
        const matchPessoa = valPessoa === "" || item.nomePessoa === valPessoa;
        return matchClass && matchPessoa;
    });

    renderizarTabela(dadosFiltrados, document.getElementById("filtro-tipo").value);
}

function renderizarTabela(lista, tipo) {
    const corpo = document.getElementById("tabela-corpo");
    corpo.innerHTML = "";
    
    // Ordenação por vencimento antes de numerar
    lista.sort((a, b) => {
        const c = (s) => { 
            const p = (s || "01/01/1900").split('/'); 
            return new Date(p[2], p[1]-1, p[0]); 
        };
        return c(a.dataVencimento) - c(b.dataVencimento);
    });

    let tPrev = 0, tReal = 0, tAtrasado = 0;
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    // O segundo parâmetro do forEach é o índice (index)
    lista.forEach((item, index) => {
        const vP = Math.abs(stringParaNumero(item.valorReceber || item.valorPagar));
        const vR = Math.abs(stringParaNumero(item.valorRecebido || item.valorPago));
        const vSaldo = vP - vR;

        tPrev += vP; 
        tReal += vR;

        const pD = (item.dataVencimento || "01/01/1900").split('/');
        const dVenc = new Date(pD[2], pD[1]-1, pD[0]);
        const vencido = dVenc < hoje && vSaldo > 0.10;

        if (vencido) tAtrasado += vSaldo;

        const tr = document.createElement("tr");
        if (vencido) tr.classList.add("linha-vencida");

        const descClass = item.nomeClassificacaoFinanceira || item.nomeClassificacao || item.classificacao || '-';

        // index + 1 para a contagem começar em 1 e não em 0
        tr.innerHTML = `
            <td style="color: #666; font-size: 0.85em;">${index + 1}</td>
            <td>${descClass}</td>
            <td>${item.nomePessoa || '-'}</td>
            <td style="font-weight:bold">
                ${item.dataVencimento} 
                ${vencido ? '<span class="atraso-badge">VENCIDO</span>' : ''}
            </td>
            <td>${item.descricaoLancamento || '-'}</td>
            <td>${formatarMoeda(vP)}</td>
            <td>${formatarMoeda(vR)}</td>
        `;
        corpo.appendChild(tr);
    });

    // Atualiza os resumos (Dashboard)
    document.getElementById("resumo-previsto").innerText = formatarMoeda(tPrev);
    document.getElementById("resumo-realizado").innerText = formatarMoeda(tReal);
    document.getElementById("resumo-saldo").innerText = formatarMoeda(tPrev - tReal);
    document.getElementById("resumo-atrasado").innerText = formatarMoeda(tAtrasado);
    
    // Log extra para conferência
    logDebug(`Grid atualizada com ${lista.length} itens numerados.`);
}
