"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Technology = require("../models/technology");

const technologyNewSchema = require("../schemas/technologyNew.json");

const router = new express.Router();


/** POST / { technology } =>  { technology }
 *
 *
 * Returns { id, technology }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, technologyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const technology = await Technology.create(req.body);
    return res.status(201).json({ technology });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches
 * - minSalary
 * - hasEquity (filter to jobs that provide a non-zero amount of equity)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const technologies = await Technology.findAll(req.query);
    return res.json({ technologies });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
