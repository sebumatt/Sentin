import React, { useRef, useState, useEffect } from 'react';
import { Upload, Play, Pause, AlertCircle, Loader2, Scan, RotateCcw } from 'lucide-react';
import { analyzeVideo } from '../services/geminiService';
import { AnalysisResult } from '../types';
import { generateVoiceAlert, playAudioBuffer, initializeAudio } from '../services/ttsService';

interface VideoMonitorProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  onTimeUpdate: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  currentEvent: string | null;
  seekTo?: number | null;
}

const VideoMonitor: React.FC<VideoMonitorProps> = ({ 
  onAnalysisComplete, 
  onTimeUpdate, 
  onDurationChange,
  currentEvent,
  seekTo
}) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [localAnalysis, setLocalAnalysis] = useState<AnalysisResult | null>(null);
  const [hasEnded, setHasEnded] = useState(false);
  
  // Track if we have already played the audio alert for the current fall event to avoid looping
  const hasPlayedFallAlert = useRef(false);
  // Cache the generated audio buffer so we don't call the API again on replay
  const cachedAudioBuffer = useRef<AudioBuffer | null>(null);
  // Track the currently playing audio source to stop it if needed
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopAudio = () => {
    if (audioSourceRef.current) {
        try {
            audioSourceRef.current.stop();
        } catch (e) {
            // Ignore if already stopped
        }
        audioSourceRef.current = null;
        // Restore volume immediately if we cut the audio short
        if (videoRef.current) videoRef.current.volume = 1.0;
    }
  };

  // Handle external seek requests
  useEffect(() => {
    if (seekTo !== null && seekTo !== undefined && videoRef.current) {
        if (Math.abs(videoRef.current.currentTime - seekTo) > 0.1) {
            videoRef.current.currentTime = seekTo;
            // Stop audio if we scrub, as we might scrub past the event
            stopAudio();
            if (hasEnded) setHasEnded(false);
        }
    }
  }, [seekTo]);

  // TTS Trigger Logic
  useEffect(() => {
    // Only trigger if we have a detected FALL event and haven't played it yet for this occurrence
    if (currentEvent === 'FALL' && !hasPlayedFallAlert.current) {
        const playAlert = async () => {
            hasPlayedFallAlert.current = true; // Mark as played immediately
            
            // Play from cache (PRE-GENERATED during analysis)
            if (cachedAudioBuffer.current) {
                console.log("Playing cached fall alert...");
                
                // Stop any existing audio first
                stopAudio();

                // Duck video volume
                if (videoRef.current) videoRef.current.volume = 0.2;
                
                const source = await playAudioBuffer(cachedAudioBuffer.current);
                if (source) {
                    audioSourceRef.current = source;
                    
                    // If video was paused while we were awaiting, stop immediately
                    if (videoRef.current && videoRef.current.paused) {
                        stopAudio();
                    }

                    // Restore volume when audio finishes naturally
                    source.onended = () => {
                         if (videoRef.current) videoRef.current.volume = 1.0;
                         audioSourceRef.current = null;
                    };
                }
            } else {
                console.log("No cached audio available for this fall event.");
            }
        };
        playAlert();
    } else if (currentEvent !== 'FALL') {
        // Reset the flag when the event clears so it can trigger again on a re-play or loop
        hasPlayedFallAlert.current = false;
    }
  }, [currentEvent]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Stop previous audio if any
    stopAudio();

    // Initialize audio on user interaction (upload)
    initializeAudio();

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setIsPlaying(false);
    setHasEnded(false);
    setLocalAnalysis(null);
    hasPlayedFallAlert.current = false;
    cachedAudioBuffer.current = null; // Clear audio cache for new video

    setIsAnalyzing(true);
    setAnalysisPhase('Initializing Gemini Vision...');

    try {
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const videoBase64 = (reader.result as string).split(',')[1];
        
        setAnalysisPhase('Identifying environmental hazards...');
        
        try {
          // 1. Perform Video Analysis
          const analysisResult = await analyzeVideo(videoBase64, file.type);
          
          // 2. Pre-generate Audio for FALL events (if any)
          // This ensures the audio is ready in memory before we start playing
          const fallEvent = analysisResult.events.find(e => e.type === 'FALL');
          
          if (fallEvent) {
             setAnalysisPhase('Generating Emergency Alert Audio...');
             const alertText = `Urgent. Fall detected. ${fallEvent.description}`;
             try {
                const buffer = await generateVoiceAlert(alertText);
                if (buffer) {
                    cachedAudioBuffer.current = buffer;
                }
             } catch (e) {
                console.error("Failed to pre-generate audio", e);
             }
          }

          // 3. Complete Setup & Auto-play
          setAnalysisPhase('Finalizing Analysis...');
          setLocalAnalysis(analysisResult); 
          onAnalysisComplete(analysisResult);
          
          if (videoRef.current) {
               videoRef.current.play();
               setIsPlaying(true);
          }
        } catch (err) {
          console.error(err);
          alert("Analysis failed. Please try again.");
        } finally {
          setIsAnalyzing(false);
          setAnalysisPhase('');
        }
      };
      
      reader.readAsDataURL(file);

    } catch (error) {
      console.error("Setup failed", error);
      setIsAnalyzing(false);
    }
  };

  const togglePlay = () => {
    // Prevent playback interaction during analysis
    if (isAnalyzing) return;

    // Initialize audio on user interaction (play click)
    initializeAudio();

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        stopAudio(); // Stop alerts if user pauses
      } else {
        videoRef.current.play();
        setHasEnded(false);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setHasEnded(true);
    stopAudio(); // Stop alerts when video ends
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && onDurationChange) {
        onDurationChange(videoRef.current.duration);
    }
  };

  return (
    <div className="relative h-full w-full bg-stone-900 rounded-3xl overflow-hidden shadow-md group border border-stone-800">
      
      {/* Visual Alarm Overlay (Blinking Red Effect) */}
      {currentEvent === 'FALL' && (
        <div className="absolute inset-0 z-40 pointer-events-none animate-pulse bg-red-500/20 mix-blend-overlay ring-[12px] ring-inset ring-red-500/50">
           <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_60%,rgba(220,38,38,0.5)_100%)]"></div>
        </div>
      )}

      {/* Analysis Status Tab (Top Left) */}
      {(isAnalyzing || analysisPhase) && (
        <div className="absolute top-4 left-4 z-50">
           <div className="bg-stone-900/80 backdrop-blur-md border border-stone-700/50 text-white pl-3 pr-4 py-2 rounded-xl flex items-center shadow-xl space-x-3">
              {isAnalyzing ? (
                 <Loader2 className="animate-spin text-purple-400" size={18} />
              ) : (
                 <Scan className="text-emerald-400" size={18} />
              )}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                  {isAnalyzing ? 'Processing' : 'Active'}
                </span>
                <span className="text-xs font-medium block">
                  {analysisPhase || 'Monitoring'}
                </span>
              </div>
           </div>
        </div>
      )}

      {/* Video Player */}
      <div className="relative w-full h-full">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnded}
            playsInline
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 bg-[#1c1c1e]">
            <div 
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              className={`cursor-pointer flex flex-col items-center hover:text-stone-300 transition group/upload ${isAnalyzing ? 'pointer-events-none opacity-50' : ''}`}
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-stone-800 rounded-full flex items-center justify-center mb-3 group-hover/upload:scale-110 transition-transform">
                  <Upload size={24} className="opacity-70" />
              </div>
              <p className="text-sm md:text-lg font-medium text-stone-300">Upload Video</p>
              <p className="text-xs opacity-60 mt-1 max-w-[150px] text-center hidden md:block">
                Analyze movement & detect falls.
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="video/*"
        onChange={handleFileUpload}
        disabled={isAnalyzing}
      />

      {/* AI Overlay: Detected Event Alert (Top Right) */}
      {currentEvent && (
        <div className="absolute top-4 right-4 flex items-center space-x-3 animate-in fade-in zoom-in duration-300 z-50">
           <div className={`
             backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border-2
             ${currentEvent === 'FALL' ? 'bg-red-500/90 border-red-400' : 'bg-orange-500/90 border-orange-400'}
           `}>
             <AlertCircle className="animate-pulse w-6 h-6 shrink-0" />
             <div>
                <span className="font-bold text-lg block tracking-tight">{currentEvent}</span>
                <span className="text-xs opacity-90 font-medium">Confidence: 98%</span>
             </div>
           </div>
        </div>
      )}

      {/* Playback Controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex justify-between items-end transition-opacity duration-300 z-50 ${hasEnded || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="flex space-x-3">
          <button 
            onClick={togglePlay}
            disabled={isAnalyzing}
            className={`w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 text-white border border-white/10 transition hover:scale-105 active:scale-95 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {hasEnded ? <RotateCcw size={16} /> : (isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />)}
          </button>
          
          <button 
             onClick={() => !isAnalyzing && fileInputRef.current?.click()}
             disabled={isAnalyzing}
             className={`w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 text-white border border-white/10 transition hover:scale-105 active:scale-95 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
             title="Upload New Video"
          >
             <Upload size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoMonitor;