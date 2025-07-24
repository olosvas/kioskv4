# Raspberry Pi Kiosk Setup Guide

## Hardware Requirements

### Components Needed
- **Raspberry Pi 4B** (4GB RAM recommended)
- **7" Official Raspberry Pi Touchscreen** (800x480 resolution)
- **12V Solenoid Valves** (one per beverage dispenser)
- **YF-S301 Water Flow Sensors** (one per beverage line)
- **12V Power Supply** (for valves)
- **5V Relay Modules** (one per valve for GPIO control)
- **Breadboard and Jumper Wires**
- **MicroSD Card** (32GB minimum, Class 10)

### GPIO Pin Layout

```
Raspberry Pi 4 GPIO Pinout (40-pin header):
     3V3  (1) (2)  5V
   GPIO2  (3) (4)  5V
   GPIO3  (5) (6)  GND
   GPIO4  (7) (8)  GPIO14
     GND  (9) (10) GPIO15
  GPIO17 (11) (12) GPIO18
  GPIO27 (13) (14) GND
  GPIO22 (15) (16) GPIO23
     3V3 (17) (18) GPIO24
  GPIO10 (19) (20) GND
   GPIO9 (21) (22) GPIO25
  GPIO11 (23) (24) GPIO8
     GND (25) (26) GPIO7
   GPIO0 (27) (28) GPIO1
   GPIO5 (29) (30) GND
   GPIO6 (31) (32) GPIO12
  GPIO13 (33) (34) GND
  GPIO19 (35) (36) GPIO16
  GPIO26 (37) (38) GPIO20
     GND (39) (40) GPIO21
```

## Hardware Connections

### 1. Valve Control (via 5V Relay)

For each beverage dispenser:

**Relay Module Connections:**
- Relay VCC → Raspberry Pi 5V (Pin 2 or 4)
- Relay GND → Raspberry Pi GND (Pin 6, 9, 14, 20, 25, 30, 34, or 39)
- Relay IN → Raspberry Pi GPIO Pin (see pin assignments below)

**12V Valve Connections:**
- 12V+ → Relay Common (COM)
- Valve + → Relay Normally Open (NO)
- Valve - → 12V Power Supply GND

### 2. Flow Sensor Connections

For each YF-S301 flow sensor:

**YF-S301 Pinout:**
- Red Wire → 5V (Pin 2 or 4)
- Black Wire → GND (Pin 6, 9, 14, 20, 25, 30, 34, or 39)
- Yellow Wire → GPIO Pin (see assignments below)

### 3. GPIO Pin Assignments

Configure these in your main app's beverage settings:

| Beverage | Valve GPIO Pin | Flow Sensor GPIO Pin |
|----------|---------------|---------------------|
| Drink 1  | GPIO 17 (Pin 11) | GPIO 27 (Pin 13) |
| Drink 2  | GPIO 18 (Pin 12) | GPIO 22 (Pin 15) |
| Drink 3  | GPIO 23 (Pin 16) | GPIO 24 (Pin 18) |
| Drink 4  | GPIO 25 (Pin 22) | GPIO 5 (Pin 29)  |

### 4. Wiring Diagram

```
Raspberry Pi 4
┌─────────────────────┐
│  GPIO17 ────────────┼─── Relay 1 IN (Valve 1)
│  GPIO27 ────────────┼─── Flow Sensor 1 Signal
│  GPIO18 ────────────┼─── Relay 2 IN (Valve 2)
│  GPIO22 ────────────┼─── Flow Sensor 2 Signal
│  GPIO23 ────────────┼─── Relay 3 IN (Valve 3)
│  GPIO24 ────────────┼─── Flow Sensor 3 Signal
│  GPIO25 ────────────┼─── Relay 4 IN (Valve 4)
│  GPIO5  ────────────┼─── Flow Sensor 4 Signal
│  5V     ────────────┼─── Relay Modules VCC + Flow Sensors VCC
│  GND    ────────────┼─── Relay Modules GND + Flow Sensors GND
└─────────────────────┘

12V Power Supply
┌─────────────────────┐
│  12V+ ──────────────┼─── Relay COM terminals
│  GND  ──────────────┼─── Valve negative terminals
└─────────────────────┘

Each Valve:
Valve+ ──── Relay NO (Normally Open)
Valve- ──── 12V Power Supply GND
```

## Software Setup

### 1. Raspberry Pi OS Installation

1. **Download Raspberry Pi OS Lite** (64-bit)
2. **Flash to SD card** using Raspberry Pi Imager
3. **Enable SSH** (add empty `ssh` file to boot partition)
4. **Configure WiFi** (add `wpa_supplicant.conf` to boot partition):

```conf
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="YourWiFiName"
    psk="YourWiFiPassword"
}
```

### 2. Initial Raspberry Pi Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git -y

# Install pigpio library for GPIO control
sudo apt install pigpio python3-pigpio -y

# Enable pigpio daemon
sudo systemctl enable pigpiod
sudo systemctl start pigpiod

# Configure boot options
sudo raspi-config
# Select: 3 Interface Options > P4 SPI > Yes
# Select: 3 Interface Options > P5 I2C > Yes
# Select: 1 System Options > S5 Boot / Auto Login > B2 Console Autologin
```

### 3. Display Configuration

Edit `/boot/config.txt`:

```bash
sudo nano /boot/config.txt
```

Add these lines:

```conf
# Enable 7" touchscreen
dtoverlay=vc4-kms-v3d
dtoverlay=rpi-ft5406
display_auto_detect=1

# Set screen resolution
hdmi_group=2
hdmi_mode=87
hdmi_cvt=800 480 60 6 0 0 0

# Disable overscan
disable_overscan=1

# GPU memory split
gpu_mem=128
```

### 4. Install Kiosk Application

```bash
# Clone your kiosk repository
git clone https://github.com/yourusername/beverage-kiosk.git
cd beverage-kiosk

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2

# Set up environment variables
nano .env
```

Create `.env` file:

```env
NODE_ENV=production
PORT=3000
CLOUD_API_URL=https://kiosk-manager-uzisinapoj.replit.app/api
DATABASE_URL=your_database_url_if_needed
```

### 5. Build and Deploy

```bash
# Build the application
npm run build

# Create PM2 ecosystem file
nano ecosystem.config.js
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'beverage-kiosk',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Create logs directory
mkdir logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Kiosk Mode Setup

Install Chromium in kiosk mode:

```bash
# Install Chromium
sudo apt install chromium-browser unclutter -y

# Create autostart directory
mkdir -p ~/.config/lxsession/LXDE-pi

# Create autostart file
nano ~/.config/lxsession/LXDE-pi/autostart
```

Add to autostart:

```bash
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash

# Hide mouse cursor
@unclutter -idle 0.1 -root

# Start kiosk app in fullscreen
@chromium-browser --noerrdialogs --disable-infobars --kiosk --disable-session-crashed-bubble --disable-dev-shm-usage --no-sandbox http://localhost:3000
```

### 7. Auto-start Configuration

Create a systemd service:

```bash
sudo nano /etc/systemd/system/kiosk-display.service
```

```ini
[Unit]
Description=Kiosk Display
After=graphical-session.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
ExecStart=/usr/bin/startx
Restart=always

[Install]
WantedBy=graphical-session.target
```

Enable the service:

```bash
sudo systemctl enable kiosk-display.service
```

## Hardware Testing

### 1. GPIO Test Script

Create a test script to verify GPIO connections:

```bash
nano test-gpio.js
```

```javascript
const { Gpio } = require('pigpio');

// Test valve control
const valve1 = new Gpio(17, { mode: Gpio.OUTPUT });
const valve2 = new Gpio(18, { mode: Gpio.OUTPUT });

// Test flow sensors
const flow1 = new Gpio(27, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP });
const flow2 = new Gpio(22, { mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP });

// Test valve operation
console.log('Testing valves...');
valve1.digitalWrite(1); // Open valve 1
setTimeout(() => valve1.digitalWrite(0), 2000); // Close after 2 seconds

valve2.digitalWrite(1); // Open valve 2
setTimeout(() => valve2.digitalWrite(0), 2000); // Close after 2 seconds

// Monitor flow sensors
flow1.on('interrupt', (level, tick) => {
  console.log('Flow sensor 1 pulse detected');
});

flow2.on('interrupt', (level, tick) => {
  console.log('Flow sensor 2 pulse detected');
});

console.log('GPIO test running. Press Ctrl+C to exit.');
```

Run the test:

```bash
sudo node test-gpio.js
```

### 2. Flow Sensor Calibration

Each YF-S301 sensor generates approximately 7.5 pulses per milliliter. The kiosk automatically calibrates based on this rate.

## Troubleshooting

### Common Issues

1. **GPIO Permissions**: Ensure the application runs with proper GPIO permissions
2. **Flow Sensor Noise**: Add pull-up resistors if readings are inconsistent
3. **Valve Not Opening**: Check 12V power supply and relay connections
4. **Display Issues**: Verify touchscreen ribbon cable connections

### Debug Commands

```bash
# Check GPIO status
gpio readall

# Monitor system logs
journalctl -f

# Check PM2 process status
pm2 status
pm2 logs

# Test pigpio daemon
sudo systemctl status pigpiod
```

### Network Configuration

For static IP (optional):

```bash
sudo nano /etc/dhcpcd.conf
```

Add:

```conf
interface wlan0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

## Security Considerations

1. **Change default passwords**
2. **Enable UFW firewall**
3. **Disable unnecessary services**
4. **Regular security updates**

```bash
# Change pi user password
passwd

# Enable firewall
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 3000

# Disable unused services
sudo systemctl disable bluetooth
sudo systemctl disable avahi-daemon
```

## Maintenance

### Regular Tasks

1. **Monitor logs**: Check PM2 logs for application errors
2. **Update system**: Run `sudo apt update && sudo apt upgrade` monthly
3. **Clean sensors**: Regular cleaning of flow sensors prevents blockages
4. **Check connections**: Verify GPIO connections monthly

### Backup Configuration

```bash
# Backup important configs
sudo cp /boot/config.txt ~/config.txt.backup
cp ~/.config/lxsession/LXDE-pi/autostart ~/autostart.backup
cp ecosystem.config.js ~/ecosystem.config.js.backup
```

This completes the Raspberry Pi setup for your beverage kiosk system!