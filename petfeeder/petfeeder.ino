// Include necessary libraries
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <EEPROM.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <WiFiManager.h>  // Include WiFiManager library
#include <SPIFFS.h>
#include "time.h"

// Firebase credentials
#define FIREBASE_HOST "catfeeder002117-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "AIzaSyDFEVV0zXBXeZkzdcVz6sARU5pHxJL80N4"

// Define FirebaseConfig and FirebaseAuth objects
FirebaseConfig fbConfig;
FirebaseAuth fbAuth;

// Define Firebase Data object
FirebaseData firebaseData;
FirebaseJson json;
FirebaseJsonData jsonData;

// Pin definitions with comments for physical connections
#define SERVO_PIN 13        // Connect servo signal to GPIO 13
#define FOOD_LEVEL_SENSOR_PIN 34  // Connect ultrasonic sensor echo to GPIO 34
#define LED_PIN 2          // Onboard LED for status
#define MANUAL_FEED_PIN 4  // Connect push button to GPIO 4 for manual feed
#define TRIG_PIN 5
#define ECHO_PIN 18

// Servo settings
Servo feedServo;
const int SERVO_CLOSED_POSITION = 0;
const int SERVO_OPEN_POSITION = 180;

// Feeding amounts (in milliseconds the servo stays open)
const int SMALL_AMOUNT = 500;
const int MEDIUM_AMOUNT = 1000;
const int LARGE_AMOUNT = 1500;

// NTP Client for time synchronization
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

// Schedule structure
struct Schedule {
  int hour;
  int minute;
  int amount; // 1=small, 2=medium, 3=large
  bool enabled;
  bool executed; // To track if schedule has been executed today
};

// Maximum number of schedules
const int MAX_SCHEDULES = 5;
Schedule schedules[MAX_SCHEDULES];

// Last feed time tracking
unsigned long lastFeedTime = 0;
const unsigned long MIN_FEED_INTERVAL = 10000; // Minimum 10 seconds between feeds

// Food level tracking
int foodLevel = 0;
bool lowFoodAlertSent = false;
const int LOW_FOOD_THRESHOLD = 20; // Percentage

// WiFiManager instance
WiFiManager wm;

// Device ID
String deviceID = ""; // Will be set to MAC address

// Global variables
bool isAPMode = false;
unsigned long lastFirebaseRetry = 0;
const unsigned long FIREBASE_RETRY_INTERVAL = 60000;

// WebServer instance
WebServer server(80);

// Firebase objects and variables
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool signupOK = false;

// Function declarations
void setupHardware();
void setupFirebase();
void setupNTP();
void handleRoot();
void handleFeed();
void handleSchedule();
void saveSchedulesToEEPROM();
void loadSchedulesFromEEPROM();
void updateFoodLevel();
void feed(int amount);
void checkSchedules();
void handleManualFeedButton();
void handleOnlineOperations();
void handleLocalOperations();
void setupWiFi();
void setupLocalWebServer();
void dispenseFeed(int amount);
int getFoodLevel();
void handleManualFeed();
void checkWiFiStatus();

void setup() {
  Serial.begin(115200);
  
  // Initialize EEPROM
  EEPROM.begin(512);
  
  // Initialize hardware
  setupHardware();
  
  // Get device ID from MAC address
  deviceID = WiFi.macAddress();
  deviceID.replace(":", "");
  Serial.print("Device ID: ");
  Serial.println(deviceID);

  // Load schedules from EEPROM
  loadSchedulesFromEEPROM();

  // Configure WiFiManager
  wm.setDebugOutput(false); // Disable debug output
  wm.setConfigPortalTimeout(180);
  wm.setAPCallback([](WiFiManager* wm) {
    isAPMode = true;
    setupLocalWebServer();
  });

  // Try to connect to WiFi
  if (!wm.autoConnect("PetFeeder-Setup")) {
    Serial.println("Failed to connect and hit timeout");
    ESP.restart();
  }

  isAPMode = (WiFi.getMode() == WIFI_AP || WiFi.getMode() == WIFI_AP_STA);
  
  if (!isAPMode) {
    setupFirebase();
    setupNTP();
    registerDevice();
    loadSchedules(); // Load schedules from Firebase
  }
}

void loop() {
  wm.process();
  
  // Handle manual feed button
  handleManualFeedButton();
  
  if (WiFi.status() == WL_CONNECTED && !isAPMode) {
    handleOnlineOperations();
  } else {
    handleLocalOperations();
  }
  
  // Always update food level and LED status
  updateFoodLevel();
  updateLEDStatus();
  
  delay(100);
}

void setupHardware() {
  // Initialize pins
  pinMode(FOOD_LEVEL_SENSOR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(MANUAL_FEED_PIN, INPUT_PULLUP);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Initialize servo
  feedServo.attach(SERVO_PIN);
  feedServo.write(SERVO_CLOSED_POSITION);
}

void setupLocalWebServer() {
  server.on("/", handleRoot);
  server.on("/feed", HTTP_POST, handleFeed);
  server.begin();
  Serial.println("HTTP server started");
}

void handleRoot() {
  String html = "<html><body>";
  html += "<h1>PetFeeder Local Control</h1>";
  html += "<p>Food Level: " + String(foodLevel) + "%</p>";
  html += "<form action='/feed' method='post'>";
  html += "<select name='amount'>";
  html += "<option value='small'>Small</option>";
  html += "<option value='medium'>Medium</option>";
  html += "<option value='large'>Large</option>";
  html += "</select>";
  html += "<input type='submit' value='Feed Now'>";
  html += "</form>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleFeed() {
  if (server.hasArg("amount")) {
    String amount = server.arg("amount");
    int feedAmount = MEDIUM_AMOUNT;
    
    if (amount == "small") {
      feedAmount = SMALL_AMOUNT;
    } else if (amount == "large") {
      feedAmount = LARGE_AMOUNT;
    }
    
    feed(feedAmount);
    server.send(200, "text/plain", "Feeding successful");
  } else {
    server.send(400, "text/plain", "Amount parameter required");
  }
}

void handleManualFeedButton() {
  static unsigned long lastButtonPress = 0;
  static bool lastButtonState = HIGH;
  
  bool buttonState = digitalRead(MANUAL_FEED_PIN);
  
  if (buttonState == LOW && lastButtonState == HIGH && 
      (millis() - lastButtonPress > 1000)) {
    feed(2); // Medium amount for manual feed
    lastButtonPress = millis();
  }
  
  lastButtonState = buttonState;
}

void saveSchedulesToEEPROM() {
  EEPROM.put(0, schedules);
  EEPROM.commit();
}

void loadSchedulesFromEEPROM() {
  EEPROM.get(0, schedules);
}

void updateLEDStatus() {
  if (foodLevel < LOW_FOOD_THRESHOLD) {
    digitalWrite(LED_PIN, (millis() / 500) % 2); // Blink for low food
  } else if (!WiFi.isConnected()) {
    digitalWrite(LED_PIN, (millis() / 1000) % 2); // Slow blink for no WiFi
  } else {
    digitalWrite(LED_PIN, HIGH); // Solid on for normal operation
  }
}

void setupFirebase() {
  // Initialize Firebase with the newer API
  fbConfig.host = FIREBASE_HOST;
  fbConfig.api_key = FIREBASE_AUTH;
  
  fbAuth.user.email = ""; // Can be left empty for database-only operations
  fbAuth.user.password = ""; // Can be left empty for database-only operations
  
  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);
}

void setupNTP() {
  // Initialize NTP client
  timeClient.begin();
  timeClient.setTimeOffset(21600); // GMT+6 for Dhaka/Bangladesh
}

void registerDevice() {
  String path = "/devices/" + deviceID;
  
  // Check if device already exists
  if (Firebase.getJSON(firebaseData, path)) {
    Serial.println("Device already registered");
    return;
  }
  
  // Register new device
  json.clear();
  json.set("deviceID", deviceID);
  json.set("name", "Cat Feeder");
  json.set("status", "online");
  json.set("lastSeen", timeClient.getEpochTime());
  json.set("foodLevel", 100);
  
  if (Firebase.setJSON(firebaseData, path, json)) {
    Serial.println("Device registered successfully");
  } else {
    Serial.println("Failed to register device");
    Serial.println(firebaseData.errorReason());
  }
}

void updateFoodLevel() {
  // Read analog value from food level sensor
  int sensorValue = analogRead(FOOD_LEVEL_SENSOR_PIN);
  
  // Convert to percentage (adjust min/max values based on your sensor)
  foodLevel = map(sensorValue, 0, 4095, 0, 100);
  
  // Update Firebase if connected
  if (WiFi.status() == WL_CONNECTED) {
    String path = "/devices/" + deviceID + "/foodLevel";
    if (Firebase.setInt(firebaseData, path, foodLevel)) {
      Serial.print("Food level updated: ");
      Serial.println(foodLevel);
      
      // Check if food level is low
      if (foodLevel < LOW_FOOD_THRESHOLD && !lowFoodAlertSent) {
        sendLowFoodAlert();
        lowFoodAlertSent = true;
      } else if (foodLevel >= LOW_FOOD_THRESHOLD) {
        lowFoodAlertSent = false;
      }
    }
  }
  
  // Update LED indicator regardless of connection status
  updateLEDStatus();
}

void sendLowFoodAlert() {
  String path = "/devices/" + deviceID + "/alerts";
  
  json.clear();
  json.set("type", "lowFood");
  json.set("message", "Food level is low. Please refill soon.");
  json.set("timestamp", timeClient.getEpochTime());
  
  if (Firebase.pushJSON(firebaseData, path, json)) {
    Serial.println("Low food alert sent");
  } else {
    Serial.println("Failed to send low food alert");
    Serial.println(firebaseData.errorReason());
  }
}

void checkForManualFeedCommand() {
  String path = "/devices/" + deviceID + "/feedCommand";
  
  if (Firebase.getJSON(firebaseData, path)) {
    String jsonStr = firebaseData.jsonString();
    
    // Parse JSON using ArduinoJson
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, jsonStr);
    
    if (error) {
      Serial.print("JSON parsing failed: ");
      Serial.println(error.c_str());
      return;
    }
    
    // Check if there's a pending feed command
    bool hasPendingCommand = false;
    int amount = 0;
    
    if (doc.containsKey("pending") && doc["pending"].as<bool>()) {
      hasPendingCommand = true;
      
      if (doc.containsKey("amount")) {
        amount = doc["amount"].as<int>();
      }
    }
    
    if (hasPendingCommand) {
      // Execute feed command
      feed(amount);
      
      // Update command status
      json.clear();
      json.set("pending", false);
      json.set("lastExecuted", timeClient.getEpochTime());
      
      if (Firebase.setJSON(firebaseData, path, json)) {
        Serial.println("Feed command executed and updated");
      } else {
        Serial.println("Failed to update feed command status");
        Serial.println(firebaseData.errorReason());
      }
    }
  } else {
    Serial.println("Failed to check for feed command");
    Serial.println(firebaseData.errorReason());
  }
}

void feed(int amount) {
  // Check if enough time has passed since last feed
  if (millis() - lastFeedTime < MIN_FEED_INTERVAL) {
    Serial.println("Feed request too soon after last feed, ignoring");
    return;
  }
  
  int feedDuration = MEDIUM_AMOUNT; // Default to medium
  
  // Set duration based on amount
  if (amount == 1) feedDuration = SMALL_AMOUNT;
  else if (amount == 2) feedDuration = MEDIUM_AMOUNT;
  else if (amount == 3) feedDuration = LARGE_AMOUNT;
  
  Serial.print("Feeding amount: ");
  Serial.println(amount);
  
  // Open servo
  feedServo.write(SERVO_OPEN_POSITION);
  delay(feedDuration);
  
  // Close servo
  feedServo.write(SERVO_CLOSED_POSITION);
  
  // Update last feed time
  lastFeedTime = millis();
  
  // Log feeding event if online
  if (WiFi.status() == WL_CONNECTED) {
    logFeedingEvent(amount);
  }
  
  // Update food level
  updateFoodLevel();
}

void logFeedingEvent(int amount) {
  String path = "/devices/" + deviceID + "/feedingHistory";
  
  json.clear();
  json.set("timestamp", timeClient.getEpochTime());
  json.set("amount", amount);
  json.set("type", "manual");
  
  if (Firebase.pushJSON(firebaseData, path, json)) {
    Serial.println("Feeding event logged");
  } else {
    Serial.println("Failed to log feeding event");
    Serial.println(firebaseData.errorReason());
  }
}

void loadSchedules() {
  String path = "/devices/" + deviceID + "/schedules";
  
  if (Firebase.getJSON(firebaseData, path)) {
    String jsonStr = firebaseData.jsonString();
    
    // Parse JSON using ArduinoJson
    DynamicJsonDocument doc(4096); // Adjust size as needed
    DeserializationError error = deserializeJson(doc, jsonStr);
    
    if (error) {
      Serial.print("JSON parsing failed: ");
      Serial.println(error.c_str());
      return;
    }
    
    // Reset schedules
    for (int i = 0; i < MAX_SCHEDULES; i++) {
      schedules[i].enabled = false;
      schedules[i].executed = false;
    }
    
    // Process each schedule
    int scheduleIndex = 0;
    for (JsonPair kv : doc.as<JsonObject>()) {
      if (scheduleIndex >= MAX_SCHEDULES) break;
      
      JsonObject scheduleObj = kv.value().as<JsonObject>();
      
      if (scheduleObj.containsKey("enabled") && 
          scheduleObj.containsKey("hour") && 
          scheduleObj.containsKey("minute") && 
          scheduleObj.containsKey("amount")) {
        
        schedules[scheduleIndex].enabled = scheduleObj["enabled"].as<bool>();
        schedules[scheduleIndex].hour = scheduleObj["hour"].as<int>();
        schedules[scheduleIndex].minute = scheduleObj["minute"].as<int>();
        schedules[scheduleIndex].amount = scheduleObj["amount"].as<int>();
        schedules[scheduleIndex].executed = false;
        
        scheduleIndex++;
      }
    }
    
    Serial.print("Loaded ");
    Serial.print(scheduleIndex);
    Serial.println(" schedules");
  } else {
    Serial.println("Failed to load schedules");
    Serial.println(firebaseData.errorReason());
  }
}

void checkSchedules() {
  // Get current time
  int currentHour = timeClient.getHours();
  int currentMinute = timeClient.getMinutes();
  
  // Check if day has changed (midnight)
  static int lastDay = -1;
  int currentDay = timeClient.getDay();
  
  if (currentDay != lastDay) {
    // Reset executed flag for all schedules
    for (int i = 0; i < MAX_SCHEDULES; i++) {
      schedules[i].executed = false;
    }
    lastDay = currentDay;
  }
  
  // Check each schedule
  for (int i = 0; i < MAX_SCHEDULES; i++) {
    if (schedules[i].enabled && !schedules[i].executed) {
      if (currentHour == schedules[i].hour && currentMinute == schedules[i].minute) {
        // Time to feed!
        feed(schedules[i].amount);
        schedules[i].executed = true;
        
        // Update feeding type in log
        String path = "/devices/" + deviceID + "/feedingHistory";
        
        if (Firebase.getJSON(firebaseData, path + "/-")) {
          String lastEntryStr = firebaseData.jsonString();
          DynamicJsonDocument lastEntryDoc(1024);
          deserializeJson(lastEntryDoc, lastEntryStr);
          
          lastEntryDoc["type"] = "scheduled";
          
          String updatedJson;
          serializeJson(lastEntryDoc, updatedJson);
          
          FirebaseJson updateJson;
          updateJson.setJsonData(updatedJson);
          
          if (Firebase.setJSON(firebaseData, path + "/-", updateJson)) {
            Serial.println("Updated feeding type to scheduled");
          }
        }
      }
    }
  }
}

void handleOnlineOperations() {
  timeClient.update();
  
  // Retry Firebase connection if needed
  if (!Firebase.ready() && (millis() - lastFirebaseRetry > FIREBASE_RETRY_INTERVAL)) {
    setupFirebase();
    lastFirebaseRetry = millis();
  }
  
  if (Firebase.ready()) {
    checkForManualFeedCommand();
    checkSchedules();
    
    static unsigned long lastFoodLevelCheck = 0;
    if (millis() - lastFoodLevelCheck > 60000) {
      updateFoodLevel();
      lastFoodLevelCheck = millis();
    }
  }
}

void handleLocalOperations() {
  if (WiFi.status() != WL_CONNECTED) {
    // Handle local operations when WiFi is not connected
    server.handleClient();
  }
}

void handleSchedule() {
  // This function would handle manual feeding through the AP web interface
  if (WiFi.getMode() == WIFI_AP || WiFi.getMode() == WIFI_AP_STA) {
    // Implementation for local feeding control
    // This would be triggered through the AP web interface
  }
}

void setupWiFi() {
  // Implementation of setupWiFi function
}

void dispenseFeed(int amount) {
  // Implementation of dispenseFeed function
}

int getFoodLevel() {
  // Implementation of getFoodLevel function
  return 0; // Placeholder return, actual implementation needed
}

void handleManualFeed() {
  // Implementation of handleManualFeed function
}

void checkWiFiStatus() {
  // Implementation of checkWiFiStatus function
}