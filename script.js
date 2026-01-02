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
    
    corpo.innerHTML = '<tr><td colspan="6" style="text-align:center">Buscando no Nomus...</td></tr>';

    try {
        const response = await fetch(`/api/consultar?endpoint=${tipo}`);
        const dados = await response.json();
        let lista = Array.isArray(dados) ? dados : (dados.content || []);

        // Ordenação
        lista.sort((a, b) => {
            const extrairData = (dStr) => {
                const p = dStr.trim().split('/');
                return new Date(p[2], p[1] - 1, p[0]);
            };
            return extrairData(a.dataVencimento) - extrairData(b.dataVencimento);
        });

        let totalPrevisto = 0, totalRealizado = 0;
        corpo.innerHTML = "";
        const hoje = new Date();
        hoje.setHours(0,0,0,0);

        lista.forEach(item => {
            const vPrev = stringParaNumero(item.valorReceber || item.valorPagar);
            const vReal = stringParaNumero(item.valorRecebido || item.valorPago);
            totalPrevisto += vPrev; totalRealizado += vReal;

            const partes = item.dataVencimento.split('/');
            const dataVenc = new Date(partes[2], partes[1] - 1, partes[0]);
            const estaVencido = dataVenc < hoje && vReal < vPrev;

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
