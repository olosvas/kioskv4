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
