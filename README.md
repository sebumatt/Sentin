# Sentin - AI Fall Detection & Care Dashboard

**Sentin** is a cutting-edge elderly monitoring dashboard that leverages **Google's Gemini 2.0 Flash** multimodal AI to provide forensic-level video analysis. It detects falls, analyzes gait stability, identifies environmental hazards, and automates care triage protocols in real-time.

![Sentin Dashboard](https://via.placeholder.com/800x450?text=Sentin+Dashboard+Preview)

## 🚀 Key Features

*   **Forensic Video Analysis**: Upload CCTV or monitoring footage for instant AI processing using Gemini's vision capabilities.
*   **Real-time Fall Detection**: accurately identifies falls and marks the exact moment of impact.
*   **Dynamic Triage System**:
    *   **Primary Contact (Caregiver)**: Automatically triggered upon fall detection.
    *   **Emergency Services**: Automatically triggered if post-fall inactivity is detected.
*   **Environmental Risk Scanning**: Scans the room layout to identify and classify trip hazards (e.g., loose rugs, stairs) with risk levels.
*   **Interactive Analysis Timeline**: Visualizes safety status with a dynamic waveform that shifts from a smooth "breathing" state to a high-frequency "disturbed" state during fall events.
*   **Live Forensics Log**: Generates a second-by-second chronological audit trail of the resident's actions.

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Vite
*   **Styling**: Tailwind CSS
*   **AI Model**: Google Gemini 2.0 Flash (`@google/genai` SDK)
*   **Visualization**: Recharts (Custom waveform logic)
*   **Icons**: Lucide React

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/sentin.git
    cd sentin
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    Ensure your environment variables are set up. The app expects `process.env.API_KEY` to be available (injected via Vite or build process) with a valid Google GenAI API key.

4.  **Run the application**
    ```bash
    npm start
    ```

## 💡 Usage Guide

1.  **Upload Video**: Click the center upload button in the video monitor to select footage of a room.
2.  **Wait for Analysis**: The Gemini model processes the video to extract events, hazards, and logs.
3.  **Monitor**:
    *   Watch the **Analysis Timeline** for red spikes indicating falls.
    *   Check **Alerts & Risks** for identified room hazards.
    *   Observe **Care Triage** on the right for the auto-calling protocol.
4.  **Interact**: Scrub through the timeline to replay specific events.

## 🎨 Design Philosophy

The UI is designed with a "Calm Tech" approach—using soft stone colors (`bg-stone-50`) and clear typography—transitioning to high-contrast emergency states (Red/Orange) only when critical events occur to reduce cognitive load on monitoring staff.
