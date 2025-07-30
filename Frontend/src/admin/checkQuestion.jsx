import axios from "axios";
import React from "react";
import { BASE_URL } from "../api";

export default function CheckQuestion() {
  const [info, setInfo] = React.useState([]);
  const [reply, setReply] = React.useState("");
  const [approved, setApproved] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/api/v1/chestguardquestion/getquestions`
        );
        setInfo(response.data.data);
      } catch (err) {
        console.error("Error fetching questions:", err);
      }
    };

    setInterval(fetchData, 10000);
    fetchData();
  }, []);

  const handlesubmit = async (_id) => {
    setApproved(true);
    try {
      await axios.post(
        `${BASE_URL}/api/v1/chestguard/A`,
        { _id, approved, reply },
        { withCredentials: true }
      );
      setInfo((prevInfo) => prevInfo.filter((item) => item._id !== _id));
    } catch (err) {
      console.error("Error approving question:", err);
    }
  };

  const deletesubmit = (_id) => {
    try {
      const response= axios.post( `${BASE_URL}/api/v1/chestguard/deletequestion` ,{_id},{ withCredentials: true })
      setInfo((prev) => prev.filter((eachValue) => eachValue._id !== _id));
    } catch (err) {
      console.error("Error deleting question:", err);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-2xl font-bold text-2xl text-black mb-4">Questions</h1>
      <div className="space-y-4">
        {info.map((eachValue) => (
          <div
            key={eachValue._id}
            className="border w-full sm:w-80 md:w-96 lg:w-180 border-gray-300 p-4 rounded-lg shadow-sm bg-gray-100"
          >
            <h3 className="text-lg font-semibold text-black">ID: {eachValue._id}</h3>
            <p className="text-black"><strong>City:</strong> {eachValue.city}</p>
            <h2 className="text-xl font-bold text-black">{eachValue.Problem_title}</h2>
            <p className="text-black">{eachValue.Description}</p>
            <label className="block text-black mt-2">Reply:</label>
            <input
              type="text"
              required
              onChange={(e) => setReply(e.target.value)}
              className="border border-black px-2 py-1 rounded w-full mt-1 text-black"
            />
            <div className="mt-3 space-x-2 flex flex-wrap">
              <button
                onClick={() => handlesubmit(eachValue._id)}
                className="px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600 w-full sm:w-auto mb-2 sm:mb-0"
              >
                Approve
              </button>
              <button
                onClick={() => deletesubmit(eachValue._id)}
                className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 w-full sm:w-auto"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
