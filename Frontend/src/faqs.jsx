import axios from "axios";
import  { useEffect, useState } from "react";
import { BASE_URL } from "./api";

export default function Faqs() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/chestguard/B`);
        console.log(response.data.data);
        setData(response.data.data);
      } catch (err) {
        console.error("Error fetching questions:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6 text-black border-b pb-2">FAQs</h1>

      {data.map((eachValue) => (
        <div
          key={eachValue._id}
          className="bg-white p-4 rounded-lg shadow-md w-full sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] mx-auto mb-4 border border-black"
        >
          <p className="text-gray-700">
            <span className="font-semibold text-black">City:</span> {eachValue.city}
          </p>
          <h2 className="text-lg font-bold text-black mt-2">
            {eachValue.Problem_title}
          </h2>
          <p className="text-gray-700">
            <span className="font-semibold text-black">Description:</span>{" "}
            {eachValue.Description}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold text-black">Reply:</span>{" "}
            {eachValue.Reply}
          </p>
        </div>
      ))}
    </div>
  );
}
