"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

/** Related functions for technologies. */

class Technology {
  /** Create a technology (from data), update db, return new technology data.
   *
   * data should be { technology }
   *
   * Returns { id, technology }
   *
   * Throws BadRequestError if technology already in database.
   * */

static async create({ technology }) {
  const duplicateCheck = await db.query(
    `SELECT technology
        FROM technologies
        WHERE technology = $1`,
    [technology]);

  if (duplicateCheck.rows[0])
  throw new BadRequestError(`Duplicate technology: ${technology}`);

  const result = await db.query(
    `INSERT INTO technologies
        (technology)
        VALUES ($1)
        RETURNING id, technology`,
    [technology]
  );
  const newTech = result.rows[0];

  return newTech;
}

 /** Find all technologies 
   * 
   * Valid filtering fields: title, minSalary, hasEquity
   *
   * Returns [{ id, technology }, ...]
   *
   **/

  static async findAll() {

    const techRes = await db.query(
          `SELECT id, technology
           FROM technologies
           ORDER BY technology`);

    return techRes.rows;
  }
}

module.exports = Technology;