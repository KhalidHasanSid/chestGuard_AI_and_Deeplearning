import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../api';

function AdminLogin() {
  const [AdminCardNo, setAdminCardNo] = React.useState("");
  const [password, setPassword] = React.useState("");
  const navigate = useNavigate();

  const abc = async (e) => {
    e.preventDefault();
    console.log(AdminCardNo, "password", password);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/chestguard/AdminloginFYP`,
        {
          AdminCardNo: AdminCardNo,
          password: password,
        },
        { withCredentials: true }
      );
      console.log("=============check2");

      console.log('Login successful:', response, "token sssss ", response.data.data.access);

      localStorage.setItem('AdminAccesstoken', response.data.data.access);
      localStorage.setItem('AdminRefreshtoken', response.data.data.refresh);
      localStorage.setItem('AdminloginTimestamp', Date.now());
      console.log("=============check3");

      navigate('/dashboard');
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white text-black">
      <div className="w-full max-w-md p-6 bg-gray-100 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-4">Admin Login</h1>
        <form onSubmit={abc} className="space-y-4">
          <div>
            <label className="block">Admin Card No:</label>
            <input
              onChange={(e) => setAdminCardNo(e.target.value)}
              type="number"
              className="w-full p-2 border border-black rounded-lg focus:ring focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label className="block">Password:</label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full p-2 border border-black rounded-lg focus:ring focus:ring-blue-200"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
            Login
          </button>
        </form>
        <div className="text-center mt-4">
          <Link to="/Adminregistration" className="text-blue-500 hover:underline">Register</Link>
        </div>
        <div className="text-center mt-2">
          <Link to="/forgetpassword" className="text-blue-500 hover:underline">Forget password?</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;