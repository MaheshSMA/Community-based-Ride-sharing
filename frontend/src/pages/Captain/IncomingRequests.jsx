import { useEffect, useState } from "react";
import socket from "../../services/socket";
import ChatWindow from "../../components/Chat/ChatWindow";


export default function IncomingRequests() {
  const [requests, setRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { rideId, riderId }
  const [captainId, setCaptainId] = useState(null); // Add this line


  useEffect(() => {
    
    const setupConnection = () => {
      if (!socket.connected) {
        // console.log("🔵 Socket not connected, connecting...");
        socket.connect();
        
        // Wait for connection event
        socket.once("connect", () => {
          // console.log("✅ Socket connected! ID:", socket.id);
          setupListeners();
          joinCaptainRoom();
        });
      } else {
        // console.log("✅ Socket already connected");
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
        // console.log("🔵 Joining captain room with ID:", captainId);
        // console.log("🔵 Captain ID type:", typeof captainId);
        
        socket.emit("captain:join", { captainId }, (ack) => {
          console.log("✅ Captain join acknowledgment:", ack);
        });
      } catch (error) {
        console.error("❌ Error parsing token:", error);
      }
    };

    // Step 3: Set up listeners
    const setupListeners = () => {
      // console.log("🔵 Setting up socket listeners...");
      
      // Remove any existing listeners first to avoid duplicates
      socket.off("ride:request");
      
      // Set up the listener
      socket.on("ride:request", (data) => {
        // console.log("✅✅✅ RECEIVED RIDE REQUEST:", data);
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
    console.log("entered respond");
    console.log("🔵 respond() called with:", { rideId, decision, overlap });
    
    // Check socket connection status
    console.log("🔵 Socket connected:", socket.connected);
    console.log("🔵 Socket ID:", socket.id);
    
    // Extract captainId
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token found in respond()");
      return;
    }
    
    let captainId;
    try {
      captainId = JSON.parse(atob(token.split(".")[1])).userId;
      setCaptainId(captainId); // Store captainId in state
      console.log("🔵 Captain ID extracted:", captainId);
    } catch (error) {
      console.error("❌ Error parsing token in respond():", error);
      return;
    }
    
    const eventData = {
      rideId,
      captainId,
      decision,
      overlap,
    };
    
    console.log("📤 Emitting ride:decision event with data:", eventData);
    
    // Emit the event
    socket.emit("ride:decision", eventData, (ack) => {
      console.log("✅ ride:decision acknowledgment received:", ack);

      // If accepted, open chat
    if (decision === "ACCEPTED") {
      console.log("accepted on the captain side, opening the chat window");
      setActiveChat({ rideId, captainId }); // You might need riderId from request
    }
    });
    
    
    console.log("📤 Event emitted (waiting for acknowledgment...)");
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Incoming Ride Requests</h2>

      {/* ✅ Chat Window - Show at top when active */}
      {activeChat && captainId && (
        <div className="mb-6 border rounded-lg p-4 bg-white shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg">Active Chat</h3>
            <button
              onClick={() => setActiveChat(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Close
            </button>
          </div>
          <ChatWindow
            rideId={activeChat.rideId}
            captainId={activeChat.captainId}
            userId={captainId}
            userName="Captain"
            otherUserName="Rider"
          />
        </div>
      )}

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
