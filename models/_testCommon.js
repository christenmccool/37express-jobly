const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");
// let jobIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  await db.query("DELETE FROM jobs");

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);


  // const job1Id =await db.query(`
  //   INSERT INTO jobs(title, salary, equity, company_handle)
  //   VALUES ('Job 1', 1000, '0.1', 'c1'),
  //          ('Job 2', 2000, '0.2', 'c1'),
  //          ('Job 3', 3000, '0', 'c2')`);
  
  const jobRes = await db.query(`
      INSERT INTO jobs(title, salary, equity, company_handle)
      VALUES ('Job 1', 1000, '0.1', 'c1'),
             ('Job 2', 2000, '0.2', 'c1'),
             ('Job 3', 3000, '0', 'c2')
      RETURNING id`);
  
  jobIds = jobRes.rows.map(ele => ele.id);
  // jobIds.splice(0, 0, ...jobRes.rows.map(ele => ele.id));

  await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      ]);


  await db.query(`
        INSERT INTO applications (username, job_id)
        VALUES ('u1', ${jobIds[1]}),
              ('u1', ${jobIds[2]})`);
}

async function commonBeforeEach() {
  hello="hi";
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  // jobIds
};