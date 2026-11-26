import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, FilePlus2, Wallet, Printer, Settings, Menu, X } from 'lucide-react';

const NAV = [
  { to: '/', l: 'Tableau de bord', i: LayoutDashboard, id: 'dashboard', end: true },
  { to: '/projets', l: 'Projets', i: FolderKanban, id: 'projects', end: true },
  { to: '/projets/nouveau', l: 'Nouveau projet', i: FilePlus2, id: 'new-project', end: true },
  { to: '/paiements', l: 'Paiements', i: Wallet, id: 'payments', end: true },
  { to: '/rapports', l: 'Impressions & exports', i: Printer, id: 'reports', end: true },
  { to: '/parametres', l: 'Paramètres & sauvegarde', i: Settings, id: 'settings', end: true },
];

export function Layout({ children }: any) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`} data-testid="sidebar">
        <div className="brand">
          <div className="brand-mark">SP</div>
          <div><div className="brand-name">SUIVI PROJETS</div><div className="brand-sub">Architecture</div></div>
          <button className="icon-btn close-nav" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`nav-${n.id}`} className={({ isActive }) => (isActive ? 'active' : '')}>
              <n.i size={18} /><span>{n.l}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">Données stockées sur cet appareil</div>
      </aside>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setOpen(true)} data-testid="mobile-menu-btn"><Menu size={20} /></button>
          <span className="brand-name">SUIVI PROJETS</span>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
