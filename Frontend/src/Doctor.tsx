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
        <div className="p-6 bg-gradient-to-br from-blue-100 via-white to-blue-200 min-h-screen">
            <h1 className="text-4xl font-extrabold text-center text-blue-800 mb-10 drop-shadow-lg">Meet Our Doctors</h1>
            <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
                {doctors.map((doctor) => (
                    <div
                        key={doctor.id}
                        className="bg-white shadow-2xl rounded-3xl overflow-hidden transform hover:scale-[1.04] hover:shadow-blue-300 transition duration-300 w-full max-w-xs flex flex-col items-center border border-blue-100"
                    >
                        <div className="w-full h-48 bg-blue-50 flex items-center justify-center">
                            <img
                                src={doctor.image}
                                alt={doctor.name}
                                className="w-32 h-32 object-cover rounded-full border-4 border-blue-200 shadow-md mt-4"
                            />
                        </div>
                        <div className="p-6 w-full flex flex-col items-center">
                            <h2 className="text-lg font-bold text-blue-700 mb-1 text-center">{doctor.name}</h2>
                            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full mb-2 font-semibold">{doctor.specialty}</span>

                            <button
                                onClick={() => handleShowNumber(doctor.id)}
                                className="flex items-center gap-2 text-sm text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition shadow-md mb-2"
                            >
                                📞 {showNumberId === doctor.id ? doctor.contactNumber : "Show Contact"}
                            </button>

                            <div className="text-sm text-gray-700 space-y-1 w-full text-left mt-2">
                                <p><span className="font-medium">🏥 Location:</span> <span className="text-gray-900">{doctor.hospitalLocation}</span></p>
                                <p><span className="font-medium">🕒 Timings:</span> <span className="text-gray-900">{doctor.timings}</span></p>
                                <p><span className="font-medium">📅 Day:</span> <span className="text-gray-900">{doctor.day}</span></p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Doctor;
