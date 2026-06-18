import { sdkLogger } from '../logger';

function calculate(operation: string, a: number, b?: number): number | string {
  switch (operation) {
    case 'add':
      if (b === undefined) return 'Add requires two numbers (a and b)';
      return a + b;
    case 'subtract':
      if (b === undefined) return 'Subtract requires two numbers (a and b)';
      return a - b;
    case 'multiply':
      if (b === undefined) return 'Multiply requires two numbers (a and b)';
      return a * b;
    case 'divide':
      if (b === undefined) return 'Divide requires two numbers (a and b)';
      if (b === 0) return 'Error: Division by zero is not allowed';
      return a / b;
    case 'power':
      if (b === undefined) return 'Power requires two numbers (base and exponent)';
      return Math.pow(a, b);
    case 'sqrt':
      if (a < 0) return 'Error: Cannot calculate square root of a negative number';
      return Math.sqrt(a);
    case 'modulo':
      if (b === undefined) return 'Modulo requires two numbers (a and b)';
      if (b === 0) return 'Error: Modulo by zero is not allowed';
      return a % b;
    default:
      return `Unknown operation: ${operation}. Supported: add, subtract, multiply, divide, power, sqrt, modulo`;
  }
}

export async function runCalculator(operation: string, a: number, b?: number): Promise<string> {
  sdkLogger.toolCallGenerated('calculator', { operation, a, b });
  const result = calculate(operation, a, b);
  if (typeof result === 'number') {
    return `Result: ${result}`;
  }
  return result;
}
