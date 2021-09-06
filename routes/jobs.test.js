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
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New Job",
    salary: 1000,
    equity: "0.5",
    companyHandle: "c1",
  };

  test("works for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {...newJob, id: expect.any(Number)},
    });
  });

  test("unauth when not admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 1000,
          equity: "0.5",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newJob,
          salary: "not-an-integer",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("works for anon without filter", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "Job 1",
            salary: 1000,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "Job 2",
            salary: 2000,
            equity: "0.2",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "Job 3",
            salary: 3000,
            equity: "0",
            companyHandle: "c2",
          }
        ]
    });
  });

  test("works with minSalary filter", async function () {
    const resp = await request(app).get("/jobs?minSalary=2000");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "Job 2",
            salary: 2000,
            equity: "0.2",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "Job 3",
            salary: 3000,
            equity: "0",
            companyHandle: "c2",
          }
        ]
    });
  });

  test("works with partial matching title filter", async function () {
    const resp = await request(app).get("/jobs?title=Job");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "Job 1",
            salary: 1000,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "Job 2",
            salary: 2000,
            equity: "0.2",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "Job 3",
            salary: 3000,
            equity: "0",
            companyHandle: "c2",
          }
        ]
    });
  });

  test("works with exact match title filter", async function () {
    const resp = await request(app).get("/jobs?title=Job 1");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "Job 1",
            salary: 1000,
            equity: "0.1",
            companyHandle: "c1",
          },
        ]
    });
  });

  test("works for hasEquity filter is true", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "Job 1",
            salary: 1000,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "Job 2",
            salary: 2000,
            equity: "0.2",
            companyHandle: "c1",
          },
        ]
    });
  });

  test("works for hasEquity filter is false", async function () {
    const resp = await request(app).get("/jobs?hasEquity=false");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "Job 1",
            salary: 1000,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "Job 2",
            salary: 2000,
            equity: "0.2",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "Job 3",
            salary: 3000,
            equity: "0",
            companyHandle: "c2",
          }
        ]
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app).get("/jobs");
    expect(resp.statusCode).toEqual(500);
  });
});


/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
      const allJobsResp = await request(app).get(`/jobs`);
      const job1Id = allJobsResp.body.jobs.filter(ele => ele.title === 'Job 1')[0].id;

      const resp = await request(app).get(`/jobs/${job1Id}`);
      expect(resp.body).toEqual({
        job: {
          id: job1Id,
          title: "Job 1",
          salary: 1000,
          equity: "0.1",
          companyHandle: "c1"
        },
      });
    });
  
    test("not found for no such job", async function () {
      const resp = await request(app).get(`/jobs/0`);
      expect(resp.statusCode).toEqual(404);
    });
  });


/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
      const allJobsResp = await request(app).get(`/jobs`);
      const job1Id = allJobsResp.body.jobs.filter(ele => ele.title === 'Job 1')[0].id;

      const resp = await request(app)
        .patch(`/jobs/${job1Id}`)
        .send({
        title: "New Job Title",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        job: {
          id: job1Id,
          title: "New Job Title",
          salary: 1000,
          equity: "0.1",
          companyHandle: "c1"
        },
      });
    });
  
    test("unauth for anon", async function () {
      const allJobsResp = await request(app).get(`/jobs`);
      const job1Id = allJobsResp.body.jobs.filter(ele => ele.title === 'Job 1')[0].id;

      const resp = await request(app)
        .patch(`/jobs/${job1Id}`)
        .send({
          title: "New Job Title",
        });
      expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth when not admin", async function () {
      const allJobsResp = await request(app).get(`/jobs`);
      const job1Id = allJobsResp.body.jobs.filter(ele => ele.title === 'Job 1')[0].id;
  
      const resp = await request(app)
        .patch(`/jobs/${job1Id}`)
        .send({
          title: "New Job Title",
        })
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found on no such job", async function () {
      const resp = await request(app)
          .patch(`/jobs/0`)
          .send({
            title: "New Job Title",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  
    test("bad request on handle change attempt", async function () {
      const allJobsResp = await request(app).get(`/jobs`);
      const job1Id = allJobsResp.body.jobs.filter(ele => ele.title === 'Job 1')[0].id;
    
      const resp = await request(app)
        .patch(`/jobs/${job1Id}`)
        .send({
          companyHandle: 'c100',
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request on invalid data", async function () {
      const allJobsResp = await request(app).get(`/jobs`);
      const job1Id = allJobsResp.body.jobs.filter(ele => ele.title === 'Job 1')[0].id;

      const resp = await request(app)
        .patch(`/jobs/${job1Id}`)
        .send({
        salary: "not-an-integer",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  });
  
  /************************************** DELETE /jobs/:id */
  
  describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
      const allJobsResp = await request(app).get(`/jobs`);
      const job1Id = allJobsResp.body.jobs.filter(ele => ele.title === 'Job 1')[0].id;

      const resp = await request(app)
        .delete(`/jobs/${job1Id}`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({ deleted: `${job1Id}` });
    });
  
    test("unauth for anon", async function () {
      const allJobsResp = await request(app).get(`/jobs`);
      const job1Id = allJobsResp.body.jobs.filter(ele => ele.title === 'Job 1')[0].id;
      
      const resp = await request(app)
        .delete(`/jobs/${job1Id}`)
      expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth when not admin", async function () {
      const allJobsResp = await request(app).get(`/jobs`);
      const job1Id = allJobsResp.body.jobs.filter(ele => ele.title === 'Job 1')[0].id;

      const resp = await request(app)
        .delete(`/jobs/${job1Id}`)
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such job", async function () {
      const resp = await request(app)
          .delete(`/jobs/0`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  });