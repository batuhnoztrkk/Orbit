import React, { useEffect, useState, useMemo } from 'react';
import { CtrlcanOrbit, useOrbit } from '@ctrlcan/orbit';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import './styles.css';

function navigate(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('locationchange')); // history patch dinleyenler için
  }
}

function Nav() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const h = () => setPath(window.location.pathname);
    window.addEventListener('locationchange', h);
    window.addEventListener('popstate', h);
    return () => {
      window.removeEventListener('locationchange', h);
      window.removeEventListener('popstate', h);
    };
  }, []);
  return (
    <nav className="nav">
      <button className={path === '/dashboard' ? 'active' : ''} onClick={() => navigate('/dashboard')}>
        Dashboard
      </button>
      <button className={path === '/products' ? 'active' : ''} onClick={() => navigate('/products')}>
        Products
      </button>
    </nav>
  );
}

function Pages() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const h = () => setPath(window.location.pathname);
    window.addEventListener('locationchange', h);
    window.addEventListener('popstate', h);
    return () => {
      window.removeEventListener('locationchange', h);
      window.removeEventListener('popstate', h);
    };
  }, []);
  return path === '/products' ? <Products /> : <Dashboard />;
}

export default function App() {
  const tour = useOrbit();

  const steps = useMemo(() => ([
    {
      id: 'intro',
      modal: {
        enabled: true,
        width: 720,
        height: 420,
        backgroundImage: '/img/hero.jpg',
        className: 'myIntro',
        // Konum: sabit (sol üst gibi)
        style: { position: 'absolute', top: 40, left: 40, transform: 'none' }
      },
      title: 'Welcome',
      content: <p>Intro content...</p>,
      controls: { showPrev: false, showClose: true }
    },
    {
      id: 's1',
      route: '/dashboard',
      dataTour: 'sales_metric',
      title: 'Dashboard',
      content: 'Sales metrics are highlighted here.',
      // İlk adımda geri gizli (global controls’dan da gelir; burada açıkça belirtmedim)
    },
    {
      id: 's2',
      route: '/products',
      dataTour: 'product_list',
      title: 'Products',
      content: 'This is your product list.',
      advance: { by: 'clickTarget' } // hedefe tıklayınca ilerle
    },
    {
      // Hedefsiz MODAL adım (intro/outro/checkpoint)
      id: 's3',
      modal: {
        enabled: true,
        width: 720,              // px veya '80vw' gibi string de verebilirsin
        height: 420,
        backgroundImage: '/img/hero.jpg', // opsiyonel: modal arka planı
        className: 'orbitIntro',          // opsiyonel: ekstra css sınıfı
        style: { borderRadius: 20 }       // opsiyonel: tam stil kontrolü
      },
      title: 'All set',
      content: 'You can close the tour now.',
      // Bu adımda geri butonu gereksiz, kapat olsun:
      controls: { showPrev: false, showClose: true }
    }
  ]), []); // IMPORTANT: steps’i useMemo ile stabilleştir (sonsuz render’ı keser)

  return (
    <>
      <CtrlcanOrbit
        steps={steps}
        options={{
          i18n: { locale: 'tr' },
          resumeOnLoad: true,
          storage: { key: 'ctrlcan:orbit:example:spa', userKey: 'USER-1' },

          tooltip: { width: 360, placement: 'right', offset: 16 },

          spotlight: { padding: 12, borderRadius: 12, blur: 10, dimOpacity: 0.62, shape: 'rounded' },

          backdrop: { blur: 10, opacity: 0.55 },

          controls: {
            hidePrevOnFirst: true, // s1'de “Geri” gizli
            showClose: true        // Close istersen false yap
          },

          modal: {
            style: { backgroundColor: '#0b0f14' }
          },

          wait: { timeoutMs: 8000, intervalMs: 120, scroll: 'smooth' },
          navigation: { escToClose: true, keybinds: { next: 'ArrowRight', prev: 'ArrowLeft' } }
        }}
      />

      <header className="header">
        <h1>ctrlcan-orbit • spa-basic</h1>
        <div className="actions">
          <button onClick={() => navigate('/dashboard')}>Go /dashboard</button>
          <button onClick={() => tour.start('intro')}>Start Tour</button>
        </div>
      </header>

      <Nav />
      <main className="content">
        <Pages />
      </main>
    </>
  );
}
