
import React, { useEffect, useRef } from 'react';
import { PhoneOutgoing, Clock, HeartPulse, ShieldAlert, Phone } from 'lucide-react';
import { AnalysisResult } from '../types';

interface CareTriageProps {
  analysis: AnalysisResult | null;
  callStatus: 'CAREGIVER' | 'EMERGENCY' | null;
  currentTime?: number;
}

const CareTriage: React.FC<CareTriageProps> = ({ analysis, callStatus, currentTime = 0 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Combine AI logs with System logs
  const displayLogs = React.useMemo(() => {
    if (!analysis) return [];
    
    const logs = [...analysis.logs];
    
    // Inject "Call Initiated" logs based on the current status
    if (callStatus === 'CAREGIVER') {
         const fallEvent = analysis.events.find(e => e.type === 'FALL');
         if (fallEvent) {
             const time = fallEvent.timeOffset + 1;
             if (!logs.find(l => l.description.includes("Calling Caregiver"))) {
                logs.push({
                   timeOffset: time,
                   timestamp: new Date(time * 1000).toISOString().substr(14, 5),
                   description: "System: Calling Caregiver..."
                });
             }
         }
    }

    if (callStatus === 'EMERGENCY') {
        const inactivityEvent = analysis.events.find(e => e.type === 'INACTIVITY');
        if (inactivityEvent) {
            const time = inactivityEvent.timeOffset + 1;
            if (!logs.find(l => l.description.includes("Dialing Emergency Services"))) {
               logs.push({
                  timeOffset: time,
                  timestamp: new Date(time * 1000).toISOString().substr(14, 5),
                  description: "System: Dialing Emergency Services (No Movement)"
               });
            }
        }
    }
    
    return logs.sort((a, b) => a.timeOffset - b.timeOffset);
  }, [analysis, callStatus]);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
        const activeIndex = displayLogs.findIndex(log => log.timeOffset > currentTime);
        if (activeIndex > 0) {
            const rowHeight = 60; 
            scrollRef.current.scrollTop = (activeIndex - 2) * rowHeight;
        }
    }
  }, [currentTime, displayLogs]);

  return (
    <div className="flex flex-col h-full bg-[#Fdfcf8] border border-[#e5e2da] rounded-3xl shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-5 pb-2 border-b border-stone-100">
        <h3 className="text-stone-800 font-semibold text-lg">Care Triage</h3>
        <div className="mt-2 text-xs font-semibold text-stone-500 uppercase tracking-wider flex justify-between">
            <span>Live Analysis Log</span>
            {analysis && <span className="text-orange-600 animate-pulse">● Rec</span>}
        </div>
      </div>

      {/* Logs Area - Flexible Height */}
      <div className="flex-1 overflow-y-auto p-5 pt-2 relative scrollbar-hide" ref={scrollRef}>
           
           {displayLogs.length > 0 ? (
               displayLogs.map((log, idx) => {
                 const isActive = Math.abs(log.timeOffset - currentTime) < 1.5;
                 const isPast = log.timeOffset < currentTime;
                 const isSystem = log.description.includes("System:");
                 
                 return (
                    <div key={idx} className={`relative flex items-start space-x-3 py-3 transition-all duration-300 ${isActive ? 'bg-stone-50 rounded-lg -mx-2 px-2' : ''} ${isPast ? 'opacity-50' : 'opacity-100'}`}>
                        {/* Timestamp Bubble */}
                        <div className={`
                           z-10 text-[10px] font-mono font-medium py-1 px-1.5 rounded-md min-w-[45px] text-center border shrink-0
                           ${isActive 
                              ? 'bg-stone-800 text-white border-stone-800 scale-105' 
                              : isSystem 
                                ? 'bg-red-50 text-red-600 border-red-100' 
                                : 'bg-white text-stone-500 border-stone-200'}
                        `}>
                           {log.timestamp}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-0.5 min-w-0">
                           <p className={`text-sm font-medium leading-tight whitespace-normal break-words ${
                               isActive ? 'text-stone-900' : 
                               isSystem ? 'text-red-600' : 'text-stone-600'
                           }`}>
                             {log.description}
                           </p>
                        </div>
                    </div>
                 );
               })
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-60">
                <Clock size={32} className="mb-2" />
             </div>
           )}
      </div>

      {/* Footer - Fixed Call Buttons */}
      <div className="p-5 bg-stone-50 border-t border-stone-100 space-y-3">
        
        {/* Caregiver Button */}
        <div className={`
          w-full rounded-2xl p-4 flex items-center justify-between border transition-all duration-500
          ${callStatus === 'CAREGIVER' 
            ? 'bg-orange-500 border-orange-600 shadow-lg scale-[1.02] ring-4 ring-orange-500/20' 
            : 'bg-white border-stone-200 shadow-sm opacity-80'}
        `}>
           <div className="flex items-center space-x-3">
               <div className={`
                 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                 ${callStatus === 'CAREGIVER' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-400'}
               `}>
                   <HeartPulse size={20} className={callStatus === 'CAREGIVER' ? 'animate-pulse' : ''} />
               </div>
               <div>
                   <div className={`text-xs font-bold uppercase tracking-wider ${callStatus === 'CAREGIVER' ? 'text-white/80' : 'text-stone-400'}`}>
                     Primary Contact
                   </div>
                   <div className={`text-sm font-bold ${callStatus === 'CAREGIVER' ? 'text-white' : 'text-stone-600'}`}>
                     {callStatus === 'CAREGIVER' ? 'Calling Caregiver...' : 'Contact Caregiver'}
                   </div>
               </div>
           </div>
           {callStatus === 'CAREGIVER' && <PhoneOutgoing size={20} className="text-white animate-bounce" />}
        </div>

        {/* Emergency Button */}
        <div className={`
          w-full rounded-2xl p-4 flex items-center justify-between border transition-all duration-500
          ${callStatus === 'EMERGENCY' 
            ? 'bg-red-600 border-red-700 shadow-lg scale-[1.02] ring-4 ring-red-600/20' 
            : 'bg-white border-stone-200 shadow-sm opacity-80'}
        `}>
           <div className="flex items-center space-x-3">
               <div className={`
                 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                 ${callStatus === 'EMERGENCY' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-400'}
               `}>
                   <ShieldAlert size={20} className={callStatus === 'EMERGENCY' ? 'animate-ping' : ''} />
               </div>
               <div>
                   <div className={`text-xs font-bold uppercase tracking-wider ${callStatus === 'EMERGENCY' ? 'text-white/80' : 'text-stone-400'}`}>
                     Emergency Services
                   </div>
                   <div className={`text-sm font-bold ${callStatus === 'EMERGENCY' ? 'text-white' : 'text-stone-600'}`}>
                     {callStatus === 'EMERGENCY' ? 'Dialing 911...' : 'Emergency Call'}
                   </div>
               </div>
           </div>
           {callStatus === 'EMERGENCY' && <PhoneOutgoing size={20} className="text-white animate-bounce" />}
        </div>

      </div>
    </div>
  );
};

export default CareTriage;
