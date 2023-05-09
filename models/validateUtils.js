const validator = require('validator');

function isTagValid(id, name) {
    if(!id || id < 0 || !name) {
        return false;
    }
    return true;
}

function isAddProjectValid(id, title, desc, catId, genre, userId) {
    if(!id || id < 0 || userId < 0 || !title || !desc || !catId || !genre || !userId) {
        return false;
    }
    return true;
}

function isUpdateProjectValid(id, newTitle, newDesc, newCatId, newGenre) {
    if(!id || id < 0 || !newTitle || !newDesc || !newCatId || !newGenre) {
        return false;
    }
    return true;
}

function isAddStoryboardValid(id, projectId, categoryId, description) {
    if(!id || id < 0 || !projectId || projectId < 0 || !categoryId || categoryId < 0 || !description) {
        return false;
    }
    return true;
}

function isUpdateStoryboardValid(id, categoryId, description) {
    if(!id || id < 0 || !categoryId || categoryId < 0 || !description) {
        return false;
    }
    return true;
}

function isUserValid(id, name, password) {
    if(!id || id < 0 || !name || !password) {
        return false;
    }
    return true;
}

function isAddTasklogValid(id, issue, projectId) {
    if(!id || id < 0 || !issue || !projectId || projectId < 0) {
        return false;
    }
    return true;
}

function isUpdateTasklogValid(id, issue, isResolved) {
    if(!id || id < 0 || !issue || !isResolved) {
        return false;
    }
    return true;
}



module.exports= {isTagValid, isAddProjectValid, isUpdateProjectValid, isAddStoryboardValid, isUpdateStoryboardValid, isUserValid, isAddTasklogValid, isUpdateTasklogValid};