"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");
const { jobIds } = require("./_testCommon");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          isAdmin,
        ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin }, ...]
   **/

  static async findAll() {
    const result = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, email, is_admin, jobs }
   *   where jobs is [jobId, jobId, ...]
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const jobsRes = await db.query(
      `SELECT job_id AS "jobId"
        FROM applications
        WHERE username = $1`,
    [username]
    );
    user.jobs = jobsRes.rows.map(ele => ele.jobId);

    const qualifyRes = await db.query(
      `SELECT tech_id AS "techId"
        FROM qualifications
        WHERE username=$1`,
      [username]
    );
    user.qualifications = qualifyRes.rows.map(ele => ele.techId);

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  /** Allow a given user to apply for a job given the job's id. 
   * 
   * Returns { username, jobId }
   * 
   * Throws BadRequestError on duplicates.
   * 
   * Throws NotFoundError if user or job not found.
   */

  static async apply(username, jobId) {
    const duplicateCheck = await db.query(
        `SELECT username, job_id
          FROM applications
          WHERE username = $1 AND job_id = $2`,
        [username, jobId],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate application for username ${username} and job ${jobId}`);
    }
  
    try {
      
      let result = await db.query(
          `INSERT INTO applications
            (username, job_id)
            VALUES ($1, $2)
            RETURNING username, job_id AS "jobId"`,
          [username, jobId]
      );
      const application = result.rows[0];

      return application;
    } 
    catch {
      throw new NotFoundError(`No user ${username} or no job ${jobId} `);
    }  
  }

  /** Qualify a given user in a given technology. 
   * 
   * Returns { username, techId }
   * 
   * Throws BadRequestError on duplicates.
   * 
   * Throws NotFoundError if user or technology not found.
   */

  static async qualify(username, techId) {
     const duplicateCheck = await db.query(
      `SELECT username, tech_id
        FROM qualifications
        WHERE username = $1 AND tech_id = $2`,
      [username, techId],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate qualification for username ${username} and technology ${techId}`);
    }

    try {
      const result = await db.query(
        `INSERT INTO qualifications
          (username, tech_id)
          VALUES ($1, $2)
          RETURNING username, tech_id AS "techId"`,
        [username, techId]
      )
      const qualification = result.rows[0]

      return qualification;

    } catch (err) {
      throw new NotFoundError(`No user ${username} or no technology ${techId}`);
    }
  }

  /** Show a given user the jobs that match their qualifications
   * 
   * Returns [{job}, {job}, ...]
   * where job is { id, title, salary, equity, companyHandle }
   * 
   * Throws NotFoundError if user not found.
   */

  static async getJobs(username) {
    const userRes = await db.query(
      `SELECT username
        FROM users
        WHERE username=$1
      `,
      [username]
    );

    if (userRes.rows.length === 0) throw new NotFoundError(`No user: ${username}`);

    // Create an array of the user's technology qualifications
    const userTechRes = await db.query(
      `SELECT tech_id AS "techId"
        FROM qualifications
        WHERE username=$1
      `,
      [username]
    );

    // if (userTechRes.rows.length === 0) throw new NotFoundError(`No qualifications: ${username}`);
    if (userTechRes.rows.length === 0) return [];

    const userTech = userTechRes.rows.map(ele => ele.techId);
    userTech.sort();

    // Create a set of the job id's of jobs which requires at least one of the user's technology qualifications
    const jobPossibilities = new Set();
    for (let techId of userTech) {
      const jobRes = await db.query(
        `SELECT job_id AS "jobId"
          FROM requirements
          WHERE tech_id=$1
        `,
        [techId]
      );
      const jobId = jobRes.rows[0].jobId;
      jobPossibilities.add(jobId);
    }

    // For each job identified above, create an array of all of the job's tech requirements
    const jobTech = {};
    for (let jobId of jobPossibilities) {
      const jobRes = await db.query(
        `SELECT job_id AS "jobId", tech_id AS "techId"
          FROM requirements
          WHERE job_id=$1
        `,
        [jobId]
      );
      jobTech[jobId] = jobRes.rows.map(ele => ele.techId)
    }

    for (let jobId in jobTech) {
      jobTech[jobId].sort();
    }

    // Identify the jobs for which the user is qualified for every technology requirement
    const jobs = [];

    for (let jobId in jobTech) {
      if (userTech.length === jobTech[jobId].length && userTech.every((val, i) => val == jobTech[jobId][i])) {
        jobs.push(+jobId);
      }
    }

    return jobs;

  }
}



module.exports = User;
