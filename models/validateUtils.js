const validator = require('validator');

function isTagValid(id, name) {
    if(id < 0 && !name) {
        return false;
    }
    return true;
}

module.exports= {isTagValid};