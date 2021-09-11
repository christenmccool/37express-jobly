"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");
const generatePassword = require('password-generator');

const express = require("express");
const { ensureLoggedIn, ensureAdmin, ensureSelfOrAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * Uses a random password to create the token. 
 * User will use this token to set password
 * 
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const userData = req.body;

    const passwordMinLength = 8;
    const passwordLength = Math.floor(Math.random() * 12) + passwordMinLength;
    const randomPassword = generatePassword(passwordLength, false);

    userData.password = randomPassword;

    const validator = jsonschema.validate(userData, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register({isAdmin: false, ...userData});
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, applications, qualifications }
 * 
 * applications is [jobId, jobId, ...]
 * qualifications is [techId, techId, ...]
 *
 * Authorization required: user or admin
 **/

router.get("/:username", ensureSelfOrAdmin, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: user or admin
 **/

router.patch("/:username", ensureSelfOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: user or admin
 **/

router.delete("/:username", ensureSelfOrAdmin, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

/** POST /[username]/jobs/[id]  => { applied: jobId }
 *
 * Allows a user to apply for a job (or admin to apply for them)
 *
 * Authorization required: user or admin
 **/

 router.post("/:username/jobs/:id", ensureSelfOrAdmin, async function (req, res, next) {
  try {
    const username = req.params.username;
    const jobId = req.params.id;

    await User.apply(username, jobId);

    return res.status(201).json({ applied: jobId });
  } catch (err) {
    return next(err);
  }
});

/** POST /[username]/tech/[id]  => { qualified: techId }
 *
 * Allows a user to state a qualification in a technology (or admin to state the qualification for them)
 *
 * Authorization required: user or admin
 **/
router.post("/:username/tech/:id", ensureSelfOrAdmin, async function (req, res, next) {
  try {
    const username = req.params.username;
    const techId = req.params.id;

    await User.qualify(username, techId);

    return res.status(201).json({qualified: techId});
  } catch (err) {
    return next(err);
  }
});

/** GET /[username]/jobs  => { jobs }
 *  jobs is [jobId, jobId, ..]
 *  Matches users with jobs where the technologies are the same
 *
 *  Authorization required: user or admin
 **/
router.get("/:username/jobs", ensureSelfOrAdmin, async function (req, res, next) {
  try {
    const jobs = await User.getJobs(req.params.username);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
