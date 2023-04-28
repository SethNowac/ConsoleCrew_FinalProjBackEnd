const validator = require('validator');

/**
 * Validates that the game input is not empty, and checks that the length of the name
 * does not exceed 30 characters and the description should not exceed 250. Both should be short.
 * @param {string} name Name of the game to add
 * @param {string} desc Short description of the game to add
 * @returns True if both name and description are valid. False otherwise.
 */
function isValid(name,desc) {
    const minNameChars = 0;
    const minDescChars = 5;
    const maxNameChars = 50;
    const maxDescChars = 250;

    if (!name || !desc || !validator.isLength(name, minNameChars, maxNameChars) || !validator.isLength(desc, minDescChars, maxDescChars)) {
        return false;
    }
    
    return true;
}

module.exports= {isValid};