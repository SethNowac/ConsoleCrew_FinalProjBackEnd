const { response } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const router = express.Router();

// Uses /tasklogs to make database requests
const routeRoot = '/tasklogs';

const logger = require("../logger")

const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");

const tasklogsModel = require("../models/tasklogModelMongoDb");
let requestJson;

/**
 * Validates creating a new tasklog and adds it to the database. Input is processed with body parameters. Sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request body of name and description to add to database
 * @param {string} response result on whether we succeeded in adding to database
 */
router.post('/', handleAddTasklog);
async function handleAddTasklog(request, response) {
    requestJson = request.body;
    try {
        const added = await tasklogsModel.addTasklog(requestJson.id, requestJson.issue, requestJson.projectId);
        if(added.acknowledged) {
            logger.info("Tasklog ["+requestJson.id+"] of issue ["+requestJson.issue+"] was added successfully!");
            response.status(200);
            let addedTasklog = await tasklogsModel.getSingleTasklogById(requestJson.id);
            response.send(addedTasklog);
        }
        else if(added == false) {
            logger.error("Tasklog controller | Unexpected failure when adding tasklog; should not happen!");
            response.status(400);
            response.send("Tasklog controller | Failed to add tasklog for unknown reason!");
        }
    }
    catch(err) {
        logger.error("Tasklog controller | Failed to add a tasklog: " + err.message)
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
 * Validates reading an existing tasklog in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the tasklog to get
 * @param {string} response result on whether or not the tasklog was successfully retrieved
 */
// router.get('/:id', handleGetSingleTasklog);
// async function handleGetSingleTasklog(request, response) {
//     try {
//         let tasklogsObject = (await tasklogsModel.getSingleTasklogById(request.params.id));
//         if(tasklogsObject != null) {
//             logger.info("Tasklog controller | Tasklog ["+tasklogsObject.id+"] was retrieved successfully!");
//             response.status(200);
//             response.send(tasklogsObject);
//         }
//         else {
//             logger.error("Tasklog controller | Failed to retrieve tasklog ["+request.params.id+"]");
//             response.status(400);
//             response.send("Tasklog controller | Failed to retrieve tasklog ["+request.params.id+"]");
//         }
//     }
//     catch(err) {
//         logger.error("Tasklog controller | Failed to get a single tasklog: " + err.message)
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
router.get('/:projectId', handleGetTasksByProjectId);
async function handleGetTasksByProjectId(request, response) {
    try {
        let tasklogsObject = (await tasklogsModel.getAllTasksByProject(parseInt(request.params.projectId)));
        if(tasklogsObject != null) {
            logger.info("Tasklog controller | Tasklogs were retrieved successfully!");
            response.status(200);
            response.send(tasklogsObject);
        }
        else {
            logger.error("Tasklogs controller | Failed to retrieve tasklogs");
            response.status(400);
            response.send("Tasklog controller | Failed to retrieve tasklogs");
        }
    }
    catch(err) {
        logger.error("Tasklog controller | Failed to get tasklogs: " + err.message)
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
 * Validates reading all existing tasklogs in the database and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the tasklog to get
 * @param {string} response result on whether or not the tasklog was successfully retrieved
 */
router.get('/', handleGetAllTasklogs);
async function handleGetAllTasklogs(request, response) {
    try {
        let tasklogsObject = (await tasklogsModel.getAllTasklogs());
        if(tasklogsObject != null) {
            logger.info("Tasklog controller | Retrieved successfully!");
            response.status(200);
            response.send(tasklogsObject);
        }
        else {
            logger.error("Tasklog controller | Failed to retrieve all tasklogs");
            response.status(400);
            response.send("Tasklog controller | Failed to retrieve all tasklogs");
        }
    }
    catch(err) {
        logger.error("Tasklog controller | Failed to get all tasklogs: " + err.message)
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
 * Validates updating an existing tasklog in the database with body parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request body of old name, new name and new description for update
 * @param {string} response result on whether the tasklog was successfully updated
 */
router.put('/', handleUpdateTasklog);
async function handleUpdateTasklog(request, response) {
    requestJson = request.body;
    try{
        const result = await tasklogsModel.updateTasklog(requestJson.id, requestJson.newIssue, requestJson.isResolved, requestJson.newNotes);
        if(result.acknowledged) {
            logger.info("Tasklog controller | Attempt to update tasklog [" + requestJson.id + "] to issue [" + requestJson.newIssue + "] was successful!");
            response.status(200);
            let updatedObject = await tasklogsModel.getSingleTasklogById(requestJson.id);
            response.send(updatedObject);
        }
        else if(result == false) {
            logger.error("Tasklog controller | Unexpected failure when updating tasklog; should not happen!");
            response.status(400);
            response.send("Tasklog controller | Unexpected failure when updating tasklog; should not happen!");
        }
    }
    catch(err) {
        logger.error("Tasklog controller | Failed to update tasklog: " + err.message)
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
 * Validates deleting an existing tasklog in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter name of the tasklog to delete
 * @param {string} response result on whether the tasklog was successfully deleted
 */
 router.delete('/:id', handleDeleteTasklog);
 async function handleDeleteTasklog(request, response) {
    try{
        const deletedItem = await tasklogsModel.getSingleTasklogById(parseInt(request.params.id));
        const result = await tasklogsModel.deleteTasklog(parseInt(request.params.id));
        if(result) {
            logger.info("Tasklog controller | Attempt to delete tasklog " + request.params.id + " was successful!");
            response.status(200);
            response.send(deletedItem);
        }
        else {
            logger.info("Tasklog controller | Unexpected failure when adding tasklog; should not happen!");
            response.status(400);
            response.send("Tasklog controller | Unexpected failure when adding tasklog; should not happen!");
        }
    }
    catch(err) {
        logger.error("Tasklog controller | Failed to delete tasklog: " + err.message)
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
