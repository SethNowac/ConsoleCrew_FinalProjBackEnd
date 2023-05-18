require('dotenv').config();
jest.setTimeout(5000);

const notesDb = "Test_NotesDb";
const projectDb = "Test_ProjectDb";

let mongodbNotes;
let mongodbProject;

const notesModel = require("../models/notesModelMongoDb");
const projectModel = require("../models/projectModelMongoDb");

const { MongoMemoryServer } = require("mongodb-memory-server");
const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");
const res = require('express/lib/response');


beforeAll(async () => {
    mongodbNotes = await MongoMemoryServer.create();
    console.log("Mock Notes Database Started");

    mongodbProject = await MongoMemoryServer.create();
    console.log("Mock Project Database Started")
});

beforeEach(async () => {
    const notesUri = mongodbNotes.getUri();
    const projectUri = mongodbProject.getUri();
    try {
        await notesModel.initialize(notesDb, true, notesUri);
        await projectModel.initialize(projectDb, true, projectUri)

        // This will fail because no cookies or users exist
        await projectModel.addProject(1, "testProject", "testing project", 1, 1, 1);

    } catch (error) {
        console.log("Error: "+error.message);
    }
});

afterEach(async() => {
    await notesModel.close();
    await projectModel.close();
});

afterAll(async () => {
    await mongodbNotes.stop();
    console.log("Mock Notes Database Stopped");

    await mongodbProject.stop();
    console.log("Mock Project Database Stopped");
});

// Tests

test("Add Note Success", async () => {
    let result = await notesModel.addNote(1, 1, "firstNote", "firstNote Desc");

    expect(result != null).toBe(true);
    expect(result.id).toBe(1);
    expect(result.title).toBe("firstNote");
    expect(result.note).toBe("firstNote Desc");
});

test("Add Note Failure", async () => {
    await expect(() => notesModel.addNote(-1,-1,"","")).toThrow();
});

test("Get All Notes By Project Success", async () => {
    await notesModel.addNote(1, 1, "firstNote", "firstNote Desc");
    await notesModel.addNote(1, 2, "secondNote", "secondNote Desc");

    let result = await notesModel.getAllNotesByProject(1);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
});

test("Get All Notes By Project Failure", async () => {
    await expect(() => notesModel.getAllNotesByProject(-1)).rejects.toThrow();
});

test("Get Single Note By Project Success", async () => {
    await notesModel.addNote(1, 1, "firstNote", "firstNote Desc");
    let result = await notesModel.getSingleNoteById(1,1);

    expect(result != null).toBe(true);
    expect(result.id).toBe(1);
    expect(result.title).toBe("firstNote");
    expect(result.note).toBe("firstNote Desc");
});

test("Get Single Note By Project Failure", async () => {
    await expect(() => notesModel.getSingleNoteById(1, -1)).rejects.toThrow();
});

test("Update Note Success", async () => {
    await notesModel.addNote(1, 1, "firstNote", "firstNote Desc");
    let result = await notesModel.updateNote(1, 1, 1, 2, "updatedNote", "updatedNote Desc");

    expect(result != null).toBe(true);
    expect(result.id).toBe(2);
    expect(result.title).toBe("updatedNote");
    expect(result.note).toBe("updatedNote Desc")
});

test("Update Note Failure", async () => {
    await expect(() => notesModel.updateNote()).rejects.toThrow();
});

test("Delete Note Success", async () => {
    await notesModel.addNote(1, 1, "firstNote", "firstNote Desc");
    let result = await notesModel.deleteNote(1,1);

    expect(result).toBe(true);
});

test("Delete Note Failure", async () => {
    await expect(() => notesModel.deleteNote(1,1)).rejects.toThrow();
})
