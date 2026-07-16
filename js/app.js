/**
 * ============================================================
 *  App.js
 *  Componente raiz. Controla o roteamento (baseado em hash,
 *  sem necessidade de servidor/build), o tema claro/escuro e
 *  o layout geral (sidebar + topbar + conteúdo).
 * ============================================================
 */

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  obras: 'Obras',
  obraForm: 'Cadastro de Obra',
  obraDetail: 'Detalhe da Obra',
  vistorias: 'Vistorias',
  vistoriaForm: 'Cadastro de Vistoria',
  orcamentos: 'Orçamentos',
  orcamentoForm: 'Cadastro de Orçamento'
};

/** Lê a rota atual a partir do hash da URL: #page?param1=x&param2=y */
function parseHash() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  const [page, queryString] = hash.split('?');
  const params = {};
  if (queryString) {
    new URLSearchParams(queryString).forEach((value, key) => { params[key] = value; });
  }
  return { page: page || 'dashboard', params };
}

function App() {
  const [route, setRoute] = React.useState(parseHash());
  const [theme, setTheme] = React.useState(localStorage.getItem('sigesan-theme') || 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = React.useState(false);

  // Sincroniza com o navegador (voltar/avançar)
  React.useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sigesan-theme', theme);
  }, [theme]);

  const navigate = (page, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    window.location.hash = qs ? `${page}?${qs}` : page;
  };

  const renderPage = () => {
    switch (route.page) {
      case 'dashboard': return <DashboardPage navigate={navigate} />;
      case 'obras': return <ObrasListPage navigate={navigate} params={route.params} />;
      case 'obraForm': return <ObraFormPage navigate={navigate} params={route.params} />;
      case 'obraDetail': return <ObraDetailPage navigate={navigate} params={route.params} />;
      case 'vistorias': return <VistoriasListPage navigate={navigate} params={route.params} />;
      case 'vistoriaForm': return <VistoriaFormPage navigate={navigate} params={route.params} />;
      case 'orcamentos': return <OrcamentosListPage navigate={navigate} params={route.params} />;
      case 'orcamentoForm': return <OrcamentoFormPage navigate={navigate} params={route.params} />;
      default: return <DashboardPage navigate={navigate} />;
    }
  };

  const currentPage = route.page.startsWith('obra') ? 'obras'
    : route.page.startsWith('vistoria') ? 'vistorias'
    : route.page.startsWith('orcamento') ? 'orcamentos'
    : 'dashboard';

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar
          currentPage={currentPage}
          navigate={navigate}
          collapsed={window.innerWidth >= 992 ? sidebarCollapsed : !sidebarMobileOpen}
          onCloseMobile={() => setSidebarMobileOpen(false)}
        />
        <div className="app-main">
          <Topbar
            pageTitle={PAGE_TITLES[route.page] || 'SIGeSAN'}
            theme={theme}
            onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            onToggleSidebar={() => {
              if (window.innerWidth >= 992) setSidebarCollapsed((c) => !c);
              else setSidebarMobileOpen((o) => !o);
            }}
            onSearch={(q) => { if (currentPage === 'obras') navigate('obras', { q }); }}
          />
          <main className="app-content">
            {renderPage()}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
