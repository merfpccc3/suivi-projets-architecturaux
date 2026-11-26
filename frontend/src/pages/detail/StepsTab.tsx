import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { Card, Progress } from '../../components/ui';
import { STEP_STATUSES, uid } from '../../lib/data';

export function StepsTab({ p }: any) {
  const { updateProject } = useStore();
  const [name, setName] = useState('');
  const patch = (sid: string, k: string, v: any) => {
    const step = p.steps.find((s: any) => s.id === sid);
    const hist = k === 'status' ? `Étape « ${step.name} » : ${STEP_STATUSES.find((x) => x.v === v)?.l}` : undefined;
    updateProject(p.id, (x: any) => ({ ...x, steps: x.steps.map((s: any) => (s.id === sid ? { ...s, [k]: v } : s)) }), hist);
  };
  const add = () => {
    if (!name.trim()) return;
    updateProject(p.id, (x: any) => ({ ...x, steps: [...x.steps, { id: uid(), name: name.trim(), start: '', end: '', obs: '', status: 'a_faire' }] }), `Étape ajoutée : ${name.trim()}`);
    setName('');
  };
  const del = (s: any) => window.confirm(`Supprimer l'étape « ${s.name} » ?`) && updateProject(p.id, (x: any) => ({ ...x, steps: x.steps.filter((y: any) => y.id !== s.id) }), `Étape supprimée : ${s.name}`);
  const done = p.steps.filter((s: any) => s.status === 'termine').length;

  return (
    <Card title={`Étapes du projet — ${done}/${p.steps.length} terminées`} testId="steps-tab"
      actions={<Progress value={p.steps.length ? Math.round((done / p.steps.length) * 100) : 0} testId="steps-progress" />}>
      <div className="steps">
        {p.steps.map((s: any, i: number) => (
          <div key={s.id} className={`step s-${s.status}`} data-testid={`step-${i}`}>
            <div className="step-num">{i + 1}</div>
            <div className="step-body">
              <input className="step-name" defaultValue={s.name} onBlur={(e) => e.target.value !== s.name && patch(s.id, 'name', e.target.value)} data-testid={`step-name-${i}`} />
              <div className="step-fields">
                <label>Début<input type="date" value={s.start} onChange={(e) => patch(s.id, 'start', e.target.value)} data-testid={`step-start-${i}`} /></label>
                <label>Fin prévue<input type="date" value={s.end} onChange={(e) => patch(s.id, 'end', e.target.value)} data-testid={`step-end-${i}`} /></label>
                <label>État<select value={s.status} onChange={(e) => patch(s.id, 'status', e.target.value)} data-testid={`step-status-${i}`}>{STEP_STATUSES.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}</select></label>
              </div>
              <input placeholder="Observations…" defaultValue={s.obs} onBlur={(e) => e.target.value !== s.obs && patch(s.id, 'obs', e.target.value)} data-testid={`step-obs-${i}`} />
            </div>
            <button className="icon-btn danger" onClick={() => del(s)} data-testid={`step-delete-${i}`}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <div className="add-row">
        <input placeholder="Nouvelle étape…" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} data-testid="new-step-input" />
        <button className="btn" onClick={add} data-testid="add-step-btn"><Plus size={16} />Ajouter</button>
      </div>
    </Card>
  );
}
