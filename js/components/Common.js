/**
 * ============================================================
 *  Common.js
 *  Componentes pequenos e reutilizáveis por todo o sistema.
 * ============================================================
 */

/** Spinner de carregamento em tela cheia ou embutido */
function Loading({ text = 'Carregando...', inline = false }) {
  if (inline) {
    return (
      <div className="d-flex align-items-center justify-content-center py-4 text-muted">
        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
        {text}
      </div>
    );
  }
  return (
    <div className="loading-overlay">
      <div className="text-center">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
        <p className="mt-3 text-muted">{text}</p>
      </div>
    </div>
  );
}

/** Estado vazio (nenhum registro encontrado) */
function EmptyState({ icon = 'bi-inbox', title = 'Nenhum registro encontrado', subtitle = '' }) {
  return (
    <div className="text-center py-5 text-muted">
      <i className={`bi ${icon}`} style={{ fontSize: '3rem', opacity: 0.4 }}></i>
      <p className="mt-3 mb-0 fw-semibold">{title}</p>
      {subtitle && <p className="small">{subtitle}</p>}
    </div>
  );
}

/** Modal de confirmação genérico (ex: exclusão de registros) */
function ConfirmModal({ show, title, message, onConfirm, onCancel, confirmText = 'Excluir', variant = 'danger' }) {
  if (!show) return null;
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-card shadow-lg">
        <div className="modal-card-header">
          <h5 className="mb-0"><i className="bi bi-exclamation-triangle text-danger me-2"></i>{title}</h5>
        </div>
        <div className="modal-card-body">
          <p className="mb-0">{message}</p>
        </div>
        <div className="modal-card-footer">
          <button className="btn btn-outline-secondary" onClick={onCancel}>Cancelar</button>
          <button className={`btn btn-${variant}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

/** Paginação Bootstrap reutilizável */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  let last = 0;
  return (
    <nav aria-label="Paginação">
      <ul className="pagination pagination-sm justify-content-center mb-0">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChange(page - 1)}>&laquo;</button>
        </li>
        {pages.map((p) => {
          const showEllipsis = p - last > 1;
          last = p;
          return (
            <React.Fragment key={p}>
              {showEllipsis && <li className="page-item disabled"><span className="page-link">…</span></li>}
              <li className={`page-item ${p === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => onChange(p)}>{p}</button>
              </li>
            </React.Fragment>
          );
        })}
        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChange(page + 1)}>&raquo;</button>
        </li>
      </ul>
    </nav>
  );
}

/** Barra de progresso com percentual */
function ProgressBar({ value }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  const color = v >= 100 ? 'bg-success' : v >= 50 ? 'bg-primary' : 'bg-warning';
  return (
    <div className="progress" style={{ height: '8px' }} title={`${v}% executado`}>
      <div className={`progress-bar ${color}`} style={{ width: `${v}%` }}></div>
    </div>
  );
}

/** Badge de status genérico */
function Badge({ text, className }) {
  return <span className={`badge rounded-pill ${className}`}>{text}</span>;
}

/** Card de indicador do dashboard */
function StatCard({ icon, label, value, color = 'primary' }) {
  return (
    <div className="col-6 col-md-4 col-xl-2-4">
      <div className="stat-card card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className={`stat-icon bg-${color}-subtle text-${color}`}>
            <i className={`bi ${icon}`}></i>
          </div>
          <div>
            <div className="stat-value">{value}</div>
            <div className="stat-label text-muted">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Campo de upload de arquivos com preview de imagens */
function FileUpload({ label, multiple = true, accept = 'image/*', onChange, previewUrls = [] }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      <input
        type="file"
        className="form-control"
        multiple={multiple}
        accept={accept}
        onChange={(e) => onChange(e.target.files)}
      />
      {previewUrls.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-2">
          {previewUrls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer" className="file-preview-thumb">
              {/^https?:.*\.(pdf)$/i.test(url)
                ? <i className="bi bi-file-earmark-pdf-fill text-danger fs-2"></i>
                : <img src={url} alt={`arquivo-${i}`} />}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
