import { useEffect, useState } from "react";
import socket from "../../services/socket";

export default function Waiting({ rideId }) {
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    socket.emit("ride:join", { rideId });

    socket.on("ride:update", (data) => {
      setResponses((prev) => [...prev, data]);
    });

    return () => socket.off("ride:update");
  }, [rideId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Captains Responding</h2>

      {responses.map((r, idx) => (
        <div key={idx} className="border p-3 mt-3 rounded">
          <p>Captain: {r.captainId}</p>
          <p>Status: {r.decision}</p>
          <p>Overlap: {r.overlap.toFixed(1)}%</p>
        </div>
      ))}
    </div>
  );
}
