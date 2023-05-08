const { response } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const router = express.Router();

// Uses /storyboards to make database requests
const routeRoot = '/storyboards';

const logger = require("../logger")

const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");

const storyboardsModel = require("../models/storyboardModelMongoDb");
let requestJson;

/**
 * Validates creating a new storyboard and adds it to the database. Input is processed with body parameters. Sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request body of name and description to add to database
 * @param {string} response result on whether we succeeded in adding to database
 */
router.post('/', handleAddStoryboard);
async function handleAddStoryboard(request, response) {
    requestJson = request.body;
    try {
        const added = await storyboardsModel.addStoryboard(requestJson.id, requestJson.projectId, requestJson.categoryId, requestJson.desc);
        if(added.acknowledged) {
            logger.info("Storyboard ["+requestJson.id+"] of description ["+requestJson.desc+"] was added successfully!");
            response.status(200);
            let addedStoryboard = await storyboardsModel.getSingleStoryboardById(requestJson.id);
            response.send(addedStoryboard);
        }
        else if(added == false) {
            logger.error("Storyboard controller | Unexpected failure when adding storyboard; should not happen!");
            response.status(400);
            response.send("Storyboard controller | Failed to add storyboard for unknown reason!");
        }
    }
    catch(err) {
        logger.error("Storyboard controller | Failed to add a storyboard: " + err.message)
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
 * Validates reading an existing storyboard in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the storyboard to get
 * @param {string} response result on whether or not the storyboard was successfully retrieved
 */
router.get('/:id', handleGetSingleStoryboard);
async function handleGetSingleStoryboard(request, response) {
    try {
        let storyboardsObject = (await storyboardsModel.getSingleStoryboardById(request.params.id));
        if(storyboardsObject != null) {
            logger.info("Storyboard controller | Storyboard ["+storyboardsObject.id+"] was retrieved successfully!");
            response.status(200);
            response.send(storyboardsObject);
        }
        else {
            logger.error("Storyboard controller | Failed to retrieve storyboard ["+request.params.id+"]");
            response.status(400);
            response.send("Storyboard controller | Failed to retrieve storyboard ["+request.params.id+"]");
        }
    }
    catch(err) {
        logger.error("Storyboard controller | Failed to get a single storyboard: " + err.message)
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
 * Validates reading all existing storyboards in the database and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the storyboard to get
 * @param {string} response result on whether or not the storyboard was successfully retrieved
 */
router.get('/', handleGetAllStoryboards);
async function handleGetAllStoryboards(request, response) {
    try {
        let storyboardsObject = (await storyboardsModel.getAllStoryboards());
        if(storyboardsObject != null) {
            logger.info("Storyboard controller | Retrieved successfully!");
            response.status(200);
            response.send(storyboardsObject);
        }
        else {
            logger.error("Storyboard controller | Failed to retrieve all storyboards");
            response.status(400);
            response.send("Storyboard controller | Failed to retrieve all storyboards");
        }
    }
    catch(err) {
        logger.error("Storyboard controller | Failed to get all storyboards: " + err.message)
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
 * Validates updating an existing storyboard in the database with body parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request body of old name, new name and new description for update
 * @param {string} response result on whether the storyboard was successfully updated
 */
router.put('/', handleUpdateStoryboard);
async function handleUpdateStoryboard(request, response) {
    requestJson = request.body;
    try{
        const result = await storyboardsModel.updateStoryboard(requestJson.id, requestJson.newCategoryId, requestJson.newDesc);
        if(result.acknowledged) {
            logger.info("Storyboard controller | Attempt to update storyboard [" + requestJson.id + "] to description [" + requestJson.newDesc + "] was successful!");
            response.status(200);
            let updatedObject = await storyboardsModel.getSingleStoryboardById(requestJson.id);
            response.send(updatedObject);
        }
        else if(result == false) {
            logger.error("Storyboard controller | Unexpected failure when updating storyboard; should not happen!");
            response.status(400);
            response.send("Storyboard controller | Unexpected failure when updating storyboard; should not happen!");
        }
    }
    catch(err) {
        logger.error("Storyboard controller | Failed to update storyboard: " + err.message)
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
 * Validates deleting an existing storyboard in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter name of the storyboard to delete
 * @param {string} response result on whether the storyboard was successfully deleted
 */
 router.delete('/:id', handleDeleteStoryboard);
 async function handleDeleteStoryboard(request, response) {
    try{
        const deletedItem = await storyboardsModel.getSingleStoryboardById(request.params.id);
        const result = await storyboardsModel.deleteStoryboard(request.params.id);
        if(result) {
            logger.info("Storyboard controller | Attempt to delete storyboard " + request.params.id + " was successful!");
            response.status(200);
            response.send(deletedItem);
        }
        else {
            logger.info("Storyboard controller | Unexpected failure when adding storyboard; should not happen!");
            response.status(400);
            response.send("Storyboard controller | Unexpected failure when adding storyboard; should not happen!");
        }
    }
    catch(err) {
        logger.error("Storyboard controller | Failed to delete storyboard: " + err.message)
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
