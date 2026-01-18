import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../../services/socket";
import ChatWindow from "../../components/Chat/ChatWindow";

export default function Waiting() {
  const { rideId } = useParams();
  const [responses, setResponses] = useState([]);
  const [acceptedCaptain, setAcceptedCaptain] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("Rider");

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.userId);
        // You might want to fetch user name from API
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!rideId) {
      console.error("No rideId in URL");
      return;
    }

    console.log("Waiting page mounted with rideId:", rideId);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("ride:join", { rideId });
    console.log("Joined ride room:", rideId);

    socket.on("ride:update", (data) => {
      console.log("✅ Received ride:update:", data);
      setResponses((prev) => {
        // Check for duplicates
        const exists = prev.some(r => r.captainId === data.captainId);
        if (exists) return prev;
        return [...prev, data];
      });

      // If accepted, set the accepted captain
      if (data.decision === "ACCEPTED" && !acceptedCaptain) {
        setAcceptedCaptain(data.captainId);
        console.log("✅ Captain accepted! Opening chat:", data.captainId);
      }
    });

    return () => {
      console.log("cleaning up waiting component");
      socket.off("ride:update");
    };
  }, [rideId, acceptedCaptain]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Captains Responding</h2>
      <p className="text-sm text-gray-500 mb-4">Ride ID: {rideId}</p>

      {/* Show chat if captain accepted */}
      {acceptedCaptain && (
        <div className="mb-6">
          <ChatWindow
            rideId={rideId}
            captainId={acceptedCaptain}
            userId={userId}
            userName={userName}
            otherUserName="Captain"
          />
        </div>
      )}

      {/* Responses List */}
      {responses.length === 0 ? (
        <div className="mt-4">
          <p className="text-gray-500">Waiting for captains to respond...</p>
          <div className="mt-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-3">Responses:</h3>
          {responses.map((r, idx) => (
            <div key={idx} className="border p-3 mt-3 rounded">
              <p className="font-semibold">Captain: {r.captainId}</p>
              <p className={r.decision === "ACCEPTED" ? "text-green-600" : "text-red-600"}>
                Status: {r.decision}
              </p>
              <p>Overlap: {r.overlap.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}