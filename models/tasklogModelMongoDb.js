//const dbName = "tasklog_db";
const collectionName = "Tasklog";

// Include class that enables a connection to the mongoDB database
const { MongoClient } = require("mongodb");

// Custom errors for database errors and invalid input errors
const { DatabaseError } = require("./DatabaseError");
const { InvalidInputError } = require("./InvalidInputErrors");

// Extra string validation tools
const validateUtils = require("./validateUtils");

let client;
let tasklogCollection;

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

        // Check to see if the collections exists for tasklog model
        tasklogCollectionCursor = await db.listCollections({ name: collectionName });
        tasklogCollectionArray = await tasklogCollectionCursor.toArray();
        if (tasklogCollectionArray.length == 0) {
            // collation specifying case-insensitive collection
            const collation = { locale: "en", strength: 1 };
            // No match was found, so create new collection
            await db.createCollection(collectionName, { collation: collation });
        }
        tasklogCollection = db.collection(collectionName); // convenient access to collection

        if (reset) {
            await tasklogCollection.drop();
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
 * Gets a list of all data within the tasklog collection of the database
 * @returns An array with the list of items in the collection
 * @throws {DatabaseError} If the database could not be read from or if there is nothing in the database
 */
async function getAllTasklogs() {
    try {
        let resultArray;
        result = await getTasklogCollection().find();
        resultArray = await result.toArray();
        if (resultArray.length == 0 || result == null) {
            logger.error("Get all tasklogs model error: There is currently nothing in the database to read!");
            throw new DatabaseError("Get all tasklogs model error: There is currently nothing in the database to read!")
        }
        logger.info("Get all tasklogs model: successfully retrieved all tasklogs")
        return resultArray;
    }
    catch (err) {
        logger.error("Get all tasklogs model error: " + err.message);
        throw new DatabaseError("Get all tasklogs model error: " + err.message);
    }
}

/**
 * Adds a new tasklog model item to the tasklog model collection with a name and password
 * @param {integer} id Id of the tasklog to add
 * @param {string} issue Issue of the tasklog to add
 * @param {integer} projectId Project Id of the tasklog that it belongs to
 * @returns true if the item was added successfully. false otherwise.
 * @throws {DatabaseError} if there was an issue writing to the database. Generally should not happen
 * @throws {InvalidInputError} if an invalid parameter was passed in
 */
async function addTasklog(id, issue, projectId) {
    if (!validateUtils.isAddTasklogValid(id, issue, projectId)) {
        logger.error("Add tasklog model error: one or more tasklog parameters were not valid!");
        throw new InvalidInputError("Add tasklog model error: one or more tasklog parameters were not valid!");
    }
    else {
        try {
            let result = (await getTasklogCollection().insertOne({ id: id, issue: issue, isResolved: false, notes: "", projectId: projectId }));

            if (result.acknowledged) {
                logger.info("Add tasklog model: Successfully added " + issue);
                return result;
            }
            else {
                throw new DatabaseError("Add tasklog model error: write request was not acknowledged!");
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
 * Reads a tasklog item from the tasklog model collection of the database by
 * performing a search query with a passed in id
 * @param {integer} id id of the tasklog to read
 * @returns A single tasklog item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getSingleTasklogById(id) {
    if (!id) {
        logger.error("Get tasklog model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Get tasklog model error: cannot pass in an empty parameter!");
    }
    else {
        let result = null;
        try {
            result = await getTasklogCollection().findOne({ id: id });
            if (result == null) {
                logger.error("Get tasklog model error: id " + id + " was not found in database!");
                throw new InvalidInputError("Get tasklog model error: id " + id + " was not found in database!");
            }

            logger.info("Get single tasklog model: Successfully retrieved " + result.issue);
            return result;
        }
        catch (err) {
            logger.error("Get single tasklog model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Get tasklog model error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Updates one of the tasklog items in the tasklog database by searching for the old name and updating it
 * with a new name and description
 * @param {string} oldName The name of the tasklog to update
 * @param {string} newName The name to replace the old one with
 * @param {string} newPassword The description to replace the old one with
 * @returns Whether the function succeeded in updating the tasklog
 * @throws {InvalidInputError} if the new name or description is invalid, if the old name was not found in the database
 * or if the old name parameter is empty
 * @throws {DatabaseError} If there was an issue updating the database
 */
async function updateTasklog(id, newIssue, isResolved, newNotes) {
    if (!id) {
        logger.error("Update tasklog model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Update tasklog model error: cannot pass in an empty parameter!");
    } else if (!validateUtils.isUpdateTasklogValid(id, newIssue, isResolved)) {
        logger.error("Update tasklog model error: newName " + newName + " or newDescription " + newPassword + " was not valid!");
        throw new InvalidInputError("Update tasklog model error: newName " + newName + " or newDescription " + newPassword + " was not valid!");
    }
    else {
        try {
            let checkExists = await getTasklogCollection().updateOne({ id: id }, { $set: { issue: newIssue, isResolved: isResolved, notes: newNotes } });
            if (checkExists.modifiedCount > 0) {
                logger.info("Update tasklog model: Successfully updated tasklog with id: " + id);
                return checkExists;
            } else {
                throw new InvalidInputError("Update tasklog model error: id " + id + " was not found in database!");
            }
        }
        catch (err) {
            logger.error("Update tasklog model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Update tasklog model error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Deletes a tasklog item from the tasklog database by searching for the item by id and removing it
 * @param {string} id Id of the tasklog to delete
 * @returns Whether the function succeeded in deleting the item
 * @throws {InvalidInputError} if an empty name parameter is passed in or if the name was not found in the database
 * @throws {DatabaseError} If there was an issue deleting the tasklog from the database
 */
async function deleteTasklog(id) {
    if (!id) {
        logger.error("Delete tasklog model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Delete tasklog model error: cannot pass in an empty parameter!");
    }
    else {
        let checkExists = null;
        try {
            checkExists = await getTasklogSingle(id);
            let result = (await getTasklogCollection().deleteOne({ id: id }));
            if (result.deletedCount > 0) {
                logger.info("Delete tasklog model: Successfully deleted " + id);
                return true;
            }
            else {
                throw new DatabaseError("Unexpected error occured; unable to delete from database!");
            }
        }
        catch (err) {
            logger.error("Delete tasklog model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError("Delete tasklog model error: " + err.message);
            }
            else {
                throw new DatabaseError("Delete tasklog model error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Convenience function that returns the tasklog model collection 
 * @returns Tasklog information collection
 * @throws {DatabaseError} If the collection could not be registered
 */
function getTasklogCollection() {
    // Validates the collection by performing a null check
    if (tasklogCollection == null) {
        logger.error("Error with connection to database: Unable to register collection!");
        throw new DatabaseError("Error with connection to database: Unable to register collection!");
    }
    return tasklogCollection;
}

function getClient() {
    return client;
}

module.exports = { getClient, initialize, addTasklog, getAllTasklogs, close, getTasklogCollection, updateTasklog, deleteTasklog, getSingleTasklogById }