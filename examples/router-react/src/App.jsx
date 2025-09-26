import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import { CtrlcanOrbit, useOrbit } from '@ctrlcan/orbit';

export default function App() {
  const tour = useOrbit();
  const nav = useNavigate();

  const steps = [
    { id: 's1', route: '/dashboard', dataTour: 'sales_metric', title: 'Dashboard', content: 'Sales metric on this page.' },
    { id: 's2', route: '/products', dataTour: 'product_list', title: 'Products', content: 'Here is the product list.', advance: { by: 'clickTarget' } },
    { id: 's3', modal: { enabled: true }, title: 'Done', content: 'Tour finished.' }
  ];

  return (
    <>
      <CtrlcanOrbit
        steps={steps}
        options={{
          i18n: { locale: 'en' },
          resumeOnLoad: true,
          storage: { key: 'ctrlcan:orbit:example:router', userKey: 'USER-2' },
          backdrop: { blur: 8, opacity: 0.5 },
          tooltip: { width: 380, placement: 'auto' }
        }}
      />
      <header className="header">
        <h1>ctrlcan-orbit • router-react</h1>
        <div className="actions">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/products">Products</NavLink>
          <button onClick={() => { nav('/dashboard'); tour.start('s1'); }}>Start Tour</button>
        </div>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
        </Routes>
      </main>
    </>
  );
}
