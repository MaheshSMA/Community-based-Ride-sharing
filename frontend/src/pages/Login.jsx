import { useState } from "react";
import API from "../services/api";
import { redirect } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [step, setStep] = useState(1);
  const [isNewUser, setIsNewUser] = useState(false);

  const sendOTP = async () => {
    await API.post("/auth/send-otp", {
      phone,
      name: isNewUser ? name : undefined,
      gender: isNewUser ? gender : undefined,
    });
    setStep(2);
  };

  const navigate = useNavigate();


  const verifyOTP = async () => {
    const res = await API.post("/auth/verify-otp", { phone, otp });
    localStorage.setItem("token", res.data.token);
    alert("Logged in");
    navigate("/",{replace : true});
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          {isNewUser ? "Sign Up" : "Login"}
        </h2>

        {step === 1 && (
          <>
            <input
              className="w-full mb-3 px-3 py-2 border rounded-lg"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {isNewUser && (
              <>
                <input
                  className="w-full mb-3 px-3 py-2 border rounded-lg"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <select
                  className="w-full mb-3 px-3 py-2 border rounded-lg"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </>
            )}

            <button
              onClick={sendOTP}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Send OTP
            </button>

            <p
              className="text-sm text-center mt-3 text-blue-600 cursor-pointer"
              onClick={() => setIsNewUser(!isNewUser)}
            >
              {isNewUser
                ? "Already have an account? Login"
                : "New here? Sign up"}
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <input
              className="w-full mb-3 px-3 py-2 border rounded-lg"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              onClick={verifyOTP}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Verify OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
}
