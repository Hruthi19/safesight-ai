import React from "react";
import { useEffect, useState } from "react";

function Dashboard() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/incidents")
      .then((res) => res.json())
      .then((data) => setIncidents(data.data));
  }, []);

  return (
    <div>
      <h1>Incident Dashboard</h1>

      {incidents.map((i) => (
        <div key={i.id}>
          <p>{i.type}</p>
          <p>{i.location}</p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;