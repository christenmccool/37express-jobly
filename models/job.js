"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilter } = require("../helpers/sql");


/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   * */

  static async create({ title, salary, equity, companyHandle }) {

    const result = await db.query(
      `INSERT INTO jobs
        (title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        companyHandle
      ],
    );
    const job = result.rows[0];

    return job;
  }


  /** Find all jobs with an optional filtering criteria.
   * 
   * Valid filtering fields: title, minSalary, hasEquity
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws BadRequestError for invalid filtering fields
   * Throws NotFoundError if not found.
   **/

   static async findAll(criteria = {}) {
    let filters = Object.keys(criteria);

    let whereStr = "";
    let values = [];

    if (Object.keys(criteria).length > 0) {
      ({whereStr, values} = sqlForFilter(criteria));

      if (whereStr) {
        whereStr = "WHERE " + whereStr;
      }
    }

    const jobsRes = await db.query(
          `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
           FROM jobs
           ${whereStr}
           ORDER BY title`,
           values);

    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, technologies }
   *   where technologies is [techId, techId, ...]
   * 
   * Throws NotFoundError if not found.
   **/

  static async get(id) {

    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
        FROM jobs
        WHERE id=$1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    const techRes = await db.query(
      `SELECT id, technology
              FROM technologies
              JOIN requirements ON requirements.tech_id=technologies.id
              WHERE requirements.job_id=$1`,
      [id]);

    job.technology = techRes.rows.map(ele => ele.id);
    // job.requirements = techRes.rows;

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
  *
  * Throws NotFoundError if company not found.
  **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`,
      [id]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }


  /** Adds the requirement for a technology to a job
  * 
  * Returns { jobId, techId }
  * 
  * Throws BadRequestError on duplicates.
  * Throws NotFoundError if company not found.
  **/

  static async require(id, techId) {
    const duplicateCheck = await db.query(
      `SELECT job_id, tech_id
        FROM requirements
        WHERE job_id = $1 AND tech_id = $2`,
      [id, techId],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate requirement for job ${id} and technology ${techId}`);
    }

    try {
      const result = await db.query(
        `INSERT INTO requirements
          (job_id, tech_id)
          VALUES ($1, $2)
          RETURNING job_id AS "jobId", tech_id AS "techId"`,
        [
          id,
          techId
        ],
      );
      const requirement = result.rows[0];

      return requirement;
    }
    catch {
      throw new NotFoundError(`No job ${id} or no technology ${techId} `);
    }

  }
}

module.exports = Job;
