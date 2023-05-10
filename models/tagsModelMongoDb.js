//const dbName = "tag_db";
const collectionName = "Tags";

// Include class that enables a connection to the mongoDB database
const {MongoClient} = require("mongodb");

// Custom errors for database errors and invalid input errors
const { DatabaseError } = require("./DatabaseError");
const { InvalidInputError } = require("./InvalidInputErrors");

// Extra string validation tools
const validateUtils = require("./validateUtils");

let client;
let tagCollection;

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
        
        // Check to see if the collections exists for tag model
        tagCollectionCursor = await db.listCollections({ name: collectionName });
        tagCollectionArray = await tagCollectionCursor.toArray();
        if (tagCollectionArray.length == 0) {  
            // collation specifying case-insensitive collection
            const collation = { locale: "en", strength: 1 };
            // No match was found, so create new collection
            await db.createCollection(collectionName, { collation: collation });
        }    
        tagCollection = db.collection(collectionName); // convenient access to collection

        if(reset) {
            await tagCollection.drop();
        }
        
        await seed();

    } catch (err) {
        logger.error("Initialize error: "+err.message);
        throw new DatabaseError("Initialize error: " + err.message);
    } 
}

/**
 * Adds default items to this collection since it should not be modified outside the model
 */
async function seed() {
    const tags = ["Indie", "Action", "Adventure", "RPG", "Singleplayer", "Fantasy", "First-Person Shooter", "Co-op", 
        "Sci-fi", "Side Scroller", "Survival Horror", "Education", "Stealth", "Third-Person Shooter"];

    for(let i = 0; i < tags.length; i++) {
        await addTag(i, tags[i]);
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
 * Gets a list of all data within the tag collection of the database
 * @returns An array with the list of items in the collection
 * @throws {DatabaseError} If the database could not be read from or if there is nothing in the database
 */
async function getAllTags() {
    try{
        let resultArray;
        result = await getTagCollection().find();
        resultArray = await result.toArray();
        if(resultArray.length == 0 || result == null) {
            logger.error("Get all tags model error: There is currently nothing in the database to read!");
            throw new DatabaseError("Get all tags model error: There is currently nothing in the database to read!")
        }
        logger.info("Get all tags model: successfully retrieved all tags")
        return resultArray;
    }
    catch(err) {
        logger.error("Get all tags model error: " + err.message);
        throw new DatabaseError("Get all tags model error: " + err.message);
    }
}

/**
 * Adds a new tag model item to the tag model collection with a name and password
 * @param {integer} id Id of the tag to add
 * @param {string} name Name of the tag to add
 * @param {string} password Password of the tag to add
 * @returns true if the item was added successfully. false otherwise.
 * @throws {DatabaseError} if there was an issue writing to the database. Generally should not happen
 * @throws {InvalidInputError} if an invalid parameter was passed in
 */
async function addTag(id, name) {
    if(!validateUtils.isTagValid(id, name)) {
        logger.error("Add tag model error: id or tag name "+name+" was not valid!");
        throw new InvalidInputError("Add tag model error: id or name "+name+" was not valid!");
    }
    else {
        try{
            let result = (await getTagCollection().insertOne({id: id, name: name}));

            if(result.acknowledged) {
                logger.info("Add tag model: Successfully added " + name);
                return result;
            }
            else {
                throw new DatabaseError("Add tag model error: write request was not acknowledged!");
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
 * Reads a tag item from the tag model collection of the database by
 * performing a search query with a passed in id
 * @param {integer} id id of the tag to read
 * @returns A single tag item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getSingleTagById(id) {
    if(!id) {
        logger.error("Get tag model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Get tag model error: cannot pass in an empty parameter!");
    }
    else {
        let result = null;
        try{
            result = await getTagCollection().findOne({id: id});
            if(result == null) {
                logger.error("Get tag model error: id "+id+" was not found in database!");
                throw new InvalidInputError("Get tag model error: id "+id+" was not found in database!");
            }

            logger.info("Get single tag model: Successfully retrieved " + result.name);
            return result;
        }
        catch(err) {
            logger.error("Get single tag model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Get tag model error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Deletes a tag item from the tag database by searching for the item by id and removing it
 * @param {string} id Id of the tag to delete
 * @returns Whether the function succeeded in deleting the item
 * @throws {InvalidInputError} if an empty name parameter is passed in or if the name was not found in the database
 * @throws {DatabaseError} If there was an issue deleting the tag from the database
 */
async function deleteTag(id) {
    if(!id) {
        logger.error("Delete tag model error: cannot pass in an empty parameter!");
        throw new InvalidInputError("Delete tag model error: cannot pass in an empty parameter!");
    }
    else {
        let checkExists = null;
        try{
            checkExists = await getTagSingle(id);
            let result = (await getTagCollection().deleteOne({id: id}));
            if(result.deletedCount > 0) {
                logger.info("Delete tag model: Successfully deleted " + id);
                return true;
            }
            else {
                throw new DatabaseError("Unexpected error occured; unable to delete from database!");
            }
        }
        catch(err) {
            logger.error("Delete tag model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError("Delete tag model error: "+err.message);
            }
            else {
                throw new DatabaseError("Delete tag model error: "+err.message);
            }
        }
    }
    return false;
}

/**
 * Convenience function that returns the tag model collection 
 * @returns Tag information collection
 * @throws {DatabaseError} If the collection could not be registered
 */
function getTagCollection() {
    // Validates the collection by performing a null check
    if(tagCollection == null) {
        logger.error("Error with connection to database: Unable to register collection!");
        throw new DatabaseError("Error with connection to database: Unable to register collection!");
    }
    return tagCollection;
}

function getClient() {
    return client;
}

module.exports = {getClient,initialize,addTag, getAllTags,close,getTagCollection,deleteTag,getSingleTagById}