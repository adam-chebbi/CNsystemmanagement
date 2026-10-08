import type { ChiffreAffaires, ClotureCheck, Comptage, Depense, Journee, JourneeSummary, Mouvement, Vente } from '../../shared/model';

export interface DayResponse {
  date: string;
  journee: Journee | null;
  ventes: Vente[];
  depenses: Depense[];
  mouvements: Mouvement[];
  comptages: Comptage[];
  ca: ChiffreAffaires | null;
  summary: JourneeSummary;
  fondReporte: number | null;
  checks: ClotureCheck[];
  canWrite: boolean;
  reason: string | null;
}

export interface Alertes {
  today: string;
  nonCloturees: { date: string; jours: number }[];
  ecartsNonJustifies: { id: string; date: string; type: string; ecart: number }[];
  recusAFournir: number;
  incidentsOuverts: number;
}
