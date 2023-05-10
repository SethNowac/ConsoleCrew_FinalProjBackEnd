//const dbName = "storyboard_db";
const collectionName = "Storyboard";

// Include class that enables a connection to the mongoDB database
const { MongoClient } = require("mongodb");

// Custom errors for database errors and invalid input errors
const { DatabaseError } = require("./DatabaseError");
const { InvalidInputError } = require("./InvalidInputErrors");

// Extra string validation tools
const validateUtils = require("./validateUtils");

let client;
let storyboardCollection;

const logger = require("../logger")

/**
 * Connect up to the online MongoDb database with the name stored in dbName
 */
async function initialize(databaseName, reset, url) {
    try {
        //const url = process.env.URL_PRE + process.env.MONGODB_PWD + process.env.URL_POST;
        client = new MongoClient(url); // store connected client for use while the app is running
        await client.connect();
        logger.info("Connected to MongoDb");
        db = client.db(databaseName);

        // Check to see if the collections exists for storyboard model
        storyboardCollectionCursor = await db.listCollections({ name: collectionName });
        storyboardCollectionArray = await storyboardCollectionCursor.toArray();
        if (storyboardCollectionArray.length == 0) {
            // collation specifying case-insensitive collection
            const collation = { locale: "en", strength: 1 };
            // No match was found, so create new collection
            await db.createCollection(collectionName, { collation: collation });
        }
        storyboardCollection = db.collection(collectionName); // convenient access to collection

        if (reset) {
            await storyboardCollection.drop();
        }

    } catch (err) {
        logger.error("Initialize error: " + err.message);
        throw new DatabaseError("Initialize error: " + err.message);
    }
}

/**
 * Closes the database connection when we're done with it
 */
async function close() {
    try {
        await client.close();
        logger.info("MongoDb connection closed");
    } catch (err) {
        logger.error("Model error: " + err.message);
    }
}

/**
 * Gets a list of all data within the storyboard collection of the database
 * @returns An array with the list of items in the collection
 * @throws {DatabaseError} If the database could not be read from or if there is nothing in the database
 */
async function getAllStoryboards() {
    try {
        let resultArray;
        result = await getStoryboardCollection().find();
        resultArray = await result.toArray();
        if (resultArray.length == 0 || result == null) {
            logger.error("Get all storyboards model error: There is currently nothing in the database to read!");
            throw new DatabaseError("Get all storyboards model error: There is currently nothing in the database to read!")
        }
        logger.info("Get all storyboards model: successfully retrieved all storyboards")
        return resultArray;
    }
    catch (err) {
        logger.error("Get all storyboards model error: " + err.message);
        throw new DatabaseError("Get all storyboards model error: " + err.message);
    }
}

/**
 * Adds a new storyboard model item to the storyboard model collection with a name and password
 * @param {integer} id Id of the storyboard to add
 * @param {string} name Name of the storyboard to add
 * @param {string} password Password of the storyboard to add
 * @returns true if the item was added successfully. false otherwise.
 * @throws {DatabaseError} if there was an issue writing to the database. Generally should not happen
 * @throws {InvalidInputError} if an invalid parameter was passed in
 */
async function addStoryboard(id, projectId, categoryId, description) {
    if (!validateUtils.isAddStoryboardValid(id, projectId, categoryId, description)) {
        logger.error("Add storyboard model error: one of the parameters was not valid!");
        throw new InvalidInputError("Add storyboard model error: one of the parameters was not valid!");
    }
    else {
        try {
            let result = (await getStoryboardCollection().insertOne({ id: id, projectId: projectId, categoryId: categoryId, description: description }));

            if (result.acknowledged) {
                logger.info("Add storyboard model: Successfully added storyboard");
                return result;
            }
            else {
                throw new DatabaseError("Add storyboard model error: write request was not acknowledged!");
            }
        }
        catch (err) {
            logger.error(err.message);
            throw new DatabaseError(err.message)
        }
    }
    return false;
}

/**
 * Reads a storyboard item from the storyboard model collection of the database by
 * performing a search query with a passed in id
 * @param {integer} id id of the storyboard to read
 * @returns A single storyboard item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getSingleStoryboardById(id) {
    if (!id) {
        logger.error("Get storyboard model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Get storyboard model error: cannot pass in an empty parameter!");
    }
    else {
        let result = null;
        try {
            result = await getStoryboardCollection().findOne({ id: id });
            if (result == null) {
                logger.error("Get storyboard model error: id " + id + " was not found in database!");
                throw new InvalidInputError("Get storyboard model error: id " + id + " was not found in database!");
            }

            logger.info("Get single storyboard model: Successfully retrieved " + result.name);
            return result;
        }
        catch (err) {
            logger.error("Get single storyboard model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Get storyboard model error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Updates one of the storyboard items in the storyboard database by searching for the old name and updating it
 * with a new name and description
 * @param {string} oldName The name of the storyboard to update
 * @param {string} newName The name to replace the old one with
 * @param {string} newPassword The description to replace the old one with
 * @returns Whether the function succeeded in updating the storyboard
 * @throws {InvalidInputError} if the new name or description is invalid, if the old name was not found in the database
 * or if the old name parameter is empty
 * @throws {DatabaseError} If there was an issue updating the database
 */
async function updateStoryboard(id, categoryId, description) {
    if (!id) {
        logger.error("Update storyboard model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Update storyboard model error: cannot pass in an empty parameter!");
    } else if (!validateUtils.isUpdateStoryboardValid(id, categoryId, description)) {
        logger.error("Update storyboard model error: one of the parameters was not valid!");
        throw new InvalidInputError("Update storyboard model error: one of the parameters was not valid!");
    }
    else {
        try {
            let checkExists = await getStoryboardCollection().updateOne({ id: id }, { $set: { categoryId: categoryId, description: description } });
            if (checkExists.modifiedCount > 0) {
                logger.info("Update storyboard model: Successfully updated storyboard with id: " + id);
                return checkExists;
            } else {
                throw new InvalidInputError("Update storyboard model error: id " + id + " was not found in database!");
            }
        }
        catch (err) {
            logger.error("Update storyboard model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Update storyboard model error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Deletes a storyboard item from the storyboard database by searching for the item by id and removing it
 * @param {string} id Id of the storyboard to delete
 * @returns Whether the function succeeded in deleting the item
 * @throws {InvalidInputError} if an empty name parameter is passed in or if the name was not found in the database
 * @throws {DatabaseError} If there was an issue deleting the storyboard from the database
 */
async function deleteStoryboard(id) {
    if (!id) {
        logger.error("Delete storyboard model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Delete storyboard model error: cannot pass in an empty parameter!");
    }
    else {
        let checkExists = null;
        try {
            checkExists = await getStoryboardSingle(id);
            let result = (await getStoryboardCollection().deleteOne({ id: id }));
            if (result.deletedCount > 0) {
                logger.info("Delete storyboard model: Successfully deleted " + id);
                return true;
            }
            else {
                throw new DatabaseError("Unexpected error occured; unable to delete from database!");
            }
        }
        catch (err) {
            logger.error("Delete storyboard model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError("Delete storyboard model error: " + err.message);
            }
            else {
                throw new DatabaseError("Delete storyboard model error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Convenience function that returns the storyboard model collection 
 * @returns Storyboard information collection
 * @throws {DatabaseError} If the collection could not be registered
 */
function getStoryboardCollection() {
    // Validates the collection by performing a null check
    if (storyboardCollection == null) {
        logger.error("Error with connection to database: Unable to register collection!");
        throw new DatabaseError("Error with connection to database: Unable to register collection!");
    }
    return storyboardCollection;
}

function getClient() {
    return client;
}

module.exports = { getClient, initialize, addStoryboard, getAllStoryboards, close, getStoryboardCollection, updateStoryboard, deleteStoryboard, getSingleStoryboardById }