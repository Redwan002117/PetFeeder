import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./router";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import { DeviceProvider } from "./contexts/DeviceContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { useEffect, useState } from "react";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <DeviceProvider>
              <div className="min-h-screen bg-background">
                <AppRoutes />
                <Toaster />
              </div>
            </DeviceProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
