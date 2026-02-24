import { firebaseProjectId } from '../lib/firebase/config'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Medical Knowledge Base (sourced from local documents) ───────────────────

const DRUGS: Record<string, Record<string, string>> = {
  ibuprofen: {
    names: 'Generic: Ibuprofen. Brand names: Advil, Motrin, Nurofen, Caldolor.',
    class: 'Drug class: Nonsteroidal Anti-inflammatory Drug (NSAID).',
    mechanism:
      'Ibuprofen works by inhibiting the enzymes COX-1 and COX-2. These enzymes produce prostaglandins — chemical messengers that cause inflammation, pain, and fever. By blocking them, ibuprofen reduces pain and inflammation.',
    indications:
      'Used for: mild to moderate pain (headache, toothache, backache), fever reduction, inflammation (arthritis, muscle strains), menstrual cramps (dysmenorrhea), minor aches and pains.',
    dosage:
      'Adults and children over 12: 200–400 mg every 4–6 hours as needed. Do not exceed 1200 mg/day without doctor supervision. Take with food or milk. Children under 12: 5–10 mg/kg every 6–8 hours (max 40 mg/kg/day).',
    contraindications:
      'Do NOT use if: hypersensitivity to ibuprofen or NSAIDs, history of asthma after NSAIDs, active peptic ulcer or GI bleeding, severe heart failure (NYHA III–IV), late pregnancy (third trimester), perioperative CABG pain.',
    warnings:
      'Warnings: cardiovascular risk (thrombotic events), GI bleeding/ulceration/perforation, reduced renal blood flow (risk in elderly/dehydrated patients), rare severe liver injury.',
    'side effects':
      'Common: nausea, vomiting, heartburn, dyspepsia, diarrhea, constipation, dizziness, headache, drowsiness. Serious (seek medical attention): black/bloody stools, chest pain, sudden numbness, rash/difficulty breathing, dark urine/yellowing skin.',
    interactions:
      'Drug interactions:\n• Warfarin — SEVERE: increased bleeding risk\n• Aspirin — MODERATE: increased GI side effects, reduced cardioprotection\n• Lisinopril/ACE inhibitors — MODERATE: reduced blood pressure effect\n• Metformin — MODERATE: possible increased metformin levels\n• Furosemide/diuretics — MODERATE: reduced diuretic effect\n• Lithium — MODERATE: increased lithium levels, toxicity risk\n• Methotrexate — MODERATE: increased toxicity\n• SSRIs — MILD: increased bleeding risk',
    pharmacokinetics:
      'Absorption: 80–85% bioavailability. Onset: 30–60 minutes. Peak: 1–2 hours. Protein binding: 90–99%. Metabolism: hepatic via CYP2C9. Half-life: 2–4 hours. Excretion: urine (as metabolites).',
    storage:
      'Store at room temperature 20–25°C (68–77°F). Keep away from moisture, heat, and light.',
  },
  warfarin: {
    names: 'Generic: Warfarin. Brand names: Coumadin, Jantoven.',
    class: 'Drug class: Anticoagulant (Vitamin K Antagonist).',
    mechanism:
      'Warfarin inhibits vitamin K epoxide reductase — the enzyme that recycles vitamin K. Vitamin K is essential for synthesis of clotting factors II, VII, IX, and X. By blocking it, warfarin reduces clotting ability. Full effect takes 3–5 days as existing clotting factors naturally degrade.',
    indications:
      'Used for: DVT and pulmonary embolism (prophylaxis and treatment), prevention of thromboembolic events in atrial fibrillation, prevention after heart valve replacement, reducing recurrent myocardial infarction risk, stroke prevention in patients with mechanical heart valves.',
    dosage:
      'Initial dose: 2–5 mg daily. Maintenance: 2–10 mg daily (individualized by INR). Target INR: 2.0–3.0 for most indications; 2.5–3.5 for mechanical heart valves. Take at the same time each day (usually evening).',
    contraindications:
      'Do NOT use if: active bleeding or hemorrhagic tendencies, pregnancy (causes warfarin embryopathy), recent/upcoming surgery, severe uncontrolled hypertension, inability to comply with INR monitoring.',
    warnings:
      'Warnings: bleeding is the most serious adverse effect. Regular INR monitoring is essential. Maintain consistent vitamin K dietary intake. Hundreds of drugs interact with warfarin.',
    'side effects':
      'Common: epistaxis, gum bleeding, easy bruising, hair loss, skin rash, nausea, abdominal pain. Serious (seek immediate medical attention): severe internal or intracranial bleeding, sudden severe headache, unexplained bruising/swelling, warfarin-induced skin necrosis, purple toe syndrome.',
    interactions:
      'SEVERE interactions:\n• Ibuprofen/NSAIDs — SEVERE: increased bleeding risk\n• Aspirin — SEVERE: significantly increased bleeding\n• Amiodarone — SEVERE: increased warfarin effect\n• Fluconazole — SEVERE: increased warfarin effect\n• Metronidazole — SEVERE: increased warfarin effect\n\nMODERATE interactions:\n• Acetaminophen (high doses) — MODERATE: increased INR\n• Amoxicillin — MODERATE: increased warfarin effect (disrupts gut flora)\n• Ciprofloxacin — MODERATE: increased warfarin effect\n• Omeprazole — MODERATE: possible increased warfarin effect\n• Simvastatin — MODERATE: possible increased warfarin effect\n\nDECREASED warfarin effect: Vitamin K supplements, Rifampin, Barbiturates, Carbamazepine, Cholestyramine, Oral contraceptives.',
    diet: "Keep vitamin K intake consistent — do not eliminate leafy greens (kale, spinach, broccoli), just eat them in consistent amounts. Avoid cranberry juice. Avoid alcohol (especially binge drinking). Avoid: St. John's wort, ginseng, ginkgo, coenzyme Q10.",
    pharmacokinetics:
      'Absorption: >95% bioavailability. Protein binding: 99% (albumin). Metabolism: hepatic via CYP2C9. Half-life: 20–60 hours (average 40 hours). Onset: 24–72 hours. Duration: 2–5 days. Monitoring: INR.',
    monitoring:
      'INR target is individualized (typically 2–3). Check frequency: initially daily to weekly, then every 4 weeks when stable. Always check INR before any surgical procedure.',
    'patient education':
      'Take exactly as prescribed at same time daily. If you miss a dose, take it the same day; otherwise skip — never double dose. Report any unusual bleeding or bruising. Use a soft toothbrush and electric razor. Avoid contact sports. Carry medical alert identification. Inform all healthcare providers. Keep all INR appointments.',
  },
  amoxicillin: {
    names: 'Generic: Amoxicillin. Brand names: Amoxil, Moxatag, Trimox.',
    class: 'Drug class: Penicillin Antibiotic (Aminopenicillin).',
    mechanism:
      'Amoxicillin is a bactericidal antibiotic that inhibits bacterial cell wall synthesis. It binds to penicillin-binding proteins (PBPs), blocking the transpeptidation step of peptidoglycan synthesis. This weakens the cell wall, causing osmotic lysis and bacterial death.',
    indications:
      'Used for: upper respiratory infections (pharyngitis, tonsillitis, sinusitis, otitis media), lower respiratory infections (bronchitis, pneumonia), skin infections, urinary tract infections (UTI), H. pylori eradication, early Lyme disease, bacterial endocarditis prophylaxis.',
    dosage:
      'Adults: mild–moderate infections: 250–500 mg every 8 hours; severe infections: 875 mg every 12 hours; max 2–3 g/day. Children: 20–40 mg/kg/day in divided doses every 8 hours; max 2–3 g/day. Renal impairment (CrCl <30 mL/min): dose adjustment required.',
    contraindications:
      'Do NOT use if: hypersensitivity to penicillins or beta-lactam antibiotics, history of severe allergic reaction to cephalosporins, infectious mononucleosis (high risk of rash).',
    warnings:
      'Warnings: anaphylaxis (0.01–0.05% of courses), 10% cross-sensitivity with cephalosporins, C. difficile-associated diarrhea, superinfection with prolonged use, Jarisch-Herxheimer reaction in Lyme/syphilis treatment, false-positive urine glucose tests (copper reduction method).',
    'side effects':
      'Common: diarrhea (5–10%), nausea, vomiting, abdominal pain, rash, vaginal yeast infection, headache, altered taste. Serious (seek medical attention): anaphylaxis (difficulty breathing, hives, swelling), C. difficile diarrhea (watery/bloody), Stevens-Johnson syndrome, seizures, hepatitis.',
    interactions:
      'Drug interactions:\n• Probenecid — increases amoxicillin levels (used intentionally)\n• Methotrexate — MODERATE: decreased elimination, increased toxicity\n• Oral contraceptives — possibly reduced contraceptive efficacy (use backup)\n• Allopurinol — increased risk of rash\n• Warfarin — MODERATE: may increase INR (monitor closely)\n• Tetracyclines — may interfere with bactericidal action',
    pharmacokinetics:
      'Absorption: 75–90% bioavailability; not significantly affected by food. Peak levels: 1–2 hours. Protein binding: 17–20%. Half-life: 60–90 minutes (prolonged in renal impairment). Excretion: 60–80% unchanged in urine.',
    spectrum:
      'Good activity against: Streptococcus species, Enterococcus faecalis, E. coli, Proteus mirabilis, Salmonella, H. pylori. Limited activity (resistance common): S. aureus, Klebsiella, Pseudomonas aeruginosa.',
    resistance:
      'Resistance mechanisms: beta-lactamase production (most common), altered penicillin-binding proteins, reduced permeability, efflux pumps.',
    pregnancy:
      'Pregnancy Category B — generally considered safe. Crosses placenta but no evidence of fetal harm. Compatible with breastfeeding (may cause diarrhea in infant).',
    'patient education':
      'Complete the entire course even if feeling better. Do not share antibiotics. Report any rash or signs of allergic reaction. Use alternative contraception if on birth control pills. Probiotics may help prevent diarrhea. Shake oral suspension well before use.',
  },
}

// ─── Topic keywords mapping ───────────────────────────────────────────────────

const TOPIC_KEYWORDS: Record<string, string[]> = {
  mechanism: ['mechanism', 'how does', 'how do', 'work', 'action', 'moa'],
  indications: [
    'used for',
    'indication',
    'treat',
    'treatment',
    'condition',
    'prescribed for',
    'what is it for',
    'what does it treat',
  ],
  dosage: [
    'dose',
    'dosage',
    'dosing',
    'how much',
    'how many',
    'mg',
    'milligram',
    'frequency',
    'how often',
    'take',
    'administer',
  ],
  'side effects': [
    'side effect',
    'adverse',
    'reaction',
    'symptom',
    'cause',
    'nausea',
    'diarrhea',
    'headache',
    'bleeding',
    'rash',
  ],
  interactions: [
    'interaction',
    'interact',
    'combine',
    'together',
    'mix',
    'take with',
    'combined with',
    'and ',
    'with ',
  ],
  contraindications: [
    'contraindication',
    'avoid',
    'should not',
    'cannot take',
    'not take',
    'dangerous for',
    'allerg',
    'pregnancy',
    'pregnant',
  ],
  warnings: ['warning', 'precaution', 'caution', 'risk', 'danger', 'careful'],
  pharmacokinetics: [
    'pharmacokinetic',
    'absorption',
    'half-life',
    'metabolism',
    'excretion',
    'bioavailability',
    'protein binding',
    'adme',
    'peak',
    'onset',
  ],
  monitoring: ['monitor', 'inr', 'test', 'check', 'blood test', 'lab'],
  diet: ['diet', 'food', 'eat', 'vitamin k', 'cranberry', 'alcohol', 'drink'],
  spectrum: ['spectrum', 'bacteria', 'cover', 'effective against', 'susceptible'],
  resistance: ['resistance', 'resistant', 'beta-lactamase'],
  pregnancy: ['pregnancy', 'pregnant', 'breastfeed', 'lactation', 'nursing'],
  'patient education': [
    'patient',
    'education',
    'advice',
    'tip',
    'remember',
    'instruction',
    'missed dose',
  ],
  storage: ['store', 'storage', 'keep'],
}

const DRUG_KEYWORDS: Record<string, string[]> = {
  ibuprofen: ['ibuprofen', 'advil', 'motrin', 'nurofen', 'caldolor', 'nsaid', 'anti-inflammatory'],
  warfarin: ['warfarin', 'coumadin', 'jantoven', 'anticoagulant', 'blood thinner', 'inr', 'clot'],
  amoxicillin: ['amoxicillin', 'amoxil', 'moxatag', 'trimox', 'penicillin', 'antibiotic'],
}

// ─── Local retrieval engine ───────────────────────────────────────────────────

function detectDrugs(query: string): string[] {
  const q = query.toLowerCase()
  return Object.entries(DRUG_KEYWORDS)
    .filter(([, keywords]) => keywords.some(k => q.includes(k)))
    .map(([drug]) => drug)
}

function detectTopics(query: string): string[] {
  const q = query.toLowerCase()
  const matched: string[] = []
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(k => q.includes(k))) matched.push(topic)
  }
  return matched
}

function lookupAnswer(query: string): string | null {
  const drugs = detectDrugs(query)
  const topics = detectTopics(query)

  if (drugs.length === 0) return null

  const lines: string[] = []

  // Special case: interaction between two drugs
  if (drugs.length >= 2 || (drugs.length === 1 && topics.includes('interactions'))) {
    for (const drug of drugs) {
      const info = DRUGS[drug]
      if (info?.interactions) {
        lines.push(`**${drug.charAt(0).toUpperCase() + drug.slice(1)} — Drug Interactions**`)
        lines.push(info.interactions)
        lines.push('')
      }
    }
    if (lines.length > 0) {
      lines.push(
        '*Please consult a licensed healthcare professional before making any medical or prescribing decisions.*'
      )
      return lines.join('\n')
    }
  }

  // General topic lookup
  for (const drug of drugs) {
    const info = DRUGS[drug]
    if (!info) continue

    const drugTitle = drug.charAt(0).toUpperCase() + drug.slice(1)

    if (topics.length === 0) {
      // No specific topic — return overview
      lines.push(`**${drugTitle} Overview**`)
      lines.push(info.names)
      lines.push(info.class)
      lines.push('')
      lines.push('**Mechanism:** ' + info.mechanism)
      lines.push('')
      lines.push('**Used for:** ' + info.indications)
      lines.push('')
      lines.push('**Dosage:** ' + info.dosage)
    } else {
      lines.push(`**${drugTitle}**`)
      for (const topic of topics) {
        const content = info[topic]
        if (content) {
          const topicLabel = topic.charAt(0).toUpperCase() + topic.slice(1)
          lines.push(`\n**${topicLabel}:**\n${content}`)
        }
      }
    }
    lines.push('')
  }

  if (lines.length === 0) return null

  lines.push(
    '*Please consult a licensed healthcare professional before making any medical or prescribing decisions.*'
  )
  return lines.join('\n')
}

// ─── RAG backend ──────────────────────────────────────────────────────────────

type RagSource = { title: string; drugName: string; excerpt: string; relevance: number }
type RagResponse = {
  success: boolean
  question: string
  answer: string
  sources?: RagSource[]
  error?: string
}

function getFunctionsBaseUrl() {
  const explicit = (import.meta.env.VITE_FUNCTIONS_URL as string | undefined) ?? ''
  if (explicit) return explicit.replace(/\/+$/, '')
  const projectId = firebaseProjectId || 'med-assist-9edf0'
  return `https://us-central1-${projectId}.cloudfunctions.net`
}

async function queryRag(question: string): Promise<RagResponse> {
  const baseUrl = getFunctionsBaseUrl()
  const res = await fetch(`${baseUrl}/askHealthDose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `RAG request failed (${res.status})`)
  }

  return (await res.json()) as RagResponse
}

function formatSources(sources: RagSource[] | undefined) {
  if (!sources || sources.length === 0) return ''
  const lines = sources.map(
    s => `- ${s.title}${s.drugName ? ` (${s.drugName})` : ''} [${s.relevance.toFixed(2)}]`
  )
  return `\n\nSources:\n${lines.join('\n')}`
}

// ─── Public API ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendToAI(messages: AIMessage[], _apiKey: string): Promise<string> {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUserMessage) return 'Please ask a question.'

  const query = lastUserMessage.content

  const answer = lookupAnswer(query)

  if (answer) return answer

  try {
    const result = await queryRag(query)
    if (result?.answer) {
      return `${result.answer}${formatSources(result.sources)}`
    }
  } catch (error) {
    console.error('RAG fallback failed:', error)
  }

  return "I couldn't reach the HealthDose knowledge base right now. Please try again later."
}
