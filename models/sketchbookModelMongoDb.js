//const dbName = "sketchbook_db";
const collectionName = "Sketchbook";

// Include class that enables a connection to the mongoDB database
const { MongoClient } = require("mongodb");

// Custom errors for database errors and invalid input errors
const { DatabaseError } = require("./DatabaseError");
const { InvalidInputError } = require("./InvalidInputErrors");

let client;
let sketchbookCollection;

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

        // Check to see if the collections exists for sketch
        sketchbookCollectionCursor = await db.listCollections({ name: collectionName });
        sketchbookCollectionArray = await sketchbookCollectionCursor.toArray();
        if (sketchbookCollectionArray.length == 0) {
            // collation specifying case-insensitive collection
            const collation = { locale: "en", strength: 1 };
            // No match was found, so create new collection
            await db.createCollection(collectionName, { collation: collation });
        }
        sketchbookCollection = db.collection(collectionName); // convenient access to collection

        if (reset) {
            await sketchbookCollection.drop();
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
 * Retrieves all sketches from a specified project as an array.
 * @param {*} projectId The Id of the project to retrieve all sketches from. Error thrown if empty.
 * @throws {DatabaseError} Thrown if process failed for unknown reason.
 * @throws {InvalidInputError} Thrown if parameter is empty or no sketches were found.
 * @returns A collection of sketches retrieved from database if any were found.
 */
async function getAllSketchesByProject(projectId) {
    try {
        if(!projectId){
            logger.error("Get sketches error: cannot pass empty projectId parameter.");
            throw new InvalidInputError("Get sketches error: cannot pass empty projectId parameter.");
        }

        result = await getSketchbookCollection().find({ projectId: projectId });

        if(!result){
            logger.error("Get sketches error: Sketches contained by project matching id: "+ projectId +" do not exist.");
            throw new InvalidInputError("Get sketches error: Sketches contained by project matching id: "+ projectId +" do not exist.");
        }

        logger.info("Get all sketches by project succeeded!");
        return result;
    }
    catch (err) {
        logger.error("Get all sketches model error: " + err.message);
        if (err instanceof InvalidInputError) {
            throw new InvalidInputError(err.message);
        }
        else {
            throw new DatabaseError("Get sketches error: " + err.message);
        }
    }
}

/**
 * Retrieves first sketch contained in a specified project matching the sketch id.
 * @param {*} projectId The project to search through. Error thrown if empty.
 * @param {*} id The sketch id to retrieve. Error thrown if empty.
 * @throws {DatabaseError} Thrown if process fails for unknown reason.
 * @throws {InvalidInputError} Thrown if any parameter is empty or no sketch was found.
 * @returns First sketch found matching specified id.
 */
async function getSingleSketchById(projectId, id) {
    try {
        if(!projectId || !id){
            logger.error("Get sketch error: cannot pass empty parameters.");
            throw new InvalidInputError("Get sketch error: cannot pass empty parameters.");
        }

        result = await getSketchbookCollection().findOne({projectId: projectId, id:id});

        if(result == null){
            logger.error("Get sketch error: Sketch matching id: "+ id + " and projectId: "+ projectId + " does not exist.");
            throw new InvalidInputError("Get sketch error: Sketch matching id: "+ id + " and projectId: "+ projectId + " does not exist.");
        }

        logger.info("Get single sketch succeeded!");
        return result;
    }
    catch (err) {
        logger.error("Get single sketch model error: " + err.message);
        if (err instanceof InvalidInputError) {
            throw new InvalidInputError(err.message);
        }
        else {
            throw new DatabaseError("Get single sketch error: " + err.message);
        }
    }
}

/**
 * Creates a new sketch in a specified project.
 * @param {*} projectid The project id for the sketch to reference. Error thrown if empty.
 * @param {*} id The id of the new sketch. Error thrown if empty.
 * @param {*} image The image of the new sketch. Error thrown if empty.
 * @throws {DatabaseError} Thrown if process fails for unknown reason.
 * @throws {InvalidInputError} Thrown if projectId or id is empty or if sketch data was not valid.
 * @returns The newly created sketch.
 */
async function addSketch(projectid, id, image) {
    try {
        if(!projectid || !id){
            logger.error("Add sketch error: ProjectId or ID cannot be empty.");
            throw new InvalidInputError("Add sketch error: ProjectId or ID cannot be empty.");
        }    
        else if (!image) {
            logger.error("Add sketch error: Cannot add sketch with no image.");
            throw new InvalidInputError("Add sketch error: Cannot add sketch with no image.");
        }
        else {
            let result = (await getSketchbookCollection().insertOne({ projectid: projectid, id: id, image: image }));
    
            if (result.acknowledged) {
                logger.info("Add sketch: Successfully added sketch");
                return result;
            }
            else {
                throw new DatabaseError("Add sketch error: write request was not acknowledged.");
            }
        }
    } catch (err) {
        logger.error("Get single sketch model error: " + err.message);
        if (err instanceof InvalidInputError) {
            throw new InvalidInputError(err.message);
        }
        else {
            throw new DatabaseError("Get single sketch error: " + err.message);
        }
    }
}

/**
 * Updates all data of first sketch matching a projectId and Id.
 * @param {*} oldProjectId The project id of the sketch to udapte. Error thrown if empty.
 * @param {*} newProjectId The new project id the sketch. Error thrown if empty.
 * @param {*} oldId The id matching the sketch to update. Error thrown if empty.
 * @param {*} newId The new id of the sketch. Error thrown if empty.
 * @param {*} image The new image of the sketch. Error thrown if empty.
 * @throws {DatabaseError} Thrown if process fails for unknown reason.
 * @throws {InvalidInputError} Thrown if any id is empty, project does not exist or image is missing.
 * @returns The updated sketch if process was sucessful.
 */
async function updateSketch(oldProjectId, newProjectId, oldId, newId, image) {
    try {
        if (!oldProjectId || !newProjectId || !oldId || !newId) {
            logger.error("Update sketch error: cannot pass an empty id parameter.");
            throw new InvalidInputError("Update sketch error: cannot pass an empty id parameter.");
        }
        else if (!image) {
            logger.error("Update sketch error: Updated sketch must have an image.");
            throw new InvalidInputError("Update sketch error: Updated sketch must have an image.");
        }
        else {
            let checkExists = await getSketchbookCollection().updateOne({ id: oldId, projectId: oldProjectId }, { $set: { projectId: newProjectid, id: newId, image: image } });
            if (checkExists.modifiedCount > 0) {
                logger.info("Update sketch: Successfully updated sketch with id: " + id);
                return checkExists;
            } 
            else {
                throw new InvalidInputError("Update sketch error: Sketch was not updated");
            }
        }
    } catch (error) {
        logger.error("Update sketch error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Update sketch error: " + err.message);
            }
    }
}

/**
 * Deletes a project sketch from the database.
 * @param {*} projectId The project that the sketch is contained in.
 * @param {*} id The id of the sketch to delete.
 * @throws {DatabaseError} Thrown if process fails for unknown reason or if sketch could not be deleted.
 * @throws {InvalidInputError} Thrown if any parameter is empty, projectId does not match an existing project image is missing.
 * @returns True if process succeeds.
 */
async function deleteSketch(projectId, id) {
    try {
        if (!id || !projectId) {
            logger.error("Delete sketch error: cannot pass in an empty parameter.");
            throw new InvalidInputError("Delete sketch error: cannot pass in an empty parameter.");
        }
        else if(! await getSingleSketchById(projectId, id)){
            logger.error("Delete sketch error: sketch matching "+id+" could not be found.");
            throw new InvalidInputError("Delete sketch error: sketch matching "+id+" could not be found.");
        }
        else {
            let result = (await getSketchbookCollection().deleteOne({ id: id, projectId: projectId }));
            if (result.deletedCount > 0) {
                logger.info("Delete sketch: Successfully deleted sketch matching id:" + id);
                return true;
            }
            else {
                throw new DatabaseError("Unexpected error occured. Unable to delete from database.");
            }
        }
    } catch (error) {
        logger.error("Delete sketch error: " + err.message);
        if (err instanceof InvalidInputError) {
            throw new InvalidInputError("Delete sketch error: " + err.message);
        }
        else {
            throw new DatabaseError("Delete sketch error: " + err.message);
        }
    }
}

/**
 * Convenience function that returns the sketches collection 
 * @returns Collection of sketches
 * @throws {DatabaseError} If the collection could not be registered
 */
function getSketchbookCollection() {
    // Validates the collection by performing a null check
    if (sketchbookCollection == null) {
        logger.error("Error with connection to database: Unable to register collection!");
        throw new DatabaseError("Error with connection to database: Unable to register collection!");
    }
    return sketchbookCollection;
}

function getClient() {
    return client;
}

module.exports = { getClient, initialize, addSketch, getAllSketchesByProject, getSingleSketchById, updateSketch, deleteSketch, getSketchbookCollection, close }