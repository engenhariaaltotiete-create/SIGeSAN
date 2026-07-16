/**
 * ============================================================
 *  helpers.js
 *  Funções utilitárias reutilizáveis pelos componentes React.
 * ============================================================
 */

/** Formata um número como moeda brasileira (R$) */
function formatCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Formata uma data (ISO ou Date) como dd/mm/aaaa */
function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('pt-BR');
}

/** Formata um percentual (0-100) com uma casa decimal */
function formatPercent(value) {
  const n = Number(value) || 0;
  return `${n.toFixed(1)}%`;
}

/** Debounce genérico — usado na busca instantânea para não disparar requests a cada tecla */
function debounce(fn, delay = 400) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Retorna a cor (Bootstrap) associada a uma situação de obra */
function situacaoBadgeClass(situacao) {
  const map = {
    'Planejada': 'bg-secondary',
    'Em andamento': 'bg-primary',
    'Paralisada': 'bg-warning text-dark',
    'Concluída': 'bg-success',
    'Cancelada': 'bg-danger'
  };
  return map[situacao] || 'bg-secondary';
}

/** Retorna a cor (Bootstrap) associada ao status de um orçamento */
function statusOrcamentoBadgeClass(status) {
  const map = {
    'Em análise': 'bg-warning text-dark',
    'Aprovado': 'bg-success',
    'Reprovado': 'bg-danger',
    'Vencido': 'bg-secondary'
  };
  return map[status] || 'bg-secondary';
}

/** Gera iniciais a partir de um nome (usado em avatares) */
function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

/** Valida um objeto de formulário simples, retornando { valid, errors } */
function validateForm(values, rules) {
  const errors = {};
  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = values[field];
    if (rule.required && (value === undefined || value === null || String(value).trim() === '')) {
      errors[field] = rule.message || 'Campo obrigatório.';
    } else if (rule.number && value !== '' && value !== undefined && isNaN(Number(value))) {
      errors[field] = 'Valor numérico inválido.';
    }
  });
  return { valid: Object.keys(errors).length === 0, errors };
}
