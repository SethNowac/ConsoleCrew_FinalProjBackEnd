const validator = require('validator');

function isTagValid(id, name) {
    if(id < 0 || !name) {
        return false;
    }
    return true;
}

function isAddProjectValid(id, title, desc, catId, genre, userId) {
    if(id < 0 || !title || !desc || catId < 0 || genre < 0 || userId < 0) {
        return false;
    }
    return true;
}

function isUpdateProjectValid(id, newTitle, newDesc, newCatId, newGenre) {
    if(id < 0 || !newTitle || !newDesc || newCatId < 0 || newGenre < 0) {
        return false;
    }
    return true;
}

function isAddStoryboardValid(id, projectId, categoryId, description) {
    if(id < 0 || projectId < 0 || categoryId < 0 || !description) {
        return false;
    }
    return true;
}

function isUpdateStoryboardValid(id, categoryId, description) {
    if(id < 0 || categoryId < 0 || !description) {
        return false;
    }
    return true;
}

function isUserValid(id, name, password) {
    if(id < 0 || !name || !password) {
        return false;
    }
    return true;
}

function isAddTasklogValid(id, issue, projectId) {
    if(id < 0 || !issue || projectId < 0) {
        return false;
    }
    return true;
}

function isUpdateTasklogValid(id, issue, isResolved) {
    if(id < 0 || !issue) {
        return false;
    }
    return true;
}



module.exports= {isTagValid, isAddProjectValid, isUpdateProjectValid, isAddStoryboardValid, isUpdateStoryboardValid, isUserValid, isAddTasklogValid, isUpdateTasklogValid};