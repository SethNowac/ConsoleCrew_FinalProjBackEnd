//const dbName = "project_db";
const collectionName = "Projects";

// Include class that enables a connection to the mongoDB database
const { MongoClient } = require("mongodb");

// Custom errors for database errors and invalid input errors
const { DatabaseError } = require("./DatabaseError");
const { InvalidInputError } = require("./InvalidInputErrors");

// Extra string validation tools
const validateUtils = require("./validateUtils");

let client;
let projectCollection;

const logger = require("../logger");

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

        // Check to see if the collections exists for project
        projectCollectionCursor = await db.listCollections({ name: collectionName });
        projectCollectionArray = await projectCollectionCursor.toArray();
        if (projectCollectionArray.length == 0) {
            // collation specifying case-insensitive collection
            const collation = { locale: "en", strength: 1 };
            // No match was found, so create new collection
            await db.createCollection(collectionName, { collation: collation });
        }
        projectCollection = db.collection(collectionName); // convenient access to collection

        if (reset) {
            await projectCollection.drop();
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
 * Gets a list of all data within the project collection of the database
 * @returns An array with the list of items in the collection
 * @throws {DatabaseError} If the database could not be read from or if there is nothing in the database
 */
async function getAllProjects() {
    try {

        let resultArray;
        result = await getProjectCollection().find();
        resultArray = await result.toArray();
        if (resultArray.length == 0 || result == null) {
            logger.error("Get all projects model error: There is currently nothing in the database to read!");
            throw new DatabaseError("Get all projects model error: There is currently nothing in the database to read!")
        }
        logger.info("Get all projects model: successfully retrieved all projects")
        return resultArray;
    }
    catch (err) {
        logger.error("Get all projects model error: " + err.message);
        throw new DatabaseError("Get all projects model error: " + err.message);
    }
}

/**
 * Gets a list of all data within the project collection of the database by the userId
 * @returns An array with the list of items in the collection
 * @throws {DatabaseError} If the database could not be read from or if there is nothing in the database
 */
async function getAllProjectsByUser(userId) {
    try {
        if(userId < 0){
            logger.error("Get notes error: id must not be less than 0.");
            throw new InvalidInputError("Get notes error: id must not be less than 0.");
        }
        let resultArray;
        result = await getProjectCollection().find({userId: userId});
        resultArray = await result.toArray();
        logger.info("Get all projects model: successfully retrieved all projects")
        return resultArray;
    }
    catch (err) {
        logger.error("Get all projects model error: " + err.message);
        if (err instanceof InvalidInputError) {
            throw new InvalidInputError(err.message);
        }
        else {
            throw new DatabaseError("Get all projects model error: " + err.message);
        }
    }
}

/**
 * Adds a new project item to the project collection with an id, title, description, categoryId, genre and userId
 * @param {integer} id Id of the project that is being added
 * @param {string} title Title of the project to add
 * @param {string} description Description of the project to add
 * @param {integer} categoryId Id of the chosen category for this project
 * @param {integer} genreId Genre of the chosen id for this project
 * @param {integer} userId Id of the user that owns this project
 * @returns true if the item was added successfully. false otherwise.
 * @throws {DatabaseError} if there was an issue writing to the database. Generally should not happen
 * @throws {InvalidInputError} if an invalid parameter was passed in
 */
async function addProject(id, title, desc, tag, userId) {
    if (!validateUtils.isAddProjectValid(id, title, desc, tag, userId)) {
        logger.error("Add project error: project with title " + title + " was not valid!");
        throw new InvalidInputError("Add project error: project with title " + title + " was not valid!");
    }
    else {
        try {

            let result = (await getProjectCollection().insertOne({ id: id, title: title, description: desc, tag: tag, userId: userId }));

            if (result.acknowledged) {
                logger.info("Add project: Successfully added " + title);
                return result;
            }
            else {
                throw new DatabaseError("Add project error: write request was not acknowledged!");
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
 * Reads a project item from the project collection of the database by
 * performing a search query with a passed in id
 * @param {integer} id id of the project to read
 * @returns A single project item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getSingleProjectById(id) {
    if (id < 0) {
        logger.error("Get project error: id can't be less than 0!");
        throw new InvalidInputError("Get project error: id can't be less than 0!");
    }
    else {
        let result = null;
        try {
        
            result = await getProjectCollection().findOne({ id: id });
            if (result == null) {
                logger.error("Get project error: id " + id + " was not found in database!");
                throw new InvalidInputError("Get project error: id " + id + " was not found in database!");
            }

            logger.info("Get single project: Successfully retrieved " + result.title);
            return result;
        }
        catch (err) {
            logger.error("Get single project error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Get project error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Updates one of the project items in the project database by searching for the old name and updating it
 * with a new name and description
 * @param {integer} id The id of the project to update
 * @param {string} newTitle The title to replace the old one with
 * @param {string} newDesc The description to replace the old one with
 * @param {integer} newCatId The category id to replace the old one with
 * @param {integer} newGenre The genre id to replace the old one with
 * @returns Whether the function succeeded in updating the project
 * @throws {InvalidInputError} if any of the parameters are invalid, if the id was not found in the database
 * or if the id parameter is empty
 * @throws {DatabaseError} If there was an issue updating the database
 */
async function updateProject(id, newTitle, newDesc, newTag) {
    if (id < 0) {
        logger.error("Update project error: id can't be less than 0!");
        throw new InvalidInputError("Update project error: id can't be less than 0!");
    } else if (!validateUtils.isUpdateProjectValid(id, newTitle, newDesc, newTag)) {
        logger.error("Update project error: one of the inputs was not valid!");
        throw new InvalidInputError("Update project error: one of the inputs was not valid!");
    }
    else {
        try {

            let checkExists = await getProjectCollection().updateOne({ id: id }, { $set: { id: id, title: newTitle, description: newDesc, tag: newTag } });
            if (checkExists.modifiedCount > 0) {
                logger.info("Update project: Successfully updated project with id: " + id);
                return checkExists;
            } else {
                throw new InvalidInputError("Update project error: id " + id + " was not found in database!");
            }
        }
        catch (err) {
            logger.error("Update project error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Update project error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Deletes a project item from the project database by searching for the item by id and removing it
 * @param {integer} id Id of the project to delete
 * @returns Whether the function succeeded in deleting the item
 * @throws {InvalidInputError} if an empty id parameter is passed in or if the id was not found in the database
 * @throws {DatabaseError} If there was an issue deleting the project from the database
 */
async function deleteProject(id) {
    if (id < 0) {
        logger.error("Delete project error: id can't be less than 0!");
        throw new InvalidInputError("Delete project error: cannot pass in an empty parameter!");
    }
    else {
        let checkExists = null;
        try {

            checkExists = await getSingleProjectById(id);
            let result = (await getProjectCollection().deleteOne({ id: id }));
            if (result.deletedCount > 0) {
                logger.info("Delete project: Successfully deleted " + id);
                return true;
            }
            else {
                throw new DatabaseError("Unexpected error occured; unable to delete from database!");
            }
        }
        catch (err) {
            logger.error("Delete project error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError("Delete project error: " + err.message);
            }
            else {
                throw new DatabaseError("Delete project error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Convenience function that returns the project collection 
 * @returns Game information collection
 * @throws {DatabaseError} If the collection could not be registered
 */
function getProjectCollection() {
    // Validates the collection by performing a null check
    if (projectCollection == null) {
        logger.error("Error with connection to database: Unable to register collection!");
        throw new DatabaseError("Error with connection to database: Unable to register collection!");
    }
    return projectCollection;
}

function getClient() {
    return client;
}

module.exports = { getClient, initialize, addProject, getAllProjects, close, getProjectCollection, updateProject, deleteProject, getSingleProjectById, getAllProjectsByUser }