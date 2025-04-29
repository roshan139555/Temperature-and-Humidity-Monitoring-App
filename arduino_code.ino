#include <DHT.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

// WiFi credentials
const char* ssid = "POCO X6 Pro 5G";
const char* password = "roshan2222";

// DHT sensor configuration
#define DHTPIN D2 // Use GPIO4 (D2 on NodeMCU)
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Web server on port 80
ESP8266WebServer server(80);

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected. IP address: ");
  Serial.println(WiFi.localIP());

  // Define server routes
  server.on("/", handleRoot);
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}

void handleRoot() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    server.send(500, "text/plain", "Failed to read from DHT sensor!");
    return;
  }

  String html = "<html><body>";
  html += "<h1>ESP8266 Weather Station</h1>";
  html += "<p>Temperature: " + String(temperature) + " °C</p>";
  html += "<p>Humidity: " + String(humidity) + " %</p>";
  html += "</body></html>";

  server.send(200, "text/html", html);
}