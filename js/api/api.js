/**
 * ============================================================
 *  api.js
 *  Camada única de comunicação com o backend (Google Apps Script).
 *  Todo o frontend fala com o Sheets exclusivamente através deste
 *  arquivo — nenhum componente faz fetch() diretamente.
 * ============================================================
 */

// URL do Web App publicado no Apps Script.
// >>> SUBSTITUA pela URL gerada em "Implantar > Nova implantação" <<<
const API_URL = window.APP_CONFIG?.API_URL || 'https://script.google.com/macros/s/SEU_ID_DE_IMPLANTACAO/exec';

/**
 * Executa uma chamada GET para a API (leitura de dados).
 * @param {string} action - nome da ação no backend (ex: 'listObras')
 * @param {Object} params - parâmetros de query string
 */
async function apiGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const url = `${API_URL}?${query}`;
  try {
    const response = await fetch(url, { method: 'GET' });
    const json = await response.json();
    if (!json.success) throw new Error(json.message || 'Erro desconhecido na API.');
    return json;
  } catch (err) {
    console.error('[api.js] Erro em apiGet:', action, err);
    throw err;
  }
}

/**
 * Executa uma chamada POST para a API (criação/edição/exclusão).
 * @param {string} action - nome da ação no backend (ex: 'createObra')
 * @param {Object} payload - dados a enviar
 */
async function apiPost(action, payload = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      // text/plain evita preflight CORS no Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload })
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.message || 'Erro desconhecido na API.');
    return json;
  } catch (err) {
    console.error('[api.js] Erro em apiPost:', action, err);
    throw err;
  }
}

/** Converte um arquivo (File) em base64 puro (sem o prefixo data:...) */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Converte uma FileList em array de {data, name, type} prontos para envio */
async function filesToPayload(fileList) {
  const files = Array.from(fileList || []);
  return Promise.all(files.map(async (file) => ({
    data: await fileToBase64(file),
    name: file.name,
    type: file.type
  })));
}

/* --------------------- Endpoints de negócio --------------------- */

const ObrasAPI = {
  list: (params) => apiGet('listObras', params),
  get: (idObra) => apiGet('getObra', { idObra }),
  create: (payload) => apiPost('createObra', payload),
  update: (payload) => apiPost('updateObra', payload),
  remove: (ID_OBRA) => apiPost('deleteObra', { ID_OBRA }),
  municipios: () => apiGet('listMunicipios'),
  tipos: () => apiGet('listTiposObra')
};

const VistoriasAPI = {
  list: (params) => apiGet('listVistorias', params),
  create: (payload) => apiPost('createVistoria', payload),
  update: (payload) => apiPost('updateVistoria', payload),
  remove: (ID_VISTORIA) => apiPost('deleteVistoria', { ID_VISTORIA })
};

const OrcamentosAPI = {
  list: (params) => apiGet('listOrcamentos', params),
  create: (payload) => apiPost('createOrcamento', payload),
  update: (payload) => apiPost('updateOrcamento', payload),
  remove: (ID_ORCAMENTO) => apiPost('deleteOrcamento', { ID_ORCAMENTO })
};

const DashboardAPI = {
  get: () => apiGet('dashboard')
};
