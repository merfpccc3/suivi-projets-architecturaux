import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Printer, Receipt as ReceiptIcon } from 'lucide-react';
import { useStore } from '../store';
import { Project } from '../types';
import { Card, Stat } from '../components/ui';
import { usePrint, FinanceStatement, Receipt } from '../components/PrintDocs';
import { PAY_MODES, downloadCSV, fcfa, fdate, today } from '../lib/data';
import { Wallet } from 'lucide-react';

export default function Payments() {
  const { projects } = useStore().data; const print = usePrint();
  const [f, setF] = useState({ mode: '', from: '', to: '' });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const pays = useMemo(() => projects.flatMap((p: Project) => p.payments.map((x) => ({ ...x, p })))
    .filter((x: any) => (!f.mode || x.mode === f.mode) && (!f.from || x.date >= f.from) && (!f.to || x.date <= f.to))
    .sort((a: any, b: any) => b.date.localeCompare(a.date)), [projects, f]);
  const total = pays.reduce((s: number, x: any) => s + x.amount, 0);

  const exportCSV = () => downloadCSV(`paiements_${today()}.csv`, ['Date', 'N° reçu', 'N° dossier', 'Projet', 'Client', 'Mode', 'Référence', 'Montant (FCFA)', 'Observation'],
    pays.map((x: any) => [fdate(x.date), x.receiptNo, x.p.number, x.p.title, x.p.client, x.mode, x.ref, x.amount, x.obs]));

  return (
    <div className="page" data-testid="payments-page">
      <div className="page-head">
        <div><h1>Paiements</h1><p className="muted">Historique complet des encaissements</p></div>
        <div className="row-actions">
          <button className="btn" onClick={exportCSV} data-testid="export-payments-csv-btn"><FileSpreadsheet size={16} />Excel / CSV</button>
          <button className="btn primary" onClick={() => print({ title: 'État financier global', filename: `etat_financier_${today()}`, node: <FinanceStatement projects={projects} /> })} data-testid="print-global-finance-btn"><Printer size={16} />État financier</button>
        </div>
      </div>
      <div className="stats money"><Stat label={`${pays.length} paiement(s) affiché(s)`} value={fcfa(total)} icon={Wallet} tone="green" testId="payments-total" /></div>
      <Card className="filters"><div className="filter-row">
        <select value={f.mode} onChange={set('mode')} data-testid="pay-filter-mode"><option value="">Tous les modes</option>{PAY_MODES.map((m) => <option key={m}>{m}</option>)}</select>
        <label className="inline-date">Du <input type="date" value={f.from} onChange={set('from')} data-testid="pay-filter-from" /></label>
        <label className="inline-date">Au <input type="date" value={f.to} onChange={set('to')} data-testid="pay-filter-to" /></label>
      </div></Card>
      <Card><div className="table-wrap"><table className="table" data-testid="all-payments-table">
        <thead><tr><th>Date</th><th>N° reçu</th><th>Projet</th><th>Client</th><th>Mode</th><th>Référence</th><th className="r">Montant</th><th></th></tr></thead>
        <tbody>
          {pays.length === 0 && <tr><td colSpan={8} className="muted">Aucun paiement</td></tr>}
          {pays.map((x: any) => (
            <tr key={x.id}><td>{fdate(x.date)}</td><td className="mono">{x.receiptNo}</td><td><Link to={`/projets/${x.p.id}`}>{x.p.title}</Link></td><td>{x.p.client}</td><td>{x.mode}</td><td>{x.ref || '—'}</td><td className="r pos">{fcfa(x.amount)}</td>
              <td><button className="btn sm" onClick={() => print({ title: `Reçu ${x.receiptNo}`, filename: `recu_${x.receiptNo}`, node: <Receipt p={x.p} pay={x} /> })} data-testid={`all-print-receipt-${x.receiptNo}`}><ReceiptIcon size={14} />Reçu</button></td></tr>
          ))}
        </tbody>
      </table></div></Card>
    </div>
  );
}
