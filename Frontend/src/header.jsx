"use client";
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";


export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="bg-white border border-black py-3 px-6 rounded-full w-11/12 md:w-3/4 mx-auto mt-7 flex items-center justify-between relative z-50">
      {/* Logo */}
      <NavLink to="/home" className="flex items-center">
        <img
          src="./images/logo.png"
          alt="Logo"
          className="w-18 h-10 object-cover rounded-full"
        />
      </NavLink>

      {/* Desktop Menu */}
      <ul className="hidden md:flex space-x-6 justify-center text-lg">
      <li>
          <NavLink
            to="/Doctor"
            className="text-black hover:text-slate-600 font-semibold transition"
          >
            Doctors
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/result"
            className="text-black hover:text-slate-600 font-semibold transition"
          >
            Results
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/askQuestion"
            className="text-black hover:text-slate-600 font-semibold transition"
          >
            Ask Question
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/faqs"
            className="text-black hover:text-slate-600 font-semibold transition"
          >
            FAQs
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/articles"
            className="text-black hover:text-slate-600 font-semibold transition"
          >
            Article & Researches
          </NavLink>
        </li>
      </ul>

      {/* Hamburger Menu Button */}
      <button
        className="md:hidden text-2xl text-black"
        onClick={toggleMenu}
      >
        {menuOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <ul className="absolute top-full left-0 w-full text-black bg-white rounded-lg shadow-md mt-2 p-4 flex flex-col space-y-3 md:hidden text-lg z-50">
          <li>
            <NavLink to="/result" onClick={toggleMenu}>
              Results
            </NavLink>
          </li>
          <li>
            <NavLink to="/askQuestion" onClick={toggleMenu}>
              Ask Question
            </NavLink>
          </li>
          <li>
            <NavLink to="/faqs" onClick={toggleMenu}>
              FAQs
            </NavLink>
          </li>
          <li>
            <NavLink to="/articles" onClick={toggleMenu}>
              Article & Researches
            </NavLink>
          </li>
        </ul>
      )}
    </nav>
  );
}
