import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [error, setError] = useState(null);

  // Initialize camera when component mounts
  useEffect(() => {
    // Check if we're in a browser environment and if the API is available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Get list of available cameras
      async function getDevices() {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setAvailableCameras(videoDevices);
          
          if (videoDevices.length > 0) {
            setSelectedCamera(videoDevices[0].deviceId);
          }
        } catch (err) {
          setError('Failed to enumerate devices: ' + err.message);
        }
      }
      
      getDevices();
    } else {
      setError('Camera access is not supported in this browser or environment');
    }
  }, []);

  // Start camera when user clicks the button
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: 'environment', // Prefer back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setHasPermission(true);
      }
    } catch (err) {
      setError('Error accessing camera: ' + err.message);
      setHasPermission(false);
    }
  };

  // Stop the camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // Take a picture
  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const { videoWidth, videoHeight } = videoRef.current;
      
      // Set canvas dimensions to match video
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
      
      // Convert canvas to data URL
      const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
      
      // Call the callback with the image data
      onCapture(imageDataUrl);
      
      // Stop camera after capture (optional)
      // stopCamera();
    }
  };

  // Switch camera
  const handleCameraChange = (e) => {
    const newCameraId = e.target.value;
    setSelectedCamera(newCameraId);
    
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}
      
      {/* Camera selection dropdown */}
      {availableCameras.length > 1 && (
        <select 
          value={selectedCamera} 
          onChange={handleCameraChange}
          className="p-2 border rounded"
        >
          {availableCameras.map(camera => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
            </option>
          ))}
        </select>
      )}
      
      {/* Video preview */}
      <div className="relative bg-black rounded overflow-hidden w-full max-w-md">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`w-full ${!isCameraActive ? 'hidden' : ''}`}
        />
        
        {!isCameraActive && (
          <div className="flex items-center justify-center w-full h-64 bg-gray-200">
            <p>Camera preview will appear here</p>
          </div>
        )}
      </div>
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera controls */}
      <div className="flex gap-4">
        {!isCameraActive ? (
          <button 
            onClick={startCamera} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start Camera
          </button>
        ) : (
          <>
            <button 
              onClick={takePicture} 
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Take Picture
            </button>
            <button 
              onClick={stopCamera} 
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Stop Camera
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;