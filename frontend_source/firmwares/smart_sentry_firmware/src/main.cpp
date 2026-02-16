#include "secrets.h"
#include <Arduino.h>
#include <WiFi.h>
#include <esp_camera.h>
#include <esp_http_server.h>

// Pin definitions for ESP32S3-CAM (Typical Freenove/AI-Thinker S3)
#define PWDN_GPIO_NUM -1
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 15
#define SIOD_GPIO_NUM 4
#define SIOC_GPIO_NUM 5
#define Y9_GPIO_NUM 16
#define Y8_GPIO_NUM 17
#define Y7_GPIO_NUM 18
#define Y6_GPIO_NUM 12
#define Y5_GPIO_NUM 10
#define Y4_GPIO_NUM 8
#define Y3_GPIO_NUM 9
#define Y2_GPIO_NUM 11
#define VSYNC_GPIO_NUM 6
#define HREF_GPIO_NUM 7
#define PCLK_GPIO_NUM 13

// SIM7600 UART Pins (Adjust based on wiring)
#define MODEM_TX 43
#define MODEM_RX 44
#define PC_RESET_PIN 14 // Specific GPIO for PC Reset

// Task Handles
TaskHandle_t streamTaskHandle = NULL;
TaskHandle_t modemTaskHandle = NULL;

// Global Server handle
httpd_handle_t stream_httpd = NULL;

// --- MJPEG STREAMS HANDLER ---
#define PART_BOUNDARY "123456789000000000000987654321"
static const char *_STREAM_CONTENT_TYPE =
    "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char *_STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char *_STREAM_PART =
    "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t *_jpg_buf = NULL;
  char *part_buf[64];

  res = httpd_req_set_type(req, _STREAM_CONTENT_TYPE);
  if (res != ESP_OK)
    return res;

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      res = ESP_FAIL;
    } else {
      if (fb->format != PIXFORMAT_JPEG) {
        bool jpeg_converted = frame2jpg(fb, 80, &_jpg_buf, &_jpg_buf_len);
        esp_camera_fb_return(fb);
        fb = NULL;
        if (!jpeg_converted) {
          Serial.println("JPEG compression failed");
          res = ESP_FAIL;
        }
      } else {
        _jpg_buf_len = fb->len;
        _jpg_buf = fb->buf;
      }
    }
    if (res == ESP_OK) {
      size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, _jpg_buf_len);
      res = httpd_req_send_chunk(req, (const char *)part_buf, hlen);
    }
    if (res == ESP_OK) {
      res = httpd_req_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
    }
    if (res == ESP_OK) {
      res =
          httpd_req_send_chunk(req, _STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY));
    }
    if (fb) {
      esp_camera_fb_return(fb);
      fb = NULL;
      _jpg_buf = NULL;
    } else if (_jpg_buf) {
      free(_jpg_buf);
      _jpg_buf = NULL;
    }
    if (res != ESP_OK)
      break;
    vTaskDelay(1); // Small delay to prevent watchdog
  }
  return res;
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 81; // Stream on 81

  httpd_uri_t stream_uri = {.uri = "/stream",
                            .method = HTTP_GET,
                            .handler = stream_handler,
                            .user_ctx = NULL};

  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
  }
}

// --- TASK A: CORE 1 - CAMERA & STREAMING ---
void StreamTask(void *pvParameters) {
  Serial.println("Starting StreamTask on Core 1");
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 12;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    vTaskDelete(NULL);
  }

  startCameraServer();

  while (true) {
    vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
}

// --- TASK B: CORE 0 - MODEM & SMS ---
void ModemTask(void *pvParameters) {
  Serial.println("Starting ModemTask on Core 0");
  HardwareSerial SerialModem(2);
  SerialModem.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);

  pinMode(PC_RESET_PIN, OUTPUT);
  digitalWrite(PC_RESET_PIN, HIGH); // Assuming active-low reset

  // Basic Modem Init
  SerialModem.println("AT");
  vTaskDelay(500 / portTICK_PERIOD_MS);
  SerialModem.println("AT+CMGF=1"); // SMS Text mode
  vTaskDelay(500 / portTICK_PERIOD_MS);
  SerialModem.println("AT+CNMI=2,1,0,0,0"); // Notify on SMS arrival

  unsigned long lastWifiCheck = millis();
  bool wifiAlerSent = false;

  while (true) {
    // Handle incoming data/SMS
    if (SerialModem.available()) {
      String line = SerialModem.readStringUntil('\n');
      if (line.indexOf("+CMTI:") != -1) {
        // New SMS arrived
        Serial.println("New SMS notification received");
        SerialModem.println("AT+CMGL=\"REC UNREAD\"");
      }
      if (line.indexOf("REBOOT_SYSTEM") != -1) {
        Serial.println("SMS Command REBOOT_SYSTEM identified!");
        digitalWrite(PC_RESET_PIN, LOW);
        vTaskDelay(1000 / portTICK_PERIOD_MS);
        digitalWrite(PC_RESET_PIN, HIGH);
        Serial.println("PC Reset triggered.");
      }
    }

    // WiFi Heartbeat / Alert Logic
    if (WiFi.status() == WL_CONNECTED) {
      lastWifiCheck = millis();
      wifiAlerSent = false;
    } else {
      if (millis() - lastWifiCheck > (5 * 60 * 1000) && !wifiAlerSent) {
        Serial.println("WiFi lost for >5 mins. Sending SMS alert...");
        SerialModem.println(
            "AT+CMGS=\"+YOUR_PHONE_NUMBER\""); // Replace with real number
        vTaskDelay(500 / portTICK_PERIOD_MS);
        SerialModem.print("WIFI CONNECTION LOST - SMART SENTRY");
        SerialModem.write(26); // CTRL+Z
        wifiAlerSent = true;
      }
    }

    vTaskDelay(2000 / portTICK_PERIOD_MS); // Polling interval
  }
}

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(wifi_ssid, wifi_password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
  Serial.println(WiFi.localIP());

  // Create FreeRTOS Tasks
  xTaskCreatePinnedToCore(StreamTask, "StreamTask", 8192, NULL,
                          2, // High priority
                          &streamTaskHandle,
                          1 // Core 1
  );

  xTaskCreatePinnedToCore(ModemTask, "ModemTask", 4096, NULL,
                          1, // Low priority
                          &modemTaskHandle,
                          0 // Core 0
  );
}

void loop() {
  // Empty, logic is in Tasks
  vTaskDelete(NULL);
}
