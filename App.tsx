
import React, { useState, useEffect } from 'react';
import AlertsPanel from './components/AlertsPanel';
import VideoMonitor from './components/VideoMonitor';
import Timeline from './components/Timeline';
import CareTriage from './components/CareTriage';
import { AnalysisResult } from './types';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  
  // 'CAREGIVER' = Fall detected
  // 'EMERGENCY' = Inactivity detected (escalation)
  const [callStatus, setCallStatus] = useState<'CAREGIVER' | 'EMERGENCY' | null>(null);

  // Sync video time with analysis data to drive the UI
  useEffect(() => {
    if (!analysisResult) return;

    // 1. Check for active events at current time
    const activeEvent = analysisResult.events.find(e => 
      currentTime >= e.timeOffset && currentTime <= e.timeOffset + 3 
    );

    setActiveAlert(activeEvent ? activeEvent.type : null);

    // 2. Call Logic
    // Trigger 1: Caregiver Call (FALL event)
    const fallEvent = analysisResult.events.find(e => 
      e.type === 'FALL' && 
      e.confidence >= 65 &&
      Math.abs(currentTime - e.timeOffset) < 1.2
    );

    if (fallEvent && callStatus !== 'CAREGIVER' && callStatus !== 'EMERGENCY') {
      setCallStatus('CAREGIVER');
      // Auto-reset for demo loop purposes after 12s if it doesn't escalate
      setTimeout(() => {
          setCallStatus(prev => prev === 'CAREGIVER' ? null : prev); 
      }, 12000);
    }

    // Trigger 2: Emergency Call (INACTIVITY event)
    // Only triggers if inactivity is high confidence
    const inactivityEvent = analysisResult.events.find(e => 
        e.type === 'INACTIVITY' &&
        e.confidence >= 80 &&
        Math.abs(currentTime - e.timeOffset) < 1.2
    );

    if (inactivityEvent && callStatus !== 'EMERGENCY') {
        setCallStatus('EMERGENCY');
        // Auto-reset for demo loop
        setTimeout(() => {
             setCallStatus(prev => prev === 'EMERGENCY' ? null : prev);
        }, 12000);
    }

  }, [currentTime, analysisResult, callStatus]);

  const handleSeek = (time: number) => {
    setSeekTarget(time);
    // Optimistically update UI
    setCurrentTime(time);
  };

  return (
    <div className="min-h-screen bg-[#e7e5e4] p-4 md:p-6 flex items-center justify-center font-sans text-stone-800">
      
      {/* 5-Column Grid Layout */}
      <div className="max-w-[1600px] w-full mx-auto grid grid-cols-1 md:grid-cols-5 grid-rows-[auto_auto_auto] md:grid-rows-3 gap-4 h-full md:h-[88vh]">
        
        {/* Main Area: Video Monitor (4x2) */}
        <div className="col-span-1 md:col-span-4 row-span-1 md:row-span-2 min-h-[400px]">
          <VideoMonitor 
            onAnalysisComplete={setAnalysisResult} 
            onTimeUpdate={setCurrentTime}
            onDurationChange={setVideoDuration}
            currentEvent={activeAlert}
            seekTo={seekTarget}
          />
        </div>

        {/* Right Sidebar: Care Triage (1x3) - Spans full height */}
        <div className="col-span-1 row-span-1 md:row-span-3 h-full">
           <CareTriage 
             analysis={analysisResult} 
             callStatus={callStatus} 
             currentTime={currentTime} 
           />
        </div>

        {/* Bottom Left: Alerts List (1x1) */}
        <div className="col-span-1 md:col-span-1 row-span-1">
          <AlertsPanel analysis={analysisResult} />
        </div>

        {/* Bottom Center: Timeline (3x1) */}
        <div className="col-span-1 md:col-span-3 row-span-1">
           <Timeline 
             analysis={analysisResult} 
             currentTime={currentTime}
             duration={videoDuration}
             onSeek={handleSeek}
           />
        </div>
        
      </div>
    </div>
  );
};

export default App;
