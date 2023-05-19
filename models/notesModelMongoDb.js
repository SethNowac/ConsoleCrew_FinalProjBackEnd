//const dbName = "notes_db";
const collectionName = "Notes";

// Include class that enables a connection to the mongoDB database
const { MongoClient } = require("mongodb");

// Custom errors for database errors and invalid input errors
const { DatabaseError } = require("./DatabaseError");
const { InvalidInputError } = require("./InvalidInputErrors");

// Extra string validation tools
const validateNotes = require("./validateNotes");

let client;
let notesCollection;

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

        collectionCursor = await db.listCollections({name: databaseName});
        collectionArray = await collectionCursor.toArray();

        if(reset && collectionArray.length > 0){
            await db.collection(databaseName).drop();
        }
        if(reset || collectionArray.length == 0){
            const collation = {locale: "en", strength: 1};
            await db.createCollection(databaseName, {collation: collation});
        }
        notesCollection = db.collection(databaseName);

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
 * Retrieves all notes from a specified project as an array.
 * @param {*} projectId The Id of the project to retrieve all notes from. Error thrown if empty.
 * @throws {DatabaseError} Thrown if process failed for unknown reason.
 * @throws {InvalidInputError} Thrown if parameter is empty or no notes were found.
 * @returns A collection of notes retrieved from database if notes were found.
 */
async function getAllNotesByProject(projectId) {
    try {
        if(projectId < 0){
            logger.error("Get notes error: project id cannot be less than 0.");
            throw new InvalidInputError("Get notes error: project id cannot be less than 0.");
        }

        result = await notesCollection.find();

        result = await result.toArray();
        result = result.filter(note => note.projectId == projectId);

        if(!result){
            logger.error("Get notes error: Notes contained by project matching id: "+ projectId +" do not exist.");
            throw new InvalidInputError("Get notes error: Notes contained by project matching id: "+ projectId +" do not exist.");
        }

        logger.info("Get all notes by project succeeded!");
        return result;
    }
    catch (err) {
        logger.error("Get all notes model error: " + err.message);
        if (err instanceof InvalidInputError) {
            throw new InvalidInputError(err.message);
        }
        else {
            throw new DatabaseError("Get notes error: " + err.message);
        }
    }
}

/**
 * Retrieves first note contained in a specified project matching the note id.
 * @param {*} projectId The project to search through. Error thrown if empty.
 * @param {*} id The note id to retrieve. Error thrown if empty.
 * @throws {DatabaseError} Thrown if process fails for unknown reason.
 * @throws {InvalidInputError} Thrown if any parameter is empty or no note was found.
 * @returns First note found matching specified id.
 */
async function getSingleNoteById(projectId, id) {
    try {
        if(!projectId || !id){
            logger.error("Get note error: cannot pass empty parameters.");
            throw new InvalidInputError("Get note error: cannot pass empty parameters.");
        }

        result = await notesCollection.findOne({$and: [
            {id: id},
            {projectId: projectId}
        ]});

        if(result == null){
            logger.error("Get note error: Note matching id: "+ id + " and projectId: "+ projectId + " does not exist.");
            throw new InvalidInputError("Get note error: Note matching id: "+ id + " and projectId: "+ projectId + " does not exist.");
        }

        logger.info("Get single note succeeded!");
        return result;
    }
    catch (err) {
        logger.error("Get single note model error: " + err.message);
        if (err instanceof InvalidInputError) {
            throw new InvalidInputError(err.message);
        }
        else {
            throw new DatabaseError("Get single note error: " + err.message);
        }
    }
}

/**
 * Creates a new note in a specified project.
 * @param {*} projectid The project id for the note to reference. Error thrown if empty.
 * @param {*} id The id of the new note. Error thrown if empty.
 * @param {*} title The title of the note. Error thrown if empty.
 * @param {*} note The content of the new note. Error thrown if empty.
 * @throws {DatabaseError} Thrown if process fails for unknown reason.
 * @throws {InvalidInputError} Thrown if projectId or id is empty or if note data was not valid.
 * @returns The newly created note.
 */
async function addNote(projectId, id, title, note) {
    try {
        if(!await validateNotes.isValid(projectId, id, title, note)) {
            logger.error("Add note error: Project didn't exist or note contained empty data.");
            throw new InvalidInputError("Add note error: Project didn't exist or note contained empty data.");
        }
        else {
            let result = (await notesCollection.insertOne({ projectId: projectId, id: id, title: title, note: note }));
    
            if (result.acknowledged) {
                logger.info("Add note: Successfully added note with title: " + title);
                return result;
            }
            else {
                throw new DatabaseError("Add note error: write request was not acknowledged!");
            }
        }
    } catch (err) {
        logger.error("Add note model error: " + err.message);
        if (err instanceof InvalidInputError) {
            throw new InvalidInputError(err.message);
        }
        else {
            throw new DatabaseError("Add note error: " + err.message);
        }
    }
}

/**
 * Updates all data of first note matching a projectId and Id.
 * @param {*} projectId The project id of the note to udapte. Error thrown if empty.
 * @param {*} newProjectId The new project id the note. Error thrown if empty.
 * @param {*} id The id matching the note to update. Error thrown if empty.
 * @param {*} newId The new id of the note. Error thrown if empty.
 * @param {*} title The new title of the note. Error thrown if invalid.
 * @param {*} note The new contents of the note. Eror thrown if invalid.
 * @throws {DatabaseError} Thrown if process fails for unknown reason.
 * @throws {InvalidInputError} Thrown if any id is empty, project does not exist or new note data is invalid.
 * @returns The update note if process was sucessful.
 */
async function updateNote(projectId, newProjectId, id, newId, title, note) {
    try {
        if (!projectId || !newProjectId || !id || !newId) {
            logger.error("Update note error: cannot pass an empty id parameter.");
            throw new InvalidInputError("Update note error: cannot pass an empty id parameter.");
        }
        else if (! await validateNotes.isValid(newProjectId, newId, title, note)) {
            logger.error("Update note error: Project didn't exist or note data was invalid.");
            throw new InvalidInputError("Update note error: Project didn't exist or note data was invalid.");
        }
        else {
            let checkExists = await notesCollection.updateOne({$and: [
                {id: id},
                {projectId: projectId}
            ]}, 
            { $set: { projectId: newProjectId, id: newId, title: title, note: note } });

            if (checkExists.modifiedCount > 0) {
                logger.info("Update note: Successfully updated note with id: " + id);
                return checkExists;
            } 
            else {
                throw new InvalidInputError("Update note error: Note was not updated");
            }
        }
    } catch (err) {
        logger.error("Update note error: " + err.message);
            if (err instanceof InvalidInputError) {
                throw new InvalidInputError(err.message);
            }
            else {
                throw new DatabaseError("Update note error: " + err.message);
            }
    }
}

/**
 * Deletes a project note from the database.
 * @param {*} projectId The project that the note is contained in.
 * @param {*} id The id of the note to delete.
 * @throws {DatabaseError} Thrown if process fails for unknown reason or if note could not be deleted.
 * @throws {InvalidInputError} Thrown if any parameter is empty, projectId does not match an existing project or note does not exist.
 * @returns True if process succeeds.
 */
async function deleteNote(projectId, id) {
    try {
        if (!id || !projectId) {
            logger.error("Delete note error: cannot pass in an empty parameter!");
            throw new InvalidInputError("Delete note error: cannot pass in an empty parameter!");
        }
        else if(! await getSingleNoteById(projectId, id)){
            logger.error("Delete note error: note matching "+id+" could not be found.");
            throw new InvalidInputError("Delete note error: note matching "+id+" could not be found.");
        }
        else {
            let result = (await notesCollection.deleteOne({$and: [
                {id: id},
                {projectId: projectId}
            ]}));

            if (result.deletedCount > 0) {
                logger.info("Delete note: Successfully deleted note matching id:" + id);
                return true;
            }
            else {
                throw new DatabaseError("Unexpected error occured. Unable to delete from database.");
            }
        }
    } catch (err) {
        logger.error("Delete note error: " + err.message);
        if (err instanceof InvalidInputError) {
            throw new InvalidInputError("Delete note error: " + err.message);
        }
        else {
            throw new DatabaseError("Delete note error: " + err.message);
        }
    }
}

/**
 * Convenience function that returns the notes collection 
 * @returns Collection of notes
 * @throws {DatabaseError} If the collection could not be registered
 */
function getNotesCollection() {
    // Validates the collection by performing a null check
    if (notesCollection == null) {
        logger.error("Error with connection to database: Unable to register collection!");
        throw new DatabaseError("Error with connection to database: Unable to register collection!");
    }
    return notesCollection;
}

function getClient() {
    return client;
}

module.exports = { getClient, initialize, addNote, getAllNotesByProject, close, updateNote, deleteNote, getSingleNoteById, getNotesCollection }