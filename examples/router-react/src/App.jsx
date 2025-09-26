import React, { useEffect, useState } from 'react';
import { CtrlcanOrbit, useOrbit } from '@ctrlcan/orbit';

function Nav() {
  const go = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('locationchange')); // history patch yakalayacak
    }
  };
  const path = window.location.pathname;
  return (
    <nav className="nav">
      <button className={path==='/dashboard'?'active':''} onClick={() => go('/dashboard')}>Dashboard</button>
      <button className={path==='/products'?'active':''} onClick={() => go('/products')}>Products</button>
    </nav>
  );
}

function PageSwitch() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const h = () => setPath(window.location.pathname);
    window.addEventListener('locationchange', h);
    window.addEventListener('popstate', h);
    return () => { window.removeEventListener('locationchange', h); window.removeEventListener('popstate', h); };
  }, []);
  if (path === '/products') return (await import('./pages/Products.jsx')).default();
  // basit render için dynamic import yerine koşullu import yapmayalım:
  return path === '/products'
    ? React.createElement((await import('./pages/Products.jsx')).default)
    : React.createElement((await import('./pages/Dashboard.jsx')).default);
}

// Basit synchronous çözüm (dynamic import yerine):
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
function Pages() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const h = () => setPath(window.location.pathname);
    window.addEventListener('locationchange', h);
    window.addEventListener('popstate', h);
    return () => { window.removeEventListener('locationchange', h); window.removeEventListener('popstate', h); };
  }, []);
  return path === '/products' ? <Products /> : <Dashboard />;
}

export default function App() {
  const tour = useOrbit();

  const steps = [
    { id: 's1', route: '/dashboard', dataTour: 'sales_metric', title: 'Dashboard', content: 'Sales metrics are highlighted here.' },
    { id: 's2', route: '/products', dataTour: 'product_list', title: 'Products', content: 'This is your product list.', advance: { by: 'clickTarget' } },
    { id: 's3', modal: { enabled: true }, title: 'All set', content: 'You can close the tour now.' }
  ];

  return (
    <>
      <CtrlcanOrbit
        steps={steps}
        options={{
          i18n: { locale: 'tr' },           // otomatik yerine TR
          resumeOnLoad: true,
          storage: { key: 'ctrlcan:orbit:example:spa', userKey: 'USER-1' },
          backdrop: { blur: 8, opacity: 0.5 },
          tooltip: { width: 360, placement: 'auto' },
          spotlight: { padding: 12, borderRadius: 12 }
        }}
      />
      <header className="header">
        <h1>ctrlcan-orbit • spa-basic</h1>
        <div className="actions">
          <button onClick={() => { if (window.location.pathname !== '/dashboard') history.pushState({}, '', '/dashboard'); window.dispatchEvent(new Event('locationchange')); }}>Go /dashboard</button>
          <button onClick={() => tour.start('s1')}>Start Tour</button>
        </div>
      </header>
      <Nav />
      <main className="content">
        <Pages />
      </main>
    </>
  );
}
