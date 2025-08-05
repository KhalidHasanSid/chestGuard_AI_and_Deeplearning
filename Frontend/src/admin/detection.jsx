import React, { useState } from "react";
import axios from "axios";
import { Upload, RefreshCw, Loader2 } from "lucide-react";
import { BASE_URL } from "../api";
import { NavLink, Link } from "react-router-dom";
import Result from "../Result";

const Detection = () => {
  const [xrayImage, setXrayImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [MR_no, setMR_no] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("")
  const [modelType, setModelType] = useState('binary');
  const [enable, setEnable] = useState(false)

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setXrayImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMriChange = (event) => {
    setMR_no(event.target.value);
  };

  const analyzeXray = async (modelType) => {
    if (!xrayImage || !MR_no) {
      alert("Please enter MRI number and upload an X-ray image.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("xrayImage", xrayImage);
    formData.append("modelType", modelType);

    // Get token from localStorage (consistent with admin login)
    const token = localStorage.getItem('AdminAccesstoken');

    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/chestguardDetection/sendImage/${MR_no}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token && { Authorization: `Bearer ${token}` })
          },
          withCredentials: true
        }
      );
      console.log("checking---", response.data.data.detection[response.data.data.detection.length - 1]);
      setResult(response.data.data.detection[response.data.data.detection.length - 1].result);
    } catch (error) {
      console.error("Error analyzing X-ray:", error);
      alert("An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setXrayImage(null);
    setImagePreview(null);
    setMR_no("");
    setResult("");
  };

  return (
    <div className="flex pt-8 justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-gray-100 p-8 rounded-lg border border-black shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-black text-center mb-6">MRI Analysis</h2>


        <input
          type="text"
          placeholder="Enter MRI Number"
          value={MR_no}
          onChange={handleMriChange}
          className="w-full mb-4 p-2 border border-black text-black  rounded-lg"
        />


        <div className="mb-4">
          <label className="bg-blue-600 text-white hover:bg-blue-500 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-white">
            <Upload size={18} /> Upload X-ray
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>


        {imagePreview && (
          <div className="flex justify-center mb-4">
            <img src={imagePreview} alt="Uploaded X-ray" className="w-64 h-auto rounded-lg border-2  shadow-lg" />
          </div>
        )}



        <select
          value={modelType}
          onChange={(e) => setModelType(e.target.value)}
          className="w-full mb-4 p-2 border border-black text-black rounded-lg"
        >
          <option value="binary">Binary Analysis</option>
          <option value="multilabel">Multi-Label Analysis</option>
        </select>

        <button
          onClick={() => analyzeXray(modelType)}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white mb-4 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Start Analysis"}
        </button>




        <button
          onClick={handleRefresh}
          className="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} /> Refresh
        </button>


        {result && (
          <div className="mt-6 bg-gray-700 p-4 rounded-lg">
            <h2 className="text-lg font-bold text-cyan-400">Analysis Result</h2>
            <p className="text-white">Predicted result: {result}</p>
            <button
              onClick={(e) =>
                setEnable((prev) => {
                  if (prev === false) return true;
                  else return false;
                })
              }
              className="px-4 py-2 bg-white text-black rounded-md border border-gray-300 hover:bg-blue-500 hover:text-green-500 transition-colors duration-200"
            >
              See Detail
            </button>
            {enable && <Link to="/result" state={{ MR_no }}>Go to Result</Link>}


          </div>
        )}
      </div>
    </div>
  );
};

export default Detection;