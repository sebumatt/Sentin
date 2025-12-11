
// A/B Testing Framework for Gemini Prompts

export type PromptVariantId = 'baseline' | 'few-shot' | 'chain-of-thought' | 'uncertainty-aware';

export interface PromptVariant {
  id: PromptVariantId;
  name: string;
  systemInstruction: string;
}

// 1. BASELINE: The standard forensic prompt
const BASELINE_INSTRUCTION = `
You are an advanced medical AI assistant specializing in elderly care and fall detection.
Your task is to analyze video footage of a resident in their home with forensic precision.

CRITICAL OBJECTIVES:
1. **Fall Detection**: Identify falls by looking for rapid descent, sudden loss of balance, or the subject ending up on the floor. Mark the exact timestamp of impact.
2. **Gait Analysis**: Detect specific abnormalities such as shuffling, staggering, hesitation, or clutching furniture for support.
3. **Chronological Log**: Provide a second-by-second (or key event based) log of what is happening. E.g., "0:01 - Resident enters", "0:02 - Walks towards chair", "0:03 - Trips on rug".
4. **Environmental Hazards**: Identify specific objects in the room (e.g., Rugs, Cables, Furniture) that pose a trip hazard. Classify risk as High/Medium/Low. Keep descriptions extremely concise (e.g. "Loose Rug", "Coffee Table").
5. **Vitals Estimation**: Estimate heart rate and activity level.

OUTPUT FORMAT:
Return a raw JSON object. Do not use Markdown.
Structure:
{
  "vitals": { ... },
  "events": [ ... ],
  "hazards": [ ... ],
  "logs": [
    { "timeOffset": number, "timestamp": string, "description": string }
  ],
  "summary": string,
  "riskAssessment": { ... }
}
`;

// 2. FEW-SHOT: Adds concrete examples to guide the model
const FEW_SHOT_ADDITION = `
EXAMPLES:
- Input: [Video of subject stumbling over carpet edge]
  Output Event: { "type": "UNSTEADY", "confidence": 85, "description": "Toe catch on rug edge causing forward stumble." }
- Input: [Video of subject collapsing slowly against wall]
  Output Event: { "type": "FALL", "confidence": 92, "description": "Controlled slide against wall to seated position." }
- Input: [Video of subject walking normally]
  Output Hazard: { "label": "Power Cord", "riskLevel": "High", "description": "Black cable spanning walkway." }
`;

// 3. CHAIN-OF-THOUGHT: Encourages internal reasoning steps
const COT_ADDITION = `
INSTRUCTION:
Before generating the final JSON structure, think step-by-step about the physics of the movement observed.
1. Analyze the Center of Mass (CoM) trajectory.
2. Check for points of contact with the ground (knees, hands, head).
3. Evaluate recovery attempts.
4. Synthesize these observations into the final 'summary' field before populating specific events.
`;

// 4. UNCERTAINTY-AWARE: Forces conservative confidence scoring
const UNCERTAINTY_ADDITION = `
INSTRUCTION:
Be extremely conservative with confidence scores.
- If the subject is partially occluded (e.g., behind sofa), reduce confidence by 20%.
- If video motion blur is high, mark events as 'UNSTEADY' rather than 'FALL' unless ground contact is clearly visible.
- In your descriptions, explicitly state any factors reducing your certainty.
`;

/**
 * Selects a prompt variant based on weighted random allocation.
 * Weights:
 * - Baseline: 50%
 * - Few-Shot: 25%
 * - Chain-of-Thought: 15%
 * - Uncertainty-Aware: 10%
 */
export const getExperimentVariant = (): PromptVariant => {
  const rand = Math.random();

  if (rand < 0.50) {
    return { 
      id: 'baseline', 
      name: 'Baseline Forensic', 
      systemInstruction: BASELINE_INSTRUCTION 
    };
  } else if (rand < 0.75) {
    return { 
      id: 'few-shot', 
      name: 'Few-Shot Examples', 
      systemInstruction: BASELINE_INSTRUCTION + "\n" + FEW_SHOT_ADDITION 
    };
  } else if (rand < 0.90) {
    return { 
      id: 'chain-of-thought', 
      name: 'Chain-of-Thought', 
      systemInstruction: BASELINE_INSTRUCTION + "\n" + COT_ADDITION 
    };
  } else {
    return { 
      id: 'uncertainty-aware', 
      name: 'Uncertainty Breakdown', 
      systemInstruction: BASELINE_INSTRUCTION + "\n" + UNCERTAINTY_ADDITION 
    };
  }
};

/**
 * Logs the experiment result to IndexedDB for future analysis.
 */
export const logExperimentResult = async (variantId: PromptVariantId, durationMs: number, success: boolean, error?: string) => {
  if (!window.indexedDB) return;

  const DB_NAME = 'SentinExperiments';
  const STORE_NAME = 'prompt_runs';
  const DB_VERSION = 1;

  try {
    const openRequest = indexedDB.open(DB_NAME, DB_VERSION);

    openRequest.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    openRequest.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      store.add({
        variantId,
        timestamp: new Date().toISOString(),
        durationMs,
        success,
        error: error || null,
        userAgent: navigator.userAgent
      });
    };
  } catch (e) {
    console.warn("Failed to log prompt experiment:", e);
  }
};
