import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Printer, Trash2, ArrowLeft } from 'lucide-react';
import { useProject, useStore } from '../store';
import { Card, Empty, FinBadge, Progress } from '../components/ui';
import { usePrint, ProjectSheet } from '../components/PrintDocs';
import { STATUSES, balance, fcfa, fdate, fdatetime, finStatus, progress, statusLabel, totalPaid } from '../lib/data';
import { InfoTab } from './detail/InfoTab';
import { StepsTab } from './detail/StepsTab';
import { TasksTab } from './detail/TasksTab';
import { FinanceTab } from './detail/FinanceTab';
import { DocsTab } from './detail/DocsTab';

const TABS = [['info', 'Informations'], ['steps', 'Étapes'], ['tasks', 'Tâches'], ['finance', 'Finances'], ['docs', 'Documents'], ['history', 'Historique']];

export default function ProjectDetail() {
  const { id } = useParams(); const nav = useNavigate();
  const { updateProject, deleteProject } = useStore();
  const p = useProject(id); const print = usePrint();
  const [tab, setTab] = useState('info');
  if (!p) return <div className="page"><Empty>Projet introuvable. <Link to="/projets">Retour à la liste</Link></Empty></div>;

  const changeStatus = (e: any) => updateProject(p.id, (x: any) => ({ ...x, status: e.target.value }), `Statut modifié : ${statusLabel(e.target.value)}`) && toast.success('Statut mis à jour');
  const remove = () => { if (window.confirm(`Supprimer définitivement le dossier ${p.number} ?`)) { deleteProject(p.id); toast.success('Projet supprimé'); nav('/projets'); } };

  return (
    <div className="page" data-testid="project-detail-page">
      <Link to="/projets" className="back"><ArrowLeft size={15} />Projets</Link>
      <div className="page-head">
        <div><div className="mono muted" data-testid="project-number">{p.number}</div><h1 data-testid="project-title">{p.title}</h1>
          <p className="muted">{p.client} · {p.location || 'Lieu non précisé'} · {p.type}</p></div>
        <div className="row-actions">
          <select value={p.status} onChange={changeStatus} className="status-select" data-testid="project-status-select">{STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>
          <Link to={`/projets/${p.id}/modifier`} className="btn" data-testid="edit-project-btn"><Pencil size={16} />Modifier</Link>
          <button className="btn primary" onClick={() => print({ title: 'Fiche du projet', filename: `fiche_${p.number}`, node: <ProjectSheet p={p} /> })} data-testid="print-project-sheet-btn"><Printer size={16} />Imprimer la fiche du projet</button>
          <button className="btn danger ghost" onClick={remove} data-testid="delete-project-btn"><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="summary">
        <div><span>Avancement</span><Progress value={progress(p)} testId="project-progress" /></div>
        <div><span>Honoraires</span><b data-testid="summary-fees">{fcfa(p.fees)}</b></div>
        <div><span>Encaissé</span><b className="pos" data-testid="summary-paid">{fcfa(totalPaid(p))}</b></div>
        <div><span>Solde restant</span><b data-testid="summary-balance">{fcfa(balance(p))}</b> <FinBadge f={finStatus(p)} /></div>
        <div><span>Livraison prévue</span><b>{fdate(p.deadline)}</b></div>
      </div>
      <div className="tabs" data-testid="project-tabs">
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)} data-testid={`tab-${k}`}>{l}</button>)}
      </div>
      {tab === 'info' && <InfoTab p={p} />}
      {tab === 'steps' && <StepsTab p={p} />}
      {tab === 'tasks' && <TasksTab p={p} />}
      {tab === 'finance' && <FinanceTab p={p} />}
      {tab === 'docs' && <DocsTab p={p} />}
      {tab === 'history' && (
        <Card title="Historique des modifications">
          <ul className="timeline" data-testid="history-list">
            {[...p.history].reverse().map((h, i) => <li key={i}><span>{fdatetime(h.date)}</span>{h.text}</li>)}
          </ul>
        </Card>
      )}
    </div>
  );
}
