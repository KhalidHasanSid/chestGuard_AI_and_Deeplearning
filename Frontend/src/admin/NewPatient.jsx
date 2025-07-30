import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../api";

export default function NewPatient() {
    const [MR_no, setMR_no] = useState("");
    const [fullname, setFullname] = useState("");
    const [email, setEmail] = useState("");
    const [Age, setAge] = useState("");
    const [city, setCity] = useState("");
    const [gender, setGender] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            console.log(MR_no, fullname, email, Age, gender, city);
            const response = await axios.post(
                `${BASE_URL}/api/v1/chestguarduser/registerFYP`,
                { MR_no, fullname, email, Age, gender, city },
                { withCredentials: true }
            );

            console.log("Registration successful:", response.data);
            setSuccess("Patient Registered Successfully! ✅");
            setError("");
        } catch (err) {
            console.error("Registration error:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "❌ Something went wrong");
            setSuccess("");
        }
    };

    return (
        <div className="flex justify-center mt-3 items-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white/90 backdrop-blur-lg shadow-lg p-6 rounded-xl border border-black">
                <h2 className="text-2xl font-bold text-center text-gray-700 mb-4">New Patient Registration</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-600 font-medium">MR No:</label>
                        <input
                            type="text"
                            value={MR_no}
                            onChange={(e) => setMR_no(e.target.value)}
                            required
                            className="w-full p-2 border border-black text-black rounded-lg focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 font-medium">Full Name:</label>
                        <input
                            type="text"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            required
                            className="w-full p-2 border border-black text-black rounded-lg focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 font-medium">Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-2 border border-black text-black rounded-lg focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 font-medium">Age:</label>
                        <input
                            type="number"
                            value={Age}
                            onChange={(e) => setAge(e.target.value)}
                            required
                            className="w-full p-2 border border-black text-black rounded-lg focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 font-medium">Gender:</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            required
                            className="w-full p-2 border border-black text-black rounded-lg focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-600 font-medium">City:</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                            className="w-full p-2 border border-black text-black rounded-lg focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
                    >
                        Register
                    </button>
                </form>

                {error && <p className="mt-3 text-xl text-red-600 text-sm">{error}</p>}
                {success && <p className="mt-3 text-xl text-green-600 text-sm">{success}</p>}
            </div>
        </div>
    );
}