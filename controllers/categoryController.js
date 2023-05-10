const { response } = require('express');
const express = require('express');
const { send } = require('express/lib/response');
const router = express.Router();

// Uses /categories to make database requests
const routeRoot = '/category';

const logger = require("../logger")

const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");

const categoryModelMongoDb = require("../models/categoryModelMongoDb");
let requestJson;

/**
 * Validates reading an existing category in the database with url parameters and sends a response back to the server
 * on whether it succeeded or failed
 * @param {integer} request parameter of name of the category to get
 * @param {string} response result on whether or not the category was successfully retrieved
 */
router.get('/:id', handleGetSingleCategory);
async function handleGetSingleCategory(request, response) {
    try {
        let categoryObject = (await categoryModelMongoDb.getSingleCategoryById(request.params.id));
        if(categoryObject != null) {
            logger.info("Category controller | Category ["+categoryObject.id+"] was retrieved successfully!");
            response.status(200);
            response.send(categoryObject);
        }
        else {
            logger.error("Category controller | Failed to retrieve category ["+request.params.id+"]");
            response.status(400);
            response.send("Category controller | Failed to retrieve category ["+request.params.id+"]");
        }
    }
    catch(err) {
        logger.error("Category controller | Failed to get a single category: " + err.message)
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
 * Validates reading all existing categories in the database and sends a response back to the server
 * on whether it succeeded or failed
 * @param {string} request parameter of name of the category to get
 * @param {string} response result on whether or not the category was successfully retrieved
 */
router.get('/', handleGetAllCategories);
async function handleGetAllCategories(request, response) {
    try {
        let categoryObject = (await categoryModelMongoDb.getAllCategories());
        if(categoryObject != null) {
            logger.info("Category controller | Retrieved successfully!");
            response.status(200);
            response.send(categoryObject);
        }
        else {
            logger.error("Category controller | Failed to retrieve all categories");
            response.status(400);
            response.send("Category controller | Failed to retrieve all categories");
        }
    }
    catch(err) {
        logger.error("Category controller | Failed to get all categories: " + err.message)
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


module.exports = {
    router,
    routeRoot
}
