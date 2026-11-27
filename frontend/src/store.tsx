import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AppData, Payment, Project } from './types';
import { DEFAULT_SETTINGS, DEFAULT_STEPS, emptyProject, fcfa, nowIso, uid } from './lib/data';
import { LoginScreen } from './components/LoginScreen';

export const STORAGE_KEY = 'suivi_projets_architecture_v1';
const AUTH_KEY = 'suivi_projets_session';
const API_BASE = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');

type AuthState = 'checking' | 'signed_out' | 'signed_in';
type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { projects: d.projects || [], settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) } };
    }
  } catch (e) {
    toast.error('Les données locales sont illisibles. Vous pouvez restaurer une sauvegarde dans les paramètres.');
  }
  return { projects: [], settings: { ...DEFAULT_SETTINGS } };
}

async function requestJson(path: string, init?: RequestInit): Promise<any> {
  const response = await fetch(`${API_BASE}${path}`, init);
  const text = await response.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!response.ok) {
    throw new ApiError(body?.detail || `Erreur du serveur (${response.status})`, response.status);
  }
  if (!body) throw new ApiError('Réponse invalide du serveur', response.status);
  return body;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function readCloudData(token: string): Promise<{ exists: boolean; data: AppData }> {
  const result = await requestJson('/api/data', { headers: authHeaders(token) });
  if (!Array.isArray(result.projects) || !result.settings || typeof result.settings !== 'object') {
    throw new Error('Les données reçues du serveur sont invalides.');
  }
  return {
    exists: result.exists === true,
    data: { projects: result.projects, settings: { ...DEFAULT_SETTINGS, ...result.settings } },
  };
}

async function writeCloudData(token: string, data: AppData) {
  await requestJson('/api/data', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

const Ctx = createContext<any>(null);
export const useStore = () => useContext(Ctx);
const yr = () => new Date().getFullYear();
const receiptNo = (n: number) => `REC-${yr()}-${String(n).padStart(4, '0')}`;

export function StoreProvider({ children }: any) {
  const [data, setData] = useState<AppData>(load);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_KEY));
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const ref = useRef(data);
  const tokenRef = useRef(token);
  const pendingData = useRef<AppData | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);

  const persistLocal = (next: AppData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      toast.error('Espace de stockage local insuffisant. La synchronisation en ligne va continuer.');
    }
    ref.current = next;
    setData(next);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    tokenRef.current = null;
    setToken(null);
    setAuthState('signed_out');
    setSyncStatus('synced');
    pendingData.current = null;
    if (saveTimer.current) clearTimeout(saveTimer.current);
  };

  const flushSync = async () => {
    if (saving.current) return;
    saving.current = true;
    while (pendingData.current && tokenRef.current) {
      const snapshot = pendingData.current;
      pendingData.current = null;
      setSyncStatus('syncing');
      try {
        await writeCloudData(tokenRef.current, snapshot);
        if (!pendingData.current) setSyncStatus('synced');
      } catch (error) {
        pendingData.current = snapshot;
        setSyncStatus('error');
        if (error instanceof ApiError && error.status === 401) {
          logout();
          toast.error('Votre session a expiré. Reconnectez-vous pour synchroniser les modifications.');
        } else {
          toast.error('Synchronisation impossible. Vos changements restent sur cet appareil ; réessayez lorsque la connexion sera rétablie.');
        }
        break;
      }
    }
    saving.current = false;
  };

  const scheduleSync = (next: AppData) => {
    pendingData.current = next;
    setSyncStatus('pending');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void flushSync();
    }, 500);
  };

  const retrySync = () => {
    if (!pendingData.current) pendingData.current = ref.current;
    void flushSync();
  };

  const login = async (password: string) => {
    const result = await requestJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (typeof result.token !== 'string' || !result.token) {
      throw new Error('Le serveur n’a pas fourni de session valide.');
    }

    const nextToken = result.token as string;
    const remote = await readCloudData(nextToken);
    let next = remote.data;
    if (!remote.exists) {
      const local = load();
      const hasLocalData = local.projects.length > 0
        || JSON.stringify(local.settings) !== JSON.stringify(DEFAULT_SETTINGS);
      if (hasLocalData) next = local;
      await writeCloudData(nextToken, next);
    }

    localStorage.setItem(AUTH_KEY, nextToken);
    tokenRef.current = nextToken;
    setToken(nextToken);
    persistLocal(next);
    setSyncStatus('synced');
    setAuthState('signed_in');
  };

  useEffect(() => {
    const sessionToken = tokenRef.current;
    if (!sessionToken) {
      setAuthState('signed_out');
      return;
    }
    let active = true;
    readCloudData(sessionToken).then(async (remote) => {
      let next = remote.data;
      if (!remote.exists) {
        const local = load();
        const hasLocalData = local.projects.length > 0
          || JSON.stringify(local.settings) !== JSON.stringify(DEFAULT_SETTINGS);
        if (hasLocalData) next = local;
        await writeCloudData(sessionToken, next);
      }
      if (!active) return;
      persistLocal(next);
      setSyncStatus('synced');
      setAuthState('signed_in');
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return;
      }
      setAuthState('signed_out');
      toast.error(error instanceof Error ? error.message : 'Impossible de charger les données synchronisées.');
    });
    return () => { active = false; };
  }, []);

  const commit = (next: AppData) => {
    persistLocal(next);
    if (tokenRef.current) scheduleSync(next);
    return true;
  };

  const createProject = (input: Partial<Project>) => {
    const d = ref.current; const s = d.settings; const id = uid();
    const nextReceipt = s.nextReceipt; const payments: Payment[] = [];
    const history = [{ date: nowIso(), text: 'Création du dossier' }];
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

  const value = {
    data, authState, syncStatus, login, logout, retrySync,
    createProject, updateProject, deleteProject, addPayment, updateSettings, importData, resetAll,
  };

  if (authState === 'checking') {
    return <div className="login-page"><p>Chargement des données synchronisées…</p></div>;
  }
  if (authState === 'signed_out') {
    return <Ctx.Provider value={value}><LoginScreen onLogin={login} /></Ctx.Provider>;
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useProject = (id?: string): Project | undefined => useStore().data.projects.find((p: Project) => p.id === id);
