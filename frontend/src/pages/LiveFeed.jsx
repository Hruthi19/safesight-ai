import React, { useCallback, useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import "./LiveFeed.css";

const ML_SERVICE_URL =
  import.meta.env.VITE_ML_SERVICE_URL || "http://localhost:8000";

export default function LiveFeed() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [active, setActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [processingVideo, setProcessingVideo] = useState(false);

  const captureAndDetect = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    setScanning(true);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setScanning(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        const response = await fetch(`${ML_SERVICE_URL}/detect`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Detection failed");

        const data = await response.json();
        setLastResult(data);

        if (data.detections?.length > 0) {
          setAlerts((prev) => [
            ...prev,
            {
              time: new Date().toLocaleTimeString(),
              count: data.detections.length,
              labels: data.detections.map((d) => d.label).join(", "),
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setScanning(false);
      }
    }, "image/jpeg", 0.85);
  }, []);

  const startWebcam = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActive(true);

      intervalRef.current = setInterval(captureAndDetect, 5000);
    } catch (err) {
      setError("Camera access denied or unavailable.");
    }
  };

  const stopWebcam = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
  };

  const processVideo = async () => {
    if (!videoFile) return;
    setProcessingVideo(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", videoFile);

      const response = await fetch(`${ML_SERVICE_URL}/detect/video`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Video processing failed");
      }

      const data = await response.json();
      setLastResult(data);

      if (data.incidents?.length > 0) {
        setAlerts((prev) => [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            count: data.incidents.length,
            labels: data.incidents.map((i) => i.incident_type).join(", "),
            clip: data.clip_url,
          },
        ]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingVideo(false);
    }
  };

  useEffect(() => {
    return () => stopWebcam();
  }, []);

  return (
    <Layout>
      <div className="live-feed">
        <div className="page-header">
          <div>
            <h2>Live Feed</h2>
            <p>Webcam scanning or upload a video for hazard detection</p>
          </div>
          <span className={`live-status ${active ? "active" : ""}`}>
            {active ? "● Scanning" : "○ Inactive"}
          </span>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="live-grid">
          <div className="live-panel">
            <h3>Webcam Stream</h3>
            <div className="video-container">
              <video ref={videoRef} autoPlay playsInline muted />
              {scanning && <div className="scan-overlay">Analyzing frame...</div>}
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <div className="live-controls">
              {!active ? (
                <button type="button" className="btn-primary" onClick={startWebcam}>
                  Start Live Scan
                </button>
              ) : (
                <button type="button" className="btn-secondary" onClick={stopWebcam}>
                  Stop
                </button>
              )}
              {active && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={captureAndDetect}
                  disabled={scanning}
                >
                  Scan Now
                </button>
              )}
            </div>
            <p className="hint">Auto-scans every 5 seconds when live</p>
          </div>

          <div className="live-panel">
            <h3>Upload Video</h3>
            <input type="file" accept="video/*" onChange={handleVideoUpload} />
            {videoFile && <p className="hint">Selected: {videoFile.name}</p>}
            <button
              type="button"
              className="btn-primary"
              onClick={processVideo}
              disabled={!videoFile || processingVideo}
              style={{ marginTop: 12 }}
            >
              {processingVideo ? "Processing..." : "Detect Hazards in Video"}
            </button>
            <p className="hint">
              Extracts a 20s clip around the first hazard found
            </p>
          </div>
        </div>

        {lastResult && (
          <div className="live-results">
            <h3>Latest Detection</h3>
            {lastResult.image_url && (
              <img src={lastResult.image_url} alt="Detection snapshot" />
            )}
            {lastResult.clip_url && (
              <video src={lastResult.clip_url} controls className="clip-preview" />
            )}
            {lastResult.detections?.length > 0 && (
              <ul>
                {lastResult.detections.map((d, i) => (
                  <li key={i}>
                    {d.label} — {(d.confidence * 100).toFixed(1)}%
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {alerts.length > 0 && (
          <div className="live-alerts">
            <h3>Detection Log</h3>
            <ul>
              {alerts.slice(-10).reverse().map((a, i) => (
                <li key={i}>
                  [{a.time}] {a.labels} ({a.count} detection{a.count > 1 ? "s" : ""})
                  {a.clip && (
                    <>
                      {" "}
                      — <a href={a.clip} target="_blank" rel="noreferrer">clip</a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}
