import React, { useState, useRef } from "react";
import "./DetectionApp.css";

export default function DetectionApp() {
  const [imageUrl, setImageUrl] = useState("");
  const [detections, setDetections] = useState([]);
  const imgRef = useRef();

  const handleDetect = async () => {
    if (!imageUrl) return alert("Please enter an image URL");

    try {
      const res = await fetch(
        (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/detect",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: imageUrl }),
        }
      );
      const data = await res.json();
      if (data.ok) setDetections(data.detections.detections || []);
      else alert("Detection failed");
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="detection-container">
      <h1>SafeSight AI — Detection</h1>

      <div className="input-container">
        <input
          type="text"
          placeholder="Enter image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <button onClick={handleDetect}>Detect</button>
      </div>

      {imageUrl && (
        <div className="image-wrapper">
          <img src={imageUrl} alt="To detect" ref={imgRef} />
          {detections.map((d, i) => {
            const [x1, y1, x2, y2] = d.bbox;
            const width = x2 - x1;
            const height = y2 - y1;
            return (
              <div
                key={i}
                className="bbox"
                style={{
                  left: x1,
                  top: y1,
                  width,
                  height,
                }}
              >
                {d.label} ({(d.confidence * 100).toFixed(1)}%)
              </div>
            );
          })}
        </div>
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
        </div>
      )}
    </div>
  );
}
