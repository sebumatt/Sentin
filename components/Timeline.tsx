
import React, { useMemo, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { AnalysisResult } from '../types';
import { PlayCircle } from 'lucide-react';

interface TimelineProps {
  analysis: AnalysisResult | null;
  currentTime: number;
  duration?: number;
  onSeek?: (time: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ analysis, currentTime, duration, onSeek }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the Fall event to calculate gradient offset
  const fallEvent = useMemo(() => analysis?.events.find(e => e.type === 'FALL'), [analysis]);

  // Generate data for the chart based on analysis or defaults
  const data = useMemo(() => {
    const points = [];
    // Prioritize actual video duration, fallback to analysis events, or default to 30s
    const maxTime = duration && duration > 0 
        ? duration 
        : (analysis?.events.length ? Math.max(...analysis.events.map(e => e.timeOffset)) + 10 : 30);
    
    // Generate waveform data
    // "No Event" = Smooth, low frequency wave
    // "Fall Event" = Sudden burst of high frequency noise
    for (let i = 0; i <= Math.ceil(maxTime * 10); i++) {
      const time = i / 10; // 0.1s resolution for better waveform detail
      let value = 20; // Baseline

      const event = analysis?.events.find(e => Math.abs(e.timeOffset - time) < 1.0);
      
      if (event?.type === 'FALL') {
         // Disturbed waveform: High amplitude, high frequency noise
         value = 50 + (Math.random() - 0.5) * 60 + Math.sin(time * 50) * 20;
      } else if (event?.type === 'UNSTEADY') {
         // Moderate disturbance
         value = 30 + Math.sin(time * 10) * 10 + (Math.random() - 0.5) * 10;
      } else {
         // "No Event" - Calm, breathing wave
         value = 20 + Math.sin(time * 2) * 4;
      }

      // Clamp value to positive
      value = Math.max(0, value);

      points.push({
        time: Number(time.toFixed(1)),
        value: value,
      });
    }
    return points;
  }, [analysis, duration]);

  // Calculate the percentage where the Fall happens to split the gradient color
  const gradientOffset = useMemo(() => {
    // If no data, default to Green (1)
    if (!data.length) return 1;
    const maxTime = data[data.length - 1].time;
    if (maxTime <= 0) return 1;

    // If no fall event, the whole line should be Green (offset 1)
    if (!fallEvent) return 1;
    
    // Calculate percentage (0 to 1)
    const offset = fallEvent.timeOffset / maxTime;
    return Math.min(Math.max(offset, 0), 1); // Clamp between 0 and 1
  }, [fallEvent, data]);

  const activeEvent = analysis?.events.find(e => Math.abs(e.timeOffset - currentTime) < 1.5);

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onSeek || !data.length) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    
    // Calculate timestamp based on ratio and max time in data
    const maxTime = data[data.length - 1].time;
    const newTime = ratio * maxTime;
    
    onSeek(newTime);
  };

  return (
    <div className="bg-[#Fdfcf8] border border-[#e5e2da] rounded-3xl p-5 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center space-x-2">
            <h3 className="text-stone-800 font-semibold text-lg">Analysis Timeline</h3>
            {activeEvent && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase animate-pulse ${
                    activeEvent.type === 'FALL' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                {activeEvent.type}
                </span>
            )}
         </div>
         <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-1 rounded-md">
            {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {new Date(((data[data.length-1]?.time || 0)) * 1000).toISOString().substr(14, 5)}
         </span>
      </div>

      <div className="flex-1 flex flex-col">
         {/* Chart Area - Interactive Scrubber */}
         <div 
            ref={containerRef}
            className="flex-1 w-full relative min-h-[120px] cursor-crosshair group/chart"
            onClick={handleScrub}
            onMouseDown={(e) => {
                if(e.buttons === 1) handleScrub(e);
            }}
            onMouseMove={(e) => {
                if(e.buttons === 1) handleScrub(e);
            }}
         >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  {/* Fill Gradient (Orange/Red Fade) */}
                  <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>

                  {/* Stroke Gradient: Green until Fall, then Red */}
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset={gradientOffset} stopColor="#10b981" /> {/* Emerald Green */}
                    <stop offset={gradientOffset} stopColor="#ef4444" /> {/* Red */}
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="time" hide />
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ color: '#44403c', fontSize: '12px' }}
                   formatter={(value: number) => [Math.round(value), 'Activity']}
                   labelFormatter={(label) => `Time: ${label}s`}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="url(#strokeGradient)" 
                  strokeWidth={2}
                  fill="url(#fillGradient)" 
                  animationDuration={300}
                />
                
                {/* Event Markers - Syncs with data generation logic */}
                {analysis?.events.map((e, i) => (
                   <ReferenceLine 
                     key={i} 
                     x={e.timeOffset} 
                     stroke={e.type === 'FALL' ? '#ef4444' : '#10b981'} 
                     strokeDasharray="3 3" 
                   />
                ))}
                
                {/* Current Time Playhead */}
                <ReferenceLine x={currentTime} stroke="#44403c" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Playhead Knob Visual */}
            {data.length > 0 && (
                <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-stone-800 z-10 pointer-events-none transition-none"
                    style={{ left: `${(currentTime / (data[data.length - 1].time || 1)) * 100}%` }}
                >
                    <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-stone-800 rounded-full shadow-md group-hover/chart:scale-125 transition-transform"></div>
                </div>
            )}
         </div>
      </div>
      
      {/* Legend */}
      <div className="mt-3 flex items-center justify-between text-xs text-stone-400 border-t border-stone-100 pt-3">
         <div className="flex space-x-4">
            <div className="flex items-center space-x-1.5">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span>No Event</span>
            </div>
            <div className="flex items-center space-x-1.5">
               <div className="w-2 h-2 rounded-full bg-red-500"></div>
               <span>Fall Event</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Timeline;
