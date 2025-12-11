# Future Implementation Roadmap

This document outlines the planned evolution of the Sentin platform, moving from a forensic analysis tool to a comprehensive live monitoring solution.

## 1. Live Stream Processing (WebRTC)
*   **Current State**: File upload based.
*   **Future Goal**: Integrate WebRTC to ingest live camera feeds (e.g., RTSP from IP cameras).
*   **Implementation**:
    *   Use a backend media server (or Gemini Live API streaming) to process frames in chunks (e.g., every 5 seconds).
    *   Implement a rolling buffer for the `Timeline` component.

## 2. Backend Integration & Notifications
*   **Current State**: Simulated calls within the UI.
*   **Future Goal**: Real-world alerts.
*   **Implementation**:
    *   Integrate **Twilio API** for programmable voice calls and SMS.
    *   Integrate **WhatsApp Business API** for rich caregiver alerts containing the fall video clip.
    *   Store event history in a database (Firebase/Supabase).

## 3. Advanced Gait Forensics
*   **Current State**: Textual descriptions of gait ("Unsteady").
*   **Future Goal**: Visual Skeleton Tracking.
*   **Implementation**:
    *   Re-introduce the Canvas overlay with high-fidelity pose estimation (MediaPipe or Gemini fine-tuned).
    *   Calculate quantitative metrics: "Stride Length", "Cadence", "Center of Mass Variance".

## 4. Multi-Resident Support
*   **Current State**: Single video context.
*   **Future Goal**: Dashboard for Care Homes.
*   **Implementation**:
    *   Sidebar navigation to switch between different rooms/residents.
    *   "Global Status" header showing the number of active alerts facility-wide.

## 5. IoT Integration
*   **Current State**: Passive monitoring.
*   **Future Goal**: Active environment control.
*   **Implementation**:
    *   If a fall is detected at night, automatically trigger **Philips Hue** or smart lights to brighten the room for emergency responders.
    *   Unlock smart doors automatically when "Emergency Services" are dialed.

## 6. Privacy & Ethics Features
*   **Current State**: Raw video display.
*   **Future Goal**: Privacy-first monitoring.
*   **Implementation**:
    *   **Blur Mode**: Automatically blur faces or bodies in the video feed, showing only the skeleton overlay or bounding boxes to preserve dignity while maintaining safety.
    *   **Local Processing**: Move lighter weight inference (e.g., movement detection) to the edge (TensorFlow.js) to reduce cloud data transmission.
