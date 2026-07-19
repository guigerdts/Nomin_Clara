import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { CalculatorPage } from './pages/CalculatorPage/CalculatorPage';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<CalculatorPage />} />
          <Route
            path="/compare"
            element={
              <div className="page-header">
                <h1>Comparar Registros</h1>
                <p className="subtitle">Próximamente en PR3.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
