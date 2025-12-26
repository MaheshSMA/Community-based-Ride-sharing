import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function RoleSwitch() {
  const navigate = useNavigate();

  const switchRole = async (role) => {
    await API.post("/user/switch-role", { role });

    if (role === "CAPTAIN") {
      navigate("/captain/routes");
    }
    
    if (role === "RIDER") {
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
