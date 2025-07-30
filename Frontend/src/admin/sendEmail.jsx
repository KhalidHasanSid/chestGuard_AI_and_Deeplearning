import axios from "axios";
import React, { useState } from "react";
import { BASE_URL } from "../api";

export default function SendEmail() {
    const [info, setInfo] = useState({});
    const [MR_no, setMR_no] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState();

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('AdminAccesstoken');

            const response = await axios.get(
                `${BASE_URL}/api/v1/chestguarduser/getPatients/${MR_no}`,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        ...(token && { Authorization: `Bearer ${token}` })
                    },
                    withCredentials: true
                },
                { withCredentials: true }
            );
            console.log("the user :****", response.data.data);
            setInfo(response.data.data);
            setError("");
        } catch (err) {
            console.error("Error fetching patient:", err);
            setError("Patient not found!");
        }
    };

    const generatePassword = () => {
        let num = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        const pass = MR_no + "_" + num;
        console.log(pass);
        setPassword(pass);
    };

    const send = async (_id) => {
        try {
            const token = localStorage.getItem('AdminAccesstoken');
            const res = await axios.post(
                `${BASE_URL}/api/v1/chestguarduser/sendEmail`,
                { _id, password }, // plain JSON object
                {
                    headers: {
                        ...(token && { Authorization: `Bearer ${token}` })
                    },
                    withCredentials: true,
                }
            );

            console.log("CHECK RESPONSE", res.data.statusCode);
            setSuccess(res.data.statusCode)

            setError("");
        } catch (err) {
            console.error("Error sending email:", err);
            setError("❌ Failed to send email!");
            setSuccess("");
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
            <div className="w-full max-w-md bg-white/90 backdrop-blur-lg shadow-lg p-6 rounded-xl border border-black">
                <h2 className="text-2xl font-bold text-center text-black mb-4">
                    Send Email to Patient
                </h2>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter MR No."
                        value={MR_no}
                        onChange={(e) => setMR_no(e.target.value)}
                        className="w-full p-2 border border-black rounded-lg focus:ring-2 focus:ring-black text-black"
                    />
                    <button
                        onClick={fetchData}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                    >
                        Search
                    </button>
                </div>

                {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}

                {info._id && (
                    <div className="mt-4 p-4 border border-black rounded-lg bg-gray-50 shadow-sm">
                        <h3 className="font-bold text-lg text-black">Patient Details</h3>
                        <p className="text-black"><strong>ID:</strong> {info._id}</p>
                        <p className="text-black"><strong>MR No:</strong> {info.MR_no}</p>
                        <p className="text-black"><strong>Name:</strong> {info.fullName}</p>
                        <p className="text-black"><strong>City:</strong> {info.city}</p>
                        <p className="text-black"><strong>Email:</strong> {info.email}</p>

                        <div className="flex flex-col gap-2 mt-4">
                            <button
                                onClick={generatePassword}
                                className="bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
                            >
                                Generate Password
                            </button>

                            {password && (
                                <div className="text-center text-black font-medium">
                                    Generated Password: <span className="font-bold">{password}</span>
                                </div>
                            )}

                            <button
                                onClick={() => send(info._id)}
                                className="bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
                            >
                                Send to Patient
                            </button>
                            ()
                        </div>
                    </div>
                )}

                {success === 200 && <p className="mt-3 text-green-600 text-sm">Password Sent Successfully!</p>}
            </div>
        </div>
    );
}