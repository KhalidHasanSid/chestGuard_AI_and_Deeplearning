import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../api';

function AdminRegistration() {
  const [AdminCardNo, setAdminCardNo] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${BASE_URL}/api/v1/chestguard/adminRegistration`, {
        AdminCardNo,
        fullname,
        email,
        password,
      });

      console.log('Registration successful:', response.data);
      setSuccess('Registration successful! You can now login.');
      setError('');
      setAdminCardNo('');
      setFullname('');
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Registration error:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Something went wrong');
      setSuccess('');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="w-full max-w-md p-6 bg-gray-100 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 text-center mb-4">Admin Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600">Admin Card No:</label>
            <input 
              type="number" 
              value={AdminCardNo} 
              onChange={(e) => setAdminCardNo(e.target.value)} 
              required 
              className="w-full text-black p-2 border border-black rounded-lg focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-gray-600">Full Name:</label>
            <input 
              type="text" 
              value={fullname} 
              onChange={(e) => setFullname(e.target.value)} 
              required 
              className="w-full p-2 text-black border border-black rounded-lg focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-gray-600">Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-2 text-black border border-black rounded-lg focus:ring focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-gray-600">Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full p-2 text-black border border-black rounded-lg focus:ring focus:ring-blue-200"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">Register</button>
        </form>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        {success && <p className="text-green-500 text-center mt-2">{success}</p>}
        <div className="text-center mt-4">
          <Link to='/Adminlogin' className="text-blue-500 hover:underline">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminRegistration;