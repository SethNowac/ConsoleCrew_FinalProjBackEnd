const { response } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const router = express.Router();


const routeRoot = '/projects';
const logger = require("../logger");

const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");

const notesModel = require("../models/notesModelMongoDb");
let requestJson;

const { authenticateUser, refreshSession } = require("../controllers/sessionController");

router.get('/:id/notes/:noteId', handleGetSingleNote);
/**
 * Authenticates user that requested query and returns note matching a projectId and noteId. Sends status of 200 if successful,
 * 400 if note was not found or ids were invalid and 500 if there was a database error.
 * @param {*} request Must contain a projectId and noteId. 
 * @param {*} response The found note if successful, error message otherwise.
 * @returns 
 */
async function handleGetSingleNote(request, response){  
    try {
        const foundNote = await notesModel.getSingleNoteById(request.params.id, request.params.noteId);
        if(foundNote.acknowledged){
            logger.info("Note controller, note found successfully");
            response.status(200);
            response.send(foundNote);
        }
        else{
            logger.error("Note controller, note not found");
            response.status(400);
            response.send("Failed to find note for unknown reason.");
        }
    } catch (err) {
        logger.error("Note controller, failed to find note."+ err.message);

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


router.get('/:id/notes', handleGetAllNotesByProject);
/**
 * Returns all notes matching a specified project id. Sends status of 200 if successful,
 * 400 if projectId was invalid and 500 if there was a database error.
 * @param {*} request Must contain valid projectId. 
 * @param {*} response The array containing all notes matching the projectId.
 * @returns Array containing all notes matching projectId. Empty array if none were found.
 */
async function handleGetAllNotesByProject(request, response){
    try {
        const foundNotes = await notesModel.getAllNotesByProject(request.params.id);
        if(foundNotes.acknowledged){
            logger.info("Note controller, notes found successfully");
            response.status(200);
            response.send(foundNotes);
        }
        else{
            logger.error("Note controller, notes not found");
            response.status(400);
            response.send("Failed to find notes for unknown reason.");
        }
    } catch (err) {
        logger.error("Note controller, failed to find notes."+ err.message);

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


router.post('/:id/notes', handleAddNote);
/**
 * Creates a new note referencing the projectId provided in the url. Sends status of 200 if successful,
 * 400 if note couldn't be created or data was invalid and 500 if there was a database error or unknown error.
 * @param {*} request Must contain note id, title and note contained in Json and projectId in request.params.
 * @param {*} response The newly created note if successful, error message otherwise.
 * @returns The newly created note or error message.
 */
async function handleAddNote(request, response) {
    requestJson = request.body;
    try {
        const addedNote = await notesModel.addNote(request.params.id, requestJson.id, requestJson.title, requestJson.note);
        if(addedNote.acknowledged){
            logger.info("Note controller, note created successfully");
            response.status(200);
            response.send(addedNote);
        }
        else{
            logger.error("Note controller, add note failed");
            response.status(400);
            response.send("Failed to add note for unknown reason.");
        }
    } catch (err) {
        logger.error("Note controller, failed to add note."+ err.message);

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


router.put('/:id/notes', handleUpdateNote);
/**
 * Updates a note matching a note id and project id. Sends status of 200 if successful,
 * 400 if note was not found or ids were invalid or data was invalid and 500 if there was a database error.
 * @param {*} request Must contain old projectId in params and new projectId, old id, new id, new title and new note in json.
 * @param {*} response The newly updated note or error message.
 * @returns The newly updated note or error message.
 */
async function handleUpdateNote(request, response){
    requestJson = request.body;
    try {
        const result = await notesModel.updateNote(request.params.id, requestJson.newProjectId, requestJson.oldId, requestJson.newId, requestJson.title, requestJson.note);
        if(result.acknowledged){
            logger.info("Note controller, note updated successfully.");
            response.status(200);
            response.send(result);
        }
    } catch (err) {
        logger.error("Note controller, failed to update note."+ err.message);

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


router.delete('/:id/notes/:noteId', handleDeleteNote);
/**
 * Deletes a note matching a project id and a note id. Sends status of 200 if successful,
 * 400 if note was not found or ids were invalid and 500 if there was a database error.
 * @param {*} request Must contain note id and project id in request.params.
 * @param {*} response True if item was deleted, error message otherwise.
 * @returns True is successful, error message otherwise.
 */
async function handleDeleteNote(request, response){
    try {
        const deletedItem = await notesModel.getSingleNoteById(request.params.id, request.params.noteId);
        const result = await notesModel.deleteNote(request.params.id, request.params.noteId);

        if(result){
            logger.info("Notes controller, note successfully deleted");
            response.status(200);
            response.send(deletedItem);
        }
        else{
            logger.error("Note controller, note was not deleted");
            response.status(400);
            response.send("Failed to delete note for unknown reason.");
        }
    } catch (err) {
        logger.error("Note controller, failed to delete note."+ err.message);

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