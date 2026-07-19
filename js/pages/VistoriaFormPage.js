/**
 * ============================================================
 *  VistoriaFormPage.js
 *  Formulário de cadastro/edição de vistorias, com upload de
 *  fotos direto para o Google Drive (via base64) e busca
 *  inteligente da obra relacionada.
 * ============================================================
 */
function VistoriaFormPage({ navigate, params }) {
  const isEdit = !!params?.idVistoria;
  const [form, setForm] = React.useState({
    ID_OBRA: params?.idObra || '', Data: new Date().toISOString().slice(0, 10),
    Responsavel: '', Clima: 'Bom', SituacaoEncontrada: '', PercentualExecutado: '0',
    Pendencias: '', NaoConformidades: '', Observacoes: '', DataProximaVistoria: '', Status: 'Concluída'
  });
  const [obraSearch, setObraSearch] = React.useState('');
  const [obraOptions, setObraOptions] = React.useState([]);
  const [selectedObra, setSelectedObra] = React.useState(null);
  const [files, setFiles] = React.useState(null);
  const [existingPhotos, setExistingPhotos] = React.useState([]);
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const climas = ['Bom', 'Nublado', 'Chuvoso', 'Instável'];

  // Carrega dados da obra pré-selecionada (vindo da tela de detalhe) ou da vistoria em edição
  React.useEffect(() => {
    (async () => {
      try {
        if (params?.idObra) {
          const res = await ObrasAPI.get(params.idObra);
          setSelectedObra(res.data.obra);
        }
        if (isEdit) {
          // busca a vistoria dentro da lista da obra (endpoint de detalhe já retorna todas)
          const idObra = params.idObra;
          const res = await ObrasAPI.get(idObra);
          const v = res.data.vistorias.find((x) => x.ID_VISTORIA === params.idVistoria);
          if (v) {
            setForm({
              ...v,
              Data: v.Data ? new Date(v.Data).toISOString().slice(0, 10) : '',
              DataProximaVistoria: v.DataProximaVistoria ? new Date(v.DataProximaVistoria).toISOString().slice(0, 10) : ''
            });
            setExistingPhotos(String(v.Fotos || '').split(',').map((s) => s.trim()).filter(Boolean));
          }
        }
      } catch (err) {
        window.toast.error('Erro ao carregar dados: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const searchObras = React.useMemo(() => debounce(async (q) => {
    if (!q) { setObraOptions([]); return; }
    const res = await ObrasAPI.list({ q, pageSize: 8 });
    setObraOptions(res.data);
  }, 350), []);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const { valid, errors } = validateForm(form, {
      ID_OBRA: { required: true, message: 'Selecione a obra relacionada.' },
      Data: { required: true, message: 'Informe a data da vistoria.' },
      Responsavel: { required: true, message: 'Informe o responsável.' },
      SituacaoEncontrada: { required: true, message: 'Descreva a situação encontrada.' },
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
      const fotosBase64 = files ? await filesToPayload(files) : [];
      const payload = { ...form, fotosBase64 };
      if (isEdit) {
        await VistoriasAPI.update({ ID_VISTORIA: params.idVistoria, ...payload });
        window.toast.success('Vistoria atualizada com sucesso.');
      } else {
        await VistoriasAPI.create(payload);
        window.toast.success('Vistoria cadastrada com sucesso.');
      }
      DataStore.invalidate('listVistorias');
      DataStore.invalidate('dashboard');
      DataStore.invalidate('getObra');
      navigate('obraDetail', { idObra: form.ID_OBRA });
    } catch (err) {
      window.toast.error('Erro ao salvar vistoria: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading text="Carregando..." inline />;

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-icon" onClick={() => navigate(form.ID_OBRA ? 'obraDetail' : 'vistorias', form.ID_OBRA ? { idObra: form.ID_OBRA } : {})}>
          <i className="bi bi-arrow-left fs-5"></i>
        </button>
        <h5 className="mb-0">{isEdit ? 'Editar Vistoria' : 'Nova Vistoria'}</h5>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
        <div className="card-body">
          <h6 className="section-title">Obra Relacionada</h6>
          <div className="mb-4">
            {selectedObra ? (
              <div className="d-flex align-items-center justify-content-between border rounded p-2">
                <div><strong>{selectedObra.NomeObra}</strong><div className="small text-muted">{selectedObra.Municipio}</div></div>
                {!isEdit && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setSelectedObra(null); handleChange('ID_OBRA', ''); }}>Trocar</button>}
              </div>
            ) : (
              <div className="position-relative">
                <input
                  className={`form-control ${errors.ID_OBRA ? 'is-invalid' : ''}`}
                  placeholder="Pesquise a obra pelo nome ou código..."
                  value={obraSearch}
                  onChange={(e) => { setObraSearch(e.target.value); searchObras(e.target.value); }}
                />
                {obraOptions.length > 0 && (
                  <div className="autocomplete-list shadow-sm">
                    {obraOptions.map((o) => (
                      <button type="button" key={o.ID_OBRA} className="autocomplete-item" onClick={() => { setSelectedObra(o); handleChange('ID_OBRA', o.ID_OBRA); setObraOptions([]); setObraSearch(''); }}>
                        <strong>{o.NomeObra}</strong> <span className="text-muted small">{o.Municipio}</span>
                      </button>
                    ))}
                  </div>
                )}
                {errors.ID_OBRA && <div className="invalid-feedback d-block">{errors.ID_OBRA}</div>}
              </div>
            )}
          </div>

          <h6 className="section-title">Dados da Vistoria</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <label className="form-label">Data *</label>
              <input type="date" className={`form-control ${errors.Data ? 'is-invalid' : ''}`} value={form.Data} onChange={(e) => handleChange('Data', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Responsável *</label>
              <input className={`form-control ${errors.Responsavel ? 'is-invalid' : ''}`} value={form.Responsavel} onChange={(e) => handleChange('Responsavel', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Clima</label>
              <select className="form-select" value={form.Clima} onChange={(e) => handleChange('Clima', e.target.value)}>
                {climas.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.Status} onChange={(e) => handleChange('Status', e.target.value)}>
                <option value="Concluída">Concluída</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label">Situação Encontrada *</label>
              <textarea className={`form-control ${errors.SituacaoEncontrada ? 'is-invalid' : ''}`} rows="2" value={form.SituacaoEncontrada} onChange={(e) => handleChange('SituacaoEncontrada', e.target.value)}></textarea>
            </div>

            <div className="col-md-6">
              <label className="form-label">Percentual Executado (%)</label>
              <input type="range" min="0" max="100" className="form-range" value={form.PercentualExecutado} onChange={(e) => handleChange('PercentualExecutado', e.target.value)} />
              <div className="d-flex justify-content-between"><small>0%</small><strong>{form.PercentualExecutado}%</strong><small>100%</small></div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Data da Próxima Vistoria</label>
              <input type="date" className="form-control" value={form.DataProximaVistoria} onChange={(e) => handleChange('DataProximaVistoria', e.target.value)} />
            </div>

            <div className="col-md-6">
              <label className="form-label">Pendências</label>
              <textarea className="form-control" rows="2" value={form.Pendencias} onChange={(e) => handleChange('Pendencias', e.target.value)}></textarea>
            </div>
            <div className="col-md-6">
              <label className="form-label">Não Conformidades</label>
              <textarea className="form-control" rows="2" value={form.NaoConformidades} onChange={(e) => handleChange('NaoConformidades', e.target.value)}></textarea>
            </div>
            <div className="col-12">
              <label className="form-label">Observações</label>
              <textarea className="form-control" rows="2" value={form.Observacoes} onChange={(e) => handleChange('Observacoes', e.target.value)}></textarea>
            </div>
          </div>

          <h6 className="section-title">Fotos da Vistoria</h6>
          <FileUpload label="Enviar fotos (armazenadas no Google Drive)" accept="image/*" onChange={setFiles} previewUrls={existingPhotos} />
        </div>

        <div className="card-footer bg-white d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('obraDetail', { idObra: form.ID_OBRA })}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : 'Salvar Vistoria'}
          </button>
        </div>
      </form>
    </div>
  );
}
