const { response } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const router = express.Router();

// Uses /projects to make database requests
const routeRoot = '/projects';

const logger = require("../logger")

const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");

const projectsModel = require("../models/projectModelMongoDb");
let requestJson;

/**
 * Validates creating a new project and adds it to the database. Input is processed with body parameters. Sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request body of name and description to add to database
 * @param {string} response result on whether we succeeded in adding to database
 */
router.post('/', handleAddProject);
async function handleAddProject(request, response) {
    requestJson = request.body;
    try {
        const added = await projectsModel.addProject(requestJson.id, requestJson.title, requestJson.desc, requestJson.tag, requestJson.userId);
        if(added.acknowledged) {
            logger.info("Project ["+requestJson.title+"] of description ["+requestJson.desc+"] was added successfully!");
            response.status(200);
            let addedProject = await projectsModel.getSingleProjectById(requestJson.id);
            response.send(addedProject);
        }
        else if(added == false) {
            logger.error("Project controller | Unexpected failure when adding project; should not happen!");
            response.status(400);
            response.send("Project controller | Failed to add project for unknown reason!");
        }
    }
    catch(err) {
        logger.error("Project controller | Failed to add a project: " + err.message)
        if(err instanceof DatabaseError) {
            response.status(500);
            response.send({errorMessage: "There was a system error: " + err.message});
        }
        else if(err instanceof InvalidInputError) {
            response.status(400);
            response.send({errorMessage: "There was a validation error: " + err.message});
        }
        else {
            response.status(500);
            response.send({errorMessage: "There was an unexpected error: " + err.message});
        }
    }
}

/**
 * Validates reading an existing project in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the project to get
 * @param {string} response result on whether or not the project was successfully retrieved
 */
// router.get('/:id', handleGetSingleProject);
// async function handleGetSingleProject(request, response) {
//     try {
//         let projectsObject = (await projectsModel.getSingleProjectById(request.params.id));
//         if(projectsObject != null) {
//             logger.info("Project controller | Project ["+projectsObject.title+"] was retrieved successfully!");
//             response.status(200);
//             response.send(projectsObject);
//         }
//         else {
//             logger.error("Project controller | Failed to retrieve project ["+request.params.id+"]");
//             response.status(400);
//             response.send("Project controller | Failed to retrieve project ["+request.params.id+"]");
//         }
//     }
//     catch(err) {
//         logger.error("Project controller | Failed to get a single project: " + err.message)
//         if(err instanceof DatabaseError) {
//             response.status(500);
//             response.send({errorMessage: "There was a system error: " + err.message});
//         }
//         else if(err instanceof InvalidInputError) {
//             response.status(400);
//             response.send({errorMessage: "There was a validation error: " + err.message});
//         }
//         else {
//             response.status(500);
//             response.send({errorMessage: "There was an unexpected error: " + err.message});
//         }
//     }
// }

/**
 * Validates reading an existing project in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the project to get
 * @param {string} response result on whether or not the project was successfully retrieved
 */
router.get('/:userId', handleGetProjectsByUserId);
async function handleGetProjectsByUserId(request, response) {
    try {
        let projectsObject = (await projectsModel.getAllProjectsByUser(parseInt(request.params.userId)));
        if(projectsObject != null) {
            logger.info("Project controller | Projects were retrieved successfully!");
            response.status(200);
            response.send(projectsObject);
        }
        else {
            logger.error("Project controller | Failed to retrieve projects");
            response.status(400);
            response.send("Project controller | Failed to retrieve projects");
        }
    }
    catch(err) {
        logger.error("Project controller | Failed to get a single project: " + err.message)
        if(err instanceof DatabaseError) {
            response.status(500);
            response.send({errorMessage: "There was a system error: " + err.message});
        }
        else if(err instanceof InvalidInputError) {
            response.status(400);
            response.send({errorMessage: "There was a validation error: " + err.message});
        }
        else {
            response.status(500);
            response.send({errorMessage: "There was an unexpected error: " + err.message});
        }
    }
}

/**
 * Validates reading all existing projects in the database and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the project to get
 * @param {string} response result on whether or not the project was successfully retrieved
 */
router.get('/', handleGetAllProjects);
async function handleGetAllProjects(request, response) {
    try {
        let projectsObject = (await projectsModel.getAllProjects());
        if(projectsObject != null) {
            logger.info("Project controller | Retrieved successfully!");
            response.status(200);
            response.send(projectsObject);
        }
        else {
            logger.error("Project controller | Failed to retrieve all projects");
            response.status(400);
            response.send("Project controller | Failed to retrieve all projects");
        }
    }
    catch(err) {
        logger.error("Project controller | Failed to get all projects: " + err.message)
        if(err instanceof DatabaseError) {
            response.status(500);
            response.send({errorMessage: "There was a system error: " + err.message});
        }
        else {
            response.status(500);
            response.send({errorMessage: "There was an unexpected error: " + err.message});
        }
    }
}

/**
 * Validates updating an existing project in the database with body parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request body of old name, new name and new description for update
 * @param {string} response result on whether the project was successfully updated
 */
router.put('/', handleUpdateProject);
async function handleUpdateProject(request, response) {
    requestJson = request.body;
    try{
        const result = await projectsModel.updateProject(requestJson.id, requestJson.newTitle, requestJson.newDesc, requestJson.newTag);
        if(result.acknowledged) {
            logger.info("Project controller | Attempt to update project [" + requestJson.id + "] to name ["+requestJson.newTitle+"] with description [" + requestJson.newDesc + "] was successful!");
            response.status(200);
            let updatedObject = await projectsModel.getSingleProjectById(requestJson.id);
            response.send(updatedObject);
        }
        else if(result == false) {
            logger.error("Project controller | Unexpected failure when updating project; should not happen!");
            response.status(400);
            response.send("Project controller | Unexpected failure when updating project; should not happen!");
        }
    }
    catch(err) {
        logger.error("Project controller | Failed to update project: " + err.message)
        if(err instanceof DatabaseError) {
            response.status(500);
            response.send({errorMessage: "There was a system error: " + err.message});
        }
        else if(err instanceof InvalidInputError) {
            response.status(400);
            response.send({errorMessage: "There was a validation error: " + err.message});
        }
        else {
            response.status(500);
            response.send({errorMessage: "There was an unexpected error: " + err.message});
        }
    }
}


/**
 * Validates deleting an existing project in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter name of the project to delete
 * @param {string} response result on whether the project was successfully deleted
 */
 router.delete('/:id', handleDeleteProject);
 async function handleDeleteProject(request, response) {
    try{
        const deletedItem = await projectsModel.getSingleProjectById(request.params.id);
        const result = await projectsModel.deleteProject(request.params.id);
        if(result) {
            logger.info("Project controller | Attempt to delete project " + request.params.id + " was successful!");
            response.status(200);
            response.send(deletedItem);
        }
        else {
            logger.info("Project controller | Unexpected failure when adding project; should not happen!");
            response.status(400);
            response.send("Project controller | Unexpected failure when adding project; should not happen!");
        }
    }
    catch(err) {
        logger.error("Project controller | Failed to delete project: " + err.message)
        if(err instanceof DatabaseError) {
            response.status(500);
            response.send({errorMessage: "There was a system error: " + err.message});
        }
        else if(err instanceof InvalidInputError) {
            response.status(400);
            response.send({errorMessage: "There was a validation error: " + err.message});
        }
        else {
            response.status(500);
            response.send({errorMessage: "There was an unexpected error: " + err.message});
        }
    }
}


module.exports = {
    router,
    routeRoot
}
