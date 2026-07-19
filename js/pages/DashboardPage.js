/**
 * ============================================================
 *  DashboardPage.js
 *  Tela inicial com indicadores, gráficos e últimos registros.
 * ============================================================
 */
function DashboardPage({ navigate }) {
  const chartMunicipioRef = React.useRef(null);
  const chartTipoRef = React.useRef(null);
  const chartInstances = React.useRef({});
  const notifiedErrorRef = React.useRef(false);

  // Cache com atualização em segundo plano a cada 20s.
  // Ao voltar para o Dashboard, os últimos dados carregados aparecem
  // na hora; uma atualização silenciosa acontece por trás.
  const { data: res, loading, error } = useCachedQuery('dashboard', () => DashboardAPI.get(), { pollInterval: 20000 });
  const data = res ? res.data : null;

  React.useEffect(() => {
    if (error && !notifiedErrorRef.current) {
      window.toast.error('Erro ao carregar dashboard: ' + error.message);
      notifiedErrorRef.current = true;
    }
    if (!error) notifiedErrorRef.current = false;
  }, [error]);

  React.useEffect(() => {
    if (!data) return;

    // Destroi gráficos anteriores antes de recriar (evita memory leak no Chart.js)
    Object.values(chartInstances.current).forEach((c) => c && c.destroy());

    if (chartMunicipioRef.current) {
      chartInstances.current.municipio = new Chart(chartMunicipioRef.current, {
        type: 'bar',
        data: {
          labels: Object.keys(data.graficos.obrasPorMunicipio),
          datasets: [{
            label: 'Obras por Município',
            data: Object.values(data.graficos.obrasPorMunicipio),
            backgroundColor: '#1565c0'
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }

    if (chartTipoRef.current) {
      chartInstances.current.tipo = new Chart(chartTipoRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data.graficos.obrasPorTipo),
          datasets: [{
            data: Object.values(data.graficos.obrasPorTipo),
            backgroundColor: ['#1565c0', '#42a5f5', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc']
          }]
        },
        options: { responsive: true }
      });
    }

    return () => Object.values(chartInstances.current).forEach((c) => c && c.destroy());
  }, [data]);

  if (loading) return <Loading text="Carregando indicadores..." inline />;
  if (!data) return <EmptyState title="Não foi possível carregar o dashboard" />;

  const ind = data.indicadores;

  return (
    <div className="fade-in">
      <div className="row g-3 mb-4">
        <StatCard icon="bi-building" label="Total de Obras" value={ind.totalObras} color="primary" />
        <StatCard icon="bi-check-circle" label="Concluídas" value={ind.obrasConcluidas} color="success" />
        <StatCard icon="bi-cone-striped" label="Em andamento" value={ind.obrasAndamento} color="info" />
        <StatCard icon="bi-pause-circle" label="Paralisadas" value={ind.obrasParalisadas} color="warning" />
        <StatCard icon="bi-clipboard-check" label="Vistorias" value={ind.totalVistorias} color="secondary" />
        <StatCard icon="bi-cash-coin" label="Orçamentos" value={ind.totalOrcamentos} color="dark" />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted">Valor Total Contratado</h6>
              <h3 className="fw-bold text-primary">{formatCurrency(ind.valorTotalContratado)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted">Valor Total Orçado</h6>
              <h3 className="fw-bold text-success">{formatCurrency(ind.valorTotalOrcado)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-3">Obras por Município</h6>
              <canvas ref={chartMunicipioRef} height="180"></canvas>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="mb-3">Obras por Tipo</h6>
              <canvas ref={chartTipoRef} height="180"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold">Últimas Vistorias</div>
            <ul className="list-group list-group-flush">
              {data.ultimasVistorias.length === 0 && <li className="list-group-item text-muted">Nenhuma vistoria cadastrada.</li>}
              {data.ultimasVistorias.map((v) => (
                <li key={v.ID_VISTORIA} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">Vistoria #{v.NumeroVistoria} — {v.Responsavel}</div>
                    <small className="text-muted">{formatDate(v.Data)} • {v.SituacaoEncontrada}</small>
                  </div>
                  <span className="badge bg-primary-subtle text-primary">{formatPercent(v.PercentualExecutado)}</span>
                </li>
              ))}
            </ul>
            <div className="card-footer bg-white text-end">
              <button className="btn btn-sm btn-link" onClick={() => navigate('vistorias')}>Ver todas &rarr;</button>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white fw-semibold">Últimos Orçamentos</div>
            <ul className="list-group list-group-flush">
              {data.ultimosOrcamentos.length === 0 && <li className="list-group-item text-muted">Nenhum orçamento cadastrado.</li>}
              {data.ultimosOrcamentos.map((o) => (
                <li key={o.ID_ORCAMENTO} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">{o.Empresa}</div>
                    <small className="text-muted">{formatDate(o.DataEmissao)} • v{o.Versao}</small>
                  </div>
                  <span className="fw-semibold text-success">{formatCurrency(o.ValorTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="card-footer bg-white text-end">
              <button className="btn btn-sm btn-link" onClick={() => navigate('orcamentos')}>Ver todos &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
