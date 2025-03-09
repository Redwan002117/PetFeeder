import React from "react";

interface ErrorDisplayProps {
  error: Error;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-700 mb-4">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="w-full bg-pet-primary text-white py-2 px-4 rounded hover:bg-pet-primary-dark transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}; 