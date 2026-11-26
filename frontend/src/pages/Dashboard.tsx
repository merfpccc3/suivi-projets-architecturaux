import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Inbox, Hourglass, Loader, CheckCircle2, PauseCircle, PackageCheck, Banknote, Wallet, TrendingDown, Clock, AlertTriangle, Plus } from 'lucide-react';
import { useStore } from '../store';
import { Project } from '../types';
import { Card, Empty, Progress, Stat, StatusBadge } from '../components/ui';
import { balance, deadlineItems, fcfa, fdate, progress, today, totalPaid } from '../lib/data';

const DeadlineList = ({ items, testId, danger }: any) => (
  <ul className="list" data-testid={testId}>
    {items.length === 0 && <Empty>Aucun élément</Empty>}
    {items.slice(0, 8).map((x: any, i: number) => (
      <li key={i}><Link to={`/projets/${x.p.id}`}>
        <span className={`date-chip ${danger ? 'danger' : ''}`}>{fdate(x.date)}</span>
        <span className="grow"><b>{x.p.title}</b><small>{x.label}</small></span>
      </Link></li>
    ))}
  </ul>
);

const ProjectList = ({ list, testId }: any) => (
  <ul className="list" data-testid={testId}>
    {list.length === 0 && <Empty>Aucun projet</Empty>}
    {list.slice(0, 6).map((p: Project) => (
      <li key={p.id}><Link to={`/projets/${p.id}`}>
        <span className="grow"><b>{p.title}</b><small>{p.number} · {p.client}</small></span>
        <span className="list-side"><StatusBadge status={p.status} /><Progress value={progress(p)} /></span>
      </Link></li>
    ))}
  </ul>
);

export default function Dashboard() {
  const { projects } = useStore().data;
  const count = (s: string) => projects.filter((p: Project) => p.status === s).length;
  const fees = projects.reduce((s: number, p: Project) => s + (Number(p.fees) || 0), 0);
  const paid = projects.reduce((s: number, p: Project) => s + totalPaid(p), 0);
  const due = projects.reduce((s: number, p: Project) => s + Math.max(0, balance(p)), 0);
  const toDeliver = projects.filter((p: Project) => ['en_cours', 'validation', 'termine'].includes(p.status)).length;
  const items = deadlineItems(projects); const t = today();
  const upcoming = items.filter((x) => x.date >= t);
  const overdue = items.filter((x) => x.date < t);
  const recent = [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pays = projects.flatMap((p: Project) => p.payments.map((x) => ({ ...x, p }))).sort((a: any, b: any) => b.date.localeCompare(a.date));

  return (
    <div className="page" data-testid="dashboard-page">
      <div className="page-head">
        <div><h1>Tableau de bord</h1><p className="muted">Vue d'ensemble de vos dossiers d'architecture</p></div>
        <Link to="/projets/nouveau" className="btn primary" data-testid="dashboard-new-project-btn"><Plus size={16} />Nouveau projet</Link>
      </div>
      <div className="stats">
        <Stat label="Total des projets" value={projects.length} icon={FolderKanban} tone="navy" testId="stat-total" />
        <Stat label="Nouvellement reçus" value={count('nouveau')} icon={Inbox} testId="stat-new" />
        <Stat label="En attente" value={count('attente')} icon={Hourglass} testId="stat-waiting" />
        <Stat label="En cours" value={count('en_cours')} icon={Loader} testId="stat-ongoing" />
        <Stat label="Terminés" value={count('termine')} icon={CheckCircle2} tone="green" testId="stat-done" />
        <Stat label="Suspendus" value={count('suspendu')} icon={PauseCircle} tone="red" testId="stat-suspended" />
        <Stat label="Dossiers à livrer" value={toDeliver} icon={PackageCheck} testId="stat-to-deliver" />
      </div>
      <div className="stats money">
        <Stat label="Honoraires convenus" value={fcfa(fees)} icon={Banknote} tone="navy" testId="stat-fees" />
        <Stat label="Paiements reçus" value={fcfa(paid)} icon={Wallet} tone="green" testId="stat-paid" />
        <Stat label="Reste à percevoir" value={fcfa(due)} icon={TrendingDown} tone="amber" testId="stat-due" />
      </div>
      <div className="grid-2">
        <Card title="Derniers projets enregistrés" icon={FolderKanban}><ProjectList list={recent} testId="recent-projects" /></Card>
        <Card title="Projets en cours" icon={Loader}><ProjectList list={projects.filter((p: Project) => p.status === 'en_cours')} testId="ongoing-projects" /></Card>
        <Card title="Prochaines échéances" icon={Clock}><DeadlineList items={upcoming} testId="upcoming-deadlines" /></Card>
        <Card title="Délais dépassés" icon={AlertTriangle} className="warn-card"><DeadlineList items={overdue} testId="overdue-deadlines" danger /></Card>
        <Card title="Derniers paiements enregistrés" icon={Wallet} className="span-2">
          <div className="table-wrap"><table className="table" data-testid="recent-payments">
            <thead><tr><th>Date</th><th>Reçu</th><th>Projet</th><th>Mode</th><th className="r">Montant</th></tr></thead>
            <tbody>
              {pays.length === 0 && <tr><td colSpan={5} className="muted">Aucun paiement</td></tr>}
              {pays.slice(0, 6).map((x: any) => <tr key={x.id}><td>{fdate(x.date)}</td><td>{x.receiptNo}</td><td><Link to={`/projets/${x.p.id}`}>{x.p.title}</Link></td><td>{x.mode}</td><td className="r pos">{fcfa(x.amount)}</td></tr>)}
            </tbody>
          </table></div>
        </Card>
      </div>
    </div>
  );
}
