'use strict';

const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const User = require('../models').User;

/**
 * Middleware to authenticate the request using Basic Authentication.
 * @param {Request} req - The Express Request object.
 * @param {Response} res - The Express Response object.
 * @param {Function} next - The function to call to pass execution to the next middleware.
 */

module.exports = (req, res, next) => {

  // Placeholder variable for error messages
  let message = null;

  // Get the user's credentials from the Authorization header.
  const credentials = auth(req);

  // Check if credentials are in database
  if (credentials) {

    // Look for a user whose `emailAddress` matches the credentials `name` property.
    User.findOne({
      where: {
        emailAddress: credentials.name
      }
    }).then(user => {

      //Check if email address matches to one in the database
      if (user) {

        //Check password
        let authenticated = bcryptjs
          .compareSync(credentials.pass, user.password);
        //If password match is true
        if (authenticated) {

          console.log(`Authentication successful for emailAddress: ${user.emailAddress}`);
          // Store the user on the Request object
          req.currentUser = user;
          next(); //Go to next middleware

        } else {

          //If password match is false
          message = `Sorry, the password you entered is incorrect`;
          console.warn(message);
          //Change status code and show message
          res.status(401).json({ message: message });
        }

      } else {

        //If email address doesn't match
        message = `Sorry, the email address doesn't have an account yet, please create one.`;
        console.warn(message);
        //Change status code and show message
        res.status(401).json({ message: message });
      }

    })

  } else {

    //If no credentials exist or are empty
    const err = new Error("Sorry, there are missing credentials, you must login");
    err.status = 401;
    next(err);
  }

}