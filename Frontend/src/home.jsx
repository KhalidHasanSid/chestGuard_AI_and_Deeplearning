import React from "react";
import ToggleCard from "./ToggleCard";

const cardsData = [
  {
    title: "What is Pneumonia?",
    content: (
      <>
        <p>
          Pneumonia, a lung infection, can cause symptoms like cough, fever,
          chills, and shortness of breath. Risk factors include smoking, weakened
          immune systems, and certain medical conditions. Prevention involves
          vaccination, good hygiene, and healthy habits.
        </p>

        <h3 className="font-semibold mt-4">Symptoms:</h3>
        <ul className="list-disc pl-6">
          <li>Cough may produce green, yellow, or even bloody mucus.</li>
          <li>Fever, sweating, and shaking chills.</li>
          <li>Shortness of breath.</li>
          <li>Rapid, shallow breathing.</li>
          <li>Chest pain that worsens when breathing deeply or coughing.</li>
          <li>Fatigue, loss of appetite, nausea, and vomiting.</li>
          <li>Confusion or delirium, especially in older people.</li>
        </ul>

        <h3 className="font-semibold mt-4">Risk Factors:</h3>
        <ul className="list-disc pl-6">
          <li>Smoking damages the lungs and weakens the immune system.</li>
          <li>Weakened immune system. Conditions like HIV/AIDS, or certain medications can increase risk.</li>
          <li>Underlying health conditions (Asthma, COPD, cystic fibrosis, heart failure, diabetes, and sickle cell disease).</li>
          <li>Both very young children and older adults are at higher risk.</li>
          <li>Exposure to respiratory infections like being around people with the flu or other respiratory illnesses increases the risk.</li>
        </ul>

        <h3 className="font-semibold mt-4">Prevention:</h3>
        <ul className="list-disc pl-6">
          <li>Vaccination</li>
          <li>Good hygiene</li>
          <li>Avoid smoking</li>
          <li>Stay away from sick people</li>
          <li>Healthy lifestyle</li>
          <li>Manage chronic conditions</li>
          <li>Prompt treatment of respiratory infections</li>
        </ul>
      </>
    ),
  },
  {
    title: "What is Tuberculosis? ",
    content: (
      <>
        <p>
          Tuberculosis (TB) is a potentially serious infectious disease that
          mainly affects the lungs and spreads through tiny droplets released
          into the air.
        </p>

        <h3 className="font-semibold mt-4">Symptoms of Tuberculosis (TB):</h3>
        <ul className="list-disc pl-6">
          <li>A cough that lasts for 3 weeks or longer, potentially producing phlegm or blood.</li>
          <li>Pain in the chest, especially when breathing or coughing.</li>
          <li>Coughing up blood or phlegm from deep inside the lungs.</li>
        </ul>

        <h3 className="font-semibold mt-4">Other Symptoms:</h3>
        <ul className="list-disc pl-6">
          <li>Fatigue and weakness</li>
          <li>Unintentional weight loss</li>
          <li>Loss of appetite</li>
          <li>Fever</li>
        </ul>

        <h3 className="font-semibold mt-4">Risk Factors for Tuberculosis (TB):</h3>
        <ul className="list-disc pl-6">
          <li>Close contact with someone who has active TB.</li>
          <li>Living in or traveling to areas with high TB rates.</li>
          <li>Weakened immune system.</li>
        </ul>

        <h3 className="font-semibold mt-4">Prevention of Tuberculosis (TB):</h3>
        <ul className="list-disc pl-6">
          <li>Avoid contact with people who have active TB.</li>
          <li>Practice good hygiene.</li>
          <li>Ensure proper ventilation.</li>
          <li>Get tested for TB.</li>
          <li>Complete the full course of TB treatment.</li>
          <li>BCG vaccination.</li>
          <li>Promote healthy lifestyles.</li>
          <li>Seek medical attention.</li>
        </ul>
      </>
    ),
  },
  
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 text-black p-6 mt-7">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-4">Welcome to Chest Guard!</h1>
        <p className="text-lg leading-relaxed">
          Your health is our priority. Access your medical reports, review AI-assisted diagnoses, and stay informed about pneumonia and tuberculosis. If you have any concerns, consult with expert radiologists through our platform.
        </p>
        <h4 className="font-semibold mt-4">Stay informed. Stay healthy. 💙</h4>
      </div>

      <div className="flex flex-col lg:flex-row items-start justify-center gap-10">
        {/* ✅ Fixed Image Path */}
        <img
          src="/images/lungs.png"
          alt="Chest X-ray"
          className="rounded-xl border border-cyan-500 shadow-lg w-96 h-auto object-contain"
        />

        {/* Cards */}
        <div className="grid gap-6">
          {cardsData.map((card, index) => (
            <ToggleCard key={index} title={card.title} content={card.content} />
          ))}
        </div>
      </div>
    </div>
  );
}
