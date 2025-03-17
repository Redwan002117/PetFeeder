import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Menu, Cpu, Wifi, Settings, RefreshCw, AlertTriangle, Wrench, Database, Code, Server } from "lucide-react";

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
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'supabase-integration' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('supabase-integration')}
          >
            <Database className="mr-2 h-4 w-4" />
            Supabase Integration
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'code-explanation' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('code-explanation')}
          >
            <Code className="mr-2 h-4 w-4" />
            Code Explanation
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start ${activeSection === 'real-time-sync' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => scrollToSection('real-time-sync')}
          >
            <Server className="mr-2 h-4 w-4" />
            Real-time Synchronization
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
                <li><strong>ESP32 Development Board</strong> - Main microcontroller (recommended: ESP32-WROOM-32)</li>
                <li><strong>Servo Motor</strong> - For dispensing food (connected to GPIO 13, SG90 or MG996R)</li>
                <li><strong>Ultrasonic Sensor</strong> - For food level detection (HC-SR04, TRIG: GPIO 12, ECHO: GPIO 14)</li>
                <li><strong>Status LED</strong> - For visual feedback (GPIO 2, standard 5mm LED with resistor)</li>
                <li><strong>Manual Feed Button</strong> - For physical feed trigger (GPIO 4, momentary push button)</li>
                <li><strong>Battery Level Sensor</strong> - Optional, for monitoring power (GPIO 35, voltage divider circuit)</li>
                <li><strong>Power Supply</strong> - 5V/2A DC adapter or 18650 Li-ion battery with charger circuit</li>
                <li><strong>Food Container</strong> - Plastic container with dispensing mechanism</li>
                <li><strong>Jumper Wires</strong> - For connecting components</li>
                <li><strong>Breadboard/PCB</strong> - For mounting components</li>
                <li><strong>Resistors</strong> - 220Ω for LED, 10kΩ for button pull-down</li>
                <li><strong>Capacitors</strong> - 100μF electrolytic for power stabilization</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Pin Connections</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="py-2 px-4 border-b">Component</th>
                      <th className="py-2 px-4 border-b">ESP32 Pin</th>
                      <th className="py-2 px-4 border-b">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-4 border-b">Servo Motor Signal</td>
                      <td className="py-2 px-4 border-b">GPIO 13</td>
                      <td className="py-2 px-4 border-b">PWM signal for servo control</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">Ultrasonic TRIG</td>
                      <td className="py-2 px-4 border-b">GPIO 12</td>
                      <td className="py-2 px-4 border-b">Trigger pin for HC-SR04</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">Ultrasonic ECHO</td>
                      <td className="py-2 px-4 border-b">GPIO 14</td>
                      <td className="py-2 px-4 border-b">Echo pin for HC-SR04</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">Status LED</td>
                      <td className="py-2 px-4 border-b">GPIO 2</td>
                      <td className="py-2 px-4 border-b">With 220Ω resistor</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">Manual Feed Button</td>
                      <td className="py-2 px-4 border-b">GPIO 4</td>
                      <td className="py-2 px-4 border-b">With 10kΩ pull-down resistor</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border-b">Battery Level</td>
                      <td className="py-2 px-4 border-b">GPIO 35</td>
                      <td className="py-2 px-4 border-b">Analog input, voltage divider</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold mt-4">Power Requirements</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Input Voltage:</strong> 5V DC</li>
                <li><strong>Current:</strong> 2A recommended (servo may draw up to 1A during operation)</li>
                <li><strong>Battery Option:</strong> 3.7V 18650 Li-ion with boost converter to 5V</li>
                <li><strong>Power Consumption:</strong>
                  <ul className="list-none ml-6">
                    <li>- Sleep mode: ~20mA</li>
                    <li>- Active (WiFi on): ~80-120mA</li>
                    <li>- During feeding: ~500-1000mA</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Assembly Instructions</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Mount the ESP32 board securely on breadboard or PCB</li>
                <li>Connect servo motor for food dispensing mechanism</li>
                <li>Install ultrasonic sensor at top of food container</li>
                <li>Wire the manual feed button to front panel</li>
                <li>Connect status LED in visible location</li>
                <li>Add power supply connections with appropriate regulation</li>
                <li>Secure all connections with appropriate insulation</li>
              </ol>

              <div className="bg-yellow-50 p-4 rounded-md mt-4">
                <p className="text-sm text-yellow-800">
                  Important: Double-check all connections before powering on the device.
                  Incorrect wiring may damage the components. Ensure proper polarity for power connections.
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
                    <li>- ArduinoJson</li>
                    <li>- ESP32Servo</li>
                    <li>- HTTPClient</li>
                    <li>- WiFiClientSecure</li>
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

        <AccordionItem value="supabase-integration" id="supabase-integration">
          <AccordionTrigger>Supabase Integration</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Supabase Configuration</h3>
              <p>
                The PetFeeder device uses Supabase to store and sync data in real-time.
                This allows for seamless communication between the device and the web application.
              </p>
              
              <h4 className="text-md font-semibold mt-4">Setup Steps</h4>
              <ol className="list-decimal list-inside space-y-2">
                <li>Create a Supabase project in the Supabase Dashboard</li>
                <li>Set up appropriate database tables with Row Level Security (RLS) policies</li>
                <li>Update the firmware with your Supabase credentials:
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mt-2 overflow-x-auto text-sm">
                    <code>
                      #define SUPABASE_URL "https://your-project-id.supabase.co"<br/>
                      #define SUPABASE_API_KEY "your-supabase-anon-key"<br/>
                      #define SUPABASE_JWT_TOKEN "your-jwt-token" // Generated after user authentication
                    </code>
                  </pre>
                </li>
              </ol>

              <h4 className="text-md font-semibold mt-4">Database Structure</h4>
              <p>The Supabase database is organized with the following tables:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li><span className="font-mono text-sm">devices</span> - Stores device information including status and food level</li>
                <li><span className="font-mono text-sm">feeding_schedules</span> - Contains all scheduled feedings</li>
                <li><span className="font-mono text-sm">feed_commands</span> - Queue for manual feed commands</li>
                <li><span className="font-mono text-sm">feeding_history</span> - Log of all feeding events</li>
                <li><span className="font-mono text-sm">device_registration</span> - Facilitates device registration process</li>
              </ul>
              
              <p className="mt-4">Each device communicates with these tables to maintain state and provide functionality.</p>

              <div className="bg-blue-50 p-4 rounded-md mt-4">
                <p className="text-sm text-blue-800">
                  Note: The device automatically registers itself in the database on first connection using its MAC address as the deviceID.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="code-explanation" id="code-explanation">
          <AccordionTrigger>Code Explanation</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Main Components</h3>
              <p>
                The PetFeeder firmware is organized into several functional components:
              </p>
              
              <h4 className="text-md font-semibold mt-4">Setup Functions</h4>
              <ul className="list-disc list-inside space-y-2">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">setupHardware()</code> - Initializes pins and servo</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">setupWiFi()</code> - Configures WiFi using WiFiManager</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">setupSupabase()</code> - Initializes Supabase connection</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">setupNTP()</code> - Sets up time synchronization</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">registerDevice()</code> - Registers device in Supabase</li>
              </ul>

              <h4 className="text-md font-semibold mt-4">Core Functions</h4>
              <ul className="list-disc list-inside space-y-2">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">feed(int amount)</code> - Controls the feeding mechanism</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">updateFoodLevel()</code> - Reads and updates food level</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">checkSchedules()</code> - Manages feeding schedules</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">handleManualFeedButton()</code> - Processes physical button presses</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">checkForManualFeedCommand()</code> - Checks for remote feed commands</li>
              </ul>

              <h4 className="text-md font-semibold mt-4">Operation Modes</h4>
              <ul className="list-disc list-inside space-y-2">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">handleOnlineOperations()</code> - Functions when connected to WiFi</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">handleLocalOperations()</code> - Functions in offline mode</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">checkWiFiStatus()</code> - Monitors connection and attempts reconnection</li>
              </ul>

              <h4 className="text-md font-semibold mt-4">Key Variables</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mt-2 overflow-x-auto text-sm">
                <code>
                  // Pin definitions<br/>
                  #define SERVO_PIN 13<br/>
                  #define FOOD_LEVEL_SENSOR_PIN 34<br/>
                  #define LED_PIN 2<br/>
                  #define MANUAL_FEED_PIN 4<br/>
                  <br/>
                  // Feeding amounts (in milliseconds)<br/>
                  const int SMALL_AMOUNT = 500;<br/>
                  const int MEDIUM_AMOUNT = 1000;<br/>
                  const int LARGE_AMOUNT = 1500;
                </code>
              </pre>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="real-time-sync" id="real-time-sync">
          <AccordionTrigger>Real-time Synchronization</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Supabase Real-time Updates</h3>
              <p>
                The PetFeeder device maintains real-time synchronization with the Supabase database,
                allowing for immediate updates and responses to user actions.
              </p>
              
              <h4 className="text-md font-semibold mt-4">Key Synchronization Features</h4>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Device Status Updates</strong> - The device regularly updates its online status and last seen timestamp</li>
                <li><strong>Food Level Monitoring</strong> - Real-time updates of food level percentage</li>
                <li><strong>Remote Feeding Commands</strong> - Immediate response to feed commands from the web app</li>
                <li><strong>Schedule Synchronization</strong> - Automatic download of updated feeding schedules</li>
                <li><strong>Feeding History</strong> - Logs of all feeding events, both manual and scheduled</li>
                <li><strong>Alert System</strong> - Notifications for low food level and other system events</li>
              </ul>

              <h4 className="text-md font-semibold mt-4">Offline Operation</h4>
              <p>
                The device is designed to continue functioning even when WiFi is unavailable:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Schedules are stored in EEPROM and continue to execute</li>
                <li>Manual feeding via physical button remains operational</li>
                <li>Local web interface becomes available in AP mode</li>
                <li>Automatic reconnection attempts when WiFi becomes available</li>
                <li>Data synchronization resumes upon reconnection</li>
              </ul>

              <div className="bg-green-50 p-4 rounded-md mt-4">
                <p className="text-sm text-green-800">
                  Best Practice: The device uses a heartbeat system to maintain connection status. If the device hasn't updated its heartbeat in 15 minutes, the web app will show it as offline.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="advanced-features" id="advanced-features">
          <AccordionTrigger>Advanced Features</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Enhanced Capabilities</h3>
              <p>
                The PetFeeder firmware includes several advanced features for improved reliability and user experience:
              </p>
              
              <h4 className="text-md font-semibold mt-4">WiFi Management</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>WiFiManager for easy network configuration</li>
                <li>Automatic fallback to AP mode when WiFi is unavailable</li>
                <li>Support for multiple network configurations</li>
                <li>Intelligent reconnection with exponential backoff</li>
              </ul>

              <h4 className="text-md font-semibold mt-4">Error Handling</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>Robust error detection and recovery</li>
                <li>Exception handling for Firebase operations</li>
                <li>Watchdog timer to prevent system hangs</li>
                <li>Visual feedback via LED status indicators</li>
              </ul>

              <h4 className="text-md font-semibold mt-4">Power Management</h4>
              <ul className="list-disc list-inside space-y-2">
                <li>Efficient operation to minimize power consumption</li>
                <li>Safe shutdown procedures during power loss</li>
                <li>State persistence across power cycles</li>
              </ul>

              <div className="bg-purple-50 p-4 rounded-md mt-4">
                <p className="text-sm text-purple-800">
                  Advanced Tip: The firmware supports OTA (Over-The-Air) updates when properly configured, allowing for remote firmware upgrades without physical access to the device.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}