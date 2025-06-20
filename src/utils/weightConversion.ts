
/**
 * Utility functions for weight conversion and display
 * Converts weights from ounces to pounds for frontend display only
 * Backend API calls remain unchanged
 */

export const convertOuncesToPounds = (ounces: number): number => {
  return Number((ounces / 16).toFixed(2));
};

export const convertPoundsToOunces = (pounds: number): number => {
  return Number((pounds * 16).toFixed(2));
};

export const formatWeightDisplay = (ounces: number): string => {
  const pounds = convertOuncesToPounds(ounces);
  return `${pounds} lb`;
};

export const parseWeightInput = (input: string | number): number => {
  // Parse weight input and convert to ounces for backend
  const value = typeof input === 'string' ? parseFloat(input) : input;
  if (isNaN(value)) return 0;
  
  // If input is string and contains 'lb' or 'pound', convert to ounces
  if (typeof input === 'string' && (input.toLowerCase().includes('lb') || input.toLowerCase().includes('pound'))) {
    return convertPoundsToOunces(value);
  }
  
  // If input is string and contains 'oz' or 'ounce', return as is
  if (typeof input === 'string' && (input.toLowerCase().includes('oz') || input.toLowerCase().includes('ounce'))) {
    return value;
  }
  
  // Default to treating as pounds for user-friendly input
  return convertPoundsToOunces(value);
};

export const displayWeightInPounds = (weightInOunces: number): string => {
  const pounds = convertOuncesToPounds(weightInOunces);
  return `${pounds} lb`;
};
