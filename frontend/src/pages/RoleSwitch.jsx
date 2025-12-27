import API from "../services/api";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";

export default function RoleSwitch() {
  const navigate = useNavigate();

  const startLiveLocation = () => {
    socket.connect();

    navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit("captain:location", {
          captainId: JSON.parse(atob(localStorage.getItem("token").split(".")[1])).userId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const switchRole = async (role) => {
    await API.post("/user/switch-role", { role });

    if (role === "CAPTAIN") {
      startLiveLocation();
      navigate("/captain/routes");
    } else {
      socket.disconnect();
      navigate("/rider/request");
    }
  };

  return (
    <div className="flex gap-4 justify-center mt-20">
      <button
        onClick={() => switchRole("RIDER")}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
      >
        Rider
      </button>

      <button
        onClick={() => switchRole("CAPTAIN")}
        className="px-6 py-2 bg-teal-600 text-white rounded-lg"
      >
        Captain
      </button>
    </div>
  );
}
