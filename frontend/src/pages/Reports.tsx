import React, { useState } from 'react';
import { FileBarChart, Banknote, FileSpreadsheet, ListChecks, Printer } from 'lucide-react';
import { useStore } from '../store';
import { Project } from '../types';
import { Card } from '../components/ui';
import { usePrint, ActivityReport, FinanceStatement } from '../components/PrintDocs';
import { balance, downloadCSV, fdate, finLabel, finStatus, progress, statusLabel, today, totalPaid } from '../lib/data';

export default function Reports() {
  const { projects } = useStore().data; const print = usePrint();
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const sel = projects.filter((p: Project) => (!from || p.receivedDate >= from) && (!to || p.receivedDate <= to));
  const period = from || to ? `Période : ${fdate(from)} au ${fdate(to)}` : 'Toutes périodes';

  const exportProjects = () => downloadCSV(`projets_${today()}.csv`, ['N° dossier', 'Intitulé', 'Client', 'Lieu', 'Type', 'Statut', 'Réception', 'Avancement %', 'Honoraires', 'Encaissé', 'Solde', 'Situation'],
    sel.map((p: Project) => [p.number, p.title, p.client, p.location, p.type, statusLabel(p.status), fdate(p.receivedDate), progress(p), p.fees, totalPaid(p), balance(p), finLabel(finStatus(p))]));
  const exportPayments = () => downloadCSV(`paiements_${today()}.csv`, ['Date', 'N° reçu', 'N° dossier', 'Projet', 'Client', 'Mode', 'Référence', 'Montant (FCFA)'],
    sel.flatMap((p: Project) => p.payments.map((x) => [fdate(x.date), x.receiptNo, p.number, p.title, p.client, x.mode, x.ref, x.amount])));
  const exportTasks = () => downloadCSV(`taches_${today()}.csv`, ['N° dossier', 'Projet', 'Tâche', 'Date limite', 'État', 'Observations'],
    sel.flatMap((p: Project) => p.tasks.map((t) => [p.number, p.title, t.title, fdate(t.deadline), t.done ? 'Réalisée' : 'En attente', t.obs])));

  return (
    <div className="page" data-testid="reports-page">
      <div className="page-head"><div><h1>Impressions & exports</h1><p className="muted">Documents A4 imprimables, PDF et exports Excel/CSV</p></div></div>
      <Card className="filters"><div className="filter-row">
        <label className="inline-date">Projets reçus du <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="report-from" /></label>
        <label className="inline-date">au <input type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="report-to" /></label>
        <span className="muted small">{sel.length} projet(s) sélectionné(s)</span>
      </div></Card>
      <div className="report-grid">
        <Card title="Rapport d'activité" icon={FileBarChart}>
          <p className="muted small">Projets reçus, en cours, terminés, en attente, suspendus et niveau global d'avancement.</p>
          <button className="btn primary" onClick={() => print({ title: "Rapport d'activité", filename: `rapport_activite_${today()}`, node: <ActivityReport projects={sel} period={period} /> })} data-testid="print-activity-report-btn"><Printer size={16} />Aperçu / Imprimer / PDF</button>
        </Card>
        <Card title="État financier global" icon={Banknote}>
          <p className="muted small">Honoraires convenus, paiements reçus avec dates, total encaissé et soldes.</p>
          <button className="btn primary" onClick={() => print({ title: 'État financier global', filename: `etat_financier_${today()}`, node: <FinanceStatement projects={sel} /> })} data-testid="print-finance-report-btn"><Printer size={16} />Aperçu / Imprimer / PDF</button>
        </Card>
        <Card title="Exports Excel / CSV" icon={FileSpreadsheet}>
          <p className="muted small">Fichiers compatibles Excel (séparateur point-virgule).</p>
          <div className="row-actions">
            <button className="btn" onClick={exportProjects} data-testid="export-all-projects-btn"><FileSpreadsheet size={16} />Projets</button>
            <button className="btn" onClick={exportPayments} data-testid="export-all-payments-btn"><FileSpreadsheet size={16} />Paiements</button>
            <button className="btn" onClick={exportTasks} data-testid="export-all-tasks-btn"><ListChecks size={16} />Tâches</button>
          </div>
        </Card>
      </div>
      <p className="muted small">La fiche de projet, la liste des tâches, l'état financier d'un dossier et les reçus s'impriment depuis la fiche de chaque projet.</p>
    </div>
  );
}
