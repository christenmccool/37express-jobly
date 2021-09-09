"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Technology = require("./technology.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {

  test("works", async function () {
    let technology = await Technology.create({technology: "NewTech"});
    expect(technology).toEqual({
        id: expect.any(Number),
        technology: "NewTech"
    });

    const result = await db.query(
          `SELECT id, technology
            FROM technologies
            WHERE technology = 'NewTech'`);
    expect(result.rows).toEqual([
      {
        id: technology.id,
        technology: "NewTech"
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Technology.create({technology: "NewTech"});
      await Technology.create({technology: "NewTech"});
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    let technologies = await Technology.findAll();

    expect(technologies).toEqual([
    {
        id: expect.any(Number),
        technology: 'Tech1'
    },
    {
        id: expect.any(Number),
        technology: 'Tech2'
    }
    ]);
});

});
  