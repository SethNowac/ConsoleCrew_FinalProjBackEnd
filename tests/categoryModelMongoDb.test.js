require ('dotenv').config();
jest.setTimeout(5000);

const db = "Test_CategoryDB";

let mongod;
const model = require("../models/categoryModelMongoDb");
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

////////////////////////////////////////
// TESTS FOR ADD CATEGORY INFORMATION //
test('Can add Category to DB', async () => {
    const { id, name } = {id: 0, name: "Category"};
    await model.addCategory(id, name);

    const cursor = await model.getCategoryCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].id == id).toBe(true);
    expect(results[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
});

test('Cannot add category with id less than 0 to DB', async () => {
    const { id, name } = {id: -1, name: "Category"};
    await expect(() => model.addCategory(id, name)).rejects.toThrow();
});

test('Cannot add category with empty name parameter to DB', async () => {
    const { id, name } = {id: 0, name: ""};
    await expect(() => model.addCategory(id, name)).rejects.toThrow();
});


/////////////////////////////////////
// TESTS FOR READ CATEGORY INFORMATION //
test('Can read Category from DB', async () => {
    const { id, name } = {id: 0, name: "Category"};
    await model.addCategory(id, name);
    const cursor = await model.getCategoryCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);

    const product = await model.getSingleCategoryById(id);

    expect(product.id == id).toBe(true);
    expect(product.name.toLowerCase() == name.toLowerCase()).toBe(true);
});

test('Cannot read Category with empty name parameter from DB', async () => {
    await expect(() => model.getSingleCategoryById("")).rejects.toThrow();
});

test('Cannot read Category with name that doesnt exist from DB', async () => {
    await expect(() => model.getSingleCategoryById(0)).rejects.toThrow();
});

///////////////////////////////////////
// TEST FOR GET ALL CATEGORY INFORMATION //
test('Reading all Category should throw error if empty', async () => {
    await expect(() => model.getAllCategories()).rejects.toThrow();
});

test('Reading all Category should return a list of items from DB', async () => {
    await model.addCategory(0, "CategoryA");
    await model.addCategory(1, "CategoryB");

    const cursor = await model.getCategoryCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    
    const product = await model.getAllCategories();

    expect(product.length == 2).toBe(true);
});