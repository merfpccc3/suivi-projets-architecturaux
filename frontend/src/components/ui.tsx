import React from 'react';
import { X } from 'lucide-react';
import { statusColor, statusLabel } from '../lib/data';

export const Field = ({ label, children, full }: any) => (
  <label className={`field ${full ? 'full' : ''}`}><span>{label}</span>{children}</label>
);

export const StatusBadge = ({ status, testId }: any) => (
  <span className={`badge b-${statusColor(status)}`} data-testid={testId}>{statusLabel(status)}</span>
);

export const FinBadge = ({ f }: any) => (
  <span className={`badge ${f === 'paid' ? 'b-success' : f === 'due' ? 'b-warn' : f === 'over' ? 'b-danger' : 'b-muted'}`} data-testid="fin-badge">
    {f === 'paid' ? 'Payé' : f === 'due' ? 'Solde dû' : f === 'over' ? 'Trop-perçu' : 'À renseigner'}
  </span>
);

export const Progress = ({ value, testId }: any) => (
  <div className="progress" data-testid={testId}><div style={{ width: `${value}%` }} /><span>{value}%</span></div>
);

export const Card = ({ title, icon: Icon, actions, children, className = '', testId }: any) => (
  <section className={`card ${className}`} data-testid={testId}>
    {(title || actions) && (
      <header className="card-head">
        <h3>{Icon && <Icon size={17} />}{title}</h3>
        {actions && <div className="card-actions">{actions}</div>}
      </header>
    )}
    {children}
  </section>
);

export const Stat = ({ label, value, icon: Icon, tone = '', testId }: any) => (
  <div className={`stat ${tone}`} data-testid={testId}>
    <div className="stat-icon">{Icon && <Icon size={18} />}</div>
    <div><div className="stat-val">{value}</div><div className="stat-lbl">{label}</div></div>
  </div>
);

export const Empty = ({ children }: any) => <div className="empty">{children}</div>;

export const Modal = ({ title, onClose, children, testId }: any) => (
  <div className="modal-back" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()} data-testid={testId}>
      <header><h3>{title}</h3><button className="icon-btn" onClick={onClose} data-testid="modal-close-btn"><X size={18} /></button></header>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);
