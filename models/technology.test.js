"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Technology = require("./technology.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  techIds
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

/************************************** get */

describe("get", function() {
  test("works", async function() {

    let technology = await Technology.get(techIds[0]);

    expect(technology).toEqual({
      id: techIds[0],
      technology: "Tech1"
    });
  })

  test("not found if no such technology", async function() {

    try {
      await Technology.get(0);
    }
    catch(err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function() {
  test("works", async function() {
    let technology = await Technology.update(techIds[0], {technology: "NewTech1"});
    expect(technology).toEqual(
      {
        id: techIds[0],
        technology: "NewTech1"
      }
    )

    const result = await db.query(
      `SELECT id, technology
         FROM technologies
         WHERE technology = 'NewTech1'`
    );

    expect(result.rows).toContainEqual(
      {
        id: techIds[0],
        technology: "NewTech1"
      }
    );
  });

  test("not found if no such technology", async function() {
    try {
      await Technology.update(0, {technology: "NewTech"});
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })

});

/************************************** remove */

describe("remove", function() {
  test("works", async function() {
    await Technology.remove(techIds[0]);

    const res = await db.query(` 
      SELECT id 
        FROM technologies
        WHERE id=${techIds[0]}`
      )
    expect(res.rows.length).toEqual(0);
  })

  test("not found if no such technology", async function() {
    try {
      await Technology.remove(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })

});