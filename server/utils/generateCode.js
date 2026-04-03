const crypto = require('crypto');

/**
 * Generate a unique captain code
 * Format: TEAM_ + 6 random uppercase letters/numbers
 * Example: TEAM_A1B2C3
 * @returns {string} Generated captain code
 */
const generateCaptainCode = () => {
  // Generate 6 random bytes and convert to hex
  const randomBytes = crypto.randomBytes(3);
  const hex = randomBytes.toString('hex').toUpperCase();
  
  // Take first 6 characters and ensure mix of letters and numbers
  let code = '';
  for (let i = 0; i < 6; i++) {
    const char = hex[i];
    // Alternate between letters and numbers for better readability
    if (i % 2 === 0) {
      // Use letter (A-F from hex)
      code += /[A-F]/.test(char) ? char : String.fromCharCode(65 + Math.floor(Math.random() * 26));
    } else {
      // Use number (0-9)
      code += /[0-9]/.test(char) ? char : Math.floor(Math.random() * 10).toString();
    }
  }
  
  return `TEAM_${code}`;
};

/**
 * Generate a captain code with team name prefix
 * Format: TEAM_TEAMNAME_RANDOM
 * Example: TEAM_WARRIORS_A1B2C3
 * @param {string} teamName - Team name for prefix
 * @returns {string} Generated captain code with team name
 */
const generateCaptainCodeWithTeam = (teamName) => {
  if (!teamName) {
    return generateCaptainCode();
  }
  
  // Clean team name and take first 6 characters
  const cleanTeamName = teamName.toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  
  // Generate 3 random characters
  const randomBytes = crypto.randomBytes(2);
  const randomPart = randomBytes.toString('hex').toUpperCase().substring(0, 3);
  
  return `TEAM_${cleanTeamName}_${randomPart}`;
};

/**
 * Validate captain code format
 * @param {string} code - Captain code to validate
 * @returns {boolean} True if valid format
 */
const validateCaptainCode = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Check format: TEAM_ followed by 6+ alphanumeric characters
  const teamCodeRegex = /^TEAM_[A-Z0-9]{6,}$/;
  return teamCodeRegex.test(code);
};

/**
 * Generate multiple unique captain codes
 * @param {number} count - Number of codes to generate
 * @returns {string[]} Array of unique captain codes
 */
const generateMultipleCaptainCodes = (count = 1) => {
  const codes = new Set();
  
  while (codes.size < count) {
    const code = generateCaptainCode();
    codes.add(code);
  }
  
  return Array.from(codes);
};

module.exports = {
  generateCaptainCode,
  generateCaptainCodeWithTeam,
  validateCaptainCode,
  generateMultipleCaptainCodes
};