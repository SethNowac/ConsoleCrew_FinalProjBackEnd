require('dotenv').config();
jest.setTimeout(5000);
const { request } = require('express');
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const supertest = require("supertest");
const testRequest = supertest(app);
const db = "Test_GameOrganizerDB";
let mongod;
const model = require("../models/gameOrganizerModelMongoDb");

const { DatabaseError } = require('../models/DatabaseError');
const { InvalidInputError } = require("../models/InvalidInputErrors");

/**
 * Function that initializes the mock database for testing
 */
beforeAll(async () => {
    // This will create a new instance of "MongoMemoryServer" and automatically start it
    mongod = await MongoMemoryServer.create();
    console.log("Mock Database started");
});

/**
 * Function that initializes the model before each test
 */
beforeEach(async () => {
    const url = mongod.getUri();

    try {
        await model.initialize(db, true, url);
    } catch (err) {
        console.log(err.message)
    }
});

/**
 * Function that closes the model after each test
 */
afterEach(async () => {
    await model.close();
});

/**
 * Function that closes the database when done testing
 */
afterAll(async () => {
    await mongod.stop(); // Stop the MongoMemoryServer
    console.log("Mock Database stopped");
});

/* Data to be used to generate random pokemon for testing */
const gameData = [
    { name: 'Truck Simulator', desc: 'Game about driving trucks' },
    { name: 'Alien Isolation', desc: 'Game where you hide from a xenomorph' },
    { name: 'Minecraft', desc: 'You mine and you craft' },
    { name: 'Fireboy and watergirl', desc: 'A co-op game about solving puzzles' },
    { name: 'Pokemon', desc: 'A game about people that make their pets fight each other' },
    { name: 'Sonic', desc: 'A game about a hedgehog that goes fast quickly' },
    { name: 'Mario', desc: 'A game about a man who saves a princess from a turtle' },
    { name: 'Truck Simulator', desc: 'Game about driving trucks' },
    { name: 'Alien Isolation', desc: 'Game where you hide from a xenomorph' },
    { name: 'Minecraft', desc: 'You mine and you craft' },
    { name: 'Fireboy and watergirl', desc: 'A co-op game about solving puzzles' },
    { name: 'Pokemon', desc: 'A game about people that make their pets fight each other' },
    { name: 'Sonic', desc: 'A game about a hedgehog that goes fast quickly' },
    { name: 'Mario', desc: 'A game about a man who saves a princess from a turtle' }
];

/** Since a Pokemon can only be added to the DB once, we have to splice from the array. */
const generateGameData = () => {
    const index = Math.floor((Math.random() * gameData.length));
    return gameData.slice(index, index + 1)[0];
}

////////////////////////////////////
// TESTS FOR GET GAME INFORMATION //
test("GET /games success case", async () => {
    const { name, desc } = generateGameData();
    await model.addGameInformation(name, desc);
    const cursor = await model.getGameInfoCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    const testResponse = await testRequest.get('/games/' + name);

    expect(testResponse.status).toBe(200);
});

test("GET /games failure case: name must exist in database --> error 400", async () => {
    const testResponse = await testRequest.get('/games/' + "nonexistant name");

    expect(testResponse.status).toBe(400);
});

////////////////////////////////////////
// TESTS FOR GET ALL GAME INFORMATION //
test("GET ALL /games success case", async () => {
    const { name, desc } = generateGameData();
    await model.addGameInformation(name, desc);
    const cursor = await model.getGameInfoCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    const testResponse = await testRequest.get('/games');

    expect(testResponse.status).toBe(200);
});

test("GET ALL /games failure case: database must not be empty --> error 500", async () => {
    const testResponse = await testRequest.get('/games');

    expect(testResponse.status).toBe(500);
});

test("GET ALL /games failure case: no connection to database --> error 500", async () => {
    await model.close();
    const testResponse = await testRequest.get('/games');

    expect(testResponse.status).toBe(500);
});

////////////////////////////////////
// TESTS FOR ADD GAME INFORMATION //
test("POST /games success case", async () => {
    const { name, desc } = generateGameData();
    const testResponse = await testRequest.post('/games').send({
        name: name,
        desc: desc
    })
    expect(testResponse.status).toBe(200);
    const cursor = await model.getGameInfoCollection().find();
    results = await cursor.toArray();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(results[0].description.toLowerCase() == desc.toLowerCase()).toBe(true);
});

test("POST /games failure case: invalid name --> error 400", async () => {
    const { name, desc } = {name: 'This title exceeds 50 characters, and therefore should fail.', desc: 'Nonexistant'};

    const testResponse = await testRequest.post('/games').send({
        name: name,
        desc: desc
    })
    expect(testResponse.status).toBe(400);
    const cursor = await model.getGameInfoCollection().find();
    results = await cursor.toArray();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
});

test("POST /games failure case: invalid description --> error 400", async () => {
    const { name, desc } = {name: 'Title', desc: 'Fail'};

    const testResponse = await testRequest.post('/games').send({
        name: name,
        desc: desc
    })
    expect(testResponse.status).toBe(400);
    const cursor = await model.getGameInfoCollection().find();
    results = await cursor.toArray();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
});

test("POST /games failure case: no connection to database --> error 500", async () => {
    const { name, desc } = generateGameData();
    await model.close();
    const testResponse = await testRequest.post('/games').send({
        name: name,
        desc: desc
    })
    expect(testResponse.status).toBe(500);
});

///////////////////////////////////////
// TESTS FOR UPDATE GAME INFORMATION //
test("PUT /games success case", async () => {
    const { name, desc } = {name: "Truck simulator", desc: "A game about driving a truck which is as boring as it sounds."};
    const { newName, newDesc } = {newName: "Minecraft", newDesc: "A fun game about mining and crafting."};
    await model.addGameInformation(name, desc);
    let cursor = await model.getGameInfoCollection().find();
    let results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    const testResponse = await testRequest.put('/games').send({
        name: name,
        newName: newName,
        newDesc: newDesc
    });

    expect(testResponse.status).toBe(200);
    cursor = await model.getGameInfoCollection().find();
    results = await cursor.toArray();

    expect(results.length).toBe(1);
    expect(results[0].name.toLowerCase() == newName.toLowerCase()).toBe(true);
    expect(results[0].description.toLowerCase() == newDesc.toLowerCase()).toBe(true);
});

test("PUT /games failure case: new name can't have empty parameter--> error 400", async () => {
    const { name, desc } = {name: "Truck simulator", desc: "A game about driving a truck which is as boring as it sounds."};
    const { newName, newDesc } = {newName: "", newDesc: "A fun game about mining and crafting."};
    await model.addGameInformation(name, desc);
    const cursor = await model.getGameInfoCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    const testResponse = await testRequest.put('/games').send({
        name: name,
        newName: newName,
        newDesc: newDesc
    });

    expect(testResponse.status).toBe(400);
});

test("PUT /games failure case: old name can't have empty parameter--> error 400", async () => {
    const { name, desc } = {name: "Truck simulator", desc: "A game about driving a truck which is as boring as it sounds."};
    const { newName, newDesc } = {newName: "Minecraft", newDesc: "A fun game about mining and crafting."};
    await model.addGameInformation(name, desc);
    const cursor = await model.getGameInfoCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    const testResponse = await testRequest.put('/games').send({
        name: "",
        newName: newName,
        newDesc: newDesc
    });

    expect(testResponse.status).toBe(400);
});

test("PUT /games failure case: new description can't have empty parameter--> error 400", async () => {
    const { name, desc } = {name: "Truck simulator", desc: "A game about driving a truck which is as boring as it sounds."};
    const { newName, newDesc } = {newName: "Minecraft", newDesc: "A fun game about mining and crafting."};
    await model.addGameInformation(name, desc);
    const cursor = await model.getGameInfoCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    const testResponse = await testRequest.put('/games').send({
        name: name,
        newName: newName,
        newDesc: ""
    });

    expect(testResponse.status).toBe(400);
});

test("PUT /games failure case: no connection to database--> error 500", async () => {
    const { name, desc } = {name: "Truck simulator", desc: "A game about driving a truck which is as boring as it sounds."};
    const { newName, newDesc } = {newName: "Minecraft", newDesc: "A fun game about mining and crafting."};

    await model.close();
    const testResponse = await testRequest.put('/games').send({
        name: name,
        newName: newName,
        newDesc: newDesc
    });

    expect(testResponse.status).toBe(500);
});

///////////////////////////////////////
// TESTS FOR DELETE GAME INFORMATION //
test("DELETE /games success case", async () => {
    const { name, desc } = {name: "Truck simulator", desc: "A game about driving a truck which is as boring as it sounds."};
    await model.addGameInformation(name, desc);
    let cursor = await model.getGameInfoCollection().find();
    let results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    const testResponse = await testRequest.delete('/games/' + name);

    expect(testResponse.status).toBe(200);
    cursor = await model.getGameInfoCollection().find();
    results = await cursor.toArray();

    expect(results.length).toBe(0);
});

test("DELETE /games failure case: name must exist in database--> error 400", async () => {
    const testResponse = await testRequest.delete('/games/' + "Non-existant game");

    expect(testResponse.status).toBe(400);
});

test("DELETE /games failure case: no connection to database--> error 500", async () => {
    await model.close();
    const testResponse = await testRequest.delete('/games/' + "Non-existant game");

    expect(testResponse.status).toBe(500);
});