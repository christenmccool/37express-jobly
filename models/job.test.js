"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds,
  techIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: 'New Job',
    salary: 1000,
    equity: '0.5',
    companyHandle: 'c1',
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(
      {
        id: expect.any(Number),
        title: 'New Job',
        salary: 1000,
        equity: '0.5',
        companyHandle: 'c1',
      }
    );

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
        FROM jobs
        WHERE title = 'New Job'`);
    expect(result.rows).toContainEqual(
      {
        id: expect.any(Number),
        title: 'New Job',
        salary: 1000,
        equity: '0.5',
        company_handle: 'c1',
      }
    );
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works for no filter", async function () {
    let jobs = await Job.findAll();

    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: 'Job 1',
        salary: 1000,
        equity: '0.1',
        companyHandle: 'c1',
      },
      {
        id: expect.any(Number),
        title: 'Job 2',
        salary: 2000,
        equity: '0.2',
        companyHandle: 'c1',
      },
      {
        id: expect.any(Number),
        title: 'Job 3',
        salary: 3000,
        equity: '0',
        companyHandle: 'c2',
      }
    ]);
  });

  test("works for minSalaray filter", async function () {
    let jobs = await Job.findAll({minSalary:"2000"});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: 'Job 2',
        salary: 2000,
        equity: '0.2',
        companyHandle: 'c1',
      },
      {
        id: expect.any(Number),
        title: 'Job 3',
        salary: 3000,
        equity: '0',
        companyHandle: 'c2',
      },
  ]);
  });

  test("works for partial matching title filter", async function () {
    let jobs = await Job.findAll({title:"Job"});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: 'Job 1',
        salary: 1000,
        equity: '0.1',
        companyHandle: 'c1',
      },
      {
        id: expect.any(Number),
        title: 'Job 2',
        salary: 2000,
        equity: '0.2',
        companyHandle: 'c1',
      },
      {  
        id: expect.any(Number),
        title: 'Job 3',
        salary: 3000,
        equity: '0',
        companyHandle: 'c2',
      }
    ]);
  });

  test("works for full match title filter", async function () {
    let jobs = await Job.findAll({title:"Job 1"});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: 'Job 1',
        salary: 1000,
        equity: '0.1',
        companyHandle: 'c1',
      },
    ]);
  });

  test("works for hasEquity true", async function () {
    let jobs = await Job.findAll({hasEquity:"true"});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: 'Job 1',
        salary: 1000,
        equity: '0.1',
        companyHandle: 'c1',
      },
      {
        id: expect.any(Number),
        title: 'Job 2',
        salary: 2000,
        equity: '0.2',
        companyHandle: 'c1',
      },
    ]);
  });

  test("works for hasEquity false", async function () {
    let jobs = await Job.findAll({hasEquity:"false"});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: 'Job 1',
        salary: 1000,
        equity: '0.1',
        companyHandle: 'c1',
      },
      {
        id: expect.any(Number),
        title: 'Job 2',
        salary: 2000,
        equity: '0.2',
        companyHandle: 'c1',
      },
      {  
        id: expect.any(Number),
        title: 'Job 3',
        salary: 3000,
        equity: '0',
        companyHandle: 'c2',
      }
    ]);
  });
});


/************************************** get */

describe("get", function () {
  test("works", async function () {

    let job = await Job.get(jobIds[0]);

    expect(job).toEqual(
      {
        id: jobIds[0],
        title: 'Job 1',
        salary: 1000,
        equity: '0.1',
        companyHandle: 'c1',
        technology: [
          techIds[0], 
          techIds[1]
          // {id: techIds[0], technology: 'Tech1'}, 
          // {id: techIds[1], technology: 'Tech2'}
        ]
      }
    );
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: 'New Title',
    salary: 8000,
    equity: '0.5',
  };

  test("works", async function () {

    let job = await Job.update(jobIds[0], updateData);
    expect(job).toEqual(
      {
        id: jobIds[0],
        ...updateData,
        companyHandle: 'c1'
      }
    );

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
         FROM jobs
         WHERE title = 'New Title'`
    );

    expect(result.rows).toContainEqual(
      {
        id: jobIds[0],
        ...updateData,
        companyHandle: 'c1'
      }
    );
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: 'New Title',
      salary: null,
      equity: null,
    };

    let job = await Job.update(jobIds[0], updateDataSetNulls);
    expect(job).toEqual(
      {
        id: jobIds[0],
        ...updateDataSetNulls,
        companyHandle: 'c1'
      }
    );

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE title = 'New Title'`);

    expect(result.rows).toContainEqual(
      {
        id: jobIds[0],
        ...updateDataSetNulls,
        companyHandle: 'c1'
      }
    );
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no job", async function () {
    try {
      const results = await db.query(
        `SELECT id
          FROM jobs
          WHERE title = 'Job 1'`
      );
      const job1Id = results.rows[0].id;

      await Job.update(job1Id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {

    await Job.remove(jobIds[0]);

    const res = await db.query(
      `SELECT id FROM jobs WHERE id=${jobIds[0]}`);

    expect(res.rows.length).toEqual(0);
  });
  
  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

});


/************************************** require */

describe("require", function () {
  test("works", async function () {
    const requirement = await Job.require(jobIds[1], techIds[0]);

    expect(requirement).toEqual({
      jobId: jobIds[1],
      techId: techIds[0]
    });

    const found = await db.query(
      `SELECT * FROM requirements
      WHERE job_id=${jobIds[1]}`
    )
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].job_id).toEqual(jobIds[1]);
    expect(found.rows[0].tech_id).toEqual(techIds[0]);

  });

  test("bad request with dup data", async function () {
    try {
      await Job.require(jobIds[1], techIds[0]);
      await Job.require(jobIds[1], techIds[0]);
    }
    catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("not found if no such job", async function () {
    try {
      await Job.require(0, techIds[0]);
    }
    catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such technology", async function () {
    try {
      await Job.require(jobIds[1], 0);
    }
    catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});



