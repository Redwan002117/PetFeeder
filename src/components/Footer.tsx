import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 py-6 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              &copy; {new Date().getFullYear()} Auto Cat Feeder,{" "}
              Developed by{" "}
              <a 
                href="https://redwancodes.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pet-primary hover:underline"
              >
                @GamerNo002117
              </a>
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Contact:{" "}
              <a 
                href="mailto:GamerNo002117@redwancodes.com"
                className="text-pet-primary hover:underline"
              >
                GamerNo002117@redwancodes.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 