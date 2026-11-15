// Honest impact arithmetic. Nothing here is a measurement of a real pilot:
// it is a model with every factor shown, and the UI labels it as an estimate.
//
// Factors
//  - 0.45 kg/person/day: CPHEEO, Manual on Municipal Solid Waste Management
//    (2016), Class I city planning figure.
//  - 4.4 persons/household: NFHS-5 (2019-21), mean household size, India.
//  - 50% wet / 30% dry / 20% inert: CPCB Annual Report 2021-22 / 2022-23,
//    typical Indian municipal solid waste composition.
//  - Compliance: measured from the pilot's own photo register (template until
//    replaced by live inspections).

import type { MessageKey } from "./i18n";

export const FACTORS = {
  perCapitaKgDay: 0.45,
  perCapitaSource: "CPHEEO, Manual on MSW Management (2016), Class I city figure",
  householdSize: 4.4,
  householdSource: "NFHS-5 (2019-21), mean household size, India",
  wetShare: 0.5,
  dryShare: 0.3,
  inertShare: 0.2,
  compositionSource: "CPCB Annual Report 2021-22 / 2022-23, typical MSW composition",
} as const;

export function computeImpact(households: number, compliancePct: number, days = 7) {
  const people = households * FACTORS.householdSize;
  const collectedKg = people * FACTORS.perCapitaKgDay * days;
  const wetKg = collectedKg * FACTORS.wetShare;
  const dryKg = collectedKg * FACTORS.dryShare;
  const inertKg = collectedKg * FACTORS.inertShare;
  const divertedKg = wetKg * (Math.max(0, Math.min(100, compliancePct)) / 100);
  const annualPer1000Kg =
    1000 *
    FACTORS.householdSize *
    FACTORS.perCapitaKgDay *
    365 *
    FACTORS.wetShare *
    (Math.max(0, Math.min(100, compliancePct)) / 100);

  return {
    households,
    days,
    people: Math.round(people),
    collectedKg: Math.round(collectedKg),
    wetKg: Math.round(wetKg),
    dryKg: Math.round(dryKg),
    inertKg: Math.round(inertKg),
    divertedKg: Math.round(divertedKg),
    annualPer1000Tonnes: Math.round(annualPer1000Kg / 100) / 10,
  };
}

export function formulaLines(
  households: number,
  compliancePct: number,
  days = 7
): FormulaLine[] {
  const i = computeImpact(households, compliancePct, days);
  const people = i.people.toLocaleString("en-IN");
  const collected = i.collectedKg.toLocaleString("en-IN");
  const wet = i.wetKg.toLocaleString("en-IN");
  const diverted = i.divertedKg.toLocaleString("en-IN");
  // Sentences are assembled in the message catalog, not here: Indic word order
  // differs, so each line is one key with its own placeholders.
  return [
    {
      expressionKey: "dashboard.formulaHouseholds",
      expressionVars: { households, size: FACTORS.householdSize },
      resultKey: "dashboard.formulaPeople",
      resultVars: { people },
      source: FACTORS.householdSource,
    },
    {
      expressionKey: "dashboard.formulaWaste",
      expressionVars: { people, kg: FACTORS.perCapitaKgDay, days },
      resultKey: "dashboard.formulaWasteResult",
      resultVars: { collected },
      source: FACTORS.perCapitaSource,
    },
    {
      expressionKey: "dashboard.formulaWet",
      expressionVars: { collected },
      resultKey: "dashboard.formulaWetResult",
      resultVars: { wet },
      source: FACTORS.compositionSource,
    },
    {
      expressionKey: "dashboard.formulaDiverted",
      expressionVars: { wet, compliance: compliancePct },
      resultKey: "dashboard.formulaDivertedResult",
      resultVars: { diverted },
      source: "",
      sourceKey: "dashboard.formulaComplianceSource",
    },
  ];
}

export type FormulaLine = {
  expressionKey: MessageKey;
  expressionVars: Record<string, string | number>;
  resultKey: MessageKey;
  resultVars: Record<string, string | number>;
  source: string;
  sourceKey?: MessageKey;
};
