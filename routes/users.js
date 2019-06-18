const express = require('express');
const router = express.Router();
const User = require("../models").User;
const bcryptjs = require('bcryptjs');
const authenticate = require('./authenticate');
const { check, validationResult } = require('express-validator/check');

// Send a GET request to /users to READ (view) the currently authenticated user
router.get('/', authenticate, (req, res) => {
  res.json({
    id: req.currentUser.id,
    firstName: req.currentUser.firstName,
    lastName: req.currentUser.lastName,
    emailAddress: req.currentUser.emailAddress
  });
  res.status(200);
});

// Send a POST request to /users to CREATE a user, sets the Location header to "/" and returns no content
router.post('/', [

  //Express Validator Check
    //First Name
  check('firstName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Error - Please provide a value for First Name'),
    //Last Name
  check('lastName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Error - Please provide a value for Last Name'),
    //Email Address + Check if it is valid
  check('emailAddress')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Error - Please provide a value for Email Address')
    .isEmail()
    .withMessage('Error - Please provide a valid Email Address'),
    //Password + Check length
  check('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Error - Please provide a value for Password')
    .isLength({ min: 4, max: 20 })
    .withMessage('Error - Please provide a value for Password that is between 4 and 20 characters in length')
],

(req, res, next) => {

  // Attempt to get the validation result from the Request object.
  const errors = validationResult(req);

  // If there are validation errors...
  if (!errors.isEmpty()) {

    // Use the Array `map()` method to get a list of error messages.
    const errorMessages = errors.array().map(error => error.msg)

    // Return the validation errors to the user.
    res.status(400).json({errors: errorMessages });

  } else {

    User.findOne({ where: { emailAddress: req.body.emailAddress }})
      .then(email => {

        //Check if email is already in the database
        if (email) {

          const err = new Error('Email Address already in use');
          err.status = 400;
          next(err);

        } else {

          //Else email is new so create user
          //First hash password
          req.body.password = bcryptjs.hashSync(req.body.password);
          User.create(req.body)
            .then(() => {

              res.location('/');
              res.status(201).end();
            })

            //Catch error and check if it is a Sequelize Validation Error - then pass error to next middleware
            .catch (err => {

              if (err.name === 'SequelizeValidationError') {
                err.message = "Error in credentials - Missing data";
                err.status = 400;
                next(err);

              } else {

                err.status = 400;
                next(err);
              }
            });
        }
      });
  }
});

module.exports = router;