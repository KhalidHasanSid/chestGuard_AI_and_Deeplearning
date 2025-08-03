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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-black">
        <h2 className="text-2xl font-semibold text-black text-center mb-6"> Patient Pannel</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-black font-medium">MR No:</label>
            <input
              type="text"
              value={MR_no}
              onChange={(e) => setMR_no(e.target.value)}
              className="w-full p-2 border border-black rounded-lg text-black"
              required
            />
          </div>

          <div>
            <label className="block text-black font-medium">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-black rounded-lg text-black"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg text-white font-medium border border-black"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-center">
          {/* <Link to="/registration" className="text-blue-600 hover:underline">
            Register
          </Link>
          <span className="mx-2 text-black">|</span> */}
          
        </div>
      </div>
    </div>
  );
}

export default Login;