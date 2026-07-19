/**
 * ============================================================
 *  ObraDetailPage.js
 *  Exibe o resumo da obra e, em abas, suas vistorias e
 *  orçamentos relacionados (relacionamento 1:N).
 * ============================================================
 */
function ObraDetailPage({ navigate, params }) {
  const [tab, setTab] = React.useState('resumo');

  const detailKey = 'getObra|' + params.idObra;
  const { data: res, loading, error } = useCachedQuery(detailKey, () => ObrasAPI.get(params.idObra), { pollInterval: 20000 });

  React.useEffect(() => { if (error) window.toast.error('Erro ao carregar obra: ' + error.message); }, [error]);

  // Chamado pelas sub-abas após criar/editar/excluir vistoria ou orçamento,
  // para que o resumo e as listas desta tela reflitam a mudança na hora.
  const refresh = () => { DataStore.invalidate('getObra|' + params.idObra); DataStore.invalidate('dashboard'); };

  if (loading) return <Loading text="Carregando obra..." inline />;
  if (!res) return <EmptyState title="Obra não encontrada" />;

  const obra = res.data.obra;
  const vistorias = res.data.vistorias;
  const orcamentos = res.data.orcamentos;

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-icon" onClick={() => navigate('obras')}><i className="bi bi-arrow-left fs-5"></i></button>
        <h5 className="mb-0 flex-grow-1">{obra.NomeObra}</h5>
        <Badge text={obra.Situacao} className={situacaoBadgeClass(obra.Situacao)} />
        <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('obraForm', { idObra: obra.ID_OBRA })}>
          <i className="bi bi-pencil me-1"></i>Editar
        </button>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item"><button className={`nav-link ${tab === 'resumo' ? 'active' : ''}`} onClick={() => setTab('resumo')}>Resumo</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === 'vistorias' ? 'active' : ''}`} onClick={() => setTab('vistorias')}>Vistorias ({vistorias.length})</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === 'orcamentos' ? 'active' : ''}`} onClick={() => setTab('orcamentos')}>Orçamentos ({orcamentos.length})</button></li>
      </ul>

      {tab === 'resumo' && (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="section-title">Dados Gerais</h6>
                <dl className="row mb-0">
                  <dt className="col-sm-4">Código</dt><dd className="col-sm-8">{obra.Codigo || '-'}</dd>
                  <dt className="col-sm-4">Município / Bairro</dt><dd className="col-sm-8">{obra.Municipio} {obra.Bairro ? `- ${obra.Bairro}` : ''}</dd>
                  <dt className="col-sm-4">Endereço</dt><dd className="col-sm-8">{obra.Endereco || '-'}</dd>
                  <dt className="col-sm-4">Tipo</dt><dd className="col-sm-8">{obra.TipoObra}</dd>
                  <dt className="col-sm-4">Empresa Contratada</dt><dd className="col-sm-8">{obra.EmpresaContratada || '-'}</dd>
                  <dt className="col-sm-4">Responsável Técnico</dt><dd className="col-sm-8">{obra.ResponsavelTecnico || '-'}</dd>
                  <dt className="col-sm-4">Fiscal</dt><dd className="col-sm-8">{obra.Fiscal || '-'}</dd>
                  <dt className="col-sm-4">Observações</dt><dd className="col-sm-8">{obra.Observacoes || '-'}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <h6 className="section-title">Cronograma</h6>
                <p className="mb-1"><i className="bi bi-calendar-event me-2 text-muted"></i>Início: {formatDate(obra.DataInicio)}</p>
                <p className="mb-1"><i className="bi bi-calendar-check me-2 text-muted"></i>Previsão: {formatDate(obra.DataPrevista)}</p>
                <p className="mb-0"><i className="bi bi-calendar2-check me-2 text-muted"></i>Conclusão: {formatDate(obra.DataConclusao)}</p>
              </div>
            </div>
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="section-title">Financeiro</h6>
                <p className="mb-2">Valor Contratado<br /><strong className="fs-5 text-primary">{formatCurrency(obra.ValorContratado)}</strong></p>
                <p className="mb-1">Execução</p>
                <ProgressBar value={obra.PercentualExecutado} />
                <small className="text-muted">{formatPercent(obra.PercentualExecutado)}</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'vistorias' && (
        <ObraVistoriasTab idObra={obra.ID_OBRA} vistorias={vistorias} onChanged={refresh} navigate={navigate} />
      )}

      {tab === 'orcamentos' && (
        <ObraOrcamentosTab idObra={obra.ID_OBRA} orcamentos={orcamentos} onChanged={refresh} navigate={navigate} />
      )}
    </div>
  );
}

/** Sub-aba: lista de vistorias da obra + atalho para nova vistoria */
function ObraVistoriasTab({ idObra, vistorias, onChanged, navigate }) {
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const handleDelete = async () => {
    try {
      await VistoriasAPI.remove(confirmDelete.ID_VISTORIA);
      window.toast.success('Vistoria excluída.');
      setConfirmDelete(null);
      DataStore.invalidate('listVistorias');
      onChanged();
    } catch (err) { window.toast.error('Erro ao excluir: ' + err.message); }
  };

  return (
    <div>
      <div className="text-end mb-3">
        <button className="btn btn-primary btn-sm" onClick={() => navigate('vistoriaForm', { idObra })}>
          <i className="bi bi-plus-lg me-1"></i>Nova Vistoria
        </button>
      </div>
      {vistorias.length === 0 ? (
        <EmptyState icon="bi-clipboard-check" title="Nenhuma vistoria cadastrada para esta obra" />
      ) : (
        <div className="row g-3">
          {vistorias.map((v) => (
            <div key={v.ID_VISTORIA} className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <h6>Vistoria #{v.NumeroVistoria}</h6>
                    <Badge text={v.Status} className={v.Status === 'Concluída' ? 'bg-success' : 'bg-warning text-dark'} />
                  </div>
                  <p className="small text-muted mb-1"><i className="bi bi-calendar-event me-1"></i>{formatDate(v.Data)} • {v.Responsavel}</p>
                  <p className="mb-1">{v.SituacaoEncontrada}</p>
                  <ProgressBar value={v.PercentualExecutado} />
                  <div className="d-flex justify-content-end gap-2 mt-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('vistoriaForm', { idObra, idVistoria: v.ID_VISTORIA })}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirmDelete(v)}><i className="bi bi-trash"></i></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal show={!!confirmDelete} title="Excluir vistoria" message="Tem certeza que deseja excluir esta vistoria?" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}

/** Sub-aba: lista de orçamentos da obra + atalho para novo orçamento */
function ObraOrcamentosTab({ idObra, orcamentos, onChanged, navigate }) {
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const handleDelete = async () => {
    try {
      await OrcamentosAPI.remove(confirmDelete.ID_ORCAMENTO);
      window.toast.success('Orçamento excluído.');
      setConfirmDelete(null);
      DataStore.invalidate('listOrcamentos');
      onChanged();
    } catch (err) { window.toast.error('Erro ao excluir: ' + err.message); }
  };

  return (
    <div>
      <div className="text-end mb-3">
        <button className="btn btn-primary btn-sm" onClick={() => navigate('orcamentoForm', { idObra })}>
          <i className="bi bi-plus-lg me-1"></i>Novo Orçamento
        </button>
      </div>
      {orcamentos.length === 0 ? (
        <EmptyState icon="bi-cash-coin" title="Nenhum orçamento cadastrado para esta obra" />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead><tr><th>Empresa</th><th>Versão</th><th>Valor Total</th><th>Status</th><th>Emissão</th><th className="text-end">Ações</th></tr></thead>
            <tbody>
              {orcamentos.map((o) => (
                <tr key={o.ID_ORCAMENTO}>
                  <td>{o.Empresa}</td>
                  <td>v{o.Versao}</td>
                  <td>{formatCurrency(o.ValorTotal)}</td>
                  <td><Badge text={o.Status} className={statusOrcamentoBadgeClass(o.Status)} /></td>
                  <td>{formatDate(o.DataEmissao)}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      {o.ArquivoPDF && <a href={o.ArquivoPDF} target="_blank" rel="noreferrer" className="btn btn-outline-secondary"><i className="bi bi-file-earmark-pdf"></i></a>}
                      <button className="btn btn-outline-primary" onClick={() => navigate('orcamentoForm', { idObra, idOrcamento: o.ID_ORCAMENTO })}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-outline-danger" onClick={() => setConfirmDelete(o)}><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmModal show={!!confirmDelete} title="Excluir orçamento" message="Tem certeza que deseja excluir este orçamento?" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
