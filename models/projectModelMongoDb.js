const dbName = "project_db";
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
 * Gets a list of all data within the game collection of the database
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
 * Adds a new project item to the project collection with an id, title, description, categoryId, genre and userId
 * @param {integer} id Id of the project that is being added
 * @param {string} title Title of the game to add
 * @param {string} description Description of the game to add
 * @param {integer} categoryId Id of the chosen category for this project
 * @param {integer} genreId Genre of the chosen id for this project
 * @param {integer} userId Id of the user that owns this project
 * @returns true if the item was added successfully. false otherwise.
 * @throws {DatabaseError} if there was an issue writing to the database. Generally should not happen
 * @throws {InvalidInputError} if an invalid parameter was passed in
 */
async function addProject(id, title, desc, catId, genre, userId) {
    if (!validateUtils.isProjectValid(id, title, desc, catId, genre, userId)) {
        logger.error("Add project error: project with title " + title + " was not valid!");
        throw new InvalidInputError("Add project error: project with title " + title + " was not valid!");
    }
    else {
        try {
            let result = (await getProjectCollection().insertOne({ id: id, title: title, description: desc, categoryId: catId, genre: genre, userId: userId }));

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
 * Reads a game item from the project collection of the database by
 * performing a search query with a passed in name
 * @param {string} name Name of the game to read
 * @returns A single game item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getProjectSingle(name, password) {
    if (!name) {
        logger.error("Get project error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Get project error: cannot pass in an empty parameter!");
    }
    else {
        let result = null;
        try {
            result = await getProjectCollection().findOne({ name: name, password: password });
            if (result == null) {
                logger.error("Get project error: name " + name + " was not found in database!");
                throw new InvalidInputError("Get project error: name " + name + " was not found in database!");
            }

            logger.info("Get project information: Successfully retrieved " + name);
            return result;
        }
        catch (err) {
            logger.error("Get project information error: " + err.message);
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
 * Reads a game item from the project collection of the database by
 * performing a search query with a passed in id
 * @param {integer} id id of the game to read
 * @returns A single game item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getSingleProjectById(id) {
    if (!id) {
        logger.error("Get project error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Get project error: cannot pass in an empty parameter!");
    }
    else {
        let result = null;
        try {
            result = await getProjectCollection().findOne({ id: id });
            if (result == null) {
                logger.error("Get project error: id " + id + " was not found in database!");
                throw new InvalidInputError("Get project error: id " + id + " was not found in database!");
            }

            logger.info("Get single project: Successfully retrieved " + result.name);
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
 * Updates one of the game items in the project database by searching for the old name and updating it
 * with a new name and description
 * @param {string} oldName The name of the game to update
 * @param {string} newName The name to replace the old one with
 * @param {string} newPassword The description to replace the old one with
 * @returns Whether the function succeeded in updating the project
 * @throws {InvalidInputError} if the new name or description is invalid, if the old name was not found in the database
 * or if the old name parameter is empty
 * @throws {DatabaseError} If there was an issue updating the database
 */
async function updateProject(id, newName, newPassword) {
    if (!id) {
        logger.error("Update project error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Update project error: cannot pass in an empty parameter!");
    } else if (!validateUtils.isProjectValid(newName, newPassword)) {
        logger.error("Update project error: newName " + newName + " or newDescription " + newPassword + " was not valid!");
        throw new InvalidInputError("Update project error: newName " + newName + " or newDescription " + newPassword + " was not valid!");
    }
    else {
        try {
            let checkExists = await getProjectCollection().updateOne({ id: id }, { $set: { name: newName, password: newPassword } });
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
 * Deletes a game item from the project database by searching for the item by name and removing it
 * @param {string} name Name of the game to delete
 * @returns Whether the function succeeded in deleting the item
 * @throws {InvalidInputError} if an empty name parameter is passed in or if the name was not found in the database
 * @throws {DatabaseError} If there was an issue deleting the game from the database
 */
async function deleteProject(id) {
    if (!id) {
        logger.error("Delete project error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Delete project error: cannot pass in an empty parameter!");
    }
    else {
        let checkExists = null;
        try {
            checkExists = await getProjectSingle(id);
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

module.exports = { getClient, initialize, addProjectInformation: addProject, getProjectSingle, getAllProjects, close, getProjectCollection, updateProject, deleteProject, getSingleProjectById }