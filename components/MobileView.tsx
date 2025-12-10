import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, MapPin, List, Settings, UploadCloud, Video, Activity, AlertTriangle, LogOut, RefreshCw, Lock } from 'lucide-react';
import { User, PotholeReport } from '../types';
import { StorageService } from '../services/storage';

interface MobileViewProps {
  user: User;
  onLogout: () => void;
}

export const MobileView: React.FC<MobileViewProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'history' | 'map' | 'settings'>('camera');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden max-w-md mx-auto shadow-2xl relative">
      {/* Top Bar */}
      <div className="h-14 bg-gray-800 flex items-center justify-between px-4 shrink-0 z-10 shadow-md">
        <span className="font-bold text-lg tracking-wider text-indigo-400">ROADSENSE</span>
        <div className="flex items-center space-x-2">
          {isOffline && <span className="text-xs bg-red-600 px-2 py-1 rounded-full animate-pulse">OFFLINE</span>}
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative bg-black">
        {activeTab === 'camera' && <CameraScreen user={user} isOffline={isOffline} />}
        {activeTab === 'history' && <HistoryScreen user={user} />}
        {activeTab === 'map' && <MapScreen />}
        {activeTab === 'settings' && <SettingsScreen user={user} onLogout={onLogout} />}
      </div>

      {/* Bottom Navigation */}
      <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center justify-around shrink-0 pb-safe">
        <NavButton icon={Camera} label="Detect" active={activeTab === 'camera'} onClick={() => setActiveTab('camera')} />
        <NavButton icon={List} label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <NavButton icon={MapPin} label="Global" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
        <NavButton icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>
    </div>
  );
};

const NavButton = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-indigo-400' : 'text-gray-400'}`}>
    <Icon size={20} />
    <span className="text-[10px] uppercase font-medium">{label}</span>
  </button>
);

// --- Sub Screens ---

const CameraScreen = ({ user, isOffline }: { user: User; isOffline: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [fps, setFps] = useState(0);
  const [lastDetection, setLastDetection] = useState<any>(null);
  const [cameraError, setCameraError] = useState<React.ReactNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    
    // Check for Secure Context
    if (!window.isSecureContext) {
      setCameraError(
        <div className="text-center">
           <Lock size={32} className="mx-auto text-yellow-500 mb-2" />
           <p>Camera access requires a secure HTTPS connection or localhost.</p>
        </div>
      );
      return;
    }

    // Stop any existing streams first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
       setCameraError("Camera API is not supported in this browser.");
       return;
    }

    try {
      let stream: MediaStream | null = null;
      
      // Attempt 1: Try specifically for the environment (back) camera
      try {
        console.log("Attempting to access back camera...");
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false
        });
      } catch (err) {
        console.warn("Environment camera request failed, attempting fallback...", err);
      }

      // Attempt 2: If environment failed, try generic video (any available camera)
      if (!stream) {
        try {
          console.log("Attempting to access any camera...");
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false
          });
        } catch (err: any) {
          console.error("Generic video request failed", err);
          
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
             setCameraError(
               <div className="text-center">
                 <p className="mb-2">Camera permission was denied.</p>
                 <p className="text-xs text-gray-400">Please click the lock icon in your browser address bar and allow camera access.</p>
               </div>
             );
          } else if (err.name === 'NotFoundError') {
             setCameraError("No camera device found on this device.");
          } else {
             setCameraError(`Camera Error: ${err.message}`);
          }
          return;
        }
      }

      // Success
      if (stream) {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure video plays (some browsers require user interaction, but autoPlay usually works if muted)
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.error("Error playing video stream:", playErr);
          }
          
          videoRef.current.onloadedmetadata = () => {
             if (canvasRef.current && videoRef.current) {
               canvasRef.current.width = videoRef.current.videoWidth;
               canvasRef.current.height = videoRef.current.videoHeight;
             }
          };
        }
      }
    } catch (err: any) {
      setCameraError(`Unexpected Error: ${err.message}`);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Simulation of TF Lite Model Inference
  // NOTE: In a real app, you would load the .tflite model here using tfjs-tflite
  const detect = useCallback((time: number) => {
    if (!videoRef.current || !canvasRef.current || !isDetecting) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx && video.readyState === 4) {
      // Ensure canvas dimensions match video dimensions
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      // FPS Calculation
      const delta = time - lastTimeRef.current;
      setFps(Math.round(1000 / delta));
      lastTimeRef.current = time;

      // --- SIMULATED INFERENCE LOGIC START ---
      // Real implementation: const predictions = await model.detect(video);
      // We simulate a detection every ~2 seconds randomly for demo purposes
      if (Math.random() > 0.98) {
        const boxX = Math.random() * (canvas.width - 150);
        const boxY = Math.random() * (canvas.height - 150);
        const conf = 0.85 + Math.random() * 0.14;
        
        const newDetection = {
           bbox: [boxX, boxY, 150, 100],
           class: 'Pothole',
           score: conf
        };
        setLastDetection(newDetection);
        
        // Auto-save logic
        handleAutoSave(canvas.toDataURL('image/jpeg', 0.5), conf);
      }
      
      if (lastDetection) {
        // Draw Bounding Box
        ctx.strokeStyle = '#ef4444'; // Red-500
        ctx.lineWidth = 4;
        ctx.strokeRect(lastDetection.bbox[0], lastDetection.bbox[1], lastDetection.bbox[2], lastDetection.bbox[3]);
        
        // Draw Label Background
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(lastDetection.bbox[0], lastDetection.bbox[1] - 30, 140, 30);
        
        // Draw Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.fillText(`Pothole ${(lastDetection.score * 100).toFixed(0)}%`, lastDetection.bbox[0] + 5, lastDetection.bbox[1] - 8);
      }
      // --- SIMULATED INFERENCE LOGIC END ---
    }
    requestRef.current = requestAnimationFrame(detect);
  }, [isDetecting, lastDetection]);

  const handleAutoSave = async (imgData: string, confidence: number) => {
    // Throttling saves or one-off saves would happen here
    const report: PotholeReport = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      latitude: 40.7128, // Mock GPS
      longitude: -74.0060, // Mock GPS
      confidence: confidence,
      imageUrl: imgData,
      timestamp: Date.now(),
      synced: !isOffline
    };
    
    await StorageService.saveReport(report);
    // Flash effect or toast could go here
    console.log("Report saved");
  };

  useEffect(() => {
    if (isDetecting) {
      requestRef.current = requestAnimationFrame(detect);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setFps(0);
      setLastDetection(null);
    }
  }, [isDetecting, detect]);

  return (
    <div className="relative h-full w-full bg-black flex flex-col">
      {cameraError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-50 p-6 text-center">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <p className="text-white text-lg font-medium mb-2">Camera Unavailable</p>
          <div className="text-gray-400 mb-6">{cameraError}</div>
          <button 
            onClick={() => startCamera()}
            className="flex items-center px-6 py-3 bg-indigo-600 rounded-full text-white font-bold active:bg-indigo-700"
          >
            <RefreshCw size={20} className="mr-2" /> Retry Camera
          </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        </>
      )}
      
      {/* HUD */}
      {!cameraError && (
        <>
          <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded text-green-400 text-xs font-mono backdrop-blur-sm z-20">
            FPS: {fps}
          </div>
          
          <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded text-white text-xs font-mono backdrop-blur-sm z-20">
            CAM: AUTO
          </div>

          <div className="absolute bottom-8 w-full flex justify-center z-30 px-6">
            <button
              onClick={() => setIsDetecting(!isDetecting)}
              className={`w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-lg transition-transform transform active:scale-95 ${
                isDetecting 
                ? 'bg-red-500 border-red-700 animate-pulse' 
                : 'bg-white border-gray-300'
              }`}
            >
              {isDetecting ? (
                <div className="w-8 h-8 bg-white rounded-sm" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-500" />
              )}
            </button>
          </div>

          {!isDetecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10 pointer-events-none">
              <p className="text-white font-medium bg-black/60 px-4 py-2 rounded-lg">Tap Record to Start Detection</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const HistoryScreen = ({ user }: { user: User }) => {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StorageService.getUserReports(user.id).then((data) => {
      setReports(data.sort((a, b) => b.timestamp - a.timestamp));
      setLoading(false);
    });
  }, [user.id]);

  return (
    <div className="h-full bg-gray-50 text-gray-900 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <List className="mr-2" size={24} /> My Detections
      </h2>
      
      {loading ? (
        <div className="flex justify-center py-10 text-gray-500">Loading records...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm p-8">
          <Activity size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No potholes detected yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex gap-3">
               <img src={report.imageUrl} alt="Pothole" className="w-20 h-20 object-cover rounded bg-gray-200" />
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-red-600 text-sm">{(report.confidence * 100).toFixed(1)}% Confidence</h3>
                    <span className="text-xs text-gray-400">{new Date(report.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">Lat: {report.latitude.toFixed(4)}, Lon: {report.longitude.toFixed(4)}</p>
                  <div className="mt-2 flex items-center">
                     {report.synced ? (
                       <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center w-fit">
                         <UploadCloud size={10} className="mr-1" /> Synced
                       </span>
                     ) : (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded flex items-center w-fit">
                         <AlertTriangle size={10} className="mr-1" /> Pending
                       </span>
                     )}
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MapScreen = () => {
  return (
    <div className="h-full relative bg-gray-200">
      {/* Mock Map View */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 opacity-60 bg-[url('https://picsum.photos/seed/mapbg/800/600')] bg-cover">
        <div className="bg-white/90 p-6 rounded-xl shadow-lg text-center backdrop-blur-md max-w-xs">
           <MapPin size={48} className="mx-auto mb-2 text-indigo-600" />
           <h3 className="font-bold text-lg text-gray-800">Global Pothole Map</h3>
           <p className="text-sm mt-2 text-gray-600">
             For live maps, standard OpenStreetMap tiles are free and do not require an API key.
           </p>
           <p className="text-xs text-gray-500 mt-2">
             Example: https://tile.openstreetmap.org/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.png
           </p>
        </div>
      </div>
      
      {/* Floating Legend */}
      <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg shadow-md text-xs backdrop-blur text-gray-800">
        <h4 className="font-bold mb-1">Severity</h4>
        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-red-600"></div><span>Critical</span></div>
        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>High</span></div>
        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span>Medium</span></div>
      </div>
    </div>
  );
};

const SettingsScreen = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  return (
    <div className="h-full bg-gray-50 text-gray-900 p-4">
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <Settings className="mr-2" size={24} /> Settings
      </h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex items-center">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl mr-4 overflow-hidden">
             {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : user.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="p-4 bg-gray-50 text-xs text-gray-500">
          User ID: {user.id}
        </div>
      </div>

      <div className="space-y-3">
        <button className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between hover:bg-gray-50">
          <span className="font-medium">Sync Offline Data</span>
          <UploadCloud size={18} className="text-gray-400" />
        </button>
        <button className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between hover:bg-gray-50">
           <span className="font-medium">Model Information</span>
           <span className="text-xs text-gray-400">Roadsense v1.0.0</span>
        </button>
        <button onClick={onLogout} className="w-full bg-red-50 p-4 rounded-lg shadow-sm border border-red-100 flex items-center justify-between text-red-600 hover:bg-red-100 mt-8">
           <span className="font-bold">Log Out</span>
           <LogOut size={18} />
        </button>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-400">
        RoadSense App v1.0.0<br/>
        Final Year Project
      </div>
    </div>
  );
};