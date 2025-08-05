import React from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "./api";

function Login() {
  const [MR_no, setMR_no] = React.useState("");
  const [password, setPassword] = React.useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log(MR_no, "password", password);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/chestguarduser/loginFYP`,
        { MR_no, password },
        { withCredentials: true }
      );

      console.log("Login successful:", response, "Token:", response.data.data.access);

      localStorage.setItem("Accesstoken", response.data.data.access);
      localStorage.setItem("Refreshtoken", response.data.data.refresh);
      localStorage.setItem("loginTimestamp", Date.now());

      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-300">
        <div className="flex flex-col items-center mb-6">
          <img src="/images/logo.png" alt="Logo" className="w-16 h-16 mb-2" />
          <h2 className="text-3xl font-bold text-blue-700 mb-1">Patient Panel</h2>
          <p className="text-gray-500 text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-blue-700 font-semibold mb-1">MR No</label>
            <input
              type="text"
              value={MR_no}
              onChange={(e) => setMR_no(e.target.value)}
              className="w-full p-3 border border-blue-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="Enter your MR No"
              required
            />
          </div>

          <div>
            <label className="block text-blue-700 font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-blue-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl text-white font-bold shadow-md transition border border-blue-700"
          >
            Login
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;