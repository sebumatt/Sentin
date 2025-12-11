# Architecture Documentation

## System Overview

Sentin is a client-side Single Page Application (SPA) built with React. It uses a unidirectional data flow pattern where the **Video Analysis Result** serves as the central source of truth, driving the visualization, logging, and alerting components.

## 📁 Directory Structure

```text
/
├── components/          # UI Components
│   ├── AlertsPanel.tsx  # Displays environmental hazards list
│   ├── CareTriage.tsx   # Live logs and Call UI logic
│   ├── FloorPlan.tsx    # (Deprecated/Removed) 2D tracking view
│   ├── Timeline.tsx     # Recharts visualization of event data
│   └── VideoMonitor.tsx # Video player and AI integration entry point
├── services/
│   └── geminiService.ts # API interaction layer for Google GenAI
├── types.ts             # TypeScript interfaces (AnalysisResult, Event, etc.)
├── App.tsx              # Main layout and state controller
└── index.tsx            # Entry point
```

## 🧠 Data Flow & Logic

### 1. The Analysis Pipeline (`VideoMonitor.tsx` -> `geminiService.ts`)
*   **Input**: User uploads a video file (blob).
*   **Processing**:
    1.  Video is converted to a Base64 string.
    2.  `geminiService` sends the video + a robust System Prompt to Gemini 2.0 Flash.
    3.  **Prompt Strategy**: The prompt enforces a strict JSON schema output containing:
        *   `events`: Time-stamped anomalies (FALL, INACTIVITY).
        *   `hazards`: Static object detection (Rugs, Furniture).
        *   `logs`: Chronological text descriptions.
*   **Output**: The JSON response is parsed into the `AnalysisResult` state in `App.tsx`.

### 2. Time Synchronization (`App.tsx`)
*   The application relies on the HTML5 Video Element's `currentTime` as the global clock.
*   `VideoMonitor` emits `onTimeUpdate` events to `App.tsx`.
*   `App.tsx` propagates `currentTime` to:
    *   `Timeline`: To draw the playhead.
    *   `CareTriage`: To highlight active log lines.
    *   **Logic Engine**: To check if the current second matches a critical event timestamp.

### 3. Event Trigger Logic (`App.tsx`)
The app implements a deterministic state machine for emergency calls based on the AI data:

```typescript
// Pseudo-code logic in App.tsx
useEffect(() => {
  // Trigger 1: Caregiver Call
  if (CurrentTime matches FALL_Event_Time) {
      Set CallStatus = 'CAREGIVER';
  }

  // Trigger 2: Emergency Escalation
  if (CurrentTime matches INACTIVITY_Event_Time AND Confidence > 80%) {
      Set CallStatus = 'EMERGENCY';
  }
}, [currentTime, analysisResult]);
```

### 4. Visualization Engine (`Timeline.tsx`)
*   Uses `recharts` but generates synthetic waveform data.
*   **Algorithm**:
    *   Iterates through the video duration in 0.1s increments.
    *   Default Value: Low amplitude sine wave (breathing effect).
    *   If `FALL` event exists at time `t`: Inject high-amplitude random noise (Fourier-like disturbance).
*   **Gradient Styling**: Uses SVG linear gradients to dynamically color the line Green (safe) or Red (danger) based on the exact timestamp of the fall.

## 🤖 AI Model Configuration

*   **Model**: `gemini-2.0-flash`
*   **Reasoning**: Selected for its low latency and high multimodal understanding capabilities, essential for processing video frames quickly on the client side.
*   **Safety Settings**: Standard settings used; the prompt explicitly requests medical/forensic context.

## ⚠️ Known Constraints

*   **File Size**: Browsers limit the size of Base64 strings. Very large videos may crash the browser tab.
*   **Session State**: Data is not persisted. Refreshing the page clears the analysis.
