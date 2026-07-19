/**
 * ============================================================
 *  ObraFormPage.js
 *  Formulário de cadastro/edição de obras, com validação
 *  completa de campos obrigatórios e máscaras.
 * ============================================================
 */
function ObraFormPage({ navigate, params }) {
  const isEdit = !!params?.idObra;
  const [form, setForm] = React.useState({
    Codigo: '', NomeObra: '', Municipio: '', Bairro: '', Endereco: '',
    Latitude: '', Longitude: '', TipoObra: '', Situacao: 'Planejada',
    EmpresaContratada: '', ResponsavelTecnico: '', Fiscal: '',
    DataInicio: '', DataPrevista: '', DataConclusao: '',
    ValorContratado: '', PercentualExecutado: '0', Observacoes: ''
  });
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(isEdit);

  const tiposObra = ['Rede de Água', 'Rede de Esgoto', 'Estação de Tratamento', 'Poço Artesiano', 'Reservatório', 'Drenagem Urbana', 'Outros'];
  const situacoes = ['Planejada', 'Em andamento', 'Paralisada', 'Concluída', 'Cancelada'];

  React.useEffect(() => {
    if (!isEdit) return;
    ObrasAPI.get(params.idObra).then((res) => {
      const obra = res.data.obra;
      setForm({
        ...form,
        ...obra,
        DataInicio: toInputDate(obra.DataInicio),
        DataPrevista: toInputDate(obra.DataPrevista),
        DataConclusao: toInputDate(obra.DataConclusao)
      });
    }).catch((err) => window.toast.error('Erro ao carregar obra: ' + err.message))
      .finally(() => setLoading(false));
  }, [params?.idObra]);

  function toInputDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const { valid, errors } = validateForm(form, {
      NomeObra: { required: true, message: 'Informe o nome da obra.' },
      Municipio: { required: true, message: 'Informe o município.' },
      TipoObra: { required: true, message: 'Selecione o tipo da obra.' },
      Situacao: { required: true, message: 'Selecione a situação.' },
      ValorContratado: { number: true },
      PercentualExecutado: { number: true }
    });
    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { window.toast.warning('Corrija os campos destacados antes de continuar.'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await ObrasAPI.update({ ID_OBRA: params.idObra, ...form });
        window.toast.success('Obra atualizada com sucesso.');
      } else {
        await ObrasAPI.create(form);
        window.toast.success('Obra cadastrada com sucesso.');
      }
      DataStore.invalidate('listObras');
      DataStore.invalidate('dashboard');
      DataStore.invalidate('getObra');
      DataStore.invalidate('listMunicipios');
      DataStore.invalidate('listTiposObra');
      navigate('obras');
    } catch (err) {
      window.toast.error('Erro ao salvar obra: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading text="Carregando dados da obra..." inline />;

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-icon" onClick={() => navigate('obras')}><i className="bi bi-arrow-left fs-5"></i></button>
        <h5 className="mb-0">{isEdit ? 'Editar Obra' : 'Nova Obra'}</h5>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
        <div className="card-body">
          <h6 className="section-title">Identificação</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <label className="form-label">Código</label>
              <input className="form-control" value={form.Codigo} onChange={(e) => handleChange('Codigo', e.target.value)} placeholder="Ex: OBR-2026-001" />
            </div>
            <div className="col-md-9">
              <label className="form-label">Nome da Obra *</label>
              <input className={`form-control ${errors.NomeObra ? 'is-invalid' : ''}`} value={form.NomeObra} onChange={(e) => handleChange('NomeObra', e.target.value)} />
              {errors.NomeObra && <div className="invalid-feedback">{errors.NomeObra}</div>}
            </div>
          </div>

          <h6 className="section-title">Localização</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">Município *</label>
              <input className={`form-control ${errors.Municipio ? 'is-invalid' : ''}`} value={form.Municipio} onChange={(e) => handleChange('Municipio', e.target.value)} />
              {errors.Municipio && <div className="invalid-feedback">{errors.Municipio}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">Bairro</label>
              <input className="form-control" value={form.Bairro} onChange={(e) => handleChange('Bairro', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Endereço</label>
              <input className="form-control" value={form.Endereco} onChange={(e) => handleChange('Endereco', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Latitude</label>
              <input type="number" step="any" className="form-control" value={form.Latitude} onChange={(e) => handleChange('Latitude', e.target.value)} placeholder="-23.5505" />
            </div>
            <div className="col-md-3">
              <label className="form-label">Longitude</label>
              <input type="number" step="any" className="form-control" value={form.Longitude} onChange={(e) => handleChange('Longitude', e.target.value)} placeholder="-46.6333" />
            </div>
          </div>

          <h6 className="section-title">Classificação</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label">Tipo da Obra *</label>
              <select className={`form-select ${errors.TipoObra ? 'is-invalid' : ''}`} value={form.TipoObra} onChange={(e) => handleChange('TipoObra', e.target.value)}>
                <option value="">Selecione...</option>
                {tiposObra.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.TipoObra && <div className="invalid-feedback">{errors.TipoObra}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label">Situação *</label>
              <select className="form-select" value={form.Situacao} onChange={(e) => handleChange('Situacao', e.target.value)}>
                {situacoes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <h6 className="section-title">Responsáveis</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">Empresa Contratada</label>
              <input className="form-control" value={form.EmpresaContratada} onChange={(e) => handleChange('EmpresaContratada', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Responsável Técnico</label>
              <input className="form-control" value={form.ResponsavelTecnico} onChange={(e) => handleChange('ResponsavelTecnico', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Fiscal</label>
              <input className="form-control" value={form.Fiscal} onChange={(e) => handleChange('Fiscal', e.target.value)} />
            </div>
          </div>

          <h6 className="section-title">Cronograma e Valores</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <label className="form-label">Data de Início</label>
              <input type="date" className="form-control" value={form.DataInicio} onChange={(e) => handleChange('DataInicio', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Data Prevista</label>
              <input type="date" className="form-control" value={form.DataPrevista} onChange={(e) => handleChange('DataPrevista', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Data de Conclusão</label>
              <input type="date" className="form-control" value={form.DataConclusao} onChange={(e) => handleChange('DataConclusao', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Valor Contratado (R$)</label>
              <input type="number" step="0.01" className={`form-control ${errors.ValorContratado ? 'is-invalid' : ''}`} value={form.ValorContratado} onChange={(e) => handleChange('ValorContratado', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Percentual Executado (%)</label>
              <input type="range" min="0" max="100" className="form-range" value={form.PercentualExecutado} onChange={(e) => handleChange('PercentualExecutado', e.target.value)} />
              <div className="d-flex justify-content-between"><small>0%</small><strong>{form.PercentualExecutado}%</strong><small>100%</small></div>
            </div>
          </div>

          <h6 className="section-title">Observações</h6>
          <textarea className="form-control mb-2" rows="3" value={form.Observacoes} onChange={(e) => handleChange('Observacoes', e.target.value)}></textarea>
        </div>

        <div className="card-footer bg-white d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('obras')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : 'Salvar Obra'}
          </button>
        </div>
      </form>
    </div>
  );
}
