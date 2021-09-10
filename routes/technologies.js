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
 *   { technologies: [ { id, technology }, ...] }
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const technologies = await Technology.findAll();
    return res.json({ technologies });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id]  =>  { technology }
 *
 * technology is { id, technology }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const technology = await Technology.get(req.params.id);
    return res.json({ technology });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[id] { technology } => { technology }
 *
 * technology is { id, technology }
 * 
 * Returns { id, technology }
 *
 * Authorization required: admin
 */

 router.patch("/:id", ensureAdmin, async function (req, res, next) {

  const validator = jsonschema.validate(req.body, technologyNewSchema);
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }
  
  try {
    const technology = await Technology.update(req.params.id, req.body);
    return res.json({ technology });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Technology.remove(req.params.id);
    return res.json({deleted: req.params.id});
  } catch (err) {
    return next(err);
  }
})

module.exports = router;
