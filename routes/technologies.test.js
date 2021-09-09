"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /technologies */

describe("POST /technologies", function () {

  test("works for admin", async function () {
    const resp = await request(app)
        .post("/technologies")
        .send({technology: "NewTech"})
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      technology: {
        id: expect.any(Number),
        technology: "NewTech"
    }});
  });

  test("unauth when not admin", async function () {
    const resp = await request(app)
        .post("/technologies")
        .send({technology: "NewTech"})
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

});

/************************************** GET /technologies */

describe("GET /technologies", function () {
  test("works for anon ", async function () {
    const resp = await request(app).get("/technologies");
    expect(resp.body).toEqual({
    technologies:
        [
        {
            id: expect.any(Number),
            technology: "Tech1",
        },
        {
            id: expect.any(Number),
            technology: "Tech2",
        }
        ]
    });
});
});
  