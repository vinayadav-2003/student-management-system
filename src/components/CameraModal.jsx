import { useEffect, useRef, useState, useCallback } from 'react';

function CameraModal({ isOpen, onClose, onCapture }) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedImg, setCapturedImg] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    setError(null);
    setCapturedImg(null);
    setIsCameraActive(false);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check your camera permissions or connection.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => {
    if (videoRef.current && stream && isCameraActive) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
      });
    }
  }, [stream, isCameraActive]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    context.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImg(dataUrl);

    stopCamera();
  };

  const handleUsePhoto = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `student_photo_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onCapture(file);
        onClose();
      } else {
        setError("Failed to process image blob.");
      }
    }, 'image/jpeg', 0.9);
  };

  const handleRetake = () => {
    void startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="camera-modal-backdrop">
      <div className="camera-modal-content">
        <div className="camera-modal-header">
          <h5 className="modal-title text-white">Capture Student Photo</h5>
          <button type="button" className="btn-close-custom" onClick={onClose}>&times;</button>
        </div>

        <div className="camera-modal-body">
          <div className="viewfinder-wrapper">
            {error && (
              <div className="camera-error-container">
                <span className="error-icon">⚠️</span>
                <p className="error-text">{error}</p>
                <button type="button" className="btn btn-secondary mt-3" onClick={startCamera}>
                  Retry Connection
                </button>
              </div>
            )}

            {!error && isCameraActive && (
              <div className="video-container">
                <video ref={videoRef} className="video-feed" playsInline muted />
                <div className="viewfinder-overlay">
                  <div className="viewfinder-corners"></div>
                </div>
              </div>
            )}

            {!error && !isCameraActive && capturedImg && (
              <div className="preview-container">
                <img src={capturedImg} alt="Captured preview" className="captured-preview-img" />
                <span className="badge-preview">Captured Preview</span>
              </div>
            )}
          </div>

          {/* Hidden canvas for capture processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="camera-modal-footer">
          {isCameraActive && (
            <div className="d-flex justify-content-center w-100">
              <button
                type="button"
                className="btn-shutter"
                onClick={handleCapture}
                title="Capture Photo"
              >
                <span className="shutter-inner"></span>
              </button>
            </div>
          )}

          {!isCameraActive && capturedImg && (
            <div className="d-flex justify-content-center gap-3 w-100">
              <button
                type="button"
                className="btn btn-warning"
                onClick={handleRetake}
              >
                🔄 Retake
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleUsePhoto}
              >
                ✔️ Use Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CameraModal;
