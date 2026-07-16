/**
 * ============================================================
 *  OrcamentosListPage.js
 *  Listagem global de orçamentos (de todas as obras).
 * ============================================================
 */
function OrcamentosListPage({ navigate }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await OrcamentosAPI.list({ q: query, status, page, pageSize: window.APP_CONFIG.ITEMS_PER_PAGE });
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) { window.toast.error('Erro ao listar orçamentos: ' + err.message); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, [page, status]);
  React.useEffect(() => { setPage(1); load(); }, [query]);

  const handleDelete = async () => {
    try {
      await OrcamentosAPI.remove(confirmDelete.ID_ORCAMENTO);
      window.toast.success('Orçamento excluído com sucesso.');
      setConfirmDelete(null);
      load();
    } catch (err) { window.toast.error('Erro ao excluir: ' + err.message); }
  };

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div className="filters-bar d-flex flex-wrap gap-2">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input type="text" className="form-control" placeholder="Buscar por empresa, descrição..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="form-select form-select-sm w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="Em análise">Em análise</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Reprovado">Reprovado</option>
            <option value="Vencido">Vencido</option>
          </select>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>Obra</th><th>Empresa</th><th>Versão</th><th>Valor Total</th><th>Status</th><th>Emissão</th><th className="text-end">Ações</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="7"><Loading inline text="Carregando orçamentos..." /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan="7"><EmptyState title="Nenhum orçamento encontrado" /></td></tr>}
              {!loading && items.map((o) => (
                <tr key={o.ID_ORCAMENTO}>
                  <td><button className="btn btn-link p-0" onClick={() => navigate('obraDetail', { idObra: o.ID_OBRA })}>{o.ID_OBRA}</button></td>
                  <td>{o.Empresa}</td>
                  <td>v{o.Versao}</td>
                  <td className="fw-semibold">{formatCurrency(o.ValorTotal)}</td>
                  <td><Badge text={o.Status} className={statusOrcamentoBadgeClass(o.Status)} /></td>
                  <td>{formatDate(o.DataEmissao)}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      {o.ArquivoPDF && <a href={o.ArquivoPDF} target="_blank" rel="noreferrer" className="btn btn-outline-secondary"><i className="bi bi-file-earmark-pdf"></i></a>}
                      <button className="btn btn-outline-primary" onClick={() => navigate('orcamentoForm', { idObra: o.ID_OBRA, idOrcamento: o.ID_ORCAMENTO })}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-outline-danger" onClick={() => setConfirmDelete(o)}><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center bg-white">
          <small className="text-muted">{total} orçamento(s) encontrado(s)</small>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      <ConfirmModal show={!!confirmDelete} title="Excluir orçamento" message="Tem certeza que deseja excluir este orçamento?" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
