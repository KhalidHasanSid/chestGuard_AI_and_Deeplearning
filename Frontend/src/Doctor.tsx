import React, { useState } from "react";

function Doctor() {
    const [showNumberId, setShowNumberId] = useState(null);

    const handleShowNumber = (id) => {
        setShowNumberId((prevId) => (prevId === id ? null : id));
    };

    const doctors = [
        {
            id: 1,
            name: "Faisal Mahmood",
            contactNumber: "021-111-911-911",
            hospitalLocation: "The Aga Khan University Hospital (AKUH)",
            timings: "14:00 - 15:00",
            specialty: "Pneumonia",
            day: "Tuesday",
            image: "./images/FaisalMahmood.PNG",
        },
        {
            id: 2,
            name: "Prof. Dr. Syed Ali Arsalan",
            contactNumber: "021-34412247",
            hospitalLocation: "Liaquat National Hospital",
            timings: "02:00 pm - 04:30 pm",
            specialty: "Pneumonia",
            day: "Monday",
            image: "./images/Prof. Dr. Syed Ali Arsalan.PNG",
        },
        {
            id: 3,
            name: "Dr. Gul Afshan Razi",
            contactNumber: "+92 337 8244111",
            hospitalLocation: "Hamdard Naimat Begum Hospital",
            timings: "09:00 am - 02:00 pm",
            specialty: "Pneumonia",
            day: "Monday",
            image: "./images/Dr. Gul Afshan Razi.PNG",
        },
        {
            id: 4,
            name: "Azizullah Khan Dhiloo",
            contactNumber: "021-111-911-911",
            hospitalLocation: "The Aga Khan University Hospital (AKUH)",
            timings: "17:30 - 20:00",
            specialty: "Pneumonia",
            day: "Tuesday",
            image: "./images/Azizullah Khan Dhiloo.PNG",
        },
        {
            id: 5,
            name: "Dr. Saifullah Baig",
            contactNumber: "021-38183435",
            hospitalLocation: "Dow University Hospital (Ojha Camp)",
            timings: "08:30 AM - 11:30 AM",
            specialty: "Pneumonia",
            day: "Thursday",
            image: "./images/Dr. Saifullah Baig.PNG",
        },
        {
            id: 6,
            name: "Nisar Ahmed Rao",
            contactNumber: "021-111-911-911",
            hospitalLocation: "The Aga Khan University Hospital (AKUH)",
            timings: "14:00 - 16:30",
            specialty: "Tuberculosis",
            day: "Tuesday",
            image: "./images/Nisar Ahmed Rao.PNG",
        },
        {
            id: 7,
            name: "Javaid A. Khan",
            contactNumber: "021-111-911-911",
            hospitalLocation: "The Aga Khan University Hospital (AKUH)",
            timings: "13:30 - 16:30",
            specialty: "Tuberculosis",
            day: "Monday",
            image: "./images/Javaid A. Khan.PNG",
        },
        {
            id: 8,
            name: "Dr. Shahid Butt",
            contactNumber: "(021) 34404040",
            hospitalLocation: "Al Mumtaz Medical Complex Hospital",
            timings: "10:00 AM - 3:00 PM",
            specialty: "Tuberculosis",
            day: "Mon - Fri",
            image: "./images/Dr. Shahid Butt.PNG",
        },
        {
            id: 9,
            name: "Dr. Zahid Hussain",
            contactNumber: "(021) 36789400",
            hospitalLocation: "Saifee Hospital (North Nazimabad)",
            timings: "06:30 PM - 09:30 PM",
            specialty: "Tuberculosis",
            day: "Friday",
            image: "./images/Dr. Zahid Hussain.PNG",
        },
        {
            id: 10,
            name: "Dr. Muhammad Hasan",
            contactNumber: "(021) 35846040",
            hospitalLocation: "Rahat Medical Center",
            timings: "06:30 PM - 08:30 PM",
            specialty: "Tuberculosis",
            day: "Friday",
            image: "./images/Dr. Muhammad Hasan.PNG",
        },
    ];

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-center text-blue-900 mb-8">Doctor Details</h1>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {doctors.map((doctor) => (
                    <div
                        key={doctor.id}
                        className="bg-white shadow-xl rounded-2xl overflow-hidden transform hover:scale-[1.03] hover:shadow-2xl transition duration-300"
                    >
                        <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="w-full h-56 object-cover-auto rounded-t-2xl"
                        />
                        <div className="p-5 space-y-2">
                            <h2 className="text-xl font-bold text-gray-800">{doctor.name}</h2>

                            <button
                                onClick={() => handleShowNumber(doctor.id)}
                                className="flex items-center gap-2 text-sm text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition"
                            >
                                📞 {showNumberId === doctor.id ? doctor.contactNumber : "Show Contact"}
                            </button>

                            <div className="text-sm text-gray-700 space-y-1">
                                <p><span className="font-medium">🏥 Location:</span> {doctor.hospitalLocation}</p>
                                <p><span className="font-medium">🕒 Timings:</span> {doctor.timings}</p>
                                <p><span className="font-medium">📅 Day:</span> {doctor.day}</p>
                                <p><span className="font-medium">🔬 Specialty:</span> {doctor.specialty}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Doctor;
