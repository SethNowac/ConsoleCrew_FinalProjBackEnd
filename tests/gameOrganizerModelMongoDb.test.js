require ('dotenv').config();
jest.setTimeout(5000);

const db = "Test_GameOrganizerDB";

let mongod;
const model = require("../models/gameOrganizerModelMongoDb");
const { MongoMemoryServer } = require("mongodb-memory-server");

const { DatabaseError } = require("../models/DatabaseError");
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

////////////////////////////////////
// TESTS FOR ADD GAME INFORMATION //
test('Can add Game Information to DB', async () => {
    const { name, desc } = {name: "Fireboy and Watergirl", desc: "A game where you solve puzzles to progress"};
    await model.addGameInformation(name, desc);

    const cursor = await model.getGameInfoCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(results[0].description.toLowerCase() == desc.toLowerCase()).toBe(true);
});

test('Cannot add game with empty name parameter to DB', async () => {
    const { name, desc } = {name: "", desc: "A game where you solve puzzles to progress"};
    await expect(() => model.addGameInformation(name, desc)).rejects.toThrow();
});

test('Cannot add game with empty description parameter to DB', async () => {
    const { name, desc } = {name: "Fireboy and Watergirl", desc: ""};
    await expect(() => model.addGameInformation(name, desc)).rejects.toThrow();
});

/////////////////////////////////////
// TESTS FOR READ GAME INFORMATION //
test('Can read Game Information from DB', async () => {
    const { name, desc } = {name: "Roblox", desc: "Sebastian's once-upon-a-time favorite stupid game"};
    await model.addGameInformation(name, desc);
    const cursor = await model.getGameInfoCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    const product = await model.getGameInformationSingle(name);

    expect(product.name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(product.description.toLowerCase() == desc.toLowerCase()).toBe(true);
});

test('Cannot read Game Information with empty name parameter from DB', async () => {
    await expect(() => model.getGameInformationSingle("")).rejects.toThrow();
});

test('Cannot read Game Information with name that doesnt exist from DB', async () => {
    await expect(() => model.getGameInformationSingle("Non-existant name")).rejects.toThrow();
});

///////////////////////////////////////
// TEST FOR GET ALL GAME INFORMATION //
test('Reading all Game Information should return an empty list', async () => {
    await expect(() => model.getAllGameInformation()).rejects.toThrow();
});

test('Reading all Game Information should return a list of items from DB', async () => {
    await model.addGameInformation("Pokemon", "A fun game where you catch animals.");
    await model.addGameInformation("Mario Party", "A game where you play with friends to win the most amount of stars.");

    const cursor = await model.getGameInfoCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    
    const product = await model.getAllGameInformation();

    expect(product.length > 0).toBe(true);
});

///////////////////////////////////////
// TESTS FOR UPDATE GAME INFORMATION //
test('Can update Game Information from DB', async () => {
    const { name, desc } = {name: "Truck simulator", desc: "A game about driving a truck which is as boring as it sounds."};
    const { validName, validDesc } = {validName: "Minecraft", validDesc: "A fun game about mining and crafting."};
    await model.addGameInformation(name, desc);

    const product = await model.updateGameInformation(name, validName, validDesc);

    const cursor = await model.getGameInfoCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    expect(product==true).toBe(true);
    expect(results[0].name.toLowerCase() == validName.toLowerCase()).toBe(true);
    expect(results[0].description.toLowerCase() == validDesc.toLowerCase()).toBe(true);
});

test('Cannot update Game Information with an empty old name parameter', async () => {
    const { name, desc } = {name: "", desc: "A game about driving a truck which is as boring as it sounds."};
    const { validName, validDesc } = {validName: "Minecraft", validDesc: "A fun game about mining and crafting."};

    await expect(() => model.updateGameInformation(name, validName, validDesc)).rejects.toThrow();
});

test('Cannot update Game Information with an empty new name parameter', async () => {
    const { name, desc } = {name: "Truck Simulator", desc: "A game about driving a truck which is as boring as it sounds."};
    const { validName, validDesc } = {validName: "", validDesc: "A fun game about mining and crafting."};

    await expect(() => model.updateGameInformation(name, validName, validDesc)).rejects.toThrow();
});

test('Cannot update Game Information with an empty new description parameter', async () => {
    const { name, desc } = {name: "Truck Simulator", desc: "A game about driving a truck which is as boring as it sounds."};
    const { validName, validDesc } = {validName: "Minecraft", validDesc: ""};

    await expect(() => model.updateGameInformation(name, validName, validDesc)).rejects.toThrow();
});

///////////////////////////////////////
// TESTS FOR DELETE GAME INFORMATION //
test('Can delete Game Information from DB', async () => {
    const { name, desc } = {name: "Beat saber", desc: "Using lightsabers to slice blocks to a beat."};
    await model.addGameInformation(name, desc);
    const cursor = await model.getGameInfoCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    const result = await model.deleteGameInformation(name);

    expect(results.length).toBe(1);
    expect(result == true).toBe(true);
});

test('Cannot use delete Game Information command with empty name parameter', async () => {
    await expect(() => model.deleteGameInformation("")).rejects.toThrow();
});

test('Cannot use delete Game Information command game that doesnt exist', async () => {
    await expect(() => model.deleteGameInformation("non-existant name")).rejects.toThrow();
});