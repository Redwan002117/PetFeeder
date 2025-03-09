import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Menu, Cpu, Wifi, Settings, RefreshCw, AlertTriangle, Wrench } from "lucide-react";

export function ESP32Guide() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          This guide covers the hardware setup, configuration, and maintenance of the ESP32-based PetFeeder device.
        </AlertDescription>
      </Alert>

      {/* Table of Contents */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <div className="flex items-center mb-2">
          <Menu className="mr-2 h-5 w-5" />
          <h3 className="text-lg font-semibold">Table of Contents</h3>
        </div>
        <nav className="space-y-1">
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'hardware-setup' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('hardware-setup')}
          >
            <Cpu className="mr-2 h-4 w-4" />
            Hardware Setup
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'wifi-setup' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('wifi-setup')}
          >
            <Wifi className="mr-2 h-4 w-4" />
            WiFi Setup
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'firmware' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('firmware')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Firmware
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'updates' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('updates')}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Updates
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'troubleshooting' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('troubleshooting')}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Troubleshooting
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'maintenance' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('maintenance')}
          >
            <Wrench className="mr-2 h-4 w-4" />
            Maintenance
          </Button>
        </nav>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="hardware-setup" id="hardware-setup">
          <AccordionTrigger>Hardware Setup</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Components</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>ESP32 Development Board</li>
                <li>Servo Motor (connected to GPIO 13)</li>
                <li>Ultrasonic Sensor (connected to GPIO 34)</li>
                <li>Status LED (GPIO 2)</li>
                <li>Manual Feed Button (GPIO 4)</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Assembly Instructions</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Mount the ESP32 board securely</li>
                <li>Connect servo motor for food dispensing</li>
                <li>Install ultrasonic sensor for food level</li>
                <li>Wire the manual feed button</li>
                <li>Connect status LED</li>
              </ol>

              <div className="bg-yellow-50 p-4 rounded-md mt-4">
                <p className="text-sm text-yellow-800">
                  Important: Double-check all connections before powering on the device.
                  Incorrect wiring may damage the components.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="initial-setup">
          <AccordionTrigger>Initial Configuration</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Software Requirements</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Arduino IDE with ESP32 support</li>
                <li>Required libraries:
                  <ul className="list-none ml-6">
                    <li>- WiFiManager</li>
                    <li>- FirebaseESP32</li>
                    <li>- ArduinoJson</li>
                    <li>- ESP32Servo</li>
                    <li>- NTPClient</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Firmware Installation</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Download the PetFeeder firmware</li>
                <li>Open in Arduino IDE</li>
                <li>Select correct board and port</li>
                <li>Upload firmware to ESP32</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="wifi-setup">
          <AccordionTrigger>WiFi Configuration</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Initial Connection</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Power on the device</li>
                <li>Connect to "PetFeeder-Setup" WiFi</li>
                <li>Open configuration portal</li>
                <li>Enter your WiFi credentials</li>
              </ol>

              <h3 className="text-lg font-semibold mt-4">Hotspot Mode</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Activates when WiFi unavailable</li>
                <li>Default SSID: "PetFeeder-Setup"</li>
                <li>Access portal at 192.168.4.1</li>
                <li>Configure backup networks</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="calibration">
          <AccordionTrigger>Calibration</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Servo Calibration</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Access device settings</li>
                <li>Adjust servo positions:
                  <ul className="list-none ml-6">
                    <li>- Closed position (0°)</li>
                    <li>- Open position (180°)</li>
                  </ul>
                </li>
                <li>Test feed amounts</li>
                <li>Fine-tune timing</li>
              </ol>

              <h3 className="text-lg font-semibold mt-4">Food Level Sensor</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Fill container completely</li>
                <li>Calibrate "100%" reading</li>
                <li>Empty container</li>
                <li>Calibrate "0%" reading</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="maintenance">
          <AccordionTrigger>Maintenance</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Regular Maintenance</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Clean food container</li>
                <li>Check servo mechanism</li>
                <li>Test sensors</li>
                <li>Verify WiFi connection</li>
                <li>Update firmware</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Troubleshooting</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>LED Status Indicators:
                  <ul className="list-none ml-6">
                    <li>- Solid: Normal operation</li>
                    <li>- Fast blink: Low food</li>
                    <li>- Slow blink: No WiFi</li>
                  </ul>
                </li>
                <li>Common Issues:
                  <ul className="list-none ml-6">
                    <li>- WiFi connectivity</li>
                    <li>- Servo jams</li>
                    <li>- Sensor readings</li>
                  </ul>
                </li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="firmware">
          <AccordionTrigger>Firmware Updates</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Update Process</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Download latest firmware</li>
                <li>Connect ESP32 to computer</li>
                <li>Upload via Arduino IDE</li>
                <li>Verify operation</li>
              </ol>

              <div className="bg-blue-50 p-4 rounded-md mt-4">
                <p className="text-sm text-blue-800">
                  Tip: Always backup your settings before updating firmware.
                  Settings are stored in EEPROM and should persist through updates.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
} 