const dbName = "game_organizer_db";

// Include class that enables a connection to the mongoDB database
const {MongoClient} = require("mongodb");

// Custom errors for database errors and invalid input errors
const { DatabaseError } = require("./DatabaseError");
const { InvalidInputError } = require("./InvalidInputErrors");

// Extra string validation tools
const validateUtils = require("./validateUtils");

let client;
let gameInfoCollection;

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
        
        // Check to see if the collections exists for game information
        gameCollectionCursor = await db.listCollections({ name: "GameInformation" });
        gameCollectionArray = await gameCollectionCursor.toArray();
        if (gameCollectionArray.length == 0) {  
            // collation specifying case-insensitive collection
            const collation = { locale: "en", strength: 1 };
            // No match was found, so create new collection
            await db.createCollection("GameInformation", { collation: collation });
        }    
        gameInfoCollection = db.collection("GameInformation"); // convenient access to collection

        if(reset) {
            await gameInfoCollection.drop();
        }

    } catch (err) {
        logger.error("Initialize error: "+err.message);
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
        logger.error("Model error: "+err.message);
    }
}

/**
 * Gets a list of all data within the game collection of the database
 * @returns An array with the list of items in the collection
 * @throws {DatabaseError} If the database could not be read from or if there is nothing in the database
 */
async function getAllGameInformation() {
    try{
        let resultArray;
        result = await getGameInfoCollection().find();
        resultArray = await result.toArray();
        if(resultArray.length == 0 || result == null) {
            logger.error("Get all game information error: There is currently nothing in the database to read!");
            throw new DatabaseError("Get all game information error: There is currently nothing in the database to read!")
        }
        logger.info("Get all game information: successfully retrieved all information")
        return resultArray;
    }
    catch(err) {
        logger.error("Get all game information error: " + err.message);
        throw new DatabaseError("Get all game information error: " + err.message);
    }
}

/**
 * Adds a new game information item to the game information collection with a name and description
 * @param {string} name Name of the game to add
 * @param {string} description Description of the game to add
 * @returns true if the item was added successfully. false otherwise.
 * @throws {DatabaseError} if there was an issue writing to the database. Generally should not happen
 * @throws {InvalidInputError} if an invalid parameter was passed in
 */
async function addGameInformation(name, description) {
    if(!validateUtils.isValid(name,description)) {
        logger.error("Add game information error: name "+name+" or description "+description+" was not valid!");
        throw new InvalidInputError("Add game information error: name "+name+" or description "+description+" was not valid!");
    }
    else {
        try{
            let result = (await getGameInfoCollection().insertOne({name: name, description: description}));

            if(result.acknowledged) {
                logger.info("Add game information: Successfully added " + name);
                return result;
            }
            else {
                throw new DatabaseError("Add game information error: write request was not acknowledged!");
            }
        }
        catch(err) {
            logger.error(err.message);
            throw new DatabaseError(err.message)
        }
    }
    return false;
}

/**
 * Reads a game item from the game information collection of the database by
 * performing a search query with a passed in name
 * @param {string} name Name of the game to read
 * @returns A single game item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getGameInformationSingle(name) {
    if(!name) {
        logger.error("Get game information error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Get game information error: cannot pass in an empty parameter!");
    }
    else {
        let result = null;
        try{
            result = await getGameInfoCollection().findOne({name: name});
            if(result == null) {
                logger.error("Get game information error: name "+name+" was not found in database!");
                throw new InvalidInputError("Get game information error: name "+name+" was not found in database!");
            }

            logger.info("Get single game information: Successfully retrieved " + name);
            return result;
        }
        catch(err) {
            logger.error("Get single game information error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Get game information error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Reads a game item from the game information collection of the database by
 * performing a search query with a passed in id
 * @param {integer} id id of the game to read
 * @returns A single game item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getSingleGameById(id) {
    if(!id) {
        logger.error("Get game information error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Get game information error: cannot pass in an empty parameter!");
    }
    else {
        let result = null;
        try{
            result = await getGameInfoCollection().findOne({_id: id});
            if(result == null) {
                logger.error("Get game information error: id "+id+" was not found in database!");
                throw new InvalidInputError("Get game information error: id "+id+" was not found in database!");
            }

            logger.info("Get single game information: Successfully retrieved " + result.name);
            return result;
        }
        catch(err) {
            logger.error("Get single game information error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Get game information error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Updates one of the game items in the game information database by searching for the old name and updating it
 * with a new name and description
 * @param {string} oldName The name of the game to update
 * @param {string} newName The name to replace the old one with
 * @param {string} newDescription The description to replace the old one with
 * @returns Whether the function succeeded in updating the game information
 * @throws {InvalidInputError} if the new name or description is invalid, if the old name was not found in the database
 * or if the old name parameter is empty
 * @throws {DatabaseError} If there was an issue updating the database
 */
async function updateGameInformation(oldName, newName, newDescription) {
    if(!oldName) {
        logger.error("Update game information error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Update game information error: cannot pass in an empty parameter!");
    } else if(!validateUtils.isValid(newName,newDescription)) {
        logger.error("Update game information error: newName "+newName+" or newDescription "+newDescription+" was not valid!");
        throw new InvalidInputError("Update game information error: newName "+newName+" or newDescription "+newDescription+" was not valid!");
    }
    else {
        try{
            let checkExists = await getGameInfoCollection().updateOne({name: oldName}, {$set: { name: newName, description: newDescription } });
            if(checkExists.modifiedCount > 0) {
                logger.info("Update game information: Successfully updated " + oldName);
                return checkExists;
            } else {
                throw new InvalidInputError("Update game information error: name "+oldName+" was not found in database!");
            }
        }
        catch(err) {
            logger.error("Update game information error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Update game information error: "+err.message);
            }
        }
    }
    return false;
}

/**
 * Deletes a game item from the game information database by searching for the item by name and removing it
 * @param {string} name Name of the game to delete
 * @returns Whether the function succeeded in deleting the item
 * @throws {InvalidInputError} if an empty name parameter is passed in or if the name was not found in the database
 * @throws {DatabaseError} If there was an issue deleting the game from the database
 */
async function deleteGameInformation(name) {
    if(!name) {
        logger.error("Delete game information error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Delete game information error: cannot pass in an empty parameter!");
    }
    else {
        let checkExists = null;
        try{
            checkExists = await getGameInformationSingle(name);
            let result = (await getGameInfoCollection().deleteOne({name: name}));
            if(result.deletedCount > 0) {
                logger.info("Delete game information: Successfully deleted " + name);
                return true;
            }
            else {
                throw new DatabaseError("Unexpected error occured; unable to delete from database!");
            }
        }
        catch(err) {
            logger.error("Delete game information error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError("Delete game information error: "+err.message);
            }
            else {
                throw new DatabaseError("Delete game information error: "+err.message);
            }
        }
    }
    return false;
}

/**
 * Convenience function that returns the game information collection 
 * @returns Game information collection
 * @throws {DatabaseError} If the collection could not be registered
 */
function getGameInfoCollection() {
    // Validates the collection by performing a null check
    if(gameInfoCollection == null) {
        logger.error("Error with connection to database: Unable to register collection!");
        throw new DatabaseError("Error with connection to database: Unable to register collection!");
    }
    return gameInfoCollection;
}

function getClient() {
    return client;
}

module.exports = {getClient,initialize,addGameInformation,getGameInformationSingle,getAllGameInformation,close,getGameInfoCollection,updateGameInformation,deleteGameInformation,getSingleGameById}