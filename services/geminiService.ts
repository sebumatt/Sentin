
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";
import { getExperimentVariant, logExperimentResult } from "./promptExperiments";

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
  
  // A/B Testing: Select a prompt variant
  const variant = getExperimentVariant();
  console.log(`[A/B Experiment] Running variant: ${variant.name} (${variant.id})`);
  
  const startTime = performance.now();

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
        systemInstruction: variant.systemInstruction, // Use selected variant
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

    const result = JSON.parse(text) as AnalysisResult;
    
    // Log success
    const duration = performance.now() - startTime;
    logExperimentResult(variant.id, duration, true);

    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    
    // Log failure
    const duration = performance.now() - startTime;
    logExperimentResult(variant.id, duration, false, (error as Error).message);
    
    throw error;
  }
};
