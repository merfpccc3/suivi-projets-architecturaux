import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Printer, FileSpreadsheet, Check } from 'lucide-react';
import { useStore } from '../../store';
import { Card, Empty, Field, Modal, Progress } from '../../components/ui';
import { usePrint, TaskListDoc } from '../../components/PrintDocs';
import { downloadCSV, fdate, today, uid } from '../../lib/data';

const blank = { title: '', deadline: '', obs: '' };

export function TasksTab({ p }: any) {
  const { updateProject } = useStore(); const print = usePrint();
  const [f, setF] = useState<any>(blank);
  const [edit, setEdit] = useState<any>(null);
  const [view, setView] = useState('all');
  const save = (tasks: any[], hist?: string) => updateProject(p.id, (x: any) => ({ ...x, tasks }), hist);

  const add = (e: any) => {
    e.preventDefault(); if (!f.title.trim()) return;
    save([...p.tasks, { id: uid(), ...f, title: f.title.trim(), done: false }], `Tâche ajoutée : ${f.title.trim()}`); setF(blank);
  };
  const toggle = (t: any) => save(p.tasks.map((x: any) => (x.id === t.id ? { ...x, done: !x.done } : x)), `Tâche ${t.done ? 'rouverte' : 'terminée'} : ${t.title}`);
  const del = (t: any) => window.confirm(`Supprimer la tâche « ${t.title} » ?`) && save(p.tasks.filter((x: any) => x.id !== t.id), `Tâche supprimée : ${t.title}`);
  const saveEdit = () => { save(p.tasks.map((x: any) => (x.id === edit.id ? edit : x)), `Tâche modifiée : ${edit.title}`); setEdit(null); };

  const doneN = p.tasks.filter((t: any) => t.done).length;
  const pct = p.tasks.length ? Math.round((doneN / p.tasks.length) * 100) : 0;
  const list = p.tasks.filter((t: any) => view === 'all' || (view === 'left' ? !t.done : t.done));
  const t0 = today();

  return (
    <Card title={`Tâches — ${doneN}/${p.tasks.length} réalisées`} testId="tasks-tab"
      actions={<>
        <Progress value={pct} testId="tasks-progress" />
        <button className="btn sm" onClick={() => downloadCSV(`taches_${p.number}.csv`, ['Tâche', 'Date limite', 'État', 'Observations'], p.tasks.map((t: any) => [t.title, fdate(t.deadline), t.done ? 'Réalisée' : 'En attente', t.obs]))} data-testid="export-tasks-csv-btn"><FileSpreadsheet size={15} />CSV</button>
        <button className="btn sm" onClick={() => print({ title: 'Liste des tâches', filename: `taches_${p.number}`, node: <TaskListDoc p={p} /> })} data-testid="print-tasks-btn"><Printer size={15} />Imprimer</button>
      </>}>
      <form className="task-form" onSubmit={add}>
        <input placeholder="Nouvelle tâche…" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} data-testid="new-task-title" />
        <input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} data-testid="new-task-deadline" />
        <input placeholder="Observation" value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} data-testid="new-task-obs" />
        <button className="btn primary" type="submit" data-testid="add-task-btn"><Plus size={16} />Ajouter</button>
      </form>
      <div className="seg">
        {[['all', 'Toutes'], ['left', `Restantes (${p.tasks.length - doneN})`], ['done', 'Réalisées']].map(([k, l]) => <button key={k} className={view === k ? 'active' : ''} onClick={() => setView(k)} data-testid={`tasks-filter-${k}`}>{l}</button>)}
      </div>
      {list.length === 0 ? <Empty>Aucune tâche</Empty> : (
        <ul className="tasks" data-testid="tasks-list">
          {list.map((t: any) => (
            <li key={t.id} className={t.done ? 'done' : ''} data-testid={`task-item-${t.id}`}>
              <button className={`check ${t.done ? 'on' : ''}`} onClick={() => toggle(t)} data-testid={`task-toggle-${t.id}`}>{t.done && <Check size={14} />}</button>
              <div className="grow"><b>{t.title}</b>{t.obs && <small>{t.obs}</small>}</div>
              {t.deadline && <span className={`date-chip ${!t.done && t.deadline < t0 ? 'danger' : ''}`}>{fdate(t.deadline)}</span>}
              <button className="icon-btn" onClick={() => setEdit({ ...t })} data-testid={`task-edit-${t.id}`}><Pencil size={15} /></button>
              <button className="icon-btn danger" onClick={() => del(t)} data-testid={`task-delete-${t.id}`}><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
      {edit && (
        <Modal title="Modifier la tâche" onClose={() => setEdit(null)} testId="edit-task-modal">
          <div className="form-grid">
            <Field label="Tâche" full><input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} data-testid="edit-task-title" /></Field>
            <Field label="Date limite"><input type="date" value={edit.deadline} onChange={(e) => setEdit({ ...edit, deadline: e.target.value })} data-testid="edit-task-deadline" /></Field>
            <Field label="Observation" full><textarea rows={3} value={edit.obs} onChange={(e) => setEdit({ ...edit, obs: e.target.value })} data-testid="edit-task-obs" /></Field>
          </div>
          <div className="form-foot"><button className="btn primary" onClick={saveEdit} data-testid="edit-task-save">Enregistrer</button></div>
        </Modal>
      )}
    </Card>
  );
}
