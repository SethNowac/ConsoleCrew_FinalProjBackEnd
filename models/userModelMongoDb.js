const dbName = "user_db";
const collectionName = "Users";

// Include class that enables a connection to the mongoDB database
const {MongoClient} = require("mongodb");

// Custom errors for database errors and invalid input errors
const { DatabaseError } = require("./DatabaseError");
const { InvalidInputError } = require("./InvalidInputErrors");

// Extra string validation tools
const validateUtils = require("./validateUtils");

let client;
let userCollection;

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
        
        // Check to see if the collections exists for user model
        userCollectionCursor = await db.listCollections({ name: collectionName });
        userCollectionArray = await userCollectionCursor.toArray();
        if (userCollectionArray.length == 0) {  
            // collation specifying case-insensitive collection
            const collation = { locale: "en", strength: 1 };
            // No match was found, so create new collection
            await db.createCollection(collectionName, { collation: collation });
        }    
        userCollection = db.collection(collectionName); // convenient access to collection

        if(reset) {
            await userCollection.drop();
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
 * Gets a list of all data within the user collection of the database
 * @returns An array with the list of items in the collection
 * @throws {DatabaseError} If the database could not be read from or if there is nothing in the database
 */
async function getAllUsers() {
    try{
        let resultArray;
        result = await getUserCollection().find();
        resultArray = await result.toArray();
        if(resultArray.length == 0 || result == null) {
            logger.error("Get all users model error: There is currently nothing in the database to read!");
            throw new DatabaseError("Get all users model error: There is currently nothing in the database to read!")
        }
        logger.info("Get all users model: successfully retrieved all users")
        return resultArray;
    }
    catch(err) {
        logger.error("Get all users model error: " + err.message);
        throw new DatabaseError("Get all users model error: " + err.message);
    }
}

/**
 * Adds a new user model item to the user model collection with a name and password
 * @param {integer} id Id of the user to add
 * @param {string} name Name of the user to add
 * @param {string} password Password of the user to add
 * @returns true if the item was added successfully. false otherwise.
 * @throws {DatabaseError} if there was an issue writing to the database. Generally should not happen
 * @throws {InvalidInputError} if an invalid parameter was passed in
 */
async function addUser(id, name, password) {
    if(!validateUtils.isUserValid(id, name, password)) {
        logger.error("Add user model error: username "+name+" or password "+password+" was not valid!");
        throw new InvalidInputError("Add user model error: name "+name+" or password "+password+" was not valid!");
    }
    else {
        try{
            let result = (await getUserCollection().insertOne({id: id, name: name, password: password}));

            if(result.acknowledged) {
                logger.info("Add user model: Successfully added " + name);
                return result;
            }
            else {
                throw new DatabaseError("Add user model error: write request was not acknowledged!");
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
 * Reads a user item from the user model collection of the database by
 * performing a search query with a passed in name
 * @param {string} name Name of the user to read
 * @param {string} password Password of the user to read
 * @returns A single user item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getUserSingle(name, password) {
    if(!name || !password) {
        logger.error("Get user model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Get user model error: cannot pass in an empty parameter!");
    }
    else {
        let result = null;
        try{
            result = await getUserCollection().findOne({name: name, password: password});
            if(result == null) {
                logger.error("Get user model error: name "+name+" was not found in database!");
                throw new InvalidInputError("Get user model error: name "+name+" was not found in database!");
            }

            logger.info("Get user model information: Successfully retrieved " + name);
            return result;
        }
        catch(err) {
            logger.error("Get user model information error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Get user model error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Reads a user item from the user model collection of the database by
 * performing a search query with a passed in id
 * @param {integer} id id of the user to read
 * @returns A single user item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getSingleUserById(id) {
    if(!id) {
        logger.error("Get user model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Get user model error: cannot pass in an empty parameter!");
    }
    else {
        let result = null;
        try{
            result = await getUserCollection().findOne({id: id});
            if(result == null) {
                logger.error("Get user model error: id "+id+" was not found in database!");
                throw new InvalidInputError("Get user model error: id "+id+" was not found in database!");
            }

            logger.info("Get single user model: Successfully retrieved " + result.name);
            return result;
        }
        catch(err) {
            logger.error("Get single user model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Get user model error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Updates one of the user items in the user database by searching for the old name and updating it
 * with a new name and description
 * @param {string} oldName The name of the user to update
 * @param {string} newName The name to replace the old one with
 * @param {string} newPassword The description to replace the old one with
 * @returns Whether the function succeeded in updating the user
 * @throws {InvalidInputError} if the new name or description is invalid, if the old name was not found in the database
 * or if the old name parameter is empty
 * @throws {DatabaseError} If there was an issue updating the database
 */
async function updateUser(id, newName, newPassword) {
    if(!id) {
        logger.error("Update user model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Update user model error: cannot pass in an empty parameter!");
    } else if(!validateUtils.isUserValid(newName,newPassword)) {
        logger.error("Update user model error: newName "+newName+" or newDescription "+newPassword+" was not valid!");
        throw new InvalidInputError("Update user model error: newName "+newName+" or newDescription "+newPassword+" was not valid!");
    }
    else {
        try{
            let checkExists = await getUserCollection().updateOne({id: id}, {$set: { name: newName, password: newPassword } });
            if(checkExists.modifiedCount > 0) {
                logger.info("Update user model: Successfully updated user with id: " + id);
                return checkExists;
            } else {
                throw new InvalidInputError("Update user model error: id "+id+" was not found in database!");
            }
        }
        catch(err) {
            logger.error("Update user model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Update user model error: "+err.message);
            }
        }
    }
    return false;
}

/**
 * Deletes a user item from the user database by searching for the item by id and removing it
 * @param {string} id Id of the user to delete
 * @returns Whether the function succeeded in deleting the item
 * @throws {InvalidInputError} if an empty name parameter is passed in or if the name was not found in the database
 * @throws {DatabaseError} If there was an issue deleting the user from the database
 */
async function deleteUser(id) {
    if(!id) {
        logger.error("Delete user model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Delete user model error: cannot pass in an empty parameter!");
    }
    else {
        let checkExists = null;
        try{
            checkExists = await getUserSingle(id);
            let result = (await getUserCollection().deleteOne({id: id}));
            if(result.deletedCount > 0) {
                logger.info("Delete user model: Successfully deleted " + id);
                return true;
            }
            else {
                throw new DatabaseError("Unexpected error occured; unable to delete from database!");
            }
        }
        catch(err) {
            logger.error("Delete user model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError("Delete user model error: "+err.message);
            }
            else {
                throw new DatabaseError("Delete user model error: "+err.message);
            }
        }
    }
    return false;
}

/**
 * Convenience function that returns the user model collection 
 * @returns User information collection
 * @throws {DatabaseError} If the collection could not be registered
 */
function getUserCollection() {
    // Validates the collection by performing a null check
    if(userCollection == null) {
        logger.error("Error with connection to database: Unable to register collection!");
        throw new DatabaseError("Error with connection to database: Unable to register collection!");
    }
    return userCollection;
}

function getClient() {
    return client;
}

module.exports = {getClient,initialize,addUserInformation: addUser,getUserSingle, getAllUsers,close,getUserCollection,updateUser,deleteUser,getSingleUserById}