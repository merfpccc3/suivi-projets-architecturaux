export type Status = 'nouveau' | 'attente' | 'en_cours' | 'validation' | 'termine' | 'livre' | 'suspendu';
export type StepStatus = 'a_faire' | 'en_cours' | 'termine';

export interface Step { id: string; name: string; start: string; end: string; obs: string; status: StepStatus; }
export interface Task { id: string; title: string; deadline: string; done: boolean; obs: string; }
export interface Payment { id: string; receiptNo: string; date: string; amount: number; mode: string; ref: string; obs: string; }
export interface ProjectDoc { id: string; name: string; category: string; date: string; type: string; size: number; data: string; }
export interface HistoryEntry { date: string; text: string; }

export interface Project {
  id: string; number: string; title: string; client: string; phone: string;
  receivedDate: string; receivedTime: string; location: string; type: string;
  description: string; concept: string; needs: string; observations: string;
  landArea: string; builtArea: string; levels: string; rooms: string; budget: string;
  status: Status; deadline: string; fees: number; advance: number;
  steps: Step[]; tasks: Task[]; payments: Payment[]; documents: ProjectDoc[]; history: HistoryEntry[];
  createdAt: string; updatedAt: string;
}

export interface Settings {
  header: string; subheader: string; owner: string; logo: string; address: string; phone: string; email: string;
  nextProject: number; nextReceipt: number;
}

export interface AppData { projects: Project[]; settings: Settings; }
