import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../../services/socket";
import ChatWindow from "../../components/Chat/ChatWindow";
import RideTrackingMap from "../../components/Map/RideTrackingMap";
import quickrideImg from "../../assets/quickride-share.png";
import API from "../../services/api";


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
  const [rideEnded, setRideEnded] = useState(false); // Track if ride has ended
  const [showRatingModal, setShowRatingModal] = useState(false); // Show/hide rating modal
  const [rating, setRating] = useState(5); // Selected rating
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.userId);
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

  useEffect(() => {
    if (!userId) return;
    if(!rideId) console.error("No rideId available for emitting rider location");

    if (navigator.geolocation) {
      console.log("entered navigator.geolocation");
      console.log("rideId:", rideId);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setRiderLocation({ lat: latitude, lng: longitude });
          
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

      const locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setRiderLocation({ lat: latitude, lng: longitude });
            console.log("rider location updated:", { riderLocation: { lat: latitude, lng: longitude } });
            
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
        const exists = prev.some(r => r.captainId === data.captainId);
        if (exists) return prev;
        return [...prev, data];
      });

      if (data.decision === "ACCEPTED" && !acceptedCaptain) {
        setAcceptedCaptain(data.captainId);
        console.log("✅ Captain accepted! Opening chat:", data.captainId);
      }
    });

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

  const handleEndRide = () => {
    setRideEnded(true);
    console.log("Ride ended");
  };

  const handleRateClick = () => {
    setShowRatingModal(true);
    
  };

  const handleSubmitRating = async () => {
    try {
      navigate("/rider/request");
      
      console.log(`✅ Rated captain ${acceptedCaptain} with ${rating} stars`);
      setShowRatingModal(false);
      // Optionally show success message
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

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

              <div className="flex flex-col gap-3 mt-4">
                <button className="w-full bg-blue-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all duration-200">
                  Start Ride
                </button>

                <button 
                  onClick={handleEndRide}
                  className="w-full bg-orange-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 transition-all duration-200"
                >
                  End Ride
                </button>

                {/* Rate Captain Button - Only show after ride ends */}
                {rideEnded && (
                  <button 
                    onClick={handleRateClick}
                    className="w-full bg-yellow-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 transition-all duration-200"
                  >
                    ⭐ Rate the Captain
                  </button>
                )}
              </div>
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

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Rate the Captain</h3>
            <p className="text-gray-600 mb-6">How was your ride experience?</p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-all duration-200 ${
                    star <= rating ? "text-yellow-400" : "text-gray-300"
                  } hover:text-yellow-400`}
                >
                  ★
                </button>
              ))}
            </div>

            <p className="text-center text-lg font-semibold text-gray-900 mb-6">
              {rating} Star{rating !== 1 ? 's' : ''}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 bg-gray-300 text-gray-900 font-semibold px-4 py-3 rounded-lg hover:bg-gray-400 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                className="flex-1 bg-blue-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}