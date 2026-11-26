import React, { createContext, useContext, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AppData, Payment, Project } from './types';
import { DEFAULT_SETTINGS, DEFAULT_STEPS, emptyProject, fcfa, nowIso, today, uid } from './lib/data';

export const STORAGE_KEY = 'suivi_projets_architecture_v1';

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { const d = JSON.parse(raw); return { projects: d.projects || [], settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) } }; }
  } catch (e) { /* données illisibles */ }
  return { projects: [], settings: { ...DEFAULT_SETTINGS } };
}

const Ctx = createContext<any>(null);
export const useStore = () => useContext(Ctx);
const yr = () => new Date().getFullYear();
const receiptNo = (n: number) => `REC-${yr()}-${String(n).padStart(4, '0')}`;

export function StoreProvider({ children }: any) {
  const [data, setData] = useState<AppData>(load);
  const ref = useRef(data);

  const commit = (next: AppData) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) {
      toast.error('Espace de stockage insuffisant : supprimez des pièces jointes ou exportez une sauvegarde.');
      return false;
    }
    ref.current = next; setData(next); return true;
  };

  const createProject = (input: Partial<Project>) => {
    const d = ref.current; const s = d.settings; const id = uid();
    let nextReceipt = s.nextReceipt; const payments: Payment[] = [];
    const history = [{ date: nowIso(), text: 'Création du dossier' }];
    if ((Number(input.advance) || 0) > 0) {
      payments.push({ id: uid(), receiptNo: receiptNo(nextReceipt++), date: input.receivedDate || today(), amount: Number(input.advance), mode: 'Espèces', ref: '', obs: 'Avance' });
      history.push({ date: nowIso(), text: `Avance enregistrée : ${fcfa(input.advance)}` });
    }
    const p = {
      ...emptyProject(), ...input, id, number: `ARCH-${yr()}-${String(s.nextProject).padStart(3, '0')}`,
      steps: DEFAULT_STEPS.map((name) => ({ id: uid(), name, start: '', end: '', obs: '', status: 'a_faire' })),
      tasks: [], payments, documents: [], history, createdAt: nowIso(), updatedAt: nowIso(),
    } as Project;
    return commit({ projects: [p, ...d.projects], settings: { ...s, nextProject: s.nextProject + 1, nextReceipt } }) ? id : null;
  };

  const updateProject = (id: string, fn: (p: Project) => Project, historyText?: string) => {
    const d = ref.current;
    const projects = d.projects.map((p) => {
      if (p.id !== id) return p;
      const n = fn({ ...p }); n.updatedAt = nowIso();
      if (historyText) n.history = [...(n.history || []), { date: nowIso(), text: historyText }];
      return n;
    });
    return commit({ ...d, projects });
  };

  const deleteProject = (id: string) => commit({ ...ref.current, projects: ref.current.projects.filter((p) => p.id !== id) });

  const addPayment = (id: string, pay: Omit<Payment, 'id' | 'receiptNo'>) => {
    const d = ref.current; const s = d.settings;
    const full: Payment = { ...pay, id: uid(), receiptNo: receiptNo(s.nextReceipt) };
    const projects = d.projects.map((p) => p.id !== id ? p : {
      ...p, payments: [...p.payments, full], updatedAt: nowIso(),
      history: [...p.history, { date: nowIso(), text: `Paiement reçu ${full.receiptNo} : ${fcfa(full.amount)} (${full.mode})` }],
    });
    return commit({ projects, settings: { ...s, nextReceipt: s.nextReceipt + 1 } }) ? full : null;
  };

  const updateSettings = (patch: any) => commit({ ...ref.current, settings: { ...ref.current.settings, ...patch } });

  const importData = (obj: any) => {
    if (!obj || !Array.isArray(obj.projects)) return false;
    return commit({ projects: obj.projects, settings: { ...DEFAULT_SETTINGS, ...(obj.settings || {}) } });
  };

  const resetAll = () => commit({ projects: [], settings: { ...DEFAULT_SETTINGS } });

  const value = { data, createProject, updateProject, deleteProject, addPayment, updateSettings, importData, resetAll };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useProject = (id?: string): Project | undefined => useStore().data.projects.find((p: Project) => p.id === id);
