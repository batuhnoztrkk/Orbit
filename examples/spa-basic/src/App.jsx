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
    // INTRO — ortalanmış modal (responsive)
    {
      id: 's1',
      modal: {
        enabled: true,
        width: '64vw',               // responsive
        height: '56vh',
        className: 'orbitIntro',
        style: {
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          // istersen min/max sınırı:
          maxWidth: '920px', minWidth: '340px',
          maxHeight: '640px', minHeight: '320px',
          borderRadius: 20
        }
      },
      title: 'Welcome',
      content: (
        <div>
          <p>Intro content...</p>
        </div>
      ),
      controls: { showPrev: false, showClose: true },
      classNames: {
        modal: 'orbitModalShell',
        actions: 'orbitActions',
        btnNext: 'orbitBtnPrimary',
        btnPrev: 'orbitBtnSecondary',
        btnClose: 'orbitBtnGhost'
      },
      // Dış alan için hafif blur/dim
      backdrop: { blur: 10, opacity: 0.5 }
    },

    // FOCUS — hem modal hem highlight (dış alan blur; highlight deliği NET)
    {
      id: 's2',
      route: '/dashboard',
      dataTour: 'sales_metric',
      title: 'Focus on metric',
      content: (
        <div>
          <p>Look here while modal shows tips.</p>
        </div>
      ),
      modal: {
        enabled: true,
        width: '52vw',
        height: '44vh',
        className: 'orbitModal',
        style: {
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '980px', minWidth: '360px',
          maxHeight: '680px', minHeight: '320px',
          borderRadius: 16
        },
        // Spotlight maskelemesi için modal deliği kenarı:
        maskRadius: 16,
        maskPadding: 0
      },
      // Dış alanı blurla, deliği net bırak:
      backdrop: { blur: 14, opacity: 0.55 },

      // Highlight deliği kenarları — deliğin İÇİ net kalsın
      // Eğer sende highlight hala bulanık görünürse, blur'ı 0 yap:
      // spotlight: { padding: 12, borderRadius: 12, blur: 0, dimOpacity: 0.6 }
      spotlight: { padding: 12, borderRadius: 12, blur: 0, dimOpacity: 0.6 },

      classNames: {
        modal: 'orbitModalShell',
        tooltip: 'orbitTooltip',
        actions: 'orbitActions',
        btnNext: 'orbitBtnPrimary',
        btnPrev: 'orbitBtnSecondary',
        btnClose: 'orbitBtnGhost',
        spotlightBlur: 'orbitSpotlightBlur',
        spotlightDim: 'orbitSpotlightDim'
      }
    },

    // PRODUCTS — clickTarget ile ilerleme (tooltip modu)
    {
      id: 's3',
      route: '/products',
      dataTour: 'product_list',
      title: 'Products',
      content: 'This is your product list.',
      advance: { by: 'clickTarget' },
      tooltip: { width: 360, placement: 'right', offset: 16 },
      spotlight: { padding: 10, borderRadius: 12, blur: 10, dimOpacity: 0.6 },
      classNames: {
        tooltip: 'orbitTooltip',
        actions: 'orbitActions',
        btnNext: 'orbitBtnPrimary',
        btnPrev: 'orbitBtnSecondary',
        btnClose: 'orbitBtnGhost'
      }
    },

    // OUTRO — ortalanmış modal (responsive)
    {
      id: 's4',
      modal: {
        enabled: true,
        width: '60vw',
        height: '50vh',
        className: 'orbitOutro',
        style: {
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '900px', minWidth: '340px',
          maxHeight: '620px', minHeight: '320px',
          borderRadius: 20
        }
      },
      title: 'All set',
      content: 'You can close the tour now.',
      controls: { showPrev: false, showClose: true },
      classNames: {
        modal: 'orbitModalShell',
        actions: 'orbitActions',
        btnNext: 'orbitBtnPrimary',
        btnPrev: 'orbitBtnSecondary',
        btnClose: 'orbitBtnGhost'
      },
      backdrop: { blur: 10, opacity: 0.5 }
    }
  ]), []);

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
