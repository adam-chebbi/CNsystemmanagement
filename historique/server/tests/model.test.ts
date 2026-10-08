import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeClotureChecks,
  computeComptageTotal,
  computeSummary,
  currentBusinessDate,
  daysBetween,
  expectedForComptage,
  formatDT,
  needsJustification,
  type Comptage,
  type Depense,
  type Mouvement,
  type Vente,
} from '../../shared/model.ts';

const base = { creeParId: 'u', creeParNom: 'U', creeLe: '2026-01-01T10:00:00Z', majParNom: null, majLe: null, annulationMotif: null, annuleParNom: null, annuleLe: null };
const vente = (montant: number, modePaiement: Vente['modePaiement'], statut: 'active' | 'annulee' = 'active'): Vente => ({
  ...base,
  statut,
  id: String(Math.random()),
  journeeId: 'j',
  heure: null,
  categorie: 'Café',
  modePaiement,
  montant,
  client: null,
  description: null,
});
const depense = (montant: number, modePaiement: Depense['modePaiement'], justificatif: Depense['justificatif'] = 'oui'): Depense => ({
  ...base,
  statut: 'active',
  id: String(Math.random()),
  journeeId: 'j',
  heure: null,
  categorie: 'Divers',
  modePaiement,
  montant,
  beneficiaire: null,
  description: null,
  justificatif,
  photo: null,
});
const mouvement = (montant: number, type: Mouvement['type']): Mouvement => ({
  ...base,
  statut: 'active',
  id: String(Math.random()),
  journeeId: 'j',
  heure: null,
  type,
  montant,
  personne: null,
  description: null,
});

test('formatDT shows three decimals (millimes)', () => {
  assert.equal(formatDT(12500).replace(/\s/g, ' '), '12,500 DT');
  assert.equal(formatDT(-50).replace(/\s/g, ' '), '-0,050 DT');
});

test('business date rolls back before the cutoff hour', () => {
  assert.equal(currentBusinessDate(new Date(2026, 9, 8, 1, 30), 5), '2026-10-07');
  assert.equal(currentBusinessDate(new Date(2026, 9, 8, 5, 0), 5), '2026-10-08');
  assert.equal(daysBetween('2026-02-27', '2026-03-02'), 3);
});

test('expected cash = float + cash sales + cash in − cash out − cash expenses', () => {
  const s = computeSummary({
    journee: { fondOuverture: 100000 },
    fondParDefaut: 0,
    ventes: [vente(50000, 'especes'), vente(30000, 'tpe'), vente(20000, 'especes', 'annulee'), vente(15000, 'ticket_resto')],
    depenses: [depense(12000, 'especes_caisse', 'non'), depense(40000, 'virement')],
    mouvements: [mouvement(10000, 'apport_fond'), mouvement(25000, 'retrait_proprietaire')],
    ca: null,
    comptages: [],
  });
  assert.equal(s.source, 'ventes');
  assert.equal(s.recettes.total, 95000);
  assert.equal(s.especesAttendues, 100000 + 50000 + 10000 - 25000 - 12000);
  assert.equal(s.tpeAttendu, 30000);
  assert.equal(s.ticketsAttendus, 15000);
  assert.equal(s.depensesTotal, 52000);
  assert.equal(s.depensesSansJustificatif, 1);
});

test('the ticket Z, when entered, is the reference over the ventes lines', () => {
  const s = computeSummary({
    journee: { fondOuverture: null },
    fondParDefaut: 50000,
    ventes: [vente(10000, 'especes')],
    depenses: [],
    mouvements: [],
    ca: {
      journeeId: 'j',
      total: 90000,
      especes: 60000,
      tpe: 20000,
      ticketsResto: 5000,
      credit: 0,
      cheque: 0,
      autre: 0,
      remises: 0,
      annulations: 0,
      offerts: 0,
      nbTickets: null,
      nbCouverts: null,
      note: null,
      saisiParNom: 'U',
      majLe: '',
    },
    comptages: [],
  });
  assert.equal(s.source, 'ca');
  assert.equal(s.especesAttendues, 50000 + 60000);
  assert.equal(s.ecartCaVentes, 80000);
  assert.equal(s.caIncoherent, true); // 60 + 20 + 5 ≠ 90
});

test('count totals: banknotes/coins, tickets, TPE', () => {
  assert.equal(
    computeComptageTotal('especes', {
      denominations: [
        { key: 'b20', quantite: 3 },
        { key: 'm500', quantite: 3 },
        { key: 'unknown', quantite: 99 },
      ],
      vrac: 250,
    }),
    60000 + 1500 + 250
  );
  assert.equal(computeComptageTotal('tickets_resto', { tickets: [{ emetteur: 'Pluxee', valeur: 5000, quantite: 4 }] }), 20000);
  assert.equal(computeComptageTotal('tpe', { tpe: [{ terminal: 'A', montant: 12345, nbTransactions: 3 }] }), 12345);
});

test('opening count is checked against the float left the night before', () => {
  const s = computeSummary({ journee: { fondOuverture: 80000 }, fondParDefaut: 0, ventes: [], depenses: [], mouvements: [], ca: null, comptages: [] });
  assert.equal(expectedForComptage('especes', 'ouverture', s, 120000), 120000);
  assert.equal(expectedForComptage('especes', 'cloture', s, 120000), 80000);
  assert.equal(needsJustification(1000, 1000), false);
  assert.equal(needsJustification(-1001, 1000), true);
});

test('closing checklist blocks until the Z and the counts are in', () => {
  const s = computeSummary({ journee: { fondOuverture: 0 }, fondParDefaut: 0, ventes: [vente(10000, 'tpe')], depenses: [], mouvements: [], ca: null, comptages: [] });
  const checks = computeClotureChecks({ summary: s, comptages: [], hasCa: false, openUrgentIncidents: 1, tolerance: 1000 });
  const blocking = checks.filter((c) => c.bloquant && !c.ok).map((c) => c.id);
  assert.deepEqual(blocking.sort(), ['ca', 'comptage_especes', 'comptage_tpe']);
  const unjustified: Comptage = {
    ...base,
    statut: 'active',
    id: 'c',
    journeeId: 'j',
    type: 'especes',
    moment: 'cloture',
    details: {},
    totalCompte: 0,
    totalAttendu: 5000,
    ecart: -5000,
    justification: null,
  };
  const checks2 = computeClotureChecks({ summary: s, comptages: [unjustified], hasCa: true, openUrgentIncidents: 0, tolerance: 1000 });
  assert.equal(checks2.find((c) => c.id === 'ecarts')!.ok, false);
});
