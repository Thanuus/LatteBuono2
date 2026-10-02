/**
 * ============================================
 * LATTE BUONO - PEDIDOS -> GOOGLE SHEETS
 * ============================================
 *
 * Este script recebe os pedidos do site (fetch POST com JSON)
 * e grava cada pedido como uma nova linha na aba "Pedidos".
 *
 * FORMATO DAS COLUNAS (novos pedidos):
 *   A - Data/Hora
 *   B - Nome
 *   C - Endereco (campos do formulario combinados em uma unica célula)
 *   D - Produtos (cada produto em uma linha dentro da mesma célula)
 *   E - Subtotal
 *   F - Observacao
 *
 * COMO ATUALIZAR (apos editar este arquivo):
 * 1. Na planilha, va no menu "Extensoes" -> "Apps Script".
 * 2. Substitua o codigo anterior pelo conteudo deste arquivo e salve (Ctrl+S).
 * 3. Implantar -> Gerenciar implantacoes -> icone de lapis (editar)
 *    -> Versao: "Nova versao" -> Implantar (a URL nao muda).
 *
 * OBSERVACOES:
 * - appendRow() so ADICIONA linhas novas; nao altera pedidos antigos.
 * - Colunas antigas (G-K) nao sao apagadas; novas linhas so preenchem A-F.
 *
 * SEGURANCA: o script acessa apenas a planilha vinculada a ele.
 * Nao ha senhas/tokens no codigo do site - apenas a URL publica (/exec).
 */

const SHEET_NAME = 'Pedidos'; // Nome da aba onde os pedidos serao gravados

/**
 * Recebe o pedido do site.
 * O site envia o JSON:
 * { nome, rua, numero, complemento, bairro, cidade, cep, produtos, subtotal, observacao }
 */
function doPost(e) {
  try {
    // 1. Interpreta o JSON recebido
    const data = JSON.parse(e.postData.contents);

    // 2. Localiza a planilha (vinculada a este script) e a aba "Pedidos"
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!aba) {
      return resposta({ status: 'erro', mensagem: 'Aba "' + SHEET_NAME + '" nao encontrada na planilha.' });
    }

    // 3. Registra a data/hora do pedido (horario de Sao Paulo)
    const dataHora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');

    // 4. Adiciona uma nova linha no formato compacto (6 colunas)
    aba.appendRow([
      dataHora,                                            // A - Data/Hora
      data.nome || '',                                     // B - Nome
      montarEndereco(data),                                // C - Endereco (uma unica célula)
      montarProdutos(data.produtos),                       // D - Produtos (um por linha na célula)
      (data.subtotal != null) ? Number(data.subtotal) : '', // E - Subtotal (mesmo valor enviado pelo site)
      data.observacao || ''                                // F - Observacao
    ]);

    // 5. Retorna confirmacao (para testes diretos, ex: Postman/curl)
    return resposta({ status: 'sucesso' });
  } catch (erro) {
    return resposta({ status: 'erro', mensagem: erro.message });
  }
}

/**
 * Monta o endereco em uma unica célula, ignorando campos vazios
 * (sem vírgulas ou espaços desnecessários).
 * Formato: Rua, Numero, Complemento, Bairro, Cidade - CEP
 * Exemplo: Rua das Flores, 123, Casa 2, Centro, Ubá - 36500-000
 */
function montarEndereco(data) {
  const partes = [data.rua, data.numero, data.complemento, data.bairro, data.cidade]
    .map(function (campo) { return (campo || '').toString().trim(); })
    .filter(function (campo) { return campo !== ''; });

  const cep = (data.cep || '').toString().trim();

  if (partes.length === 0) return cep;
  if (cep === '') return partes.join(', ');
  return partes.join(', ') + ' - ' + cep;
}

/**
 * Coloca cada produto em uma linha diferente dentro da mesma célula.
 * O site envia: "2x Doce de Leite; 1x Queijo Frescal"
 * Resultado:   "2x Doce de Leite\n1x Queijo Frescal"
 */
function montarProdutos(produtos) {
  if (!produtos) return '';
  return produtos
    .split(';')
    .map(function (item) { return item.trim(); })
    .filter(function (item) { return item !== ''; })
    .join('\n');
}

// Helper: resposta em JSON
function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
