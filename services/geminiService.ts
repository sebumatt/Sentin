
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_INSTRUCTION_ANALYSIS = `
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

const responseSchemaAnalysis: Schema = {
  type: Type.OBJECT,
  properties: {
    vitals: {
      type: Type.OBJECT,
      properties: {
        heartRate: { type: Type.NUMBER },
        oxygenLevel: { type: Type.NUMBER },
        activityLevel: { type: Type.STRING, enum: ["High", "Moderate", "Low", "Sedentary"] },
      },
      required: ["heartRate", "oxygenLevel", "activityLevel"],
    },
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timeOffset: { type: Type.NUMBER },
          type: { type: Type.STRING, enum: ["FALL", "UNSTEADY", "INACTIVITY", "NORMAL"] },
          confidence: { type: Type.NUMBER },
          description: { type: Type.STRING },
        },
        required: ["timeOffset", "type", "confidence", "description"],
      },
    },
    hazards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          riskLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          description: { type: Type.STRING },
        },
        required: ["label", "riskLevel", "description"],
      },
    },
    logs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timeOffset: { type: Type.NUMBER },
          timestamp: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["timeOffset", "timestamp", "description"],
      },
    },
    summary: { type: Type.STRING },
    riskAssessment: {
      type: Type.OBJECT,
      properties: {
        fallRisk: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
        mobilityScore: { type: Type.NUMBER },
      },
      required: ["fallRisk", "mobilityScore"],
    },
  },
  required: ["vitals", "events", "hazards", "logs", "summary", "riskAssessment"],
};

// --- Main Analysis Logic ---
export const analyzeVideo = async (base64Video: string, mimeType: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    console.log("Starting Gemini Video Analysis (Events, Hazards & Logs)...");
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Video,
            },
          },
          {
            text: "Analyze this video. List hazards. Provide a strict second-by-second chronological log of actions (e.g. 0:01 - Entered).",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
        responseMimeType: "application/json",
        responseSchema: responseSchemaAnalysis,
      },
    });

    let text = response.text;
    if (!text) throw new Error("No response from Gemini");

    if (text.startsWith("```json")) {
        text = text.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (text.startsWith("```")) {
        text = text.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
