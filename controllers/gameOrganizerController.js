const { response } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const router = express.Router();

// Uses /games to make database requests
const routeRoot = '/games';

const logger = require("../logger")

const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");

const gameOrganizerModel = require("../models/gameOrganizerModelMongoDb");
let requestJson;

/**
 * Validates creating a new game and adds it to the database. Input is processed with body parameters. Sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request body of name and description to add to database
 * @param {string} response result on whether we succeeded in adding to database
 */
router.post('/', handleAddGameInformation);
async function handleAddGameInformation(request, response) {
    requestJson = request.body;
    try {
        const added = await gameOrganizerModel.addGameInformation(requestJson.name, requestJson.desc);
        if(added.acknowledged) {
            logger.info("Game ["+requestJson.name+"] of description ["+requestJson.desc+"] was added successfully!");
            response.status(200);
            let addedGame = await gameOrganizerModel.getSingleGameById(added.insertedId);
            response.send(addedGame);
        }
        else if(added == false) {
            logger.error("Game organizer controller | Add Game | Unexpected failure when adding game; should not happen!");
            response.status(400);
            response.send("Game organizer controller | Add Game | Failed to add game for unknown reason!");
        }
    }
    catch(err) {
        logger.error("Game organizer controller | Failed to add a game: " + err.message)
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
 * Validates reading an existing game in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the game to get
 * @param {string} response result on whether or not the game was successfully retrieved
 */
router.get('/:name', handleGetSingleGame);
async function handleGetSingleGame(request, response) {
    try {
        let gameOrganizerObject = (await gameOrganizerModel.getGameInformationSingle(request.params.name));
        if(gameOrganizerObject != null) {
            logger.info("Game organizer controller | Get single game | Game ["+gameOrganizerObject.name+"] was retrieved successfully!");
            response.status(200);
            response.send(gameOrganizerObject);
        }
        else {
            logger.error("Game organizer controller | Get single game | Failed to retrieve game ["+request.params.name+"]");
            response.status(400);
            response.send("Game organizer controller | Get single game | Failed to retrieve game ["+request.params.name+"]");
        }
    }
    catch(err) {
        logger.error("Game organizer controller | Failed to get a single game: " + err.message)
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
 * Validates reading all existing games in the database and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the game to get
 * @param {string} response result on whether or not the game was successfully retrieved
 */
router.get('/', handleGetAllGames);
async function handleGetAllGames(request, response) {
    try {
        let gameOrganizerObject = (await gameOrganizerModel.getAllGameInformation());
        if(gameOrganizerObject != null) {
            logger.info("Game organizer controller | Get all games | Retrieved successfully!");
            response.status(200);
            response.send(gameOrganizerObject);
        }
        else {
            logger.error("Game organizer controller | Get all games | Failed to retrieve all games");
            response.status(400);
            response.send("Game organizer controller | Get all games | Failed to retrieve all games");
        }
    }
    catch(err) {
        logger.error("Game organizer controller | Failed to get all games: " + err.message)
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
 * Validates updating an existing game in the database with body parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request body of old name, new name and new description for update
 * @param {string} response result on whether the game was successfully updated
 */
router.put('/', handleUpdateGameInformation);
async function handleUpdateGameInformation(request, response) {
    requestJson = request.body;
    try{
        const result = await gameOrganizerModel.updateGameInformation(requestJson.name, requestJson.newName, requestJson.newDesc);
        if(result.acknowledged) {
            logger.info("Game organizer controller | Update game | Attempt to update game [" + requestJson.name + "] to name ["+requestJson.newName+"] with description [" + requestJson.newDesc + "] was successful!");
            response.status(200);
            let updatedObject = await gameOrganizerModel.getGameInformationSingle(requestJson.newName);
            response.send(updatedObject);
        }
        else if(result == false) {
            logger.error("Game organizer controller | Update game | Unexpected failure when updating game; should not happen!");
            response.status(400);
            response.send("Game organizer controller | Update game | Unexpected failure when updating game; should not happen!");
        }
    }
    catch(err) {
        logger.error("Game organizer controller | Game organizer controller | Update game | Failed to update game: " + err.message)
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
 * Validates deleting an existing game in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter name of the game to delete
 * @param {string} response result on whether the game was successfully deleted
 */
 router.delete('/:name', handleDeleteGameInformation);
 async function handleDeleteGameInformation(request, response) {
    try{
        const deletedItem = await gameOrganizerModel.getGameInformationSingle(request.params.name);
        const result = await gameOrganizerModel.deleteGameInformation(request.params.name);
        if(result) {
            logger.info("Game organizer controller | Delete game | Attempt to delete game " + request.params.name + " was successful!");
            response.status(200);
            response.send(deletedItem);
        }
        else {
            logger.info("Game organizer controller | Delete game | Unexpected failure when adding game; should not happen!");
            response.status(400);
            response.send("Game organizer controller | Delete game | Unexpected failure when adding game; should not happen!");
        }
    }
    catch(err) {
        logger.error("Game organizer controller | Failed to delete game: " + err.message)
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
