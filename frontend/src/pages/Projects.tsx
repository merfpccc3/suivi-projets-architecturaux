import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, FileSpreadsheet, Printer } from 'lucide-react';
import { useStore } from '../store';
import { Project } from '../types';
import { Card, Empty, FinBadge, Progress, StatusBadge } from '../components/ui';
import { usePrint, ActivityReport } from '../components/PrintDocs';
import { PROJECT_TYPES, STATUSES, balance, balanceText, feesText, downloadCSV, fcfa, fdate, finLabel, finStatus, progress, statusLabel, today, totalPaid } from '../lib/data';

export default function Projects() {
  const { projects } = useStore().data;
  const nav = useNavigate(); const print = usePrint();
  const [f, setF] = useState({ q: '', status: '', type: '', fin: '', from: '', to: '' });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return projects.filter((p: Project) =>
      (!q || [p.number, p.title, p.client, p.location, statusLabel(p.status)].join(' ').toLowerCase().includes(q)) &&
      (!f.status || p.status === f.status) && (!f.type || p.type === f.type) && (!f.fin || finStatus(p) === f.fin) &&
      (!f.from || p.receivedDate >= f.from) && (!f.to || p.receivedDate <= f.to));
  }, [projects, f]);

  const exportCSV = () => downloadCSV(`projets_${today()}.csv`,
    ['N° dossier', 'Intitulé', 'Client', 'Téléphone', 'Lieu', 'Type', 'Statut', 'Date réception', 'Livraison prévue', 'Avancement %', 'Honoraires', 'Encaissé', 'Solde', 'Situation'],
    list.map((p: Project) => [p.number, p.title, p.client, p.phone, p.location, p.type, statusLabel(p.status), fdate(p.receivedDate), fdate(p.deadline), progress(p), p.fees, totalPaid(p), balance(p), finLabel(finStatus(p))]));

  const period = f.from || f.to ? `Période : ${fdate(f.from)} au ${fdate(f.to)}` : 'Tous les projets';

  return (
    <div className="page" data-testid="projects-page">
      <div className="page-head">
        <div><h1>Projets</h1><p className="muted">{list.length} dossier(s) sur {projects.length}</p></div>
        <div className="row-actions">
          <button className="btn" onClick={exportCSV} data-testid="export-projects-csv-btn"><FileSpreadsheet size={16} />Excel / CSV</button>
          <button className="btn" onClick={() => print({ title: "Rapport d'activité", filename: `rapport_activite_${today()}`, node: <ActivityReport projects={list} period={period} /> })} data-testid="print-projects-btn"><Printer size={16} />Imprimer</button>
          <Link to="/projets/nouveau" className="btn primary" data-testid="projects-new-btn"><Plus size={16} />Nouveau</Link>
        </div>
      </div>
      <Card className="filters">
        <div className="search"><Search size={17} /><input placeholder="Rechercher : n° de dossier, projet, client, lieu, statut…" value={f.q} onChange={set('q')} data-testid="project-search-input" /></div>
        <div className="filter-row">
          <select value={f.status} onChange={set('status')} data-testid="filter-status"><option value="">Tous les statuts</option>{STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>
          <select value={f.type} onChange={set('type')} data-testid="filter-type"><option value="">Tous les types</option>{PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <select value={f.fin} onChange={set('fin')} data-testid="filter-finance"><option value="">Toute situation financière</option><option value="paid">Entièrement payés</option><option value="due">Solde à percevoir</option><option value="none">Honoraires non définis</option></select>
          <label className="inline-date">Du <input type="date" value={f.from} onChange={set('from')} data-testid="filter-from" /></label>
          <label className="inline-date">Au <input type="date" value={f.to} onChange={set('to')} data-testid="filter-to" /></label>
        </div>
      </Card>
      <Card>
        {list.length === 0 ? <Empty>Aucun projet trouvé. <Link to="/projets/nouveau">Créer un projet</Link></Empty> : (
          <div className="table-wrap"><table className="table hover" data-testid="projects-table">
            <thead><tr><th>N°</th><th>Intitulé</th><th>Client</th><th>Lieu</th><th>Statut</th><th>Avancement</th><th className="r">Honoraires</th><th className="r">Solde</th><th>Paiement</th></tr></thead>
            <tbody>{list.map((p: Project) => (
              <tr key={p.id} onClick={() => nav(`/projets/${p.id}`)} data-testid={`project-row-${p.number}`}>
                <td className="mono">{p.number}</td><td><b>{p.title}</b><div className="muted small">{p.type}</div></td><td>{p.client}</td><td>{p.location}</td>
                <td><StatusBadge status={p.status} /></td><td><Progress value={progress(p)} /></td>
                <td className="r">{feesText(p)}</td><td className="r">{balanceText(p)}</td><td><FinBadge f={finStatus(p)} /></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}
