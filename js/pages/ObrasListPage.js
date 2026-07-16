/**
 * ============================================================
 *  ObrasListPage.js
 *  Listagem de obras com busca instantânea, filtros, ordenação
 *  e paginação. Ponto de entrada para criar/editar/ver detalhe.
 * ============================================================
 */
function ObrasListPage({ navigate, params }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [query, setQuery] = React.useState('');
  const [situacao, setSituacao] = React.useState('');
  const [municipio, setMunicipio] = React.useState('');
  const [municipios, setMunicipios] = React.useState([]);
  const [sortField, setSortField] = React.useState('DataCadastro');
  const [sortDir, setSortDir] = React.useState('desc');
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const situacoes = ['Planejada', 'Em andamento', 'Paralisada', 'Concluída', 'Cancelada'];

  const load = async () => {
    setLoading(true);
    try {
      const res = await ObrasAPI.list({ q: query, situacao, municipio, page, pageSize: window.APP_CONFIG.ITEMS_PER_PAGE, sortField, sortDir });
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      window.toast.error('Erro ao listar obras: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, [page, situacao, municipio, sortField, sortDir]);
  React.useEffect(() => { ObrasAPI.municipios().then((r) => setMunicipios(r.data)).catch(() => {}); }, []);
  React.useEffect(() => { setPage(1); load(); }, [query]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleDelete = async () => {
    try {
      await ObrasAPI.remove(confirmDelete.ID_OBRA);
      window.toast.success('Obra excluída com sucesso.');
      setConfirmDelete(null);
      load();
    } catch (err) {
      window.toast.error('Erro ao excluir: ' + err.message);
    }
  };

  const sortIcon = (field) => sortField === field ? (sortDir === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up text-muted';

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div className="filters-bar d-flex flex-wrap gap-2">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input type="text" className="form-control" placeholder="Buscar obra, código, empresa..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="form-select form-select-sm w-auto" value={situacao} onChange={(e) => setSituacao(e.target.value)}>
            <option value="">Todas as situações</option>
            {situacoes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-select form-select-sm w-auto" value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
            <option value="">Todos os municípios</option>
            {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('obraForm')}>
          <i className="bi bi-plus-lg me-1"></i> Nova Obra
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th role="button" onClick={() => handleSort('NomeObra')}>Obra <i className={`bi ${sortIcon('NomeObra')}`}></i></th>
                <th role="button" onClick={() => handleSort('Municipio')}>Município <i className={`bi ${sortIcon('Municipio')}`}></i></th>
                <th>Situação</th>
                <th role="button" onClick={() => handleSort('ValorContratado')}>Valor Contratado <i className={`bi ${sortIcon('ValorContratado')}`}></i></th>
                <th>Execução</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="6"><Loading inline text="Carregando obras..." /></td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan="6"><EmptyState title="Nenhuma obra encontrada" subtitle="Cadastre a primeira obra clicando em 'Nova Obra'." /></td></tr>
              )}
              {!loading && items.map((obra) => (
                <tr key={obra.ID_OBRA}>
                  <td>
                    <button className="btn btn-link p-0 text-start fw-semibold" onClick={() => navigate('obraDetail', { idObra: obra.ID_OBRA })}>
                      {obra.NomeObra}
                    </button>
                    <div className="small text-muted">{obra.Codigo}</div>
                  </td>
                  <td>{obra.Municipio}{obra.Bairro ? ` - ${obra.Bairro}` : ''}</td>
                  <td><Badge text={obra.Situacao} className={situacaoBadgeClass(obra.Situacao)} /></td>
                  <td>{formatCurrency(obra.ValorContratado)}</td>
                  <td style={{ minWidth: '120px' }}>
                    <ProgressBar value={obra.PercentualExecutado} />
                    <small className="text-muted">{formatPercent(obra.PercentualExecutado)}</small>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-secondary" title="Ver detalhes" onClick={() => navigate('obraDetail', { idObra: obra.ID_OBRA })}><i className="bi bi-eye"></i></button>
                      <button className="btn btn-outline-primary" title="Editar" onClick={() => navigate('obraForm', { idObra: obra.ID_OBRA })}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-outline-danger" title="Excluir" onClick={() => setConfirmDelete(obra)}><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center bg-white">
          <small className="text-muted">{total} obra(s) encontrada(s)</small>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      <ConfirmModal
        show={!!confirmDelete}
        title="Excluir obra"
        message={confirmDelete ? `Tem certeza que deseja excluir a obra "${confirmDelete.NomeObra}"? Todas as vistorias e orçamentos relacionados também serão excluídos.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
