#include <Arduino.h>
#include "WiFiManager.h"
#include <ESP32Servo.h>
#include <FirebaseESP32.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// Pin Definitions
#define SERVO_PIN 13
#define TRIG_PIN 5
#define ECHO_PIN 18
#define LED_PIN 2

// Create instances
WiFiManager wifiManager;
Servo feederServo;
FirebaseData firebaseData;

// Function declarations
void setupHardware();
void handleFeeding();
void updateFoodLevel();
void syncWithFirebase();

void setup() {
    Serial.begin(115200);
    
    // Initialize hardware
    setupHardware();
    
    // Start WiFi manager
    wifiManager.begin();
    
    // Wait for connection or hotspot mode
    while (!wifiManager.isConnected() && !wifiManager.isHotspotEnabled()) {
        delay(100);
    }
    
    if (wifiManager.isConnected()) {
        // Initialize Firebase
        Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
        Firebase.reconnectWiFi(true);
    }
}

void loop() {
    // Update WiFi manager
    wifiManager.update();
    
    // If connected to WiFi, sync with Firebase
    if (wifiManager.isConnected()) {
        syncWithFirebase();
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
    
    // Initialize ultrasonic sensor
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    
    // Initialize LED
    pinMode(LED_PIN, OUTPUT);
}

void handleFeeding() {
    // Implementation of feeding logic
    // This will work in both online and offline modes
}

void updateFoodLevel() {
    // Implementation of food level measurement
    // This will work in both online and offline modes
}

void syncWithFirebase() {
    // Implementation of Firebase synchronization
    // Only called when WiFi is connected
} 