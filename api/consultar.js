<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Painel Financeiro - 3FA</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h2 { color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
        button { background-color: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; transition: background 0.3s; }
        button:hover { background-color: #1565c0; }
        .table-container { margin-top: 20px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background-color: #f8f9fa; color: #333; font-weight: bold; padding: 12px; border: 1px solid #dee2e6; text-align: left; }
        td { padding: 10px; border: 1px solid #dee2e6; color: #555; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .status-true { color: #2e7d32; font-weight: bold; } /* Pago */
        .status-false { color: #d32f2f; font-weight: bold; } /* Pendente */
    </style>
</head>
<body>

<div class="container">
    <h2>Consulta de Contas a Receber</h2>
    <button onclick="carregarDados()">Atualizar Dados</button>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Classificação</th>
                    <th>CNPJ Pessoa</th>
                    <th>Vencimento</th>
                    <th>Descrição</th>
                    <th>Empresa</th>
                    <th>Cliente (Pessoa)</th>
                    <th>NF Origem</th>
                    <th>Status</th>
                    <th>Valor a Receber</th>
                    <th>Valor Recebido</th>
                </tr>
            </thead>
            <tbody id="tabela-corpo">
                <tr>
                    <td colspan="10" style="text-align:center">Clique no botão para carregar os dados.</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<script>
    async function carregarDados() {
        const corpo = document.getElementById("tabela-corpo");
        corpo.innerHTML = '<tr><td colspan="10" style="text-align:center">Carregando dados do Nomus...</td></tr>';

        try {
            const response = await fetch('/api/consultar');
            const dados = await response.json();

            // O Nomus costuma retornar uma lista direta [] ou um objeto com { content: [] }
            const lista = Array.isArray(dados) ? dados : (dados.content || []);

            if (lista.length === 0) {
                corpo.innerHTML = '<tr><td colspan="10" style="text-align:center">Nenhum registro encontrado.</td></tr>';
                return;
            }

            corpo.innerHTML = ""; // Limpa a tabela

            lista.forEach(item => {
                const tr = document.createElement("tr");
                
                // Formatação simples do status baseado no booleano retornado
                const statusTexto = item.status ? "Pago" : "Pendente";
                const statusClasse = item.status ? "status-true" : "status-false";

                tr.innerHTML = `
                    <td>${item.classificacao || '-'}</td>
                    <td>${item.cnpjPessoa || '-'}</td>
                    <td>${item.dataVencimento || '-'}</td>
                    <td>${item.descricaoLancamento || '-'}</td>
                    <td>${item.nomeEmpresa || '-'}</td>
                    <td>${item.nomePessoa || '-'}</td>
                    <td>${item.numeroNotaFiscalOrigem || '-'}</td>
                    <td class="${statusClasse}">${statusTexto}</td>
                    <td>R$ ${item.valorReceber || '0,00'}</td>
                    <td>R$ ${item.valorRecebido || '0,00'}</td>
                `;
                corpo.appendChild(tr);
            });

        } catch (erro) {
            corpo.innerHTML = `<tr><td colspan="10" style="text-align:center; color:red">Erro ao carregar dados: ${erro.message}</td></tr>`;
        }
    }
</script>

</body>
</html>

