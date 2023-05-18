require('dotenv').config();
jest.setTimeout(5000);

const notesDb = "Test_NotesDb";
const projectDb = "Test_ProjectDb";

let mongodb;

const notesModel = require("../models/notesModelMongoDb");
const projectModel = require("../models/projectModelMongoDb");

const { MongoMemoryServer } = require("mongodb-memory-server");
const { DatabaseError } = require("../models/DatabaseError");
const { InvalidInputError } = require("../models/InvalidInputErrors");
const res = require('express/lib/response');


beforeAll(async () => {
    mongodb = await MongoMemoryServer.create();
    console.log("Mock Server Started");
});

beforeEach(async () => {
    const notesUri = mongodb.getUri();
    const projectUri = mongodb.getUri();
    try {
        await notesModel.initialize(notesDb, true, notesUri);
        await projectModel.initialize(projectDb, true, projectUri);

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
    await mongodb.stop();
    console.log("Mock Notes Database Stopped");
});

// Tests

test("Add Note Success", async () => {
    await notesModel.addNote(1, 1, "firstNote", "firstNote Desc");

    const coll = notesModel.getNotesCollection();
    const cursor = await coll.find();
    const results = await cursor.toArray();

    expect(results[0] != null).toBe(true);
    expect(results[0].id).toBe(1);
    expect(results[0].title).toBe("firstNote");
    expect(results[0].note).toBe("firstNote Desc");
});

test("Add Note Failure", async () => {
    await expect(() => notesModel.addNote()).rejects.toThrow();;

    const coll = notesModel.getNotesCollection();
    const cursor = await coll.find();
    const results = await cursor.toArray();

    console.log("HELLO: "+results[0]);

    expect(results.length).toBe(0);
});

test("Get All Notes By Project Success", async () => {
    await notesModel.addNote(1, 1, "firstNote", "firstNote Desc");
    await notesModel.addNote(1, 2, "secondNote", "secondNote Desc");

    let result = await notesModel.getAllNotesByProject(1);

    expect(result != null).toBe(true);
});

test("Get All Notes By Project Failure", async () => {
    await expect(() => notesModel.getAllNotesByProject()).rejects.toThrow();
});

test("Get Single Note By Project Success", async () => {
    await notesModel.addNote(1, 1, "firstNote", "firstNote Desc");
    let result = await notesModel.getSingleNoteById(1,1);

    expect(result != null).toBe(true);
});

test("Get Single Note By Project Failure", async () => {
    await expect(() => notesModel.getSingleNoteById(1, -1)).rejects.toThrow();
});

test("Update Note Success", async () => {
    await notesModel.addNote(1, 1, "firstNote", "firstNote Desc");
    await notesModel.updateNote(1, 1, 1, 2, "updatedNote", "updatedNote Desc");

    const coll = notesModel.getNotesCollection();
    const cursor = await coll.find();
    const results = await cursor.toArray();

    expect(results[0] != null).toBe(true);
    expect(results[0].id).toBe(2);
    expect(results[0].title).toBe("updatedNote");
    expect(results[0].note).toBe("updatedNote Desc")
});

test("Update Note Failure", async () => {
    await expect(() => notesModel.updateNote()).rejects.toThrow();
});

test("Delete Note Success", async () => {
    await notesModel.addNote(1, 1, "firstNote", "firstNote Desc");

    const coll = notesModel.getNotesCollection();
    const cursor = await coll.find();
    const results = await cursor.toArray();

    let initialSize = results.length;

    let result = await notesModel.deleteNote(1,1);

    let sizeAfter = results.length;

    expect(initialSize-1).toBe(sizeAfter);
});

test("Delete Note Failure", async () => {
    await expect(() => notesModel.deleteNote(1,1)).rejects.toThrow();
})
