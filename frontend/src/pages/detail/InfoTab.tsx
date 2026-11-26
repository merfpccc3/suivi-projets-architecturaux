import React from 'react';
import { Card } from '../../components/ui';
import { fcfa, fdate, statusLabel } from '../../lib/data';

const KV = ({ rows }: any) => (
  <dl className="kv">{rows.map(([k, v]: any) => <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>)}</dl>
);
const Text = ({ label, v }: any) => <div className="text-block"><h4>{label}</h4><p>{v || '—'}</p></div>;

export function InfoTab({ p }: any) {
  return (
    <div className="grid-2" data-testid="info-tab">
      <Card title="Informations générales">
        <KV rows={[['N° de dossier', p.number], ['Type', p.type], ['Statut', statusLabel(p.status)], ['Lieu', p.location], ['Réception', `${fdate(p.receivedDate)} ${p.receivedTime || ''}`], ['Livraison prévue', fdate(p.deadline)]]} />
      </Card>
      <Card title="Client">
        <KV rows={[['Nom', p.client], ['Téléphone', p.phone && <a href={`tel:${p.phone}`}>{p.phone}</a>]]} />
        <h4 className="sub-title">Caractéristiques techniques</h4>
        <KV rows={[['Superficie du terrain', p.landArea && `${p.landArea} m²`], ['Surface bâtie', p.builtArea && `${p.builtArea} m²`], ['Niveaux', p.levels], ['Pièces', p.rooms], ['Budget prévisionnel', p.budget && fcfa(p.budget)]]} />
      </Card>
      <Card title="Description et concept" className="span-2">
        <Text label="Description du projet" v={p.description} />
        <Text label="Concept architectural" v={p.concept} />
        <Text label="Objectifs et besoins du client" v={p.needs} />
        <Text label="Observations" v={p.observations} />
      </Card>
    </div>
  );
}
