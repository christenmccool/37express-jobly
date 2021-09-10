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
  techIds
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
  
/************************************** GET /technologies/:id */

describe("GET /technologies/:id", function () {
  test("works for anon", async function() {
    const resp = await request(app).get(`/technologies/${techIds[0]}`);
    expect(resp.body).toEqual({technology: 
      {
        id: techIds[0],
        technology: "Tech1"
      }
    });
  });

  test("not found for no such technology", async function () {
    const resp = await request(app).get(`/technologies/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /technologies/:id */
describe("PATCH /technologies/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/technologies/${techIds[0]}`)
      .send({technology: "NewTech"})
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({technology: 
      {
        id: techIds[0],
        technology: "NewTech"
      }
    });
  });

  test("unauth when anon", async function () {
    const resp = await request(app)
      .patch(`/technologies/${techIds[0]}`)
      .send({technology: "NewTech"});
      expect(resp.statusCode).toEqual(401);
  });

  test("unauth when not admin", async function () {
    const resp = await request(app)
      .patch(`/technologies/${techIds[0]}`)
      .send({technology: "NewTech"})
      .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such technology", async function () {
    const resp = await request(app)
      .patch(`/technologies/0`)
      .send({technology: "NewTech"})
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** DELETE /technologies/:id */

describe("DELETE /technologies/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/technologies/${techIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${techIds[0]}` });
  });

  test("unauth when anon", async function () {
    const resp = await request(app)
        .delete(`/technologies/${techIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth when not admin", async function () {
    const resp = await request(app)
        .delete(`/technologies/${techIds[0]}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such technology", async function () {
    const resp = await request(app)
        .delete(`/technologies/0`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
