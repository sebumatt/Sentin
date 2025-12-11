
export interface TimelineEvent {
  timeOffset: number; // Seconds from start of video
  type: 'FALL' | 'UNSTEADY' | 'INACTIVITY' | 'NORMAL';
  confidence: number; // 0-100
  description: string;
}

export interface VitalsData {
  heartRate: number;
  oxygenLevel: number;
  activityLevel: 'High' | 'Moderate' | 'Low' | 'Sedentary';
}

export interface Hazard {
  label: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface ActivityLog {
  timeOffset: number;
  timestamp: string; // e.g. "0:01"
  description: string;
}

export interface AnalysisResult {
  vitals: VitalsData;
  events: TimelineEvent[];
  hazards: Hazard[];
  logs: ActivityLog[];
  summary: string;
  riskAssessment: {
    fallRisk: 'High' | 'Medium' | 'Low';
    mobilityScore: number; // 0-10
  };
}

export interface ChatMessage {
  id: string;
  sender: 'AI' | 'Caregiver' | 'System';
  text: string;
  timestamp: Date;
  isUrgent?: boolean;
}

export interface PathPoint {
  x: number;
  y: number;
}
