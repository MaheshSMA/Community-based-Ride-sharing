import { useState } from "react";
import API from "../services/api";
import { redirect } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import quickrideImg from "../assets/quickride-share.png";


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
    navigate("/community-setup",{replace : true});
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
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
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md relative z-10">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
          {isNewUser ? "Sign Up" : "Login"}
        </h2>

        {step === 1 && (
          <>
            <input
              className="w-full mb-4 px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {isNewUser && (
              <>
                <input
                  className="w-full mb-4 px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <select
                  className="w-full mb-4 px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 cursor-pointer"
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
              className="w-full bg-black text-white font-semibold py-3.5 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 mt-2"
            >
              Send OTP
            </button>

            <p
              className="text-sm text-center mt-6 text-gray-600 hover:text-black cursor-pointer transition-colors duration-200 font-medium"
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
              className="w-full mb-6 px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              onClick={verifyOTP}
              className="w-full bg-black text-white font-semibold py-3.5 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200"
            >
              Verify OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
}
