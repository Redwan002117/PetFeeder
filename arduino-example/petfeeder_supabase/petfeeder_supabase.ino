/**
 * Auto Pet Feeder - ESP32 Supabase Integration Example
 * 
 * This example demonstrates how to connect an ESP32 to Supabase
 * to control a pet feeder device.
 * 
 * Required Libraries:
 * - ArduinoJson
 * - ESP32 Servo
 * - HTTPClient
 * - WiFiClientSecure
 * 
 * Hardware:
 * - ESP32 development board
 * - Servo motor for dispensing food
 * - Optional: Food level sensor
 * - Optional: Battery level monitoring
 * 
 * Debug Features:
 * - Serial debug output with timestamps
 * - LED status indicators
 * - Detailed API response logging
 * - Sensor reading verification
 * 
 * @author @GamerNo002117
 **/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <time.h>

// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Supabase credentials
#define SUPABASE_URL "https://your-project-id.supabase.co"
#define SUPABASE_API_KEY "your-supabase-anon-key"
#define SUPABASE_JWT_TOKEN "your-jwt-token" // Generated after user authentication

// User ID - this should be set during device setup
#define USER_ID "YOUR_USER_ID"

// Debug configuration
#define DEBUG_MODE true           // Set to false to disable detailed debug output
#define DEBUG_LED_ENABLED true    // Set to false to disable debug LED patterns
#define DEBUG_BLINK_DURATION 100  // Duration of debug LED blinks in ms

// Hardware pins
#define SERVO_PIN 13
#define FOOD_LEVEL_SENSOR_PIN 34
#define BATTERY_LEVEL_PIN 35
#define TRIG_PIN 12  // Ultrasonic sensor trigger pin
#define ECHO_PIN 14  // Ultrasonic sensor echo pin
#define LED_PIN 2    // Status LED pin
#define DEBUG_LED_PIN LED_PIN  // Using the same LED for debug indications

// Constants
#define FEED_AMOUNT_PER_SECOND 5 // grams per second
#define MAX_FEED_AMOUNT 100 // maximum amount in grams

// Global variables
Servo feederServo;
WiFiClientSecure client;
HTTPClient http;

unsigned long lastStatusUpdate = 0;
unsigned long lastScheduleCheck = 0;
unsigned long lastTimeSync = 0;
unsigned long debugTimestamp = 0;  // For tracking debug message timestamps

// Debug status tracking
bool wifiConnected = false;
bool timeInitialized = false;
bool servoInitialized = false;
bool supabaseConnected = false;

struct FeedingSchedule {
  String id;
  String time;
  int amount;
  bool enabled;
  bool days[7]; // Sunday to Saturday
};

FeedingSchedule schedules[10]; // Maximum 10 schedules
int scheduleCount = 0;

struct tm timeinfo;

// Function prototypes
void updateDeviceStatus();
void loadSchedules();
void checkSchedules();
void checkForManualFeedCommand();
void updateCommandStatus(String commandId, String status);
void logFeedingEvent(int amount, String type);
void updateFoodLevel();
void updateBatteryLevel();
int readFoodLevel();
int readBatteryLevel();
void feed(int amount);
void debugPrint(String message, bool newLine = true);
void debugBlink(int times, int speed = DEBUG_BLINK_DURATION);

// Debug print function with timestamp
void debugPrint(String message, bool newLine) {
  if (!DEBUG_MODE) return;
  
  unsigned long currentMillis = millis();
  unsigned long seconds = currentMillis / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  // Format: [HH:MM:SS.mmm]
  String timestamp = String("[") + 
                    String(hours % 24) + String(":") + 
                    String(minutes % 60) + String(":") + 
                    String(seconds % 60) + String(".") + 
                    String(currentMillis % 1000) + String("] ");
  
  if (newLine) {
    Serial.println(timestamp + message);
  } else {
    Serial.print(timestamp + message);
  }
}

// Debug LED patterns
void debugBlink(int times, int speed) {
  if (!DEBUG_MODE || !DEBUG_LED_ENABLED) return;
  
  for (int i = 0; i < times; i++) {
    digitalWrite(DEBUG_LED_PIN, HIGH);
    delay(speed);
    digitalWrite(DEBUG_LED_PIN, LOW);
    delay(speed);
  }
}

void setup() {
  Serial.begin(115200);
  delay(500); // Give serial monitor time to start
  
  debugPrint("========================================");
  debugPrint("PetFeeder ESP32 Supabase Integration");
  debugPrint("========================================");
  debugPrint("Firmware version: 1.0.0");
  debugPrint("Debug mode: ENABLED");
  
  // Initialize LED pin
  pinMode(DEBUG_LED_PIN, OUTPUT);
  digitalWrite(DEBUG_LED_PIN, LOW);
  debugBlink(3); // Startup indicator
  
  // Initialize hardware
  debugPrint("Initializing servo motor...", false);
  feederServo.attach(SERVO_PIN);
  feederServo.write(0); // Initial position
  servoInitialized = true;
  debugPrint("OK");
  
  // Initialize ultrasonic sensor pins
  debugPrint("Initializing ultrasonic sensor...", false);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  debugPrint("OK");
  
  // Connect to WiFi
  debugPrint("Connecting to WiFi SSID: " + String(WIFI_SSID), false);
  
  // Explicitly set WiFi mode to station before attempting to connect
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 20) { // 10 second timeout
    Serial.print(".");
    debugBlink(1, 100);
    delay(500);
    wifiAttempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    debugPrint("\nConnected with IP: " + WiFi.localIP().toString());
    debugPrint("Signal strength: " + String(WiFi.RSSI()) + " dBm");
    debugBlink(2); // Success indicator
  } else {
    debugPrint("\nWiFi connection FAILED");
    debugBlink(5, 200); // Error indicator
    
    // Start AP mode for configuration
    debugPrint("Starting Access Point for configuration...");
    
    // Disconnect from any previous WiFi connection attempts
    WiFi.disconnect();
    delay(100);
    
    // Set WiFi mode to access point
    WiFi.mode(WIFI_AP);
    delay(100);
    
    // Create a unique SSID using the device MAC address
    String apSSID = "PetFeeder-" + String((uint32_t)ESP.getEfuseMac(), HEX).substring(0, 4);
    
    // Start the access point with a stronger signal
    if (WiFi.softAP(apSSID.c_str(), "petfeeder123", 1, 0, 4)) {
      debugPrint("AP started successfully with SSID: " + apSSID);
      debugPrint("AP IP address: " + WiFi.softAPIP().toString());
      debugBlink(3); // AP mode indicator
    } else {
      debugPrint("Failed to start AP mode");
      
      // Try one more time with default settings
      delay(1000);
      if (WiFi.softAP(apSSID.c_str(), "petfeeder123")) {
        debugPrint("AP started with default settings, SSID: " + apSSID);
        debugPrint("AP IP address: " + WiFi.softAPIP().toString());
        debugBlink(3); // AP mode indicator
      } else {
        debugPrint("AP mode completely failed");
      }
    }
  }

  // Initialize time
  debugPrint("Initializing time synchronization...", false);
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  
  // Check if time was initialized successfully
  if (getLocalTime(&timeinfo)) {
    timeInitialized = true;
    char timeStringBuff[50];
    strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%d %H:%M:%S", &timeinfo);
    debugPrint("OK - Current time: " + String(timeStringBuff));
  } else {
    debugPrint("FAILED");
    debugBlink(4, 200); // Error indicator
  }
  
  // Skip SSL certificate verification (for development only)
  debugPrint("Setting up secure client (insecure mode)...", false);
  client.setInsecure();
  debugPrint("OK");
  
  // Test Supabase connection
  debugPrint("Testing Supabase connection...");
  String deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  debugPrint("Device ID: " + deviceId);
  
  // Update device status
  debugPrint("Updating device status...");
  updateDeviceStatus();
  
  // Load feeding schedules
  debugPrint("Loading feeding schedules...");
  loadSchedules();
  
  debugPrint("Setup complete!");
  debugPrint("========================================");
  
  // Final status report
  debugPrint("SYSTEM STATUS:");
  debugPrint("WiFi: " + String(wifiConnected ? "CONNECTED" : "DISCONNECTED"));
  debugPrint("Time sync: " + String(timeInitialized ? "OK" : "FAILED"));
  debugPrint("Servo: " + String(servoInitialized ? "OK" : "FAILED"));
  debugPrint("Supabase: " + String(supabaseConnected ? "CONNECTED" : "DISCONNECTED"));
  debugPrint("========================================");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    debugPrint("WiFi disconnected. Reconnecting...");
    debugBlink(3, 200); // Error indicator
    wifiConnected = false;
    WiFi.reconnect();
    delay(5000);
    
    if (WiFi.status() == WL_CONNECTED) {
      wifiConnected = true;
      debugPrint("WiFi reconnected with IP: " + WiFi.localIP().toString());
      debugBlink(2); // Success indicator
    }
    return;
  }
  
  // Update time
  if (millis() - lastTimeSync > 3600000) { // Every hour
    debugPrint("Synchronizing time...", false);
    if (getLocalTime(&timeinfo)) {
      char timeStringBuff[50];
      strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%d %H:%M:%S", &timeinfo);
      debugPrint("OK - Current time: " + String(timeStringBuff));
      timeInitialized = true;
    } else {
      debugPrint("FAILED");
      timeInitialized = false;
      debugBlink(4, 200); // Error indicator
    }
    lastTimeSync = millis();
  }
  
  // Update device status periodically
  if (millis() - lastStatusUpdate > 60000) { // Every minute
    debugPrint("Updating device status...");
    updateDeviceStatus();
    lastStatusUpdate = millis();
  }
  
  // Check feeding schedules
  if (millis() - lastScheduleCheck > 30000) { // Every 30 seconds
    debugPrint("Checking feeding schedules...");
    checkSchedules();
    lastScheduleCheck = millis();
  }
  
  // Check for manual feed commands
  debugPrint("Checking for manual feed commands...");
  checkForManualFeedCommand();
  
  // Check food level and update
  debugPrint("Updating food and battery levels...");
  updateFoodLevel();
  
  // Blink LED once to indicate normal operation
  if (DEBUG_LED_ENABLED && millis() - debugTimestamp > 10000) { // Every 10 seconds
    debugBlink(1, 50);
    debugTimestamp = millis();
  }
  
  delay(1000); // Small delay to prevent excessive API calls
}

// Update device status in Supabase
void updateDeviceStatus() {
  String deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  
  debugPrint("Updating device status for ID: " + deviceId);
  
  // Get current time
  time_t now;
  time(&now);
  
  // Create JSON payload
  JsonDocument doc;
  doc["status"] = "online";
  doc["last_seen"] = now;
  doc["ip_address"] = WiFi.localIP().toString();
  doc["wifi_strength"] = WiFi.RSSI();
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  debugPrint("Status payload: " + jsonPayload);
  
  // Send to Supabase
  String url = String(SUPABASE_URL) + "/rest/v1/devices?id=eq." + deviceId;
  debugPrint("Sending PATCH request to: " + url);
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
  http.addHeader("Prefer", "return=minimal");
  
  unsigned long requestStartTime = millis();
  int httpResponseCode = http.PATCH(jsonPayload);
  unsigned long requestDuration = millis() - requestStartTime;
  
  if (httpResponseCode == 204) {
    debugPrint("Device status updated successfully (" + String(requestDuration) + "ms)");
    supabaseConnected = true;
  } else {
    debugPrint("Error updating device status: " + String(httpResponseCode));
    debugPrint("Response: " + http.getString());
    supabaseConnected = false;
    debugBlink(3, 200); // Error indicator
  }
  
  http.end();
}

// Load feeding schedules from Supabase
void loadSchedules() {
  String deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  
  debugPrint("Loading feeding schedules for device: " + deviceId);
  
  String url = String(SUPABASE_URL) + "/rest/v1/feeding_schedules?device_id=eq." + deviceId + "&select=*";
  debugPrint("Sending GET request to: " + url);
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
  
  unsigned long requestStartTime = millis();
  int httpResponseCode = http.GET();
  unsigned long requestDuration = millis() - requestStartTime;
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    debugPrint("Received schedule data (" + String(requestDuration) + "ms)");
    debugPrint("Response size: " + String(response.length()) + " bytes");
    
    // Parse JSON response
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (error) {
      debugPrint("ERROR: deserializeJson() failed: " + String(error.c_str()));
      debugBlink(4, 200); // Error indicator
      return;
    }
    
    // Clear existing schedules
    scheduleCount = 0;
    
    // Process schedules
    JsonArray array = doc.as<JsonArray>();
    debugPrint("Found " + String(array.size()) + " schedules in database");
    
    for (JsonObject obj : array) {
      if (scheduleCount < 10) { // Maximum 10 schedules
        schedules[scheduleCount].id = obj["id"].as<String>();
        schedules[scheduleCount].time = obj["time"].as<String>();
        schedules[scheduleCount].amount = obj["amount"].as<int>();
        schedules[scheduleCount].enabled = obj["enabled"].as<bool>();
        
        // Parse days
        JsonArray days = obj["days"].as<JsonArray>();
        for (int i = 0; i < 7; i++) {
          schedules[scheduleCount].days[i] = days[i].as<bool>();
        }
        
        debugPrint("Schedule " + String(scheduleCount+1) + ": " + 
                  schedules[scheduleCount].time + ", " + 
                  String(schedules[scheduleCount].amount) + "g, " + 
                  (schedules[scheduleCount].enabled ? "enabled" : "disabled"));
        
        scheduleCount++;
      } else {
        debugPrint("WARNING: Maximum schedule limit reached (10). Ignoring additional schedules.");
        break;
      }
    }
    
    debugPrint("Successfully loaded " + String(scheduleCount) + " schedules");
    debugBlink(2); // Success indicator
  } else {
    debugPrint("ERROR: Failed to load schedules: " + String(httpResponseCode));
    debugPrint("Response: " + http.getString());
    debugBlink(4, 200); // Error indicator
  }
  
  http.end();
}

// Check if any scheduled feeding is due
void checkSchedules() {
  debugPrint("Checking feeding schedules...");
  
  if (!getLocalTime(&timeinfo)) {
    debugPrint("ERROR: Failed to obtain time");
    timeInitialized = false;
    debugBlink(4, 200); // Error indicator
    return;
  }
  
  char timeStr[6];
  sprintf(timeStr, "%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min);
  String currentTime = String(timeStr);
  int currentDay = timeinfo.tm_wday; // 0 = Sunday
  
  char dayNames[7][4] = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
  debugPrint("Current time: " + currentTime + ", Day: " + String(dayNames[currentDay]));
  
  if (scheduleCount == 0) {
    debugPrint("No feeding schedules found");
    return;
  }
  
  debugPrint("Checking " + String(scheduleCount) + " schedules...");
  
  for (int i = 0; i < scheduleCount; i++) {
    debugPrint("Schedule " + String(i+1) + ": " + schedules[i].time + 
              ", enabled: " + (schedules[i].enabled ? "yes" : "no") + 
              ", today: " + (schedules[i].days[currentDay] ? "yes" : "no"));
    
    if (schedules[i].enabled && 
        schedules[i].days[currentDay] && 
        currentTime == schedules[i].time) {
      
      // Time to feed!
      debugPrint("MATCH FOUND! Scheduled feeding: " + 
                String(schedules[i].amount) + " grams");
      debugBlink(3); // Schedule match indicator
      
      feed(schedules[i].amount);
      
      // Log feeding event
      debugPrint("Logging scheduled feeding event...");
      logFeedingEvent(schedules[i].amount, "scheduled");
      
      // Small delay to prevent multiple triggers
      debugPrint("Waiting 60 seconds to prevent multiple triggers...");
      delay(60000);
    }
  }
  
  debugPrint("Schedule check complete");
}

// Check for manual feed commands from Supabase
void checkForManualFeedCommand() {
  debugPrint("Checking for manual feed commands...");
  
  String deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  
  String url = String(SUPABASE_URL) + "/rest/v1/feed_commands?device_id=eq." + deviceId + "&status=eq.pending&select=*";
  debugPrint("Sending GET request to: " + url);
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
  
  unsigned long requestStartTime = millis();
  int httpResponseCode = http.GET();
  unsigned long requestDuration = millis() - requestStartTime;
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    debugPrint("Received response (" + String(requestDuration) + "ms)");
    debugPrint("Response size: " + String(response.length()) + " bytes");
    
    // Parse JSON response
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (error) {
      debugPrint("ERROR: deserializeJson() failed: " + String(error.c_str()));
      debugBlink(4, 200); // Error indicator
      return;
    }
    
    // Process commands
    JsonArray array = doc.as<JsonArray>();
    int commandCount = array.size();
    
    if (commandCount == 0) {
      debugPrint("No pending feed commands found");
      return;
    }
    
    debugPrint("Found " + String(commandCount) + " pending feed commands");
    debugBlink(2); // Command found indicator
    
    for (JsonObject obj : array) {
      String commandId = obj["id"].as<String>();
      int amount = obj["amount"].as<int>();
      String userId = obj["user_id"].as<String>();
      
      // Execute feed command
      debugPrint("========== MANUAL FEEDING COMMAND ==========");
      debugPrint("Command ID: " + commandId);
      debugPrint("User ID: " + userId);
      debugPrint("Amount: " + String(amount) + " grams");
      
      feed(amount);
      
      // Log feeding event
      debugPrint("Logging manual feeding event...");
      logFeedingEvent(amount, "manual");
      
      // Update command status to completed
      debugPrint("Updating command status to 'completed'...");
      updateCommandStatus(commandId, "completed");
      
      debugPrint("======= MANUAL FEEDING COMMAND COMPLETE =======");
    }
  } else {
    debugPrint("ERROR: Failed to check feed commands: " + String(httpResponseCode));
    debugPrint("Response: " + http.getString());
    debugBlink(4, 200); // Error indicator
  }
  
  http.end();
}

// Update command status in Supabase
void updateCommandStatus(String commandId, String status) {
  debugPrint("Updating command status for ID: " + commandId + " to '" + status + "'");
  
  JsonDocument doc;
  doc["status"] = status;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  debugPrint("Status update payload: " + jsonPayload);
  
  String url = String(SUPABASE_URL) + "/rest/v1/feed_commands?id=eq." + commandId;
  debugPrint("Sending PATCH request to: " + url);
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
  http.addHeader("Prefer", "return=minimal");
  
  unsigned long requestStartTime = millis();
  int httpResponseCode = http.PATCH(jsonPayload);
  unsigned long requestDuration = millis() - requestStartTime;
  
  if (httpResponseCode == 204) {
    debugPrint("Command status updated successfully (" + String(requestDuration) + "ms)");
  } else {
    debugPrint("ERROR: Failed to update command status: " + String(httpResponseCode));
    debugPrint("Response: " + http.getString());
    debugBlink(3, 200); // Error indicator
  }
  
  http.end();
}

// Log feeding event to Supabase
void logFeedingEvent(int amount, String type) {
  debugPrint("Logging feeding event: " + String(amount) + "g, type: " + type);
  
  String deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  
  // Get current time
  time_t now;
  time(&now);
  
  // Create JSON payload
  JsonDocument doc;
  doc["device_id"] = deviceId;
  doc["amount"] = amount;
  doc["type"] = type;
  doc["timestamp"] = now;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  debugPrint("Feeding event payload: " + jsonPayload);
  
  // Send to Supabase
  String url = String(SUPABASE_URL) + "/rest/v1/feeding_history";
  debugPrint("Sending POST request to: " + url);
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
  http.addHeader("Prefer", "return=minimal");
  
  unsigned long requestStartTime = millis();
  int httpResponseCode = http.POST(jsonPayload);
  unsigned long requestDuration = millis() - requestStartTime;
  
  if (httpResponseCode == 201) {
    debugPrint("Feeding event logged successfully (" + String(requestDuration) + "ms)");
    debugBlink(2); // Success indicator
  } else {
    debugPrint("ERROR: Failed to log feeding event: " + String(httpResponseCode));
    debugPrint("Response: " + http.getString());
    debugBlink(3, 200); // Error indicator
  }
  
  http.end();
}

// Update food level in Supabase
void updateFoodLevel() {
  debugPrint("Updating food level in Supabase...");
  
  String deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  
  // Read food level from sensor
  int foodLevel = readFoodLevel();
  
  // Check if reading was successful
  if (foodLevel < 0) {
    debugPrint("ERROR: Failed to read food level, skipping update");
    return;
  }
  
  // Create JSON payload
  JsonDocument doc;
  doc["food_level"] = foodLevel;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  debugPrint("Food level payload: " + jsonPayload);
  
  // Send to Supabase
  String url = String(SUPABASE_URL) + "/rest/v1/devices?id=eq." + deviceId;
  debugPrint("Sending PATCH request to: " + url);
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
  http.addHeader("Prefer", "return=minimal");
  
  unsigned long requestStartTime = millis();
  int httpResponseCode = http.PATCH(jsonPayload);
  unsigned long requestDuration = millis() - requestStartTime;
  
  if (httpResponseCode == 204) {
    debugPrint("Food level updated successfully (" + String(requestDuration) + "ms)");
  } else {
    debugPrint("ERROR: Failed to update food level: " + String(httpResponseCode));
    debugPrint("Response: " + http.getString());
    debugBlink(3, 200); // Error indicator
  }
  
  http.end();
  
  // Also update battery level if available
  updateBatteryLevel();
}

// Update battery level in Supabase
void updateBatteryLevel() {
  debugPrint("Updating battery level in Supabase...");
  
  String deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  
  // Read battery level
  int batteryLevel = readBatteryLevel();
  
  // Create JSON payload
  JsonDocument doc;
  doc["battery_level"] = batteryLevel;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  debugPrint("Battery level payload: " + jsonPayload);
  
  // Send to Supabase
  String url = String(SUPABASE_URL) + "/rest/v1/devices?id=eq." + deviceId;
  debugPrint("Sending PATCH request to: " + url);
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
  http.addHeader("Prefer", "return=minimal");
  
  unsigned long requestStartTime = millis();
  int httpResponseCode = http.PATCH(jsonPayload);
  unsigned long requestDuration = millis() - requestStartTime;
  
  if (httpResponseCode == 204) {
    debugPrint("Battery level updated successfully (" + String(requestDuration) + "ms)");
  } else {
    debugPrint("ERROR: Failed to update battery level: " + String(httpResponseCode));
    debugPrint("Response: " + http.getString());
    debugBlink(3, 200); // Error indicator
  }
  
  http.end();
}

// Read food level from sensor
int readFoodLevel() {
  debugPrint("Reading food level from ultrasonic sensor...");
  
  // Using ultrasonic sensor to measure food level
  // Send a pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Measure the response
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  
  // Check if reading timed out
  if (duration == 0) {
    debugPrint("ERROR: Ultrasonic sensor reading timed out");
    debugBlink(3, 200); // Error indicator
    return -1; // Error value
  }
  
  // Calculate distance in cm
  float distance = duration * 0.034 / 2;
  
  debugPrint("Raw ultrasonic reading: " + String(duration) + " μs, " + 
            String(distance) + " cm");
  
  // Convert distance to food level percentage
  // Assuming 5cm is empty (0%) and 30cm is full (100%)
  int maxDistance = 30; // cm when container is empty
  int minDistance = 5;  // cm when container is full
  
  // Check for out-of-range readings
  if (distance < 2 || distance > 400) {
    debugPrint("WARNING: Ultrasonic reading out of valid range");
    debugBlink(2, 200); // Warning indicator
  }
  
  // Constrain the distance reading
  distance = constrain(distance, minDistance, maxDistance);
  
  // Map distance to percentage (inverted: closer = more food)
  int foodLevel = map(distance, maxDistance, minDistance, 0, 100);
  
  debugPrint("Food level: " + String(foodLevel) + "% (distance: " + 
            String(distance) + " cm)");
  
  // Check for low food level
  if (foodLevel < 20) {
    debugPrint("WARNING: Food level low (" + String(foodLevel) + "%)");
    debugBlink(3, 200); // Warning indicator
  }
  
  return foodLevel;
}

// Read battery level
int readBatteryLevel() {
  debugPrint("Reading battery level...");
  
  // Read analog value from battery monitoring pin
  int rawValue = analogRead(BATTERY_LEVEL_PIN);
  
  // Convert analog reading to voltage
  // ESP32 ADC is typically 12-bit (0-4095)
  float voltage = rawValue * (3.3 / 4095.0) * 2; // Multiply by 2 if using a voltage divider
  
  debugPrint("Raw ADC value: " + String(rawValue) + ", Voltage: " + 
            String(voltage, 2) + "V");
  
  // Convert voltage to percentage
  // Assuming 3.0V is 0% and 4.2V is 100% (for a LiPo battery)
  int percentage = map(voltage * 100, 300, 420, 0, 100);
  percentage = constrain(percentage, 0, 100);
  
  debugPrint("Battery level: " + String(percentage) + "%");
  
  // Check for low battery
  if (percentage < 20) {
    debugPrint("WARNING: Battery level low (" + String(percentage) + "%)");
    debugBlink(4, 200); // Warning indicator
  }
  
  return percentage;
}

// Feed function - dispenses food by rotating servo
void feed(int amount) {
  debugPrint("========== FEEDING OPERATION ==========");
  
  // Validate amount
  if (amount <= 0) {
    debugPrint("ERROR: Invalid feed amount");
    debugBlink(5, 100); // Error indicator
    return;
  }
  
  if (amount > MAX_FEED_AMOUNT) {
    debugPrint("WARNING: Feed amount exceeds maximum. Limiting to " + 
              String(MAX_FEED_AMOUNT) + " grams");
    amount = MAX_FEED_AMOUNT;
  }
  
  // Calculate feeding time based on amount
  int feedTimeMs = (amount * 1000) / FEED_AMOUNT_PER_SECOND;
  
  debugPrint("Feeding " + String(amount) + " grams for " + 
            String(feedTimeMs) + " ms");
  
  // Turn on status LED
  digitalWrite(LED_PIN, HIGH);
  
  // Check servo status
  if (!servoInitialized) {
    debugPrint("ERROR: Servo not initialized");
    debugBlink(5, 100); // Error indicator
    return;
  }
  
  // Open the feeder (rotate servo to open position)
  debugPrint("Opening feeder (servo to 180°)...");
  feederServo.write(180); // Open position
  
  // Wait for calculated time
  unsigned long startTime = millis();
  unsigned long endTime = startTime + feedTimeMs;
  
  debugPrint("Dispensing food...");
  while (millis() < endTime) {
    // Blink LED during feeding to indicate activity
    if (DEBUG_LED_ENABLED) {
      digitalWrite(LED_PIN, (millis() % 200 < 100) ? HIGH : LOW);
    }
    delay(50);
  }
  
  // Close the feeder (rotate servo back to closed position)
  debugPrint("Closing feeder (servo to 0°)...");
  feederServo.write(0); // Closed position
  
  // Turn off status LED
  digitalWrite(LED_PIN, LOW);
  
  // Calculate actual feeding duration
  unsigned long actualDuration = millis() - startTime;
  debugPrint("Feeding complete (actual duration: " + String(actualDuration) + " ms)");
  
  // Verify food level change if sensor available
  int beforeLevel = -1;
  int afterLevel = -1;
  
  if (FOOD_LEVEL_SENSOR_PIN > 0) {
    delay(1000); // Wait for food to settle
    afterLevel = readFoodLevel();
    
    debugPrint("Food level after feeding: " + String(afterLevel) + "%");
    
    if (beforeLevel > 0 && afterLevel >= beforeLevel) {
      debugPrint("WARNING: Food level did not decrease after feeding");
      debugPrint("This may indicate a feeding mechanism issue");
      debugBlink(3, 200); // Warning indicator
    }
  }
  
  debugPrint("======= FEEDING OPERATION COMPLETE =======");
}