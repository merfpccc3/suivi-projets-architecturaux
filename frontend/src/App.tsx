import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StoreProvider } from './store';
import { PrintProvider } from './components/PrintDocs';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectForm from './pages/ProjectForm';
import ProjectDetail from './pages/ProjectDetail';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <StoreProvider>
        <PrintProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projets" element={<Projects />} />
                <Route path="/projets/nouveau" element={<ProjectForm />} />
                <Route path="/projets/:id" element={<ProjectDetail />} />
                <Route path="/projets/:id/modifier" element={<ProjectForm />} />
                <Route path="/paiements" element={<Payments />} />
                <Route path="/rapports" element={<Reports />} />
                <Route path="/parametres" element={<SettingsPage />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </PrintProvider>
      </StoreProvider>
    </>
  );
}
