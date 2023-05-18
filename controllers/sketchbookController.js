const { response } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const router = express.Router();


const routeRoot = '/projects';
const logger = require("../logger");

const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");

const sketchbookModel = require("../models/sketchbookModelMongoDb");
let requestJson;


router.get('/:id/sketch/:sketchId', handleGetSingleSketch);
async function handleGetSingleSketch(request, response){  
    try {
        const foundSketch = await sketchbookModel.getSingleSketchById(request.params.id, request.params.sketchId);
        if(foundSketch.acknowledged){
            logger.info("Sketchbook controller, sketch found successfully");
            response.status(200);
            response.send(foundSketch);
        }
        else{
            logger.error("Sketchbook controller, sketch not found");
            response.status(400);
            response.send("Failed to find sketch for unknown reason.");
        }
    } catch (err) {
        logger.error("Sketchbook controller, failed to find sketch."+ err.message);

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


router.get('/:id/sketches', handleGetAllSketchesByProject);
async function handleGetAllSketchesByProject(request, response){
    try {
        const foundSketches = await sketchbookModel.getAllSketchesByProject(request.params.id);
        if(foundSketches.acknowledged){
            logger.info("Sketchbook controller, sketches found successfully");
            response.status(200);
            response.send(foundSketches);
        }
        else{
            logger.error("Sketchbook controller, sketches not found");
            response.status(400);
            response.send("Failed to find sketches for unknown reason.");
        }
    } catch (err) {
        logger.error("Sketchbook controller, failed to find sketches."+ err.message);

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


router.post('/:id/sketch', handleAddSketch);
async function handleAddSketch(request, response) {
    requestJson = request.body;
    try {
        const addedSketch = await sketchbookModel.addSketch(request.params.id, requestJson.id, requestJson.image);
        if(addedSketch.acknowledged){
            logger.info("Sketchbook controller, sketch created successfully");
            response.status(200);
            response.send(addedSketch);
        }
        else{
            logger.error("Sketchbook controller, add sketch failed");
            response.status(400);
            response.send("Failed to add sketch for unknown reason.");
        }
    } catch (err) {
        logger.error("Sketchbook controller, failed to add sketch."+ err.message);

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


router.put('/:id/sketch', handleUpdateSketch);
async function handleUpdateSketch(request, response){
    requestJson = request.body;
    try {
        const result = await sketchbookModel.updateSketch(request.params.id, requestJson.newProjectId, requestJson.oldId, requestJson.newId, requestJson.image);
        if(result.acknowledged){
            logger.info("Sketchbook controller, sketch updated successfully.");
            response.status(200);
            response.send(result);
        }
    } catch (err) {
        logger.error("Sketchbook controller, failed to update sketch."+ err.message);

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


router.delete('/:id/sketch/:sketchId', handleDeleteSketch);
async function handleDeleteSketch(request, response){
    try {
        const deletedItem = await sketchbookModel.getSingleSketchById(request.params.id, request.params.sketchId);
        const result = await sketchbookModel.deleteSketch(request.params.id, request.params.sketchId);

        if(result){
            logger.info("Sketchbook controller, sketch successfully deleted");
            response.status(200);
            response.send(deletedItem);
        }
        else{
            logger.error("Sketchbook controller, sketch was not deleted");
            response.status(400);
            response.send("Failed to delete sketch for unknown reason.");
        }
    } catch (err) {
        logger.error("Sketchbook controller, failed to delete sketch."+ err.message);

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