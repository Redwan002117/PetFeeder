#include <Arduino.h>
#include "WiFiManager.h"
#include <ESP32Servo.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <time.h>

// Pin Definitions
#define SERVO_PIN 13
#define TRIG_PIN 5
#define ECHO_PIN 18
#define LED_PIN 2
#define BATTERY_LEVEL_PIN 35  // Pin for battery level monitoring

// Supabase credentials
#define SUPABASE_URL "https://your-project-id.supabase.co"
#define SUPABASE_API_KEY "your-supabase-anon-key"
#define SUPABASE_JWT_TOKEN "your-jwt-token" // Generated after user authentication

// Constants
#define FEED_AMOUNT_PER_SECOND 5 // grams per second
#define MAX_FEED_AMOUNT 100 // maximum amount in grams

// Create instances
WiFiManager wifiManager;
Servo feederServo;
WiFiClientSecure client;
HTTPClient http;

// Global variables
unsigned long lastStatusUpdate = 0;
unsigned long lastScheduleCheck = 0;
unsigned long lastTimeSync = 0;
struct tm timeinfo;

// Feeding schedule structure
struct FeedingSchedule {
    String id;
    String time;
    int amount;
    bool enabled;
    bool days[7]; // Sunday to Saturday
};

FeedingSchedule schedules[10]; // Maximum 10 schedules
int scheduleCount = 0;

// Function declarations
// Function declarations
void setupHardware();
void handleFeeding();
void updateFoodLevel();
void syncWithSupabase();
void updateDeviceStatus();
void loadSchedules();
void checkSchedules();
void checkForManualFeedCommand();
void updateCommandStatus(String commandId, String status);
void logFeedingEvent(int amount, String type);
void feed(int amount);
int readFoodLevel();
int readBatteryLevel();
void updateBatteryLevel();

void setup() {
    Serial.begin(115200);
    
    // Initialize hardware
    setupHardware();
    
    // Initialize EEPROM
    EEPROM.begin(512);
    
    // Start WiFi manager
    wifiManager.begin();
    
    // Wait for connection or hotspot mode
    while (!wifiManager.isConnected() && !wifiManager.isHotspotEnabled()) {
        delay(100);
    }
    
    if (wifiManager.isConnected()) {
        // Initialize time
        configTime(0, 0, "pool.ntp.org", "time.nist.gov");
        
        // Skip SSL certificate verification (for development only)
        client.setInsecure();
        
        // Update device status
        updateDeviceStatus();
        
        // Load feeding schedules
        loadSchedules();
    }
}

void loop() {
    // Update WiFi manager
    wifiManager.update();
    
    // If connected to WiFi, sync with Supabase
    if (wifiManager.isConnected()) {
        // Update time periodically
        if (millis() - lastTimeSync > 3600000) { // Every hour
            getLocalTime(&timeinfo);
            lastTimeSync = millis();
        }
        
        // Update device status periodically
        if (millis() - lastStatusUpdate > 60000) { // Every minute
            updateDeviceStatus();
            lastStatusUpdate = millis();
        }
        
        // Check feeding schedules
        if (millis() - lastScheduleCheck > 30000) { // Every 30 seconds
            checkSchedules();
            lastScheduleCheck = millis();
        }
        
        // Check for manual feed commands
        checkForManualFeedCommand();
        
        // Sync with Supabase
        syncWithSupabase();
    }
    
    // Handle local operations
    handleFeeding();
    updateFoodLevel();
    
    // Small delay to prevent tight loops
    delay(100);
}

void setupHardware() {
    // Initialize servo
    ESP32PWM::allocateTimer(0);
    feederServo.setPeriodHertz(50);
    feederServo.attach(SERVO_PIN);
    feederServo.write(0); // Initial position
    
    // Initialize ultrasonic sensor
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    
    // Initialize LED
    pinMode(LED_PIN, OUTPUT);
}

void handleFeeding() {
    // Implementation of feeding logic for offline mode
    // This will work when WiFi is not connected
    // For example, check a button press to trigger manual feeding
}

void updateFoodLevel() {
    // Read food level from sensor
    int foodLevel = readFoodLevel();
    
    // If connected to WiFi, update food level in Supabase
    if (wifiManager.isConnected()) {
        String deviceId = WiFi.macAddress();
        deviceId.replace(":", "");
        
        // Create JSON payload
        JsonDocument doc;
        doc["food_level"] = foodLevel;
        
        String jsonPayload;
        serializeJson(doc, jsonPayload);
        
        // Send to Supabase
        http.begin(client, String(SUPABASE_URL) + "/rest/v1/devices?id=eq." + deviceId);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("apikey", SUPABASE_API_KEY);
        http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
        http.addHeader("Prefer", "return=minimal");
        
        int httpResponseCode = http.PATCH(jsonPayload);
        
        if (httpResponseCode == 204) {
            Serial.println("Food level updated successfully");
        } else {
            Serial.print("Error updating food level: ");
            Serial.println(httpResponseCode);
        }
        
        http.end();
        
        // Also update battery level if available
        updateBatteryLevel();
    }
}

void syncWithSupabase() {
    // This function handles any additional synchronization with Supabase
    // It's called periodically when WiFi is connected
}

// Update device status in Supabase
void updateDeviceStatus() {
    String deviceId = WiFi.macAddress();
    deviceId.replace(":", "");
    
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
    
    // Send to Supabase
    http.begin(client, String(SUPABASE_URL) + "/rest/v1/devices?id=eq." + deviceId);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_API_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
    http.addHeader("Prefer", "return=minimal");
    
    int httpResponseCode = http.PATCH(jsonPayload);
    
    if (httpResponseCode == 204) {
        Serial.println("Device status updated successfully");
        digitalWrite(LED_PIN, HIGH); // Turn on LED to indicate online status
    } else {
        Serial.print("Error updating device status: ");
        Serial.println(httpResponseCode);
        digitalWrite(LED_PIN, LOW); // Turn off LED to indicate error
    }
    
    http.end();
}

// Load feeding schedules from Supabase
void loadSchedules() {
    String deviceId = WiFi.macAddress();
    deviceId.replace(":", "");
    
    http.begin(client, String(SUPABASE_URL) + "/rest/v1/feeding_schedules?device_id=eq." + deviceId + "&select=*");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_API_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
    
    int httpResponseCode = http.GET();
    
    if (httpResponseCode == 200) {
        String response = http.getString();
        
        // Parse JSON response
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, response);
        
        if (error) {
            Serial.print("deserializeJson() failed: ");
            Serial.println(error.c_str());
            return;
        }
        
        // Clear existing schedules
        scheduleCount = 0;
        
        // Process schedules
        JsonArray array = doc.as<JsonArray>();
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
                
                scheduleCount++;
            }
        }
        
        Serial.print("Loaded ");
        Serial.print(scheduleCount);
        Serial.println(" schedules");
    } else {
        Serial.print("Error loading schedules: ");
        Serial.println(httpResponseCode);
    }
    
    http.end();
}

// Check if any scheduled feeding is due
void checkSchedules() {
    if (!getLocalTime(&timeinfo)) {
        Serial.println("Failed to obtain time");
        return;
    }
    
    char timeStr[6];
    sprintf(timeStr, "%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min);
    String currentTime = String(timeStr);
    int currentDay = timeinfo.tm_wday; // 0 = Sunday
    
    for (int i = 0; i < scheduleCount; i++) {
        if (schedules[i].enabled && 
            schedules[i].days[currentDay] && 
            currentTime == schedules[i].time) {
            
            // Time to feed!
            Serial.print("Scheduled feeding: ");
            Serial.print(schedules[i].amount);
            Serial.println(" grams");
            
            feed(schedules[i].amount);
            
            // Log feeding event
            logFeedingEvent(schedules[i].amount, "scheduled");
            
            // Small delay to prevent multiple triggers
            delay(60000);
        }
    }
}

// Check for manual feed commands from Supabase
void checkForManualFeedCommand() {
    String deviceId = WiFi.macAddress();
    deviceId.replace(":", "");
    
    http.begin(client, String(SUPABASE_URL) + "/rest/v1/feed_commands?device_id=eq." + deviceId + "&status=eq.pending&select=*");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_API_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
    
    int httpResponseCode = http.GET();
    
    if (httpResponseCode == 200) {
        String response = http.getString();
        
        // Parse JSON response
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, response);
        
        if (error) {
            Serial.print("deserializeJson() failed: ");
            Serial.println(error.c_str());
            return;
        }
        
        // Process commands
        JsonArray array = doc.as<JsonArray>();
        for (JsonObject obj : array) {
            String commandId = obj["id"].as<String>();
            int amount = obj["amount"].as<int>();
            
            // Execute feed command
            Serial.print("Manual feeding command: ");
            Serial.print(amount);
            Serial.println(" grams");
            
            feed(amount);
            
            // Log feeding event
            logFeedingEvent(amount, "manual");
            
            // Update command status to completed
            updateCommandStatus(commandId, "completed");
        }
    } else {
        Serial.print("Error checking feed commands: ");
        Serial.println(httpResponseCode);
    }
    
    http.end();
}

// Update command status in Supabase
void updateCommandStatus(String commandId, String status) {
    JsonDocument doc;
    doc["status"] = status;
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    http.begin(client, String(SUPABASE_URL) + "/rest/v1/feed_commands?id=eq." + commandId);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_API_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
    http.addHeader("Prefer", "return=minimal");
    
    int httpResponseCode = http.PATCH(jsonPayload);
    
    if (httpResponseCode == 204) {
        Serial.println("Command status updated successfully");
    } else {
        Serial.print("Error updating command status: ");
        Serial.println(httpResponseCode);
    }
    
    http.end();
}

// Log feeding event to Supabase
void logFeedingEvent(int amount, String type) {
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
    
    // Send to Supabase
    http.begin(client, String(SUPABASE_URL) + "/rest/v1/feeding_history");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_API_KEY);
    http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
    http.addHeader("Prefer", "return=minimal");
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode == 201) {
        Serial.println("Feeding event logged successfully");
    } else {
        Serial.print("Error logging feeding event: ");
        Serial.println(httpResponseCode);
    }
    
    http.end();
}

// Feed function - dispenses food by rotating servo
void feed(int amount) {
    // Validate amount
    if (amount <= 0) {
        Serial.println("Invalid feed amount");
        return;
    }
    
    if (amount > MAX_FEED_AMOUNT) {
        Serial.print("Feed amount exceeds maximum. Limiting to ");
        Serial.print(MAX_FEED_AMOUNT);
        Serial.println(" grams");
        amount = MAX_FEED_AMOUNT;
    }
    
    // Calculate feeding time based on amount
    int feedTimeMs = (amount * 1000) / FEED_AMOUNT_PER_SECOND;
    
    Serial.print("Feeding ");
    Serial.print(amount);
    Serial.print(" grams for ");
    Serial.print(feedTimeMs);
    Serial.println(" ms");
    
    // Turn on status LED
    digitalWrite(LED_PIN, HIGH);
    
    // Open the feeder (rotate servo to open position)
    feederServo.write(180); // Open position
    
    // Wait for calculated time
    delay(feedTimeMs);
    
    // Close the feeder (rotate servo back to closed position)
    feederServo.write(0); // Closed position
    
    // Turn off status LED
    digitalWrite(LED_PIN, LOW);
    
    Serial.println("Feeding complete");
}

// Read food level from sensor
int readFoodLevel() {
    // Using ultrasonic sensor to measure food level
    // Send a pulse
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    
    // Measure the response
    long duration = pulseIn(ECHO_PIN, HIGH);
    
    // Calculate distance in cm
    int distance = duration * 0.034 / 2;
    
    // Convert distance to food level percentage
    // Assuming 5cm is empty (0%) and 30cm is full (100%)
    int maxDistance = 30; // cm when container is empty
    int minDistance = 5;  // cm when container is full
    
    // Constrain the distance reading
    distance = constrain(distance, minDistance, maxDistance);
    
    // Map distance to percentage (inverted: closer = more food)
    int foodLevel = map(distance, maxDistance, minDistance, 0, 100);
    
    Serial.print("Food level: ");
    Serial.print(foodLevel);
    Serial.println("%");
    
    return foodLevel;
}

// Read battery level
int readBatteryLevel() {
    // Read analog value from battery monitoring pin
    int rawValue = analogRead(BATTERY_LEVEL_PIN);
    
    // Convert analog reading to voltage
    // ESP32 ADC is typically 12-bit (0-4095)
    float voltage = rawValue * (3.3 / 4095.0) * 2; // Multiply by 2 if using a voltage divider
    
    // Convert voltage to percentage
    // Assuming 3.0V is 0% and 4.2V is 100% (for a LiPo battery)
    int percentage = map(voltage * 100, 300, 420, 0, 100);
    percentage = constrain(percentage, 0, 100);
    
    Serial.print("Battery level: ");
    Serial.print(percentage);
    Serial.println("%");
    
    return percentage;
}

// Update battery level in Supabase
void updateBatteryLevel() {
    if (wifiManager.isConnected()) {
        String deviceId = WiFi.macAddress();
        deviceId.replace(":", "");
        
        // Read battery level
        int batteryLevel = readBatteryLevel();
        
        // Create JSON payload
        JsonDocument doc;
        doc["battery_level"] = batteryLevel;
        
        String jsonPayload;
        serializeJson(doc, jsonPayload);
        
        // Send to Supabase
        http.begin(client, String(SUPABASE_URL) + "/rest/v1/devices?id=eq." + deviceId);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("apikey", SUPABASE_API_KEY);
        http.addHeader("Authorization", "Bearer " + String(SUPABASE_JWT_TOKEN));
        http.addHeader("Prefer", "return=minimal");
        
        int httpResponseCode = http.PATCH(jsonPayload);
        
        if (httpResponseCode == 204) {
            Serial.println("Battery level updated successfully");
        } else {
            Serial.print("Error updating battery level: ");
            Serial.println(httpResponseCode);
        }
        
        http.end();
    }
}