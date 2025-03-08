#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

#define EEPROM_SIZE 512
#define MAX_NETWORKS 5
#define CHECK_INTERVAL 30000 // 30 seconds
#define MAX_RETRIES 3

class WiFiManager {
private:
    struct NetworkConfig {
        char ssid[32];
        char password[64];
        int priority;
        bool enabled;
    };

    struct HotspotConfig {
        char ssid[32];
        char password[64];
        uint8_t channel;
        bool hidden;
        uint8_t maxConnections;
    };

    NetworkConfig networks[MAX_NETWORKS];
    HotspotConfig hotspotConfig;
    WebServer* server;
    DNSServer* dnsServer;
    unsigned long lastCheck;
    bool isHotspotActive;
    int connectionRetries;

    // EEPROM management
    void saveConfig() {
        EEPROM.put(0, networks);
        EEPROM.put(sizeof(networks), hotspotConfig);
        EEPROM.commit();
    }

    void loadConfig() {
        EEPROM.get(0, networks);
        EEPROM.get(sizeof(networks), hotspotConfig);
    }

    // Web server handlers
    void setupWebServer() {
        server = new WebServer(80);
        dnsServer = new DNSServer();

        server->on("/", HTTP_GET, [this]() {
            this->handleRoot();
        });

        server->on("/scan", HTTP_GET, [this]() {
            this->handleScan();
        });

        server->on("/configure", HTTP_POST, [this]() {
            this->handleConfigure();
        });

        server->on("/hotspot", HTTP_POST, [this]() {
            this->handleHotspotConfig();
        });

        server->begin();
    }

    void handleRoot() {
        String html = "<html><head><title>PetFeeder Setup</title></head><body>";
        html += "<h1>PetFeeder WiFi Setup</h1>";
        html += "<button onclick='scanNetworks()'>Scan Networks</button>";
        html += "<div id='networks'></div>";
        html += "<script>";
        html += "function scanNetworks() {";
        html += "  fetch('/scan').then(r=>r.json()).then(data=>{";
        html += "    let html = '<ul>';";
        html += "    data.networks.forEach(n=>{";
        html += "      html += `<li>${n.ssid} (${n.rssi}dBm) `;";
        html += "      html += `<button onclick='configure(\"${n.ssid}\")'>Configure</button></li>`;";
        html += "    });";
        html += "    html += '</ul>';";
        html += "    document.getElementById('networks').innerHTML = html;";
        html += "  });";
        html += "}";
        html += "</script>";
        html += "</body></html>";
        server->send(200, "text/html", html);
    }

    void handleScan() {
        int n = WiFi.scanNetworks();
        String json = "{\"networks\":[";
        for (int i = 0; i < n; i++) {
            if (i > 0) json += ",";
            json += "{\"ssid\":\"" + WiFi.SSID(i) + "\",\"rssi\":" + String(WiFi.RSSI(i)) + "}";
        }
        json += "]}";
        server->send(200, "application/json", json);
    }

    void handleConfigure() {
        if (!server->hasArg("ssid") || !server->hasArg("password")) {
            server->send(400, "text/plain", "Missing parameters");
            return;
        }

        String ssid = server->arg("ssid");
        String password = server->arg("password");
        int priority = server->hasArg("priority") ? server->arg("priority").toInt() : 0;

        // Find empty slot or lowest priority
        int slot = 0;
        for (int i = 0; i < MAX_NETWORKS; i++) {
            if (!networks[i].enabled || networks[i].priority < networks[slot].priority) {
                slot = i;
            }
        }

        strncpy(networks[slot].ssid, ssid.c_str(), 31);
        strncpy(networks[slot].password, password.c_str(), 63);
        networks[slot].priority = priority;
        networks[slot].enabled = true;

        saveConfig();
        server->send(200, "text/plain", "Configuration saved");

        // Try to connect to the new network
        connectToBestNetwork();
    }

    void handleHotspotConfig() {
        if (!server->hasArg("ssid") || !server->hasArg("password")) {
            server->send(400, "text/plain", "Missing parameters");
            return;
        }

        String ssid = server->arg("ssid");
        String password = server->arg("password");
        uint8_t channel = server->hasArg("channel") ? server->arg("channel").toInt() : 1;
        bool hidden = server->hasArg("hidden") ? server->arg("hidden") == "true" : false;
        uint8_t maxConn = server->hasArg("maxConnections") ? server->arg("maxConnections").toInt() : 4;

        strncpy(hotspotConfig.ssid, ssid.c_str(), 31);
        strncpy(hotspotConfig.password, password.c_str(), 63);
        hotspotConfig.channel = channel;
        hotspotConfig.hidden = hidden;
        hotspotConfig.maxConnections = maxConn;

        saveConfig();
        server->send(200, "text/plain", "Hotspot configuration saved");
    }

public:
    WiFiManager() {
        lastCheck = 0;
        isHotspotActive = false;
        connectionRetries = 0;
        
        // Initialize EEPROM
        EEPROM.begin(EEPROM_SIZE);
        loadConfig();

        // Set default hotspot config if empty
        if (strlen(hotspotConfig.ssid) == 0) {
            String defaultSSID = "PetFeeder-Setup-" + String((uint32_t)ESP.getEfuseMac(), HEX).substring(0, 4);
            strncpy(hotspotConfig.ssid, defaultSSID.c_str(), 31);
            strncpy(hotspotConfig.password, "petfeeder123", 63);
            hotspotConfig.channel = 1;
            hotspotConfig.hidden = false;
            hotspotConfig.maxConnections = 4;
            saveConfig();
        }
    }

    void begin() {
        // Try to connect to stored networks first
        if (!connectToBestNetwork()) {
            startHotspot();
        }
    }

    bool connectToBestNetwork() {
        // Sort networks by priority
        for (int i = 0; i < MAX_NETWORKS - 1; i++) {
            for (int j = i + 1; j < MAX_NETWORKS; j++) {
                if (networks[j].enabled && networks[j].priority > networks[i].priority) {
                    NetworkConfig temp = networks[i];
                    networks[i] = networks[j];
                    networks[j] = temp;
                }
            }
        }

        // Try to connect to each enabled network in order of priority
        for (int i = 0; i < MAX_NETWORKS; i++) {
            if (networks[i].enabled) {
                WiFi.begin(networks[i].ssid, networks[i].password);
                int attempts = 0;
                while (WiFi.status() != WL_CONNECTED && attempts < 20) {
                    delay(500);
                    attempts++;
                }
                if (WiFi.status() == WL_CONNECTED) {
                    if (isHotspotActive) {
                        stopHotspot();
                    }
                    return true;
                }
            }
        }
        return false;
    }

    void startHotspot() {
        if (!isHotspotActive) {
            WiFi.mode(WIFI_AP);
            WiFi.softAP(hotspotConfig.ssid, hotspotConfig.password, hotspotConfig.channel, 
                       hotspotConfig.hidden, hotspotConfig.maxConnections);
            setupWebServer();
            isHotspotActive = true;
        }
    }

    void stopHotspot() {
        if (isHotspotActive) {
            WiFi.softAPdisconnect(true);
            if (server) {
                server->stop();
                delete server;
                server = nullptr;
            }
            if (dnsServer) {
                dnsServer->stop();
                delete dnsServer;
                dnsServer = nullptr;
            }
            isHotspotActive = false;
        }
    }

    void update() {
        unsigned long currentMillis = millis();
        
        // Check connection status periodically
        if (currentMillis - lastCheck >= CHECK_INTERVAL) {
            lastCheck = currentMillis;
            
            if (WiFi.status() != WL_CONNECTED) {
                connectionRetries++;
                if (connectionRetries >= MAX_RETRIES) {
                    if (!isHotspotActive) {
                        startHotspot();
                    }
                } else {
                    connectToBestNetwork();
                }
            } else {
                connectionRetries = 0;
                if (isHotspotActive) {
                    stopHotspot();
                }
            }
        }

        // Handle DNS and web server if hotspot is active
        if (isHotspotActive) {
            if (dnsServer) dnsServer->processNextRequest();
            if (server) server->handleClient();
        }
    }

    bool isConnected() {
        return WiFi.status() == WL_CONNECTED;
    }

    bool isHotspotEnabled() {
        return isHotspotActive;
    }

    String getCurrentSSID() {
        return WiFi.SSID();
    }

    IPAddress getLocalIP() {
        return isHotspotActive ? WiFi.softAPIP() : WiFi.localIP();
    }
};

#endif // WIFI_MANAGER_H 