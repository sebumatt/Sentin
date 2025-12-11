
import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { AnalysisResult } from '../types';

interface AlertsPanelProps {
  analysis: AnalysisResult | null;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ analysis }) => {
  const hazards = analysis?.hazards || [];

  return (
    <div className="bg-[#Fdfcf8] border border-[#e5e2da] rounded-3xl p-5 flex flex-col h-full shadow-sm overflow-y-auto">
      <div className="flex items-center space-x-2 mb-4">
        <ShieldAlert size={20} className="text-stone-700" />
        <h3 className="text-stone-800 font-semibold text-lg">Alerts & Risks</h3>
      </div>

      <div className="flex-1">
        <div className="mb-3">
             <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Environmental Hazards</h4>
        </div>

        {hazards.length > 0 ? (
            <div className="space-y-3">
                {hazards.map((hazard, idx) => (
                    <div key={idx} className="bg-stone-50 px-4 py-3 rounded-xl border border-stone-100 flex items-center justify-between shadow-sm">
                        <span className="text-sm font-medium text-stone-800 capitalize">{hazard.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide min-w-[60px] text-center ${
                            hazard.riskLevel === 'High' ? 'bg-red-100 text-red-700' : 
                            hazard.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700' : 
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                            {hazard.riskLevel}
                        </span>
                    </div>
                ))}
            </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 opacity-60">
                <ShieldAlert size={32} className="mb-2" />
                <p className="text-sm">Scanning room environment...</p>
                <p className="text-xs mt-1">Video analysis will identify trip hazards.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
