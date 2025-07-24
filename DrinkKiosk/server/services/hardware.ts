export interface HardwareService {
  openValve(pin: number): Promise<void>;
  closeValve(pin: number): Promise<void>;
  readFlowSensor(pin: number): Promise<number>;
  pourBeverage(valvePin: number, flowSensorPin: number, targetVolume: number): Promise<void>;
}

export class RaspberryPiHardware implements HardwareService {
  private valveStates: Map<number, boolean> = new Map();
  private pouringInProgress: Map<number, boolean> = new Map();

  async openValve(pin: number): Promise<void> {
    try {
      // In production, use pigpio or rpi-gpio library
      console.log(`Opening valve on GPIO pin ${pin}`);
      this.valveStates.set(pin, true);
      
      // TODO: Implement actual GPIO control
      // const gpio = require('pigpio').Gpio;
      // const valve = new gpio(pin, {mode: gpio.OUTPUT});
      // valve.digitalWrite(1);
    } catch (error) {
      console.error(`Failed to open valve on pin ${pin}:`, error);
      throw error;
    }
  }

  async closeValve(pin: number): Promise<void> {
    try {
      console.log(`Closing valve on GPIO pin ${pin}`);
      this.valveStates.set(pin, false);
      
      // TODO: Implement actual GPIO control
      // const gpio = require('pigpio').Gpio;
      // const valve = new gpio(pin, {mode: gpio.OUTPUT});
      // valve.digitalWrite(0);
    } catch (error) {
      console.error(`Failed to close valve on pin ${pin}:`, error);
      throw error;
    }
  }

  async readFlowSensor(pin: number): Promise<number> {
    try {
      // TODO: Implement YF-S301 flow sensor reading
      // Return flow rate in ml/second
      console.log(`Reading flow sensor on GPIO pin ${pin}`);
      
      // Simulate flow rate for development
      return Math.random() * 50 + 10; // 10-60 ml/s
    } catch (error) {
      console.error(`Failed to read flow sensor on pin ${pin}:`, error);
      return 0;
    }
  }

  async pourBeverage(valvePin: number, flowSensorPin: number, targetVolume: number): Promise<void> {
    if (this.pouringInProgress.get(valvePin)) {
      throw new Error(`Valve ${valvePin} is already in use`);
    }

    this.pouringInProgress.set(valvePin, true);
    let totalPoured = 0;

    try {
      console.log(`Starting to pour ${targetVolume}ml using valve ${valvePin}, sensor ${flowSensorPin}`);
      
      await this.openValve(valvePin);
      
      // Monitor flow and close when target reached
      const startTime = Date.now();
      const maxDuration = 60000; // 1 minute safety timeout
      
      while (totalPoured < targetVolume && (Date.now() - startTime) < maxDuration) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms intervals
        
        const flowRate = await this.readFlowSensor(flowSensorPin);
        totalPoured += (flowRate * 0.1); // 0.1 second interval
        
        console.log(`Poured: ${totalPoured.toFixed(1)}ml / ${targetVolume}ml`);
        
        // In production, emit progress events for real-time updates
        // this.emit('pourProgress', { valvePin, poured: totalPoured, target: targetVolume });
      }
      
      await this.closeValve(valvePin);
      
      if (totalPoured < targetVolume * 0.95) {
        throw new Error(`Incomplete pour: ${totalPoured.toFixed(1)}ml of ${targetVolume}ml`);
      }
      
      console.log(`Successfully poured ${totalPoured.toFixed(1)}ml`);
      
    } catch (error) {
      await this.closeValve(valvePin);
      throw error;
    } finally {
      this.pouringInProgress.set(valvePin, false);
    }
  }
}

export class MockHardware implements HardwareService {
  async openValve(pin: number): Promise<void> {
    console.log(`[MOCK] Opening valve on pin ${pin}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async closeValve(pin: number): Promise<void> {
    console.log(`[MOCK] Closing valve on pin ${pin}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async readFlowSensor(pin: number): Promise<number> {
    // Simulate realistic flow rate
    return 25 + Math.random() * 10; // 25-35 ml/s
  }

  async pourBeverage(valvePin: number, flowSensorPin: number, targetVolume: number): Promise<void> {
    console.log(`[MOCK] Pouring ${targetVolume}ml using valve ${valvePin}`);
    
    // Simulate pouring with 5-second duration for testing
    const duration = 5000;
    const intervals = 50;
    const stepTime = duration / intervals;
    const stepVolume = targetVolume / intervals;
    
    for (let i = 0; i < intervals; i++) {
      await new Promise(resolve => setTimeout(resolve, stepTime));
      const poured = (i + 1) * stepVolume;
      console.log(`[MOCK] Poured: ${poured.toFixed(1)}ml / ${targetVolume}ml`);
    }
    
    console.log(`[MOCK] Completed pouring ${targetVolume}ml`);
  }
}

// Use mock hardware in development, real hardware in production
export const hardware = process.env.NODE_ENV === 'production' 
  ? new RaspberryPiHardware() 
  : new MockHardware();
