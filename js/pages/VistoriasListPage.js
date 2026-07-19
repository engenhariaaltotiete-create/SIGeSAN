/**
 * ============================================================
 *  VistoriasListPage.js
 *  Listagem global de vistorias (de todas as obras), com busca,
 *  filtro por status e paginação.
 * ============================================================
 */
function VistoriasListPage({ navigate }) {
  const [page, setPage] = React.useState(1);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const listParams = { q: query, status, page, pageSize: window.APP_CONFIG.ITEMS_PER_PAGE };
  const listKey = 'listVistorias|' + JSON.stringify(listParams);
  const { data: listRes, loading, error } = useCachedQuery(listKey, () => VistoriasAPI.list(listParams), { pollInterval: 20000 });

  const items = listRes ? listRes.data : [];
  const total = listRes ? listRes.total : 0;
  const totalPages = listRes ? listRes.totalPages : 1;

  React.useEffect(() => { if (error) window.toast.error('Erro ao listar vistorias: ' + error.message); }, [error]);
  React.useEffect(() => { setPage(1); }, [query, status]);

  const handleDelete = async () => {
    try {
      await VistoriasAPI.remove(confirmDelete.ID_VISTORIA);
      window.toast.success('Vistoria excluída com sucesso.');
      setConfirmDelete(null);
      DataStore.invalidate('listVistorias');
      DataStore.invalidate('dashboard');
      DataStore.invalidate('getObra');
    } catch (err) { window.toast.error('Erro ao excluir: ' + err.message); }
  };

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div className="filters-bar d-flex flex-wrap gap-2">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input type="text" className="form-control" placeholder="Buscar por responsável, situação..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="form-select form-select-sm w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="Concluída">Concluída</option>
            <option value="Pendente">Pendente</option>
          </select>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Nº</th><th>Obra</th><th>Data</th><th>Responsável</th><th>Situação</th><th>Execução</th><th className="text-end">Ações</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7"><Loading inline text="Carregando vistorias..." /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan="7"><EmptyState title="Nenhuma vistoria encontrada" /></td></tr>}
              {!loading && items.map((v) => (
                <tr key={v.ID_VISTORIA}>
                  <td>{v.NumeroVistoria}</td>
                  <td>
                    <button className="btn btn-link p-0" onClick={() => navigate('obraDetail', { idObra: v.ID_OBRA })}>{v.ID_OBRA}</button>
                  </td>
                  <td>{formatDate(v.Data)}</td>
                  <td>{v.Responsavel}</td>
                  <td>{v.SituacaoEncontrada}</td>
                  <td style={{ minWidth: '120px' }}><ProgressBar value={v.PercentualExecutado} /></td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-primary" onClick={() => navigate('vistoriaForm', { idObra: v.ID_OBRA, idVistoria: v.ID_VISTORIA })}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-outline-danger" onClick={() => setConfirmDelete(v)}><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center bg-white">
          <small className="text-muted">{total} vistoria(s) encontrada(s)</small>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      <ConfirmModal show={!!confirmDelete} title="Excluir vistoria" message="Tem certeza que deseja excluir esta vistoria?" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
