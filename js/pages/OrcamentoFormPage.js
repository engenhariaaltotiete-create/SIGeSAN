/**
 * ============================================================
 *  OrcamentoFormPage.js
 *  Formulário de cadastro/edição de orçamentos, com cálculo
 *  automático do valor total (material + mão de obra +
 *  equipamentos + BDI) e upload do PDF para o Google Drive.
 * ============================================================
 */
function OrcamentoFormPage({ navigate, params }) {
  const isEdit = !!params?.idOrcamento;
  const [form, setForm] = React.useState({
    ID_OBRA: params?.idObra || '', Numero: '', Empresa: '', Descricao: '',
    ValorMaterial: '0', ValorMaoObra: '0', ValorEquipamentos: '0', BDI: '20',
    Status: 'Em análise', DataEmissao: new Date().toISOString().slice(0, 10), Validade: '', Observacoes: ''
  });
  const [selectedObra, setSelectedObra] = React.useState(null);
  const [pdfFile, setPdfFile] = React.useState(null);
  const [existingPdf, setExistingPdf] = React.useState('');
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        if (params?.idObra) {
          const res = await ObrasAPI.get(params.idObra);
          setSelectedObra(res.data.obra);
          if (isEdit) {
            const o = res.data.orcamentos.find((x) => x.ID_ORCAMENTO === params.idOrcamento);
            if (o) {
              setForm({ ...o, DataEmissao: o.DataEmissao ? new Date(o.DataEmissao).toISOString().slice(0, 10) : '', Validade: o.Validade ? new Date(o.Validade).toISOString().slice(0, 10) : '' });
              setExistingPdf(o.ArquivoPDF || '');
            }
          }
        }
      } catch (err) {
        window.toast.error('Erro ao carregar dados: ' + err.message);
      } finally { setLoading(false); }
    })();
  }, []);

  const valorTotal = React.useMemo(() => {
    const material = Number(form.ValorMaterial) || 0;
    const maoObra = Number(form.ValorMaoObra) || 0;
    const equipamentos = Number(form.ValorEquipamentos) || 0;
    const bdi = Number(form.BDI) || 0;
    const subtotal = material + maoObra + equipamentos;
    return subtotal + subtotal * (bdi / 100);
  }, [form.ValorMaterial, form.ValorMaoObra, form.ValorEquipamentos, form.BDI]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const { valid, errors } = validateForm(form, {
      ID_OBRA: { required: true, message: 'Obra relacionada não identificada.' },
      Empresa: { required: true, message: 'Informe a empresa responsável pelo orçamento.' },
      ValorMaterial: { number: true }, ValorMaoObra: { number: true },
      ValorEquipamentos: { number: true }, BDI: { number: true }
    });
    setErrors(errors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { window.toast.warning('Corrija os campos destacados antes de continuar.'); return; }
    setSaving(true);
    try {
      let arquivoPdfBase64, arquivoPdfNome, arquivoPdfTipo;
      if (pdfFile) {
        arquivoPdfBase64 = await fileToBase64(pdfFile);
        arquivoPdfNome = pdfFile.name;
        arquivoPdfTipo = pdfFile.type;
      }
      const payload = { ...form, ValorTotal: valorTotal, arquivoPdfBase64, arquivoPdfNome, arquivoPdfTipo };
      if (isEdit) {
        await OrcamentosAPI.update({ ID_ORCAMENTO: params.idOrcamento, ...payload });
        window.toast.success('Orçamento atualizado com sucesso.');
      } else {
        await OrcamentosAPI.create(payload);
        window.toast.success('Orçamento cadastrado com sucesso.');
      }
      DataStore.invalidate('listOrcamentos');
      DataStore.invalidate('dashboard');
      DataStore.invalidate('getObra');
      navigate('obraDetail', { idObra: form.ID_OBRA });
    } catch (err) {
      window.toast.error('Erro ao salvar orçamento: ' + err.message);
    } finally { setSaving(false); }
  };

  if (loading) return <Loading text="Carregando..." inline />;

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-icon" onClick={() => navigate('obraDetail', { idObra: form.ID_OBRA })}><i className="bi bi-arrow-left fs-5"></i></button>
        <h5 className="mb-0">{isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}</h5>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
        <div className="card-body">
          {selectedObra && (
            <div className="alert alert-light border d-flex justify-content-between align-items-center">
              <div><i className="bi bi-building me-2"></i><strong>{selectedObra.NomeObra}</strong> — {selectedObra.Municipio}</div>
            </div>
          )}

          <h6 className="section-title">Identificação</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <label className="form-label">Número</label>
              <input className="form-control" value={form.Numero} onChange={(e) => handleChange('Numero', e.target.value)} placeholder="Ex: ORC-001" />
            </div>
            <div className="col-md-5">
              <label className="form-label">Empresa *</label>
              <input className={`form-control ${errors.Empresa ? 'is-invalid' : ''}`} value={form.Empresa} onChange={(e) => handleChange('Empresa', e.target.value)} />
              {errors.Empresa && <div className="invalid-feedback">{errors.Empresa}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.Status} onChange={(e) => handleChange('Status', e.target.value)}>
                <option value="Em análise">Em análise</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Reprovado">Reprovado</option>
                <option value="Vencido">Vencido</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Descrição</label>
              <textarea className="form-control" rows="2" value={form.Descricao} onChange={(e) => handleChange('Descricao', e.target.value)}></textarea>
            </div>
          </div>

          <h6 className="section-title">Composição de Valores</h6>
          <div className="row g-3 mb-2">
            <div className="col-md-3">
              <label className="form-label">Material (R$)</label>
              <input type="number" step="0.01" className="form-control" value={form.ValorMaterial} onChange={(e) => handleChange('ValorMaterial', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Mão de Obra (R$)</label>
              <input type="number" step="0.01" className="form-control" value={form.ValorMaoObra} onChange={(e) => handleChange('ValorMaoObra', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Equipamentos (R$)</label>
              <input type="number" step="0.01" className="form-control" value={form.ValorEquipamentos} onChange={(e) => handleChange('ValorEquipamentos', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">BDI (%)</label>
              <input type="number" step="0.01" className="form-control" value={form.BDI} onChange={(e) => handleChange('BDI', e.target.value)} />
            </div>
          </div>
          <div className="alert alert-primary d-flex justify-content-between align-items-center mb-4">
            <span>Valor Total Calculado</span>
            <strong className="fs-5">{formatCurrency(valorTotal)}</strong>
          </div>

          <h6 className="section-title">Validade</h6>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">Data de Emissão</label>
              <input type="date" className="form-control" value={form.DataEmissao} onChange={(e) => handleChange('DataEmissao', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Validade</label>
              <input type="date" className="form-control" value={form.Validade} onChange={(e) => handleChange('Validade', e.target.value)} />
            </div>
          </div>

          <h6 className="section-title">Observações</h6>
          <textarea className="form-control mb-4" rows="2" value={form.Observacoes} onChange={(e) => handleChange('Observacoes', e.target.value)}></textarea>

          <h6 className="section-title">Arquivo PDF do Orçamento</h6>
          <FileUpload label="Enviar PDF (armazenado no Google Drive)" multiple={false} accept="application/pdf" onChange={(files) => setPdfFile(files[0])} previewUrls={existingPdf ? [existingPdf] : []} />
        </div>

        <div className="card-footer bg-white d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('obraDetail', { idObra: form.ID_OBRA })}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</> : 'Salvar Orçamento'}
          </button>
        </div>
      </form>
    </div>
  );
}
