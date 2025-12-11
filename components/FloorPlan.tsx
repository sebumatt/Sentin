import React from 'react';
import { Frame, Cpu } from 'lucide-react';
import { PathPoint } from '../types';

interface FloorPlanProps {
  currentPathPoint: PathPoint | null;
  videoThumbnail: string | null;
  generatedFloorPlan: string | null;
}

const FloorPlan: React.FC<FloorPlanProps> = ({ currentPathPoint, videoThumbnail, generatedFloorPlan }) => {
  // Use the generated plan if available, otherwise fallback to the raw thumbnail
  const displayImage = generatedFloorPlan || videoThumbnail;

  return (
    <div className="bg-[#Fdfcf8] border border-[#e5e2da] rounded-3xl p-4 flex flex-col h-full shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-center mb-2 z-10">
        <div>
            <h3 className="text-stone-800 font-semibold text-lg">Resident Status</h3>
            <p className="text-[10px] text-stone-400 font-medium tracking-wide uppercase">Live Tracking</p>
        </div>
        {generatedFloorPlan && (
           <div className="flex items-center space-x-1 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
             <Cpu size={10} className="text-purple-600" />
             <span className="text-[8px] font-bold text-purple-700 tracking-tighter uppercase">Gemini Robotics-ER 1.5</span>
           </div>
        )}
      </div>

      <div className="flex-1 relative bg-stone-100/50 rounded-2xl overflow-hidden flex items-center justify-center border border-stone-200/50 group">
        {displayImage ? (
          <>
            <img 
              src={displayImage} 
              alt="Floor Layout" 
              className={`w-full h-full object-fill transition-all duration-700 ${generatedFloorPlan ? 'opacity-90 grayscale contrast-125' : 'opacity-60 blur-[2px]'}`} 
            />
            
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            {/* Tracked Person Indicator */}
            {currentPathPoint && (
              <div 
                className="absolute w-6 h-6 z-20 transition-all duration-300 ease-linear flex items-center justify-center"
                style={{
                  left: `${currentPathPoint.x}%`,
                  top: `${currentPathPoint.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Person Pulse */}
                <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-40"></div>
                {/* Person Core */}
                <div className="relative w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg shadow-orange-500/50"></div>
                
                {/* Tracking Line Effect (Optional visual flair) */}
                <div className="absolute w-[200px] h-[1px] bg-gradient-to-r from-transparent via-orange-400/20 to-transparent rotate-90 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute w-[200px] h-[1px] bg-gradient-to-r from-transparent via-orange-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-6 opacity-50">
            <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
                <Frame size={24} />
            </div>
            <p className="text-stone-500 text-sm font-medium">Waiting for Video</p>
            <p className="text-stone-400 text-xs mt-1">Auto-generating 2D layout...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlan;