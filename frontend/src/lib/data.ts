import { Project, Settings } from '../types';

export const STATUSES = [
  { v: 'nouveau', l: 'Nouveau dossier', c: 'info' },
  { v: 'attente', l: 'En attente', c: 'warn' },
  { v: 'en_cours', l: 'En cours', c: 'primary' },
  { v: 'validation', l: 'En validation', c: 'violet' },
  { v: 'termine', l: 'Terminé', c: 'success' },
  { v: 'livre', l: 'Livré', c: 'success-dark' },
  { v: 'suspendu', l: 'Suspendu', c: 'danger' },
];
export const statusLabel = (v: string) => STATUSES.find((s) => s.v === v)?.l || v;
export const statusColor = (v: string) => STATUSES.find((s) => s.v === v)?.c || 'info';

export const PROJECT_TYPES = ['Maison individuelle', 'Immeuble résidentiel', 'Bâtiment commercial', 'Bâtiment administratif', 'Bâtiment industriel', 'Rénovation', 'Extension', 'Aménagement intérieur', 'Autre'];
export const PAY_MODES = ['Espèces', 'TMoney', 'Flooz', 'Virement bancaire', 'Autre'];
export const DOC_CATS = ['Plans architecturaux', 'Esquisses', 'Images de référence', 'Documents PDF', 'Documents Word', 'Devis', 'Contrats', 'Courriers', 'Autres pièces techniques'];
export const STEP_STATUSES = [{ v: 'a_faire', l: 'À faire' }, { v: 'en_cours', l: 'En cours' }, { v: 'termine', l: 'Terminée' }];
export const DEFAULT_STEPS = ['Réception et étude du dossier', 'Analyse des besoins du client', 'Élaboration du concept architectural', 'Réalisation des esquisses', 'Avant-projet sommaire (APS)', 'Avant-projet détaillé (APD)', 'Élaboration des plans architecturaux', 'Constitution du dossier technique', 'Corrections et modifications', 'Validation du projet', 'Livraison du dossier'];

export const DEFAULT_SETTINGS: Settings = {
  header: "SUIVI DES PROJETS D'ARCHITECTURE",
  subheader: 'Gestion – Conception – Suivi des réalisations',
  address: '', phone: '', email: '', nextProject: 1, nextReceipt: 1,
};

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
export const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
export const nowTime = () => new Date().toTimeString().slice(0, 5);
export const nowIso = () => new Date().toISOString();

export const num = (n: any) => new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0)).replace(/[\u202f\u00a0]/g, ' ');
export const fcfa = (n: any) => `${num(n)} FCFA`;
export const fdate = (d?: string) => (d ? d.slice(0, 10).split('-').reverse().join('/') : '—');
export const fdatetime = (iso: string) => { const d = new Date(iso); return `${d.toLocaleDateString('fr-FR')} ${d.toTimeString().slice(0, 5)}`; };

export const emptyProject = (): Partial<Project> => ({
  title: '', client: '', phone: '', receivedDate: today(), receivedTime: nowTime(), location: '', type: PROJECT_TYPES[0],
  description: '', concept: '', needs: '', observations: '', landArea: '', builtArea: '', levels: '', rooms: '', budget: '',
  status: 'nouveau', deadline: '', fees: 0, advance: 0,
});

export const totalPaid = (p: Project) => (p.payments || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
export const balance = (p: Project) => (Number(p.fees) || 0) - totalPaid(p);
export const finStatus = (p: Project) => ((Number(p.fees) || 0) <= 0 ? 'none' : balance(p) <= 0 ? 'paid' : 'due');
export const finLabel = (f: string) => ({ none: 'Honoraires non définis', paid: 'Entièrement payé', due: 'Solde à percevoir' } as any)[f];

export const progress = (p: Project) => {
  if (p.tasks?.length) return Math.round((p.tasks.filter((t) => t.done).length / p.tasks.length) * 100);
  if (p.steps?.length) return Math.round((p.steps.filter((s) => s.status === 'termine').length / p.steps.length) * 100);
  return 0;
};
export const isClosed = (p: Project) => p.status === 'termine' || p.status === 'livre';

export function deadlineItems(projects: Project[]) {
  const items: any[] = [];
  projects.forEach((p) => {
    if (isClosed(p) || p.status === 'suspendu') return;
    if (p.deadline) items.push({ date: p.deadline, label: 'Livraison du dossier', p });
    p.steps.forEach((s) => s.status !== 'termine' && s.end && items.push({ date: s.end, label: `Étape : ${s.name}`, p }));
    p.tasks.forEach((t) => !t.done && t.deadline && items.push({ date: t.deadline, label: `Tâche : ${t.title}`, p }));
  });
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export function saveBlob(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

export function downloadCSV(name: string, headers: string[], rows: any[][]) {
  const esc = (v: any) => { const s = String(v ?? ''); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = '\ufeff' + [headers, ...rows].map((r) => r.map(esc).join(';')).join('\r\n');
  saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), name);
}

export function dataUrlToBlob(dataUrl: string) {
  const [meta, b64] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bin = atob(b64); const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export const fsize = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(2)} Mo` : `${Math.ceil(b / 1024)} Ko`);
