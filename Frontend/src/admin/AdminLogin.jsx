import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../api';

function AdminLogin() {
  const [AdminCardNo, setAdminCardNo] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const abc = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/chestguard/AdminloginFYP`,
        {
          AdminCardNo: AdminCardNo,
          password: password,
        },
        { withCredentials: true }
      );
      localStorage.setItem('AdminAccesstoken', response.data.data.access);
      localStorage.setItem('AdminRefreshtoken', response.data.data.refresh);
      localStorage.setItem('AdminloginTimestamp', Date.now());
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-300">
        <div className="flex flex-col items-center mb-6">
          <img src="/images/logo.png" alt="Logo" className="w-16 h-16 mb-2" />
          <h2 className="text-3xl font-bold text-blue-700 mb-1">Admin Panel</h2>
          <p className="text-gray-500 text-sm">Sign in as admin to access dashboard</p>
        </div>

        <form onSubmit={abc} className="space-y-6">
          <div>
            <label className="block text-blue-700 font-semibold mb-1">Admin Card No</label>
            <input
              type="text"
              value={AdminCardNo}
              onChange={(e) => setAdminCardNo(e.target.value)}
              className="w-full p-3 border border-blue-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="Enter your Admin Card No"
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

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl text-white font-bold shadow-md transition border border-blue-700 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-500">Don't have an account?</span>
          <Link to="/Adminregistration" className="ml-2 text-blue-600 hover:underline font-semibold">
            Register
          </Link>
        </div>
        <div className="text-center mt-2">
          <Link to="/forgetpassword" className="text-blue-600 hover:underline font-semibold">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;