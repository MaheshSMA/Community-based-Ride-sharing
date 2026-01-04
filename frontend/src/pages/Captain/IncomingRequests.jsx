import { useEffect, useState } from "react";
import socket from "../../services/socket";

export default function IncomingRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    socket.on("ride:request", (data) => {
      setRequests((prev) => [...prev, data]);
    });

    return () => socket.off("ride:request");
  }, []);

  const respond = (rideId, decision, overlap) => {
    socket.emit("ride:decision", {
      rideId,
      captainId: JSON.parse(
        atob(localStorage.getItem("token").split(".")[1])
      ).userId,
      decision,
      overlap,
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Incoming Ride Requests</h2>

      {requests.map((r) => (
        <div
          key={r.rideId}
          className="border p-4 rounded-lg shadow"
        >
          <p>Overlap: {r.overlap.toFixed(1)}%</p>
          <p>Seats needed: {r.seatsRequired}</p>

          <div className="flex gap-3 mt-3">
            <button
              onClick={() => respond(r.rideId, "ACCEPTED", r.overlap)}
              className="bg-green-600 text-white px-4 py-1 rounded"
            >
              Accept
            </button>

            <button
              onClick={() => respond(r.rideId, "REJECTED", r.overlap)}
              className="bg-red-600 text-white px-4 py-1 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
