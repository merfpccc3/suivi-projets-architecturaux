import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Printer, Receipt as ReceiptIcon, Trash2, Pencil } from 'lucide-react';
import { useStore } from '../../store';
import { Card, Field, FinBadge, Modal } from '../../components/ui';
import { usePrint, FinanceStatement, Receipt } from '../../components/PrintDocs';
import { PAY_MODES, balanceText, fcfa, fdate, feesText, finStatus, rateText, today, totalPaid } from '../../lib/data';

export function FinanceTab({ p }: any) {
  const { addPayment, updateProject } = useStore(); const print = usePrint();
  const [f, setF] = useState<any>({ date: today(), amount: '', mode: PAY_MODES[0], ref: '', obs: '' });
  const [edit, setEdit] = useState<any>(null);
  const saveEdit = () => {
    const amount = Number(edit.amount);
    if (!(amount > 0)) { toast.error('Saisissez un montant valide'); return; }
    if (!window.confirm(`Enregistrer les modifications du paiement ${edit.receiptNo} ?`)) return;
    if (updateProject(p.id, (y: any) => ({ ...y, payments: y.payments.map((z: any) => (z.id === edit.id ? { ...edit, amount } : z)) }), `Paiement modifié : ${edit.receiptNo} (${fcfa(amount)})`)) { toast.success('Paiement modifié'); setEdit(null); }
  };
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const printReceipt = (pay: any) => print({ title: `Reçu ${pay.receiptNo}`, filename: `recu_${pay.receiptNo}`, node: <Receipt p={p} pay={pay} /> });

  const submit = (e: any) => {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!(amount > 0)) { toast.error('Saisissez un montant valide'); return; }
    const pay = addPayment(p.id, { ...f, amount });
    if (pay) { toast.success(`Paiement enregistré — reçu ${pay.receiptNo}`); setF({ ...f, amount: '', ref: '', obs: '' }); }
  };
  const del = (x: any) => window.confirm(`Supprimer le paiement ${x.receiptNo} ?`) &&
    updateProject(p.id, (y: any) => ({ ...y, payments: y.payments.filter((z: any) => z.id !== x.id) }), `Paiement supprimé : ${x.receiptNo} (${fcfa(x.amount)})`);

  const pays = [...p.payments].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="grid-2" data-testid="finance-tab">
      <Card title="Situation financière" actions={<button className="btn sm" onClick={() => print({ title: 'État financier', filename: `etat_financier_${p.number}`, node: <FinanceStatement projects={[p]} single /> })} data-testid="print-finance-btn"><Printer size={15} />État financier</button>}>
        <div className="fin-grid">
          <div><span>Honoraires convenus</span><b data-testid="fin-fees">{feesText(p)}</b></div>
          <div><span>Avance convenue</span><b data-testid="fin-advance">{Number(p.advance) > 0 ? fcfa(p.advance) : 'À renseigner'}</b></div>
          <div><span>Total encaissé</span><b className="pos" data-testid="fin-paid">{fcfa(totalPaid(p))}</b></div>
          <div><span>Solde restant</span><b data-testid="fin-balance">{balanceText(p)}</b></div>
          <div><span>Taux d'encaissement</span><b data-testid="fin-rate">{rateText(p)}</b></div>
        </div>
        <p><FinBadge f={finStatus(p)} /> <span className="muted small">Modifiez les honoraires via « Modifier ».</span></p>
      </Card>
      <Card title="Enregistrer un paiement">
        <form className="form-grid" onSubmit={submit} data-testid="payment-form">
          <Field label="Date du paiement"><input type="date" value={f.date} onChange={set('date')} data-testid="pay-date" /></Field>
          <Field label="Montant reçu (FCFA)"><input type="number" min={0} value={f.amount} onChange={set('amount')} data-testid="pay-amount" /></Field>
          <Field label="Mode de paiement"><select value={f.mode} onChange={set('mode')} data-testid="pay-mode">{PAY_MODES.map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Référence"><input value={f.ref} onChange={set('ref')} data-testid="pay-ref" /></Field>
          <Field label="Observation" full><input value={f.obs} onChange={set('obs')} data-testid="pay-obs" /></Field>
          <div className="full"><button className="btn primary" type="submit" data-testid="add-payment-btn"><Plus size={16} />Enregistrer le paiement</button></div>
        </form>
      </Card>
      <Card title="Historique des encaissements" className="span-2">
        <div className="table-wrap"><table className="table" data-testid="payments-history">
          <thead><tr><th>Date</th><th>N° reçu</th><th>Mode</th><th>Référence</th><th>Observation</th><th className="r">Montant</th><th></th></tr></thead>
          <tbody>
            {pays.length === 0 && <tr><td colSpan={7} className="muted">Aucun paiement enregistré</td></tr>}
            {pays.map((x) => (
              <tr key={x.id} data-testid={`payment-row-${x.receiptNo}`}>
                <td>{fdate(x.date)}</td><td className="mono">{x.receiptNo}</td><td>{x.mode}</td><td>{x.ref || '—'}</td><td>{x.obs}</td><td className="r pos">{fcfa(x.amount)}</td>
                <td className="nowrap">
                  <button className="btn sm" onClick={() => printReceipt(x)} data-testid={`print-receipt-${x.receiptNo}`}><ReceiptIcon size={14} />Reçu</button>
                  <button className="icon-btn" onClick={() => setEdit({ ...x })} data-testid={`edit-payment-${x.receiptNo}`}><Pencil size={15} /></button>
                  <button className="icon-btn danger" onClick={() => del(x)} data-testid={`delete-payment-${x.receiptNo}`}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
      {edit && (
        <Modal title={`Modifier le paiement ${edit.receiptNo}`} onClose={() => setEdit(null)} testId="edit-payment-modal">
          <div className="form-grid">
            <Field label="Date du paiement"><input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} data-testid="edit-pay-date" /></Field>
            <Field label="Montant reçu (FCFA)"><input type="number" min={0} value={edit.amount} onChange={(e) => setEdit({ ...edit, amount: e.target.value })} data-testid="edit-pay-amount" /></Field>
            <Field label="Mode de paiement"><select value={edit.mode} onChange={(e) => setEdit({ ...edit, mode: e.target.value })} data-testid="edit-pay-mode">{PAY_MODES.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Référence"><input value={edit.ref} onChange={(e) => setEdit({ ...edit, ref: e.target.value })} data-testid="edit-pay-ref" /></Field>
            <Field label="Observation" full><input value={edit.obs} onChange={(e) => setEdit({ ...edit, obs: e.target.value })} data-testid="edit-pay-obs" /></Field>
          </div>
          <div className="form-foot"><button className="btn primary" onClick={saveEdit} data-testid="edit-pay-save">Enregistrer</button></div>
        </Modal>
      )}
    </div>
  );
}
