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


router.get('/:id/notes/:noteId', handleGetSingleNote);
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