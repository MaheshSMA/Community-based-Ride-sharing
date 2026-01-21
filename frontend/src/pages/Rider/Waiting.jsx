import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../../services/socket";
import ChatWindow from "../../components/Chat/ChatWindow";
import RideTrackingMap from "../../components/Map/RideTrackingMap";
import quickrideImg from "../../assets/quickride-share.png";

export default function Waiting() {
  const { rideId } = useParams();
  const [responses, setResponses] = useState([]);
  const [acceptedCaptain, setAcceptedCaptain] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("Rider");
  const [riderLocation, setRiderLocation] = useState(null);
  const [captainLocation, setCaptainLocation] = useState(null);
  const [riderRating, setRiderRating] = useState(4);
  const [captainRatings, setCaptainRatings] = useState({});

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

  const fetchCaptainRating = async (captainId) => {
    try {
      const response = await API.get(`/user/${captainId}`);
      setCaptainRatings(prev => ({
        ...prev,
        [captainId]: response.data.rating
      }));
    } catch (error) {
      console.error("Error fetching captain rating:", error);
    }
  };

  useEffect(() => {
    // Fetch rider's rating
    const fetchRiderRating = async () => {
      try {
        const response = await API.get(`/user/${userId}`);
        setRiderRating(response.data.rating);
      } catch (error) {
        console.error("Error fetching rider rating:", error);
      }
    };

    if (userId) {
      fetchRiderRating();
    }
  }, [userId]);


  // Get rider's current location and emit it
  useEffect(() => {
    if (!userId) return;
    if(!rideId) console.error("No rideId available for emitting rider location");

    // Get current location
    if (navigator.geolocation) {
      console.log("entered navigator.geolocation");
      console.log("rideId:", rideId);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setRiderLocation({ lat: latitude, lng: longitude });
          
          // Emit rider location to socket
          if (rideId) {
            socket.emit("rider:location", {
              rideId,
              userId,
              lat: latitude,
              lng: longitude,
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );

      // Update location every 5 seconds
      const locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setRiderLocation({ lat:12.9355559, lng: 77.5120187 });
            console.log("rider location updated:", { riderLocation: { lat: latitude, lng: longitude } });
            
            if (rideId) {
              socket.emit("rider:location", {
                rideId,
                userId,
                lat: latitude + 12.9757079,
                lng: longitude + 77.5728757,
              });
            }
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
      }, 5000);

      return () => clearInterval(locationInterval);
    }
  }, [userId, rideId]);

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

    // Listen for captain location updates
    socket.on("captain:location", (data) => {
      console.log("📍 Captain location updated:", data);
      setCaptainLocation({ lat: data.lat, lng: data.lng });
    });

    return () => {
      console.log("cleaning up waiting component");
      socket.off("ride:update");
      socket.off("captain:location");
    };
  }, [rideId, acceptedCaptain]);

  

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={quickrideImg}
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Captains Responding</h2>
          <p className="text-sm text-gray-600 mt-2">Ride ID: {rideId}</p>
          <p className="text-sm text-blue-600 mt-2 font-semibold">Your Rating: ⭐ {riderRating.toFixed(2)}</p>
        </div>

        {/* Show chat and map if captain accepted */}
        {acceptedCaptain && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Window */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Chat with Captain</h3>
              <ChatWindow
                rideId={rideId}
                captainId={acceptedCaptain}
                userId={userId}
                userName={userName}
                otherUserName="Captain"
              />
            </div>

            {/* Ride Tracking Map */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Ride Tracking</h3>
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <RideTrackingMap 
                  riderLocation={riderLocation} 
                  captainLocation={captainLocation} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Responses List */}
        {responses.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200">
            <p className="text-gray-600 text-center text-lg">Waiting for captains to respond...</p>
            <div className="mt-6 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Responses:</h3>
            <div className="space-y-3">
              {responses.map((r, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">Captain: {r.captainId}</p>
                    <p className="text-sm font-semibold text-yellow-600">⭐ {captainRatings[r.captainId]?.toFixed(2) || 'Loading...'}</p>
                  </div>
                  <p className={r.decision === "ACCEPTED" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    Status: {r.decision}
                  </p>
                  <p className="text-gray-700">Overlap: {r.overlap.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}