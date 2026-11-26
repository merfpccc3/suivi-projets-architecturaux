import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, Eye, Download, Trash2, FileText } from 'lucide-react';
import { useStore } from '../../store';
import { Card, Empty, Field } from '../../components/ui';
import { DOC_CATS, dataUrlToBlob, fdate, fsize, saveBlob, today, uid } from '../../lib/data';

const MAX = 1024 * 1024;

export function DocsTab({ p }: any) {
  const { updateProject } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [cat, setCat] = useState(DOC_CATS[0]);

  const upload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error('Choisissez un fichier'); return; }
    if (file.size > MAX) { toast.error('Fichier trop volumineux (1 Mo maximum)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const doc = { id: uid(), name: name.trim() || file.name, category: cat, date: today(), type: file.type, size: file.size, data: reader.result as string, file: file.name };
      if (updateProject(p.id, (x: any) => ({ ...x, documents: [...x.documents, doc] }), `Document ajouté : ${doc.name}`)) {
        toast.success('Document ajouté'); setName(''); if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };
  const open = (d: any) => { const url = URL.createObjectURL(dataUrlToBlob(d.data)); window.open(url, '_blank'); };
  const download = (d: any) => saveBlob(dataUrlToBlob(d.data), d.file || d.name);
  const del = (d: any) => window.confirm(`Supprimer « ${d.name} » ?`) && updateProject(p.id, (x: any) => ({ ...x, documents: x.documents.filter((y: any) => y.id !== d.id) }), `Document supprimé : ${d.name}`);

  return (
    <div className="grid-2" data-testid="docs-tab">
      <Card title="Joindre un document">
        <div className="form-grid">
          <Field label="Fichier (1 Mo max.)" full><input type="file" ref={fileRef} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.dwg,.txt" data-testid="doc-file-input" /></Field>
          <Field label="Nom du document"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Par défaut : nom du fichier" data-testid="doc-name-input" /></Field>
          <Field label="Catégorie"><select value={cat} onChange={(e) => setCat(e.target.value)} data-testid="doc-category-select">{DOC_CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <div className="full"><button className="btn primary" onClick={upload} data-testid="doc-upload-btn"><Upload size={16} />Ajouter le document</button></div>
        </div>
        <p className="muted small">Les fichiers sont conservés dans le navigateur de cet appareil (espace limité à environ 5 Mo au total). Pensez à exporter une sauvegarde.</p>
      </Card>
      <Card title={`Documents du projet (${p.documents.length})`}>
        {p.documents.length === 0 ? <Empty>Aucun document</Empty> : (
          <ul className="docs" data-testid="docs-list">
            {p.documents.map((d: any) => (
              <li key={d.id} data-testid={`doc-item-${d.id}`}>
                <FileText size={20} className="doc-ic" />
                <div className="grow"><b>{d.name}</b><small>{d.category} · {fdate(d.date)} · {fsize(d.size)}</small></div>
                <button className="icon-btn" onClick={() => open(d)} title="Consulter" data-testid={`doc-view-${d.id}`}><Eye size={16} /></button>
                <button className="icon-btn" onClick={() => download(d)} title="Télécharger" data-testid={`doc-download-${d.id}`}><Download size={16} /></button>
                <button className="icon-btn danger" onClick={() => del(d)} title="Supprimer" data-testid={`doc-delete-${d.id}`}><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
