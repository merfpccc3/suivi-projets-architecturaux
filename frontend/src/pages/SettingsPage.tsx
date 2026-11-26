import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Save, Download, Upload, Trash2, HardDrive } from 'lucide-react';
import { STORAGE_KEY, useStore } from '../store';
import { Card, Field, Progress } from '../components/ui';
import { saveBlob, today } from '../lib/data';

export default function SettingsPage() {
  const { data, updateSettings, importData, resetAll } = useStore();
  const [s, setS] = useState({ ...data.settings });
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: string) => (e: any) => setS({ ...s, [k]: e.target.value });
  const used = (localStorage.getItem(STORAGE_KEY) || '').length;
  const usedMo = used / 1024 / 1024;

  const exportAll = () => { saveBlob(new Blob([JSON.stringify({ app: 'SUIVI PROJETS', exportedAt: new Date().toISOString(), ...data })], { type: 'application/json' }), `sauvegarde_suivi_projets_${today()}.json`); toast.success('Sauvegarde exportée'); };
  const importFile = () => {
    const file = fileRef.current?.files?.[0]; if (!file) { toast.error('Choisissez un fichier de sauvegarde'); return; }
    if (!window.confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result as string);
        if (importData(obj)) { toast.success(`Sauvegarde restaurée (${obj.projects.length} projet(s))`); setS({ ...data.settings, ...(obj.settings || {}) }); }
        else toast.error('Fichier de sauvegarde invalide');
      } catch (e) { toast.error('Fichier de sauvegarde invalide'); }
    };
    r.readAsText(file);
  };

  return (
    <div className="page" data-testid="settings-page">
      <div className="page-head"><div><h1>Paramètres & sauvegarde</h1><p className="muted">En-tête des documents et gestion des données</p></div></div>
      <div className="grid-2">
        <Card title="En-tête des documents imprimés">
          <div className="form-grid">
            <Field label="Titre / nom du cabinet" full><input value={s.header} onChange={set('header')} data-testid="settings-header" /></Field>
            <Field label="Sous-titre" full><input value={s.subheader} onChange={set('subheader')} data-testid="settings-subheader" /></Field>
            <Field label="Adresse" full><input value={s.address} onChange={set('address')} data-testid="settings-address" /></Field>
            <Field label="Téléphone"><input value={s.phone} onChange={set('phone')} data-testid="settings-phone" /></Field>
            <Field label="E-mail"><input value={s.email} onChange={set('email')} data-testid="settings-email" /></Field>
          </div>
          <div className="form-foot"><button className="btn primary" onClick={() => updateSettings({ header: s.header, subheader: s.subheader, address: s.address, phone: s.phone, email: s.email }) && toast.success('En-tête enregistré')} data-testid="settings-save-btn"><Save size={16} />Enregistrer</button></div>
        </Card>
        <Card title="Sauvegarde et restauration" icon={HardDrive}>
          <p className="muted small">Espace utilisé : ~{usedMo.toFixed(2)} Mo sur ~5 Mo disponibles</p>
          <Progress value={Math.min(100, Math.round((usedMo / 5) * 100))} testId="storage-usage" />
          <div className="stack">
            <button className="btn success" onClick={exportAll} data-testid="export-backup-btn"><Download size={16} />Exporter toutes les données (.json)</button>
            <div className="add-row"><input type="file" accept=".json,application/json" ref={fileRef} data-testid="import-backup-input" />
              <button className="btn" onClick={importFile} data-testid="import-backup-btn"><Upload size={16} />Importer</button></div>
            <button className="btn danger ghost" onClick={() => window.confirm('Effacer définitivement toutes les données de cet appareil ?') && resetAll() && toast.success('Données effacées')} data-testid="reset-data-btn"><Trash2 size={16} />Effacer toutes les données</button>
          </div>
        </Card>
      </div>
    </div>
  );
}
