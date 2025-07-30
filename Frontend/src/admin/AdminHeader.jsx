import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi"; // Hamburger icons

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white border text-black border-black py-3 px-6 rounded-full w-11/12 md:w-3/4 mx-auto mt-7 flex items-center justify-between relative z-50">
      {/* Logo */}
      <NavLink to="/dashboard" className="flex items-center">
        <img
          src="./images/logo.png"
          alt="Logo"
          className="w-18 h-10 object-cover rounded-full"
        />
      </NavLink>

      {/* Desktop Menu */}
      <ul className="hidden md:flex space-x-6 text-lg">
        <li>
          <NavLink to="/detection" className="text-black font-semibold hover:text-slate-600 transition">
            Detection
          </NavLink>
        </li>
        <li>
          <NavLink to="/newPatient" className="text-black font-semibold hover:text-slate-600 transition">
            New Patient
          </NavLink>
        </li>
        <li>
          <NavLink to="/sendEmail" className="text-black font-semibold hover:text-slate-600 transition">
            Find and send mail
          </NavLink>
        </li>
        <li>
          <NavLink to="/checkquestion" className="text-black font-semibold hover:text-slate-600 transition">
            Check new Question
          </NavLink>
        </li>
       {/* / <li>
          <NavLink to="/askQuestion" className="text-black font-semibold hover:text-slate-600 transition">
            Awareness Update
          </NavLink>
        </li> */}
      </ul>

      {/* Hamburger Icon */}
      <button className="md:hidden text-2xl text-black" onClick={toggleMenu}>
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <ul className="absolute top-full left-0 w-full bg-white shadow-lg rounded-lg mt-2 p-4 flex flex-col space-y-4 text-lg md:hidden z-50">
          <li>
            <NavLink to="/detection" onClick={toggleMenu}>
              Detection
            </NavLink>
          </li>
          <li>
            <NavLink to="/newPatient" onClick={toggleMenu}>
              New Patient
            </NavLink>
          </li>
          <li>
            <NavLink to="/sendEmail" onClick={toggleMenu}>
              Find and send mail
            </NavLink>
          </li>
          <li>
            <NavLink to="/checkquestion" onClick={toggleMenu}>
              Check new Question
            </NavLink>
          </li>
         
        </ul>
      )}
    </nav>
  );
}
