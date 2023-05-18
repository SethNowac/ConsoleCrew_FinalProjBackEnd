//const dbName = "category_db";
const collectionName = "Categories";

// Include class that enables a connection to the mongoDB database
const {MongoClient} = require("mongodb");

// Custom errors for database errors and invalid input errors
const { DatabaseError } = require("./DatabaseError");
const { InvalidInputError } = require("./InvalidInputErrors");

// Extra string validation tools
const validateUtils = require("./validateUtils");

let client;
let categoryCollection;

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
        
        // Check to see if the collections exists for category model
        categoryCollectionCursor = await db.listCollections({ name: collectionName });
        categoryCollectionArray = await categoryCollectionCursor.toArray();
        if (categoryCollectionArray.length == 0) {  
            // collation specifying case-insensitive collection
            const collation = { locale: "en", strength: 1 };
            // No match was found, so create new collection
            await db.createCollection(collectionName, { collation: collation });
        }    
        categoryCollection = db.collection(collectionName); // convenient access to collection

        if(reset) {
            await categoryCollection.drop();
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
    const categories = ["Cutscene", "Puzzle", "Story Event"];

    for(let i = 0; i < categories.length; i++) {
        await addCategory(i, categories[i]);
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
 * Gets a list of all data within the category collection of the database
 * @returns An array with the list of items in the collection
 * @throws {DatabaseError} If the database could not be read from or if there is nothing in the database
 */
async function getAllCategories() {
    try{
        let resultArray;
        result = await getCategoryCollection().find();
        resultArray = await result.toArray();
        if(resultArray.length == 0 || result == null) {
            logger.error("Get all categories model error: There is currently nothing in the database to read!");
            throw new DatabaseError("Get all categories model error: There is currently nothing in the database to read!")
        }
        logger.info("Get all categories model: successfully retrieved all categories")
        return resultArray;
    }
    catch(err) {
        logger.error("Get all categories model error: " + err.message);
        throw new DatabaseError("Get all categories model error: " + err.message);
    }
}

/**
 * Adds a new category model item to the category model collection with a name and password
 * @param {integer} id Id of the category to add
 * @param {string} name Name of the category to add
 * @param {string} password Password of the category to add
 * @returns true if the item was added successfully. false otherwise.
 * @throws {DatabaseError} if there was an issue writing to the database. Generally should not happen
 * @throws {InvalidInputError} if an invalid parameter was passed in
 */
async function addCategory(id, name) {
    if(!validateUtils.isTagValid(id, name)) {
        logger.error("Add category model error: id or category name "+name+" was not valid!");
        throw new InvalidInputError("Add category model error: id or name "+name+" was not valid!");
    }
    else {
        try{
            let result = (await getCategoryCollection().insertOne({id: id, name: name}));

            if(result.acknowledged) {
                logger.info("Add category model: Successfully added " + name);
                return result;
            }
            else {
                throw new DatabaseError("Add category model error: write request was not acknowledged!");
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
 * Reads a category item from the category model collection of the database by
 * performing a search query with a passed in id
 * @param {integer} id id of the category to read
 * @returns A single category item with the name passed in to the function
 * @throws {InvalidInputError} if an empty parameter is passed in
 * @throws {DatabaseError} If the database could not be read from
 */
async function getSingleCategoryById(id) {
    if(id < 0) {
        logger.error("Get category model error: id can't be less than 0!");
        throw new InvalidInputError("Get category model error: cannot pass in an empty parameter!");
    }
    else {
        let result = null;
        try{
            result = await getCategoryCollection().findOne({id: id});
            if(result == null) {
                logger.error("Get category model error: id "+id+" was not found in database!");
                throw new InvalidInputError("Get category model error: id "+id+" was not found in database!");
            }

            logger.info("Get single category model: Successfully retrieved " + result.name);
            return result;
        }
        catch(err) {
            logger.error("Get single category model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Get category model error: " + err.message);
            }
        }
    }
    return false;
}

/**
 * Deletes a category item from the category database by searching for the item by id and removing it
 * @param {string} id Id of the category to delete
 * @returns Whether the function succeeded in deleting the item
 * @throws {InvalidInputError} if an empty name parameter is passed in or if the name was not found in the database
 * @throws {DatabaseError} If there was an issue deleting the category from the database
 */
async function deleteCategory(id) {
    if(id < 0) {
        logger.error("Delete category model error: id cannot be less than 0!");
        throw new InvalidInputError("Delete category model error: id cannot be less than 0!");
    }
    else {
        let checkExists = null;
        try{
            checkExists = await getSingleCategoryById(id);
            let result = (await getCategoryCollection().deleteOne({id: id}));
            if(result.deletedCount > 0) {
                logger.info("Delete category model: Successfully deleted " + id);
                return true;
            }
            else {
                throw new DatabaseError("Unexpected error occured; unable to delete from database!");
            }
        }
        catch(err) {
            logger.error("Delete category model error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError("Delete category model error: "+err.message);
            }
            else {
                throw new DatabaseError("Delete category model error: "+err.message);
            }
        }
    }
    return false;
}

/**
 * Convenience function that returns the category model collection 
 * @returns Category information collection
 * @throws {DatabaseError} If the collection could not be registered
 */
function getCategoryCollection() {
    // Validates the collection by performing a null check
    if(categoryCollection == null) {
        logger.error("Error with connection to database: Unable to register collection!");
        throw new DatabaseError("Error with connection to database: Unable to register collection!");
    }
    return categoryCollection;
}

function getClient() {
    return client;
}

module.exports = {getClient,initialize,addCategory, getAllCategories,close,getCategoryCollection,deleteCategory,getSingleCategoryById}