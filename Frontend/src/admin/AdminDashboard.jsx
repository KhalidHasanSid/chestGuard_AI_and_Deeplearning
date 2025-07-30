import React, { useEffect, useState } from "react";
import axios from "axios";  
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { BASE_URL } from "../api";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
    const [data, setData] = useState(null);  
    const [cityData, setCityData] = useState([]);
    const [pieData, setPieData] = useState(null);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/api/v1/chestguard/getInsights`);
                setData(response.data);
                setCityData(response.data.chk2 || []);  
            } catch (err) {
                console.log("Error fetching data:", err);
            }
        };

        fetchInsights();
    }, []);  

    useEffect(() => {
        if (data?.chk?.length >= 2) {
            setPieData({
                labels: [data.chk[0]._id, data.chk[1]._id],
                datasets: [
                    {
                        data: [data.chk[0].count, data.chk[1].count],
                        backgroundColor: ["#4F46E5", "#EC4899"],
                        borderWidth: 1,
                    },
                ],
            });
        }
    }, [data]);

    if (!data) {
        return <p className="text-center text-gray-500 mt-10">Loading data...</p>;
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-6">
            
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center w-full">
                
                
                <div className="bg-white shadow-lg border border-gray-300 px-8 py-11 rounded-2xl text-center hover:scale-105 transition-transform w-64">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Registered Patients</h1>
                    <p className="text-xl text-gray-600">👥 Total Users</p>
                    <p className="text-4xl font-extrabold text-blue-600 mt-2">{data.userCount}</p>  
                </div>     

                {pieData && (
                    <div className="bg-white shadow-lg p-6 rounded-xl w-64">
                        <Pie data={pieData} />
                    </div>
                )}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl text-2xl text-black font-bold border border-black py-3 px-6 ">
                <span >Current City Results</span>
                {cityData.map((eachValue, index) => (
                    <div key={index} className="border border-gray-300 p-4 rounded-lg shadow-md bg-white">
                        <h3 className="font-bold text-gray-800">{eachValue.city}</h3>
                        <ul className="mt-2 text-gray-600">
                            {eachValue.results.map((i, idx) => (
                                <li key={idx} className="text-sm">{i.result}: <span className="font-semibold">{i.count}</span></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>    
    );
}
