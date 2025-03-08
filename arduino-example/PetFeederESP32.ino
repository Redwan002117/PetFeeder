/**
 * Auto Cat Feeder - ESP32 Firebase Integration Example
 * 
 * This example demonstrates how to connect an ESP32 to the Firebase Realtime Database
 * to control a pet feeder device.
 * 
 * Required Libraries:
 * - Firebase ESP32 Client by Mobizt
 * - ArduinoJson
 * - ESP32 Servo
 * 
 * Hardware:
 * - ESP32 development board
 * - Servo motor for dispensing food
 * - Optional: Food level sensor
 * - Optional: Battery level monitoring
 * 
 * @author GamerNo002117@redwancodes.com
 */

#include <WiFi.h>
#include <FirebaseESP32.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <time.h>

// WiFi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase credentials
#define FIREBASE_HOST "catfeeder002117-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "YOUR_FIREBASE_AUTH_TOKEN"

// User ID - this should be set during device setup
#define USER_ID "YOUR_USER_ID"

// Hardware pins
#define SERVO_PIN 13
#define FOOD_LEVEL_SENSOR_PIN 34
#define BATTERY_LEVEL_PIN 35

// Constants
#define FEED_AMOUNT_PER_SECOND 5 // grams per second
#define MAX_FEED_AMOUNT 100 // maximum amount in grams

// Global variables
FirebaseData firebaseData;
FirebaseJson json;
Servo feederServo;

unsigned long lastStatusUpdate = 0;
unsigned long lastScheduleCheck = 0;
unsigned long lastTimeSync = 0;

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

void setup() {
  Serial.begin(115200);
  
  // Initialize hardware
  feederServo.attach(SERVO_PIN);
  feederServo.write(0); // Initial position
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // Initialize time
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  
  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
  
  // Set database read timeout
  Firebase.setReadTimeout(firebaseData, 1000 * 60);
  // Set database size limit
  Firebase.setwriteSizeLimit(firebaseData, "tiny");
  
  // Update device status
  updateDeviceStatus();
  
  // Load feeding schedules
  loadFeedingSchedules();
  
  Serial.println("Setup completed");
}

void loop() {
  // Update device status every 5 minutes
  if (millis() - lastStatusUpdate > 5 * 60 * 1000) {
    updateDeviceStatus();
    lastStatusUpdate = millis();
  }
  
  // Sync time every hour
  if (millis() - lastTimeSync > 60 * 60 * 1000) {
    syncTime();
    lastTimeSync = millis();
  }
  
  // Check for manual feeding requests
  checkManualFeedRequest();
  
  // Check feeding schedules every minute
  if (millis() - lastScheduleCheck > 60 * 1000) {
    checkFeedingSchedules();
    lastScheduleCheck = millis();
  }
  
  // Check for WiFi credentials update
  checkWiFiCredentialsUpdate();
  
  delay(1000);
}

void updateDeviceStatus() {
  int foodLevel = readFoodLevel();
  int batteryLevel = readBatteryLevel();
  
  json.clear();
  json.add("online", true);
  json.add("lastSeen", getTimestamp());
  json.add("foodLevel", foodLevel);
  json.add("batteryLevel", batteryLevel);
  json.add("firmwareVersion", "1.0.0");
  
  String path = "/users/" + String(USER_ID) + "/deviceStatus";
  
  if (Firebase.updateNode(firebaseData, path, json)) {
    Serial.println("Device status updated");
  } else {
    Serial.println("Failed to update device status");
    Serial.println(firebaseData.errorReason());
  }
}

void loadFeedingSchedules() {
  String path = "/users/" + String(USER_ID) + "/feedingSchedule";
  
  if (Firebase.getJSON(firebaseData, path)) {
    FirebaseJson &json = firebaseData.jsonObject();
    FirebaseJsonData jsonData;
    size_t count = json.iteratorBegin();
    scheduleCount = 0;
    
    for (size_t i = 0; i < count && scheduleCount < 10; i++) {
      json.iteratorGet(i, jsonData);
      
      if (jsonData.type == "object") {
        FirebaseJson scheduleJson;
        jsonData.getJSON(scheduleJson);
        
        FeedingSchedule schedule;
        schedule.id = jsonData.key;
        
        FirebaseJsonData timeData;
        scheduleJson.get(timeData, "time");
        if (timeData.success) schedule.time = timeData.stringValue;
        
        FirebaseJsonData amountData;
        scheduleJson.get(amountData, "amount");
        if (amountData.success) schedule.amount = amountData.intValue;
        
        FirebaseJsonData enabledData;
        scheduleJson.get(enabledData, "enabled");
        if (enabledData.success) schedule.enabled = enabledData.boolValue;
        
        FirebaseJsonData daysData;
        scheduleJson.get(daysData, "days");
        if (daysData.success) {
          FirebaseJson daysJson;
          daysData.getJSON(daysJson);
          
          const char* dayNames[] = {"sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"};
          for (int j = 0; j < 7; j++) {
            FirebaseJsonData dayData;
            daysJson.get(dayData, dayNames[j]);
            if (dayData.success) schedule.days[j] = dayData.boolValue;
            else schedule.days[j] = false;
          }
        }
        
        schedules[scheduleCount++] = schedule;
      }
    }
    
    json.iteratorEnd();
    Serial.println("Loaded " + String(scheduleCount) + " feeding schedules");
  } else {
    Serial.println("Failed to load feeding schedules");
    Serial.println(firebaseData.errorReason());
  }
}

void checkFeedingSchedules() {
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return;
  }
  
  char timeStr[6];
  sprintf(timeStr, "%02d:%02d", timeinfo.tm_hour, timeinfo.tm_min);
  
  for (int i = 0; i < scheduleCount; i++) {
    if (schedules[i].enabled && 
        schedules[i].time == String(timeStr) && 
        schedules[i].days[timeinfo.tm_wday]) {
      
      Serial.println("Scheduled feeding triggered: " + schedules[i].id);
      dispenseFeed(schedules[i].amount, "scheduled", schedules[i].id);
    }
  }
}

void checkManualFeedRequest() {
  String path = "/users/" + String(USER_ID) + "/manualFeed";
  
  if (Firebase.getJSON(firebaseData, path)) {
    FirebaseJson &json = firebaseData.jsonObject();
    FirebaseJsonData statusData;
    json.get(statusData, "status");
    
    if (statusData.success && statusData.stringValue == "pending") {
      FirebaseJsonData amountData;
      json.get(amountData, "amount");
      
      int amount = 20; // Default amount
      if (amountData.success) amount = amountData.intValue;
      
      Serial.println("Manual feeding triggered: " + String(amount) + "g");
      dispenseFeed(amount, "manual", "");
      
      // Update status to completed
      FirebaseJson updateJson;
      updateJson.add("status", "completed");
      
      if (Firebase.updateNode(firebaseData, path, updateJson)) {
        Serial.println("Manual feed status updated to completed");
      } else {
        Serial.println("Failed to update manual feed status");
      }
    }
  }
}

void dispenseFeed(int amount, String type, String scheduleId) {
  // Limit the amount to the maximum
  if (amount > MAX_FEED_AMOUNT) amount = MAX_FEED_AMOUNT;
  
  // Calculate dispensing time
  int dispensingTime = (amount * 1000) / FEED_AMOUNT_PER_SECOND;
  
  // Activate the servo to dispense food
  feederServo.write(180); // Open position
  delay(dispensingTime);
  feederServo.write(0);   // Close position
  
  // Record feeding history
  recordFeedingHistory(amount, type, scheduleId);
  
  // Update food level
  updateDeviceStatus();
}

void recordFeedingHistory(int amount, String type, String scheduleId) {
  String path = "/users/" + String(USER_ID) + "/feedingHistory";
  
  FirebaseJson historyJson;
  historyJson.add("timestamp", getTimestamp());
  historyJson.add("amount", amount);
  historyJson.add("type", type);
  historyJson.add("success", true);
  
  if (scheduleId.length() > 0) {
    historyJson.add("scheduleId", scheduleId);
  }
  
  String historyKey = "feeding_" + String(getTimestamp());
  
  if (Firebase.pushJSON(firebaseData, path, historyJson)) {
    Serial.println("Feeding history recorded");
  } else {
    Serial.println("Failed to record feeding history");
    Serial.println(firebaseData.errorReason());
  }
}

void checkWiFiCredentialsUpdate() {
  String path = "/users/" + String(USER_ID) + "/wifiCredentials";
  
  if (Firebase.getJSON(firebaseData, path)) {
    FirebaseJson &json = firebaseData.jsonObject();
    
    FirebaseJsonData timestampData;
    json.get(timestampData, "timestamp");
    
    // Only process if the timestamp is newer than the last check
    if (timestampData.success) {
      FirebaseJsonData ssidData;
      FirebaseJsonData passwordData;
      
      json.get(ssidData, "ssid");
      json.get(passwordData, "password");
      
      if (ssidData.success && passwordData.success) {
        String newSSID = ssidData.stringValue;
        String newPassword = passwordData.stringValue;
        
        // Only update if different from current
        if (newSSID != WIFI_SSID || newPassword != WIFI_PASSWORD) {
          Serial.println("New WiFi credentials received. Reconnecting...");
          
          WiFi.disconnect();
          delay(1000);
          
          WiFi.begin(newSSID.c_str(), newPassword.c_str());
          Serial.print("Connecting to new WiFi");
          
          int attempts = 0;
          while (WiFi.status() != WL_CONNECTED && attempts < 20) {
            Serial.print(".");
            delay(500);
            attempts++;
          }
          
          if (WiFi.status() == WL_CONNECTED) {
            Serial.println();
            Serial.print("Connected to new WiFi with IP: ");
            Serial.println(WiFi.localIP());
            
            // Update status to reflect the change
            updateDeviceStatus();
          } else {
            Serial.println();
            Serial.println("Failed to connect to new WiFi. Reverting to previous connection.");
            
            WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
            while (WiFi.status() != WL_CONNECTED) {
              Serial.print(".");
              delay(500);
            }
          }
        }
      }
    }
  }
}

int readFoodLevel() {
  // Read the analog value from the food level sensor
  int sensorValue = analogRead(FOOD_LEVEL_SENSOR_PIN);
  
  // Map the sensor value to a percentage (0-100)
  int foodLevel = map(sensorValue, 0, 4095, 0, 100);
  
  // Constrain the value to 0-100 range
  foodLevel = constrain(foodLevel, 0, 100);
  
  return foodLevel;
}

int readBatteryLevel() {
  // Read the analog value from the battery level pin
  int sensorValue = analogRead(BATTERY_LEVEL_PIN);
  
  // Map the sensor value to a percentage (0-100)
  // Assuming 3.3V reference voltage and battery range of 3.0V to 4.2V
  int batteryLevel = map(sensorValue, 2330, 3277, 0, 100);
  
  // Constrain the value to 0-100 range
  batteryLevel = constrain(batteryLevel, 0, 100);
  
  return batteryLevel;
}

unsigned long getTimestamp() {
  time_t now;
  time(&now);
  return now;
}

void syncTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Time synchronized");
} 