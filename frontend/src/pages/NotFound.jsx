import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 max-w-md w-full rounded-lg shadow-md bg-gray-100 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">404 - Page Not Found</h1>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
