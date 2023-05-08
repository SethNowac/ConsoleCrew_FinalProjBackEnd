const { response } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const router = express.Router();

// Uses /notes to make database requests
const routeRoot = '/notes';

const logger = require("../logger")

const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");

const notesModel = require("../models/notesModelMongoDb");
let requestJson;

/**
 * Validates creating a new note and adds it to the database. Input is processed with body parameters. Sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request body of name and description to add to database
 * @param {string} response result on whether we succeeded in adding to database
 */
router.post('/', handleAddNote);
async function handleAddNote(request, response) {
    requestJson = request.body;
    try {
        const added = await notesModel.addNote(requestJson.id, requestJson.title, requestJson.note);
        if(added.acknowledged) {
            logger.info("Note ["+requestJson.name+"] of description ["+requestJson.desc+"] was added successfully!");
            response.status(200);
            let addedNote = await notesModel.getSingleNoteById(added.insertedId);
            response.send(addedNote);
        }
        else if(added == false) {
            logger.error("Note controller | Unexpected failure when adding note; should not happen!");
            response.status(400);
            response.send("Note controller | Failed to add note for unknown reason!");
        }
    }
    catch(err) {
        logger.error("Note controller | Failed to add a note: " + err.message)
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
 * Validates reading an existing note in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the note to get
 * @param {string} response result on whether or not the note was successfully retrieved
 */
router.get('/:id', handleGetSingleNote);
async function handleGetSingleNote(request, response) {
    try {
        let notesObject = (await notesModel.getSingleNoteById(request.params.id));
        if(notesObject != null) {
            logger.info("Note controller | Note ["+notesObject.name+"] was retrieved successfully!");
            response.status(200);
            response.send(notesObject);
        }
        else {
            logger.error("Note controller | Failed to retrieve note ["+request.params.id+"]");
            response.status(400);
            response.send("Note controller | Failed to retrieve note ["+request.params.id+"]");
        }
    }
    catch(err) {
        logger.error("Note controller | Failed to get a single note: " + err.message)
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
 * Validates reading all existing notes in the database and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the note to get
 * @param {string} response result on whether or not the note was successfully retrieved
 */
router.get('/', handleGetAllNotes);
async function handleGetAllNotes(request, response) {
    try {
        let notesObject = (await notesModel.getAllNote());
        if(notesObject != null) {
            logger.info("Note controller | Retrieved successfully!");
            response.status(200);
            response.send(notesObject);
        }
        else {
            logger.error("Note controller | Failed to retrieve all notes");
            response.status(400);
            response.send("Note controller | Failed to retrieve all notes");
        }
    }
    catch(err) {
        logger.error("Note controller | Failed to get all notes: " + err.message)
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
 * Validates updating an existing note in the database with body parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request body of old name, new name and new description for update
 * @param {string} response result on whether the note was successfully updated
 */
router.put('/', handleUpdateNote);
async function handleUpdateNote(request, response) {
    requestJson = request.body;
    try{
        const result = await notesModel.updateNote(requestJson.name, requestJson.newName, requestJson.newDesc);
        if(result.acknowledged) {
            logger.info("Note controller | Attempt to update note [" + requestJson.name + "] to name ["+requestJson.newName+"] with description [" + requestJson.newDesc + "] was successful!");
            response.status(200);
            let updatedObject = await notesModel.getNoteSingle(requestJson.newName);
            response.send(updatedObject);
        }
        else if(result == false) {
            logger.error("Note controller | Unexpected failure when updating note; should not happen!");
            response.status(400);
            response.send("Note controller | Unexpected failure when updating note; should not happen!");
        }
    }
    catch(err) {
        logger.error("Note controller | Failed to update note: " + err.message)
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
 * Validates deleting an existing note in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter name of the note to delete
 * @param {string} response result on whether the note was successfully deleted
 */
 router.delete('/:name', handleDeleteNote);
 async function handleDeleteNote(request, response) {
    try{
        const deletedItem = await notesModel.getNoteSingle(request.params.name);
        const result = await notesModel.deleteNote(request.params.name);
        if(result) {
            logger.info("Note controller | Attempt to delete note " + request.params.name + " was successful!");
            response.status(200);
            response.send(deletedItem);
        }
        else {
            logger.info("Note controller | Unexpected failure when adding note; should not happen!");
            response.status(400);
            response.send("Note controller | Unexpected failure when adding note; should not happen!");
        }
    }
    catch(err) {
        logger.error("Note controller | Failed to delete note: " + err.message)
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
