/**
 * Real Raspberry Pi GPIO Implementation
 * This file implements actual GPIO control for production deployment
 */

import { HardwareService } from './hardware';

export class RealRaspberryPiHardware implements HardwareService {
  private pigpio: any;
  private Gpio: any;
  private valves: Map<number, any> = new Map();
  private flowSensors: Map<number, any> = new Map();
  private valveStates: Map<number, boolean> = new Map();
  private pouringInProgress: Map<number, boolean> = new Map();
  private flowCounts: Map<number, number> = new Map();
  
  constructor() {
    this.initializeGPIO();
  }

  private initializeGPIO() {
    try {
      // Import pigpio library
      this.pigpio = require('pigpio');
      this.Gpio = this.pigpio.Gpio;
      
      console.log('✅ pigpio library loaded successfully');
      
      // Initialize default valve pins
      this.initializeValvePins([17, 18, 23, 25]);
      this.initializeFlowSensorPins([27, 22, 24, 5]);
      
      console.log('🎉 Real GPIO hardware initialized and ready');
      
    } catch (error) {
      console.error('❌ Failed to initialize pigpio:', error.message);
      console.log('💡 Install pigpio: sudo apt install pigpio python3-pigpio');
      console.log('💡 Install Node wrapper: npm install pigpio');
      console.log('💡 Run with sudo permissions for GPIO access');
      throw error;
    }
  }

  private initializeValvePins(pins: number[]) {
    for (const pin of pins) {
      try {
        const valve = new this.Gpio(pin, { mode: this.Gpio.OUTPUT });
        valve.digitalWrite(0); // Ensure valve starts closed
        this.valves.set(pin, valve);
        this.valveStates.set(pin, false);
        console.log(`🔧 Valve GPIO ${pin} initialized (closed)`);
      } catch (error) {
        console.error(`❌ Failed to initialize valve GPIO ${pin}:`, error);
      }
    }
  }

  private initializeFlowSensorPins(pins: number[]) {
    for (const pin of pins) {
      try {
        const sensor = new this.Gpio(pin, { 
          mode: this.Gpio.INPUT, 
          pullUpDown: this.Gpio.PUD_UP,
          edge: this.Gpio.RISING_EDGE 
        });
        
        this.flowCounts.set(pin, 0);
        
        // Count pulses from flow sensor
        sensor.on('interrupt', (level: number, tick: number) => {
          const currentCount = this.flowCounts.get(pin) || 0;
          this.flowCounts.set(pin, currentCount + 1);
        });
        
        this.flowSensors.set(pin, sensor);
        console.log(`📡 Flow sensor GPIO ${pin} initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize flow sensor GPIO ${pin}:`, error);
      }
    }
  }

  async openValve(pin: number): Promise<void> {
    try {
      const valve = this.valves.get(pin);
      if (!valve) {
        throw new Error(`Valve on GPIO ${pin} not initialized`);
      }

      valve.digitalWrite(1);
      this.valveStates.set(pin, true);
      console.log(`🚰 Opened valve on GPIO ${pin}`);
    } catch (error) {
      console.error(`❌ Failed to open valve on GPIO ${pin}:`, error);
      throw error;
    }
  }

  async closeValve(pin: number): Promise<void> {
    try {
      const valve = this.valves.get(pin);
      if (!valve) {
        throw new Error(`Valve on GPIO ${pin} not initialized`);
      }

      valve.digitalWrite(0);
      this.valveStates.set(pin, false);
      console.log(`🔒 Closed valve on GPIO ${pin}`);
    } catch (error) {
      console.error(`❌ Failed to close valve on GPIO ${pin}:`, error);
      throw error;
    }
  }

  async readFlowSensor(pin: number): Promise<number> {
    try {
      const sensor = this.flowSensors.get(pin);
      if (!sensor) {
        console.warn(`⚠️ Flow sensor on GPIO ${pin} not initialized`);
        return 0;
      }

      const pulseCount = this.flowCounts.get(pin) || 0;
      
      // YF-S301 generates ~7.5 pulses per milliliter
      // Return flow rate in ml/second based on recent pulse count
      const flowRate = pulseCount * (1000 / 7.5) / 1000; // Convert to ml/s
      
      // Reset pulse count for next reading
      this.flowCounts.set(pin, 0);
      
      return flowRate;
    } catch (error) {
      console.error(`❌ Failed to read flow sensor on GPIO ${pin}:`, error);
      return 0;
    }
  }

  async pourBeverage(valvePin: number, flowSensorPin: number, targetVolume: number): Promise<void> {
    if (this.pouringInProgress.get(valvePin)) {
      throw new Error(`Valve ${valvePin} is already in use`);
    }

    this.pouringInProgress.set(valvePin, true);
    let totalPoured = 0;
    let initialPulseCount = this.flowCounts.get(flowSensorPin) || 0;

    try {
      console.log(`🥤 Starting to pour ${targetVolume}ml using valve ${valvePin}, sensor ${flowSensorPin}`);
      
      // Reset flow sensor count
      this.flowCounts.set(flowSensorPin, 0);
      
      await this.openValve(valvePin);
      
      const startTime = Date.now();
      const maxDuration = 60000; // 1 minute safety timeout
      const checkInterval = 200; // Check every 200ms
      
      while (totalPoured < targetVolume && (Date.now() - startTime) < maxDuration) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        
        // Calculate volume based on pulse count
        const currentPulses = this.flowCounts.get(flowSensorPin) || 0;
        
        // YF-S301: ~7.5 pulses per milliliter
        totalPoured = currentPulses / 7.5;
        
        if (totalPoured > 0) {
          console.log(`📊 Poured: ${totalPoured.toFixed(1)}ml / ${targetVolume}ml (${currentPulses} pulses)`);
        }
        
        // Safety check - if no flow detected for 5 seconds, alert
        if (totalPoured < 1 && (Date.now() - startTime) > 5000) {
          console.warn(`⚠️ Warning: Low flow detected. Check beverage supply and sensor connection.`);
        }
      }
      
      await this.closeValve(valvePin);
      
      // Allow remaining flow to be counted
      await new Promise(resolve => setTimeout(resolve, 500));
      const finalPulses = this.flowCounts.get(flowSensorPin) || 0;
      const finalVolume = finalPulses / 7.5;
      
      if (finalVolume < targetVolume * 0.90) {
        console.warn(`⚠️ Incomplete pour: ${finalVolume.toFixed(1)}ml of ${targetVolume}ml target`);
        console.log(`💡 Check: beverage supply, valve operation, sensor connection`);
      }
      
      console.log(`✅ Pour completed: ${finalVolume.toFixed(1)}ml (${finalPulses} pulses)`);
      
    } catch (error) {
      console.error(`❌ Pouring failed:`, error);
      await this.closeValve(valvePin); // Ensure valve is closed on error
      throw error;
    } finally {
      this.pouringInProgress.set(valvePin, false);
    }
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    try {
      console.log('🧹 Cleaning up GPIO resources...');
      
      // Close all valves
      for (const [pin, valve] of this.valves) {
        try {
          valve.digitalWrite(0);
          console.log(`🔒 Closed valve GPIO ${pin}`);
        } catch (error) {
          console.error(`❌ Error closing valve GPIO ${pin}:`, error);
        }
      }
      
      // Terminate pigpio
      if (this.pigpio) {
        this.pigpio.terminate();
        console.log('✅ pigpio terminated');
      }
    } catch (error) {
      console.error('❌ Error during GPIO cleanup:', error);
    }
  }

  // Get current status of all hardware
  getStatus() {
    const valveEntries = Array.from(this.valveStates.entries());
    const flowSensorKeys = Array.from(this.flowSensors.keys());
    const pouringEntries = Array.from(this.pouringInProgress.entries());
    
    return {
      valves: valveEntries.map(([pin, state]) => ({
        pin,
        state: state ? 'open' : 'closed',
        initialized: this.valves.has(pin)
      })),
      flowSensors: flowSensorKeys.map(pin => ({
        pin,
        initialized: this.flowSensors.has(pin),
        pulseCount: this.flowCounts.get(pin) || 0
      })),
      pouring: pouringEntries
        .filter(([_, inProgress]) => inProgress)
        .map(([pin, _]) => pin)
    };
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up GPIO...');
  // Cleanup will be handled by the hardware instance
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, cleaning up GPIO...');
  // Cleanup will be handled by the hardware instance
  process.exit(0);
});
