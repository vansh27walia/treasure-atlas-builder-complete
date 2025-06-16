
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
  if (pounds < 1) {
    return `${ounces} oz`;
  }
  return `${pounds} lb`;
};

export const parseWeightInput = (input: string): number => {
  // Parse weight input and convert to ounces for backend
  const value = parseFloat(input);
  if (isNaN(value)) return 0;
  
  // If input contains 'lb' or 'pound', convert to ounces
  if (input.toLowerCase().includes('lb') || input.toLowerCase().includes('pound')) {
    return convertPoundsToOunces(value);
  }
  
  // If input contains 'oz' or 'ounce', return as is
  if (input.toLowerCase().includes('oz') || input.toLowerCase().includes('ounce')) {
    return value;
  }
  
  // Default to treating as pounds for user-friendly input
  return convertPoundsToOunces(value);
};
