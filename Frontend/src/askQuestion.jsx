import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "./api";

function AskQuestion() {
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [problem, setProblemTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/chestguardquestion/askQuestionFYP`,
        { age, city, problem, description },
        { withCredentials: true }
      );

      if (response.status === 200) {
        setSuccess("Successfully Submitted!");
        setAge("");
        setCity("");
        setProblemTitle("");
        setDescription("");
      }
    } catch (error) {
      setError("Submission Failed! Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center items-center p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md border border-black">
        <h2 className="text-2xl font-semibold text-black mb-4 border-b pb-2">
          Submit Your Problem
        </h2>

        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            className="w-full p-2 border border-black rounded-lg text-black"
          />
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full p-2 border border-black rounded-lg text-black"
          />
          <input
            type="text"
            placeholder="Problem Title"
            value={problem}
            onChange={(e) => setProblemTitle(e.target.value)}
            required
            className="w-full p-2 border border-black rounded-lg text-black"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="4"
            className="w-full p-2 border border-black rounded-lg text-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AskQuestion;