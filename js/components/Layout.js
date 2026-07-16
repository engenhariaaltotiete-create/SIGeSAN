/**
 * ============================================================
 *  Layout.js
 *  Sidebar (menu lateral) e Topbar (menu superior) do sistema.
 * ============================================================
 */

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { key: 'obras', label: 'Obras', icon: 'bi-building' },
  { key: 'vistorias', label: 'Vistorias', icon: 'bi-clipboard-check' },
  { key: 'orcamentos', label: 'Orçamentos', icon: 'bi-cash-coin' }
];

function Sidebar({ currentPage, navigate, collapsed, onCloseMobile }) {
  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <i className="bi bi-droplet-half"></i>
          {!collapsed && <span>SIGeSAN</span>}
        </div>
        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`sidebar-link ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => { navigate(item.key); onCloseMobile && onCloseMobile(); }}
              title={item.label}
            >
              <i className={`bi ${item.icon}`}></i>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        {!collapsed && (
          <div className="sidebar-footer">
            <small className="text-muted">Gestão de Obras de Saneamento</small>
            <small className="text-muted d-block">v1.0.0</small>
          </div>
        )}
      </aside>
      {!collapsed && <div className="sidebar-backdrop d-lg-none" onClick={onCloseMobile}></div>}
    </>
  );
}

function Topbar({ onToggleSidebar, theme, onToggleTheme, onSearch, pageTitle }) {
  const [query, setQuery] = React.useState('');
  const debouncedSearch = React.useMemo(() => debounce(onSearch, 400), [onSearch]);

  return (
    <header className="topbar">
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-icon d-lg-none" onClick={onToggleSidebar}>
          <i className="bi bi-list fs-4"></i>
        </button>
        <button className="btn btn-icon d-none d-lg-inline-flex" onClick={onToggleSidebar}>
          <i className="bi bi-layout-sidebar-inset fs-5"></i>
        </button>
        <h1 className="topbar-title">{pageTitle}</h1>
      </div>

      <div className="topbar-search d-none d-md-flex">
        <i className="bi bi-search"></i>
        <input
          type="text"
          placeholder="Pesquisar..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); debouncedSearch(e.target.value); }}
        />
      </div>

      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-icon" onClick={onToggleTheme} title="Alternar tema">
          <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`}></i>
        </button>
        <div className="topbar-avatar" title="Usuário do sistema">
          <i className="bi bi-person-fill"></i>
        </div>
      </div>
    </header>
  );
}
