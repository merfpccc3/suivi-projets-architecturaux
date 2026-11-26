import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { useProject, useStore } from '../store';
import { Card, Field } from '../components/ui';
import { PROJECT_TYPES, STATUSES, emptyProject, fcfa, fdate, statusLabel } from '../lib/data';

const TRACKED: any = { title: 'intitulé', client: 'client', status: 'statut', deadline: 'date de livraison', fees: 'honoraires', location: 'lieu', type: 'type' };

export default function ProjectForm() {
  const { id } = useParams(); const nav = useNavigate();
  const { createProject, updateProject } = useStore();
  const existing = useProject(id);
  const [f, setF] = useState<any>(existing ? { ...existing } : emptyProject());
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const inp = (k: string, props: any = {}) => <input value={f[k] ?? ''} onChange={set(k)} data-testid={`form-${k}`} {...props} />;
  const area = (k: string) => <textarea rows={3} value={f[k] ?? ''} onChange={set(k)} data-testid={`form-${k}`} />;

  const submit = (e: any) => {
    e.preventDefault();
    if (!f.title.trim() || !f.client.trim()) { toast.error("L'intitulé et le nom du client sont obligatoires"); return; }
    const data = { ...f, fees: Number(f.fees) || 0, advance: Number(f.advance) || 0 };
    if (existing) {
      const changes = Object.keys(TRACKED).filter((k) => String(existing[k] ?? '') !== String(data[k] ?? ''))
        .map((k) => k === 'status' ? `statut → ${statusLabel(data.status)}` : k === 'fees' ? `honoraires → ${fcfa(data.fees)}` : k === 'deadline' ? `livraison → ${fdate(data.deadline)}` : TRACKED[k]);
      const ok = updateProject(existing.id, (p: any) => ({ ...p, ...data }), changes.length ? `Modification : ${changes.join(', ')}` : 'Mise à jour des informations');
      if (ok) { toast.success('Projet mis à jour'); nav(`/projets/${existing.id}`); }
    } else {
      const newId = createProject(data);
      if (newId) { toast.success('Projet enregistré'); nav(`/projets/${newId}`); }
    }
  };

  return (
    <form className="page" onSubmit={submit} data-testid="project-form">
      <div className="page-head">
        <div><h1>{existing ? 'Modifier le projet' : 'Nouveau projet'}</h1>
          <p className="muted">{existing ? existing.number : 'Le numéro de dossier sera attribué automatiquement'}</p></div>
        <button type="submit" className="btn primary" data-testid="form-submit-btn"><Save size={16} />Enregistrer</button>
      </div>
      <Card title="Informations générales">
        <div className="form-grid">
          <Field label="Intitulé du projet *" full>{inp('title', { placeholder: 'Ex. Villa R+1 à Lomé' })}</Field>
          <Field label="Nom du client / commanditaire *">{inp('client')}</Field>
          <Field label="Téléphone du client">{inp('phone', { type: 'tel' })}</Field>
          <Field label="Date de réception">{inp('receivedDate', { type: 'date' })}</Field>
          <Field label="Heure de réception">{inp('receivedTime', { type: 'time' })}</Field>
          <Field label="Lieu de réalisation">{inp('location')}</Field>
          <Field label="Type de projet"><select value={f.type} onChange={set('type')} data-testid="form-type">{PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Statut"><select value={f.status} onChange={set('status')} data-testid="form-status">{STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select></Field>
          <Field label="Date prévue de livraison">{inp('deadline', { type: 'date' })}</Field>
        </div>
      </Card>
      <Card title="Description et concept">
        <div className="form-grid">
          <Field label="Description du projet" full>{area('description')}</Field>
          <Field label="Concept architectural" full>{area('concept')}</Field>
          <Field label="Objectifs et besoins du client" full>{area('needs')}</Field>
          <Field label="Observations" full>{area('observations')}</Field>
        </div>
      </Card>
      <Card title="Informations techniques (facultatives)">
        <div className="form-grid">
          <Field label="Superficie du terrain (m²)">{inp('landArea', { type: 'number', min: 0 })}</Field>
          <Field label="Surface bâtie prévue (m²)">{inp('builtArea', { type: 'number', min: 0 })}</Field>
          <Field label="Nombre de niveaux">{inp('levels', { type: 'number', min: 0 })}</Field>
          <Field label="Nombre de pièces">{inp('rooms', { type: 'number', min: 0 })}</Field>
          <Field label="Budget prévisionnel du client (FCFA)">{inp('budget', { type: 'number', min: 0 })}</Field>
        </div>
      </Card>
      <Card title="Honoraires">
        <div className="form-grid">
          <Field label="Honoraires totaux convenus (FCFA)">{inp('fees', { type: 'number', min: 0 })}</Field>
          <Field label="Montant de l'avance (FCFA)">{inp('advance', { type: 'number', min: 0 })}</Field>
        </div>
        <p className="muted small">{existing ? "Modifier l'avance ici ne crée pas de paiement : enregistrez les encaissements dans l'onglet Finances." : "L'avance saisie est automatiquement enregistrée comme premier paiement (avec reçu)."}</p>
      </Card>
      <div className="form-foot"><button type="submit" className="btn primary" data-testid="form-submit-bottom-btn"><Save size={16} />Enregistrer le projet</button></div>
    </form>
  );
}
