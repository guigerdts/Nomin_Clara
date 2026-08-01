import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { CalculatorPage } from './pages/CalculatorPage/CalculatorPage';

const ComparePage = lazy(() => import('./pages/ComparePage/ComparePage').then(m => ({ default: m.ComparePage })));
const LiquidacionPage = lazy(() => import('./pages/LiquidacionPage/LiquidacionPage').then(m => ({ default: m.LiquidacionPage })));

const SuspenseFallback = (
  <div className="container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</div>
);

function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <Header />
      <main id="main-content" className="container">
        <Routes>
          <Route path="/" element={<CalculatorPage />} />
          <Route path="/compare" element={
            <Suspense fallback={SuspenseFallback}>
              <ComparePage />
            </Suspense>
          } />
          <Route path="/liquidacion" element={
            <Suspense fallback={SuspenseFallback}>
              <LiquidacionPage />
            </Suspense>
          } />
        </Routes>
      </main>
      <Footer />
      <ToastContainer />
    </BrowserRouter>
  );
}

export { App };
