import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Printer, Download, X } from 'lucide-react';
import { useStore } from '../store';
import { Project } from '../types';
import { STATUSES, STEP_STATUSES, balance, fcfa, fdate, finLabel, finStatus, nowTime, progress, statusLabel, today, totalPaid } from '../lib/data';

const PrintCtx = createContext<any>(null);
export const usePrint = () => useContext(PrintCtx);

export function PrintProvider({ children }: any) {
  const [doc, setDoc] = useState<any>(null);
  return (
    <PrintCtx.Provider value={setDoc}>
      {children}
      {doc && <PrintPreview doc={doc} onClose={() => setDoc(null)} />}
    </PrintCtx.Provider>
  );
}

function PrintPreview({ doc, onClose }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    document.body.classList.add('printing');
    return () => { document.body.classList.remove('printing'); };
  }, []);

  const pdf = async () => {
    setBusy(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set({
        margin: [10, 10, 14, 10], filename: `${doc.filename}.pdf`,
        image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, windowWidth: 800 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.avoid-break'] },
      }).from(ref.current).toPdf().get('pdf').then((p: any) => {
        const n = p.internal.getNumberOfPages();
        for (let i = 1; i <= n; i++) { p.setPage(i); p.setFontSize(8); p.setTextColor(120); p.text(`Page ${i} / ${n}`, 200, 290, { align: 'right' }); }
      }).save();
      toast.success('PDF téléchargé');
    } catch (e) { toast.error('Échec de la génération du PDF'); }
    setBusy(false);
  };

  return createPortal(
    <div className="print-layer" data-testid="print-preview">
      <div className="print-toolbar no-print">
        <strong>{doc.title}</strong>
        <div className="row-actions">
          <button className="btn primary" onClick={() => window.print()} data-testid="print-now-btn"><Printer size={16} />Imprimer</button>
          <button className="btn success" onClick={pdf} disabled={busy} data-testid="download-pdf-btn"><Download size={16} />{busy ? 'Génération…' : 'Télécharger PDF'}</button>
          <button className="btn ghost light" onClick={onClose} data-testid="close-preview-btn"><X size={16} />Fermer</button>
        </div>
      </div>
      <div className="print-scroll"><div className="a4-page"><div className="a4" ref={ref} id="print-doc">{doc.node}</div></div></div>
    </div>,
    document.body,
  );
}

export function DocHeader({ title, subtitle }: any) {
  const s = useStore().data.settings;
  return (
    <div className="doc-head">
      <div className="doc-brand">
        <div className="doc-logo">SP</div>
        <div>
          <div className="doc-org">{s.header}</div>
          <div className="doc-sub">{s.subheader}</div>
          <div className="doc-contact">{[s.address, s.phone, s.email].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <div className="doc-meta">
        <div className="doc-title">{title}</div>
        {subtitle && <div className="doc-subtitle">{subtitle}</div>}
        <div className="doc-date">Édité le {fdate(today())} à {nowTime()}</div>
      </div>
    </div>
  );
}

const KV = ({ rows }: any) => (
  <table className="doc-kv"><tbody>{rows.map(([k, v]: any) => <tr key={k}><th>{k}</th><td>{v || '—'}</td></tr>)}</tbody></table>
);
const Txt = ({ label, value }: any) => value ? <div className="doc-txt avoid-break"><h5>{label}</h5><p>{value}</p></div> : null;

const PaymentsTable = ({ p }: { p: Project }) => (
  <table className="doc-table">
    <thead><tr><th>N° reçu</th><th>Date</th><th>Mode</th><th>Référence</th><th className="r">Montant</th></tr></thead>
    <tbody>
      {p.payments.length === 0 && <tr><td colSpan={5}>Aucun paiement enregistré</td></tr>}
      {[...p.payments].sort((a, b) => a.date.localeCompare(b.date)).map((x) => (
        <tr key={x.id}><td>{x.receiptNo}</td><td>{fdate(x.date)}</td><td>{x.mode}</td><td>{x.ref || '—'}</td><td className="r">{fcfa(x.amount)}</td></tr>
      ))}
    </tbody>
  </table>
);

const FinSummary = ({ p }: { p: Project }) => (
  <div className="doc-totals avoid-break">
    <div><span>Honoraires convenus</span><b>{fcfa(p.fees)}</b></div>
    <div><span>Avance convenue</span><b>{fcfa(p.advance)}</b></div>
    <div><span>Total encaissé</span><b className="pos">{fcfa(totalPaid(p))}</b></div>
    <div><span>Solde restant</span><b>{fcfa(balance(p))}</b></div>
  </div>
);

export function ProjectSheet({ p }: { p: Project }) {
  return (
    <div data-testid="doc-project-sheet">
      <DocHeader title="FICHE DE PROJET" subtitle={`Dossier ${p.number}`} />
      <h2 className="doc-h">{p.title}</h2>
      <h4 className="doc-sec">Informations générales</h4>
      <KV rows={[['N° de dossier', p.number], ['Type de projet', p.type], ['Statut', statusLabel(p.status)], ['Lieu de réalisation', p.location], ['Réception', `${fdate(p.receivedDate)} ${p.receivedTime || ''}`], ['Livraison prévue', fdate(p.deadline)]]} />
      <h4 className="doc-sec">Client / Commanditaire</h4>
      <KV rows={[['Nom', p.client], ['Téléphone', p.phone]]} />
      <h4 className="doc-sec">Description et concept</h4>
      <Txt label="Description du projet" value={p.description} />
      <Txt label="Concept architectural" value={p.concept} />
      <Txt label="Objectifs et besoins du client" value={p.needs} />
      <h4 className="doc-sec">Caractéristiques techniques</h4>
      <KV rows={[['Superficie du terrain', p.landArea && `${p.landArea} m²`], ['Surface bâtie prévue', p.builtArea && `${p.builtArea} m²`], ['Nombre de niveaux', p.levels], ['Nombre de pièces', p.rooms], ['Budget prévisionnel', p.budget && fcfa(p.budget)]]} />
      <h4 className="doc-sec">Étapes et avancement — {progress(p)} %</h4>
      <table className="doc-table">
        <thead><tr><th>Étape</th><th>Début</th><th>Fin prévue</th><th>État</th><th>Observations</th></tr></thead>
        <tbody>{p.steps.map((s) => <tr key={s.id}><td>{s.name}</td><td>{fdate(s.start)}</td><td>{fdate(s.end)}</td><td>{STEP_STATUSES.find((x) => x.v === s.status)?.l}</td><td>{s.obs}</td></tr>)}</tbody>
      </table>
      <p className="doc-note">Tâches réalisées : {p.tasks.filter((t) => t.done).length} / {p.tasks.length}</p>
      <h4 className="doc-sec">Situation financière — {finLabel(finStatus(p))}</h4>
      <FinSummary p={p} />
      <PaymentsTable p={p} />
      {p.documents.length > 0 && <><h4 className="doc-sec">Documents associés</h4>
        <table className="doc-table"><thead><tr><th>Document</th><th>Catégorie</th><th>Date d'ajout</th></tr></thead>
          <tbody>{p.documents.map((d) => <tr key={d.id}><td>{d.name}</td><td>{d.category}</td><td>{fdate(d.date)}</td></tr>)}</tbody></table></>}
      <h4 className="doc-sec">Observations</h4>
      <p className="doc-p">{p.observations || '—'}</p>
      <Signature />
    </div>
  );
}

const Signature = () => (
  <div className="doc-sign avoid-break"><div><span>Signature</span></div><div><span>Cachet</span></div></div>
);

export function FinanceStatement({ projects, single }: { projects: Project[]; single?: boolean }) {
  if (single) {
    const p = projects[0];
    return (
      <div data-testid="doc-finance-statement">
        <DocHeader title="ÉTAT FINANCIER" subtitle={`Dossier ${p.number}`} />
        <KV rows={[['Projet', p.title], ['Client', p.client], ['Situation', finLabel(finStatus(p))]]} />
        <h4 className="doc-sec">Récapitulatif</h4>
        <FinSummary p={p} />
        <h4 className="doc-sec">Historique des encaissements</h4>
        <PaymentsTable p={p} />
        <Signature />
      </div>
    );
  }
  const fees = projects.reduce((s, p) => s + (Number(p.fees) || 0), 0);
  const paid = projects.reduce((s, p) => s + totalPaid(p), 0);
  const pays = projects.flatMap((p) => p.payments.map((x) => ({ ...x, p }))).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div data-testid="doc-finance-statement">
      <DocHeader title="ÉTAT FINANCIER GLOBAL" subtitle={`${projects.length} projet(s)`} />
      <div className="doc-totals avoid-break">
        <div><span>Honoraires convenus</span><b>{fcfa(fees)}</b></div>
        <div><span>Total encaissé</span><b className="pos">{fcfa(paid)}</b></div>
        <div><span>Reste à percevoir</span><b>{fcfa(fees - paid)}</b></div>
      </div>
      <h4 className="doc-sec">Situation par projet</h4>
      <table className="doc-table">
        <thead><tr><th>N°</th><th>Projet</th><th>Client</th><th className="r">Honoraires</th><th className="r">Encaissé</th><th className="r">Solde</th></tr></thead>
        <tbody>{projects.map((p) => <tr key={p.id}><td>{p.number}</td><td>{p.title}</td><td>{p.client}</td><td className="r">{fcfa(p.fees)}</td><td className="r">{fcfa(totalPaid(p))}</td><td className="r">{fcfa(balance(p))}</td></tr>)}</tbody>
      </table>
      <h4 className="doc-sec">Paiements reçus</h4>
      <table className="doc-table">
        <thead><tr><th>Date</th><th>N° reçu</th><th>Projet</th><th>Mode</th><th className="r">Montant</th></tr></thead>
        <tbody>{pays.length === 0 && <tr><td colSpan={5}>Aucun paiement</td></tr>}
          {pays.map((x) => <tr key={x.id}><td>{fdate(x.date)}</td><td>{x.receiptNo}</td><td>{x.p.number} — {x.p.title}</td><td>{x.mode}</td><td className="r">{fcfa(x.amount)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function ActivityReport({ projects, period }: { projects: Project[]; period?: string }) {
  const avg = projects.length ? Math.round(projects.reduce((s, p) => s + progress(p), 0) / projects.length) : 0;
  const Table = ({ list }: any) => (
    <table className="doc-table">
      <thead><tr><th>N°</th><th>Projet</th><th>Client</th><th>Type</th><th>Réception</th><th className="r">Avancement</th></tr></thead>
      <tbody>{list.map((p: Project) => <tr key={p.id}><td>{p.number}</td><td>{p.title}</td><td>{p.client}</td><td>{p.type}</td><td>{fdate(p.receivedDate)}</td><td className="r">{progress(p)} %</td></tr>)}</tbody>
    </table>
  );
  return (
    <div data-testid="doc-activity-report">
      <DocHeader title="RAPPORT D'ACTIVITÉ" subtitle={period} />
      <div className="doc-totals avoid-break">
        <div><span>Projets reçus</span><b>{projects.length}</b></div>
        {STATUSES.map((s) => <div key={s.v}><span>{s.l}</span><b>{projects.filter((p) => p.status === s.v).length}</b></div>)}
        <div><span>Avancement global moyen</span><b className="pos">{avg} %</b></div>
      </div>
      <h4 className="doc-sec">Liste des projets reçus</h4>
      <Table list={projects} />
      {STATUSES.map((s) => {
        const list = projects.filter((p) => p.status === s.v);
        return list.length ? <div key={s.v}><h4 className="doc-sec">{s.l} ({list.length})</h4><Table list={list} /></div> : null;
      })}
    </div>
  );
}

export function TaskListDoc({ p }: { p: Project }) {
  const Section = ({ title, list }: any) => (
    <>
      <h4 className="doc-sec">{title} ({list.length})</h4>
      <table className="doc-table">
        <thead><tr><th>Tâche</th><th>Date limite</th><th>État</th><th>Observations</th></tr></thead>
        <tbody>{list.length === 0 && <tr><td colSpan={4}>Aucune tâche</td></tr>}
          {list.map((t: any) => <tr key={t.id}><td>{t.title}</td><td>{fdate(t.deadline)}</td><td>{t.done ? 'Réalisée' : 'En attente'}</td><td>{t.obs}</td></tr>)}</tbody>
      </table>
    </>
  );
  return (
    <div data-testid="doc-task-list">
      <DocHeader title="LISTE DES TÂCHES" subtitle={`Dossier ${p.number}`} />
      <KV rows={[['Projet', p.title], ['Client', p.client], ['Avancement', `${progress(p)} %`]]} />
      <Section title="Tâches en attente" list={p.tasks.filter((t) => !t.done)} />
      <Section title="Tâches réalisées" list={p.tasks.filter((t) => t.done)} />
    </div>
  );
}

export function Receipt({ p, pay }: any) {
  const idx = p.payments.findIndex((x: any) => x.id === pay.id);
  const paidAt = p.payments.filter((x: any, i: number) => x.date < pay.date || (x.date === pay.date && i <= idx)).reduce((s: number, x: any) => s + (Number(x.amount) || 0), 0);
  return (
    <div className="receipt" data-testid="doc-receipt">
      <DocHeader title="REÇU DE PAIEMENT" subtitle={`N° ${pay.receiptNo}`} />
      <div className="receipt-amount avoid-break"><span>Montant reçu</span><b>{fcfa(pay.amount)}</b></div>
      <KV rows={[['Reçu N°', pay.receiptNo], ['Reçu de', p.client], ['Projet', `${p.title} (${p.number})`], ['Date du paiement', fdate(pay.date)], ['Mode de paiement', pay.mode], ['Référence', pay.ref], ['Objet', pay.obs || "Honoraires d'architecture"]]} />
      <div className="doc-totals avoid-break">
        <div><span>Honoraires convenus</span><b>{fcfa(p.fees)}</b></div>
        <div><span>Total encaissé à cette date</span><b>{fcfa(paidAt)}</b></div>
        <div><span>Solde restant</span><b>{fcfa((Number(p.fees) || 0) - paidAt)}</b></div>
      </div>
      <Signature />
    </div>
  );
}
