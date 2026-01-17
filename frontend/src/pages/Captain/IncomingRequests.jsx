import { useEffect, useState } from "react";
import socket from "../../services/socket";

export default function IncomingRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    console.log("🔵 IncomingRequests: useEffect started");
    console.log("🔵 Socket connected status:", socket.connected);
    console.log("🔵 Socket ID:", socket.id);


    const setupConnection = () => {
      if (!socket.connected) {
        console.log("🔵 Socket not connected, connecting...");
        socket.connect();
        
        // Wait for connection event
        socket.once("connect", () => {
          console.log("✅ Socket connected! ID:", socket.id);
          setupListeners();
          joinCaptainRoom();
        });
      } else {
        console.log("✅ Socket already connected");
        setupListeners();
        joinCaptainRoom();
      }
    };

    // Step 2: Join captain room
    const joinCaptainRoom = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No token found");
        return;
      }

      try {
        const captainId = JSON.parse(atob(token.split(".")[1])).userId;
        console.log("🔵 Joining captain room with ID:", captainId);
        console.log("🔵 Captain ID type:", typeof captainId);
        
        socket.emit("captain:join", { captainId }, (ack) => {
          console.log("✅ Captain join acknowledgment:", ack);
        });
      } catch (error) {
        console.error("❌ Error parsing token:", error);
      }
    };

    // Step 3: Set up listeners
    const setupListeners = () => {
      console.log("🔵 Setting up socket listeners...");
      
      // Remove any existing listeners first to avoid duplicates
      socket.off("ride:request");
      
      // Set up the listener
      socket.on("ride:request", (data) => {
        console.log("✅✅✅ RECEIVED RIDE REQUEST:", data);
        setRequests((prev) => [...prev, data]);
      });

      // Debug: Listen to all events
      socket.onAny((eventName, ...args) => {
        console.log("📨 Socket event received:", eventName, args);
      });

      // Connection status listeners
      socket.on("connect", () => {
        console.log("✅ Socket connected event fired");
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socket.on("error", (error) => {
        console.error("❌ Socket error:", error);
      });
    };

    setupConnection();


    

    // socket.on("ride:request", (data) => {
    //   console.log("Received ride request:", data);
    //   setRequests((prev) => [...prev, data]);
    // });

    


    return () => {
      console.log("🔵 Cleaning up IncomingRequests");
      socket.off("ride:request");
      socket.offAny();
    };

    // socket.on("ride:request", (data) => {
    //   setRequests((prev) => [...prev, data]);
    // });

    // console.log(requests);

    // return () => socket.off("ride:request");
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
