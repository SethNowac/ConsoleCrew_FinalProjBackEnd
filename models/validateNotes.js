const validator = require('validator');
const projectModel = require("./projectModelMongoDb");

// ASYNC FUNCTION ASYNC FUNCTION ASYNC FUNCTION !!!!!!!!!!!!!!!!!!!!!!!!!!
async function isValid(projectid, id, title, note) {
    try {
        let result = await projectModel.getSingleProjectById(projectid);
        if(!result)
            return false;

        if(!title || !note || projectid < 0 || id < 0) // Maybe add some more robust validation here
            return false;

        return true;
        
    } catch (error) {
        return false;
    }
}

module.exports= {isValid};