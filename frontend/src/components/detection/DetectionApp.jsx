import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import Layout from "../Layout";
import "./DetectionApp.css";

const HAZARD_MAP = {
  fire: { type: "fire_detected", severity: "high" },
  smoke: { type: "fire_detected", severity: "high" },
  person: { type: "worker_in_area", severity: "low" },
  bottle: { type: "spill_detected", severity: "medium" },
  cup: { type: "spill_detected", severity: "medium" },
};

const ML_SERVICE_URL =
  import.meta.env.VITE_ML_SERVICE_URL || "http://localhost:8000";

const BBOX_COLORS = {
  fire: "#ff6600",
  smoke: "#666666",
  person: "#e53935",
  default: "#e53935",
};

function bboxColor(label) {
  return BBOX_COLORS[label] || BBOX_COLORS.default;
}

export default function DetectionApp() {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [detections, setDetections] = useState([]);
  const [storedIds, setStoredIds] = useState([]);
  const [storedImageUrl, setStoredImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [imgScale, setImgScale] = useState({ scaleX: 1, scaleY: 1 });
  const imgRef = useRef();

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImageUrl("");
    setPreviewUrl(URL.createObjectURL(file));
    setDetections([]);
    setStoredImageUrl("");
    setStatusMessage("");
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;

    setImgScale({
      scaleX: img.clientWidth / img.naturalWidth,
      scaleY: img.clientHeight / img.naturalHeight,
    });
  };

  useEffect(() => {
    handleImageLoad();
  }, [detections, previewUrl]);

  const scaleBbox = (bbox) => {
    const [x1, y1, x2, y2] = bbox;
    return {
      left: x1 * imgScale.scaleX,
      top: y1 * imgScale.scaleY,
      width: (x2 - x1) * imgScale.scaleX,
      height: (y2 - y1) * imgScale.scaleY,
    };
  };

  const handleDetect = async () => {
    if (!imageUrl && !selectedFile) {
      alert("Enter an image URL or upload a file");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      let response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        response = await fetch(`${ML_SERVICE_URL}/detect`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`${ML_SERVICE_URL}/detect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: imageUrl }),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Detection failed");
      }

      const data = await response.json();
      const found = data.detections || [];

      setDetections(found);
      setStoredIds(data.stored_ids || []);
      setStoredImageUrl(data.image_url || "");
      if (imageUrl) setPreviewUrl(imageUrl);

      if (found.length === 0) {
        setStatusMessage("Detection complete — no objects found in this image.");
      } else {
        setStatusMessage(
          `Detection complete — found ${found.length} object${found.length === 1 ? "" : "s"}.`
        );
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async () => {
    if (detections.length === 0) return;

    const top = detections.reduce((a, b) =>
      a.confidence > b.confidence ? a : b
    );
    const mapped = HAZARD_MAP[top.label] || {
      type: `${top.label}_detected`,
      severity: "medium",
    };

    setCreating(true);
    try {
      const result = await api.createIncident({
        detection_id: storedIds[0] || undefined,
        incident_type: mapped.type,
        severity: mapped.severity,
        confidence: top.confidence,
        bbox: top.bbox,
        image_url: storedImageUrl,
        location: "Detected via ML",
      });
      navigate(`/incidents/${result.data.id}`);
    } catch (err) {
      alert("Failed to create incident: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
    <div className="detection-container">
      <h2>Hazard Detection</h2>
      <p>Upload an image or paste a URL to run YOLOv8 detection.</p>

      <div className="input-container">
        <input
          type="text"
          placeholder="Enter image URL"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setSelectedFile(null);
            setPreviewUrl(e.target.value);
            setDetections([]);
            setStoredImageUrl("");
            setStatusMessage("");
          }}
        />
        <button onClick={handleDetect} disabled={loading}>
          {loading ? "Detecting..." : "Detect"}
        </button>
      </div>

      <div className="input-container">
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      {statusMessage && <p className="status-message">{statusMessage}</p>}

      {previewUrl && (
        <div className="image-wrapper">
          <img
            src={previewUrl}
            alt="To detect"
            ref={imgRef}
            onLoad={handleImageLoad}
          />
          {detections.map((d, i) => {
            const box = scaleBbox(d.bbox);
            return (
              <div
                key={i}
                className="bbox"
                style={{
                  left: box.left,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                  borderColor: bboxColor(d.label),
                  color: bboxColor(d.label),
                }}
              >
                {d.label} ({(d.confidence * 100).toFixed(1)}%)
              </div>
            );
          })}
        </div>
      )}

      {storedImageUrl && (
        <p>
          Stored in MinIO:{" "}
          <a href={storedImageUrl} target="_blank" rel="noreferrer">
            {storedImageUrl}
          </a>
        </p>
      )}

      {detections.length > 0 && (
        <div className="detections-list">
          <h3>Detections:</h3>
          <ul>
            {detections.map((d, i) => (
              <li key={i}>
                {d.label} — {(d.confidence * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-primary"
            onClick={handleCreateIncident}
            disabled={creating}
            style={{ marginTop: 12 }}
          >
            {creating ? "Creating..." : "Create Incident from Detection"}
          </button>
        </div>
      )}
    </div>
    </Layout>
  );
}
