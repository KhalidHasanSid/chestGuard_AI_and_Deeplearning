import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SetNewPassword from './setNewPassword.jsx';
import { BASE_URL } from "../api";

export default function ForgetPassword() {
    const [code, setCode] = useState("");
    const [email, setEmail] = useState("");
    const [flag, setFlag] = useState(0); 
    const navigate = useNavigate();

    const sendCode = async () => {
        try {
            const response = await axios.post(`${BASE_URL}/api/v1/chestguarduser/sendcode`, {
                email: email 
            }, { withCredentials: true });

            console.log(response.data.statusCode);  

            if (response.data.statusCode === 200) {
                setFlag(1);  
            } else {
                setFlag(2);
            }
        } catch (err) {
            setFlag(2);
            console.error("Login error:", err);
        }
    };

    const handlerFunction = async () => {  
        try {

            console.log(email,"===",code)
            const response2 = await axios.post(`${BASE_URL}/api/v1/chestguarduser/checkOTP`, {
                email: email,
                code: code 
            }, { withCredentials: true });
            console.log(">>>>",response2.data.statusCode)

            if (response2.data.statusCode == 200) {

                console.log("i am here new flag value is going to 3")
                
               setFlag(3)
            }
            else if (response2.data.statusCode == 400) {
                console.log("incorrect otp")
            }
        } catch (err) {
            console.log("incorrect otp")
            console.error("Login error:", err);
        }
    };

    return (
      <>
  <div className="w-[22rem] mx-auto mt-40 p-6 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center">
    <h2 className="font-bold text-2xl text-gray-800 mb-6">Forget Password</h2>

    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
      <input
        type="text"
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter your email"
      />
    </div>

    <button
      onClick={sendCode}
      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-400 font-semibold transition duration-200 w-full mb-4"
    >
      Send Code
    </button>

    {flag === 1 && <p className="text-green-600 mb-2">Code sent</p>}
    {flag === 2 && <p className="text-red-600 mb-2">Not sent</p>}

    {flag === 1 && (
      <div className="w-full mt-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Enter Passcode</label>
        <input
          type="text"
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handlerFunction();
          }}
          className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter passcode"
        />
      </div>
    )}

    {flag === 3 && (
      <div className="w-full mt-4">
        <SetNewPassword value={email} />
      </div>
    )}
  </div>
</>

    );
}