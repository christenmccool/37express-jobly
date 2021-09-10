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


  /** Given a technology id, return data about technology.
   *
   * Returns { id, technology }
   * 
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const techRes = await db.query(
      `SELECT id, technology
        FROM technologies
        WHERE id=$1`,
      [id]
    );

    const technology = techRes.rows[0];

    if (!technology) throw new NotFoundError(`No technology: ${id}`);

    return technology;
  }

  /** Update technology data with `data`.
   *
   * Data should be: { technology }
   *
   * Returns { id, technology }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {

    if (Object.keys(data).length === 0) throw new BadRequestError("No data");

    const techRes = await db.query(`
      UPDATE technologies
        SET technology=$1
        WHERE id=$2
        RETURNING id, technology
      `,
      [data.technology, id] 
    )
    const technology = techRes.rows[0];

    if (!technology) throw new NotFoundError(`No technology: ${id}`);

    return technology;
  }

  /** Delete given technology from database; returns undefined.
  *
  * Throws NotFoundError if company not found.
  **/

  static async remove(id) {

    const techRes = await db.query(`
      DELETE 
        FROM technologies
        WHERE id=$1
        RETURNING id
      `,
      [id]
    )

    const technology = techRes.rows[0];

    if (!technology) throw new NotFoundError(`No technology: ${id}`);

  }

}

module.exports = Technology;