const express = require('express');
const router = express.Router();
const Course = require('../models').Course;
const User = require('../models').User;
const authenticate = require('./authenticate');

// Send a GET request to /courses to READ (view) a list of courses (including the user that owns the course)
router.get('/', (req, res, next) => {
  //Find all courses
  Course.findAll({
    //Specific attributes object to pass to findAll
    attributes: [
      'id',
      'title',
      'description',
      'estimatedTime',
      'materialsNeeded',
      'userId'
    ],
    //Include the user linked to each course
    include: [
      {
        model: User,
        attributes: [
          'id',
          'firstName',
          'lastName',
          'emailAddress'
        ]
      }
    ]
  }).then(courses => {
    //Respond with courses in JSON format
    res.json(courses);
    //Set status code 200 - OK
    res.status(200);
  }).catch(err => {
    err.status = 400;
    next(err);
  });
});


// Send a GET request to /courses/:id to READ (view) a course (including the user that owns the course) for the provided course ID
router.get('/:id', (req, res, next) => {
  //Find specific course
  Course.findOne({
    //Match ID
    where: {
      id: req.params.id
    },
    //Return specific attributes
    attributes: [
      "id",
      "title",
      "description",
      "estimatedTime",
      "materialsNeeded",
      "userId"
    ],
    //Include the user linked to the course
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "emailAddress"]
      }
    ]
  }).then(course => {
    //If course matches = true
    if(course) {
      //respond with course data
      res.json(course);
      res.status(200);
    } else {
      //No match = error
      const err = new Error('No courses match the ID entered');
      err.status = 400;
      next(err);
    }
  });
});


// Send a POST request to /courses to CREATE a course, sets the location header to the URI for the course, and returns no content
router.post('/', authenticate, (req, res, next) => {
  
  //Check if title is empty
  if(!req.body.title) {
    const err = new Error('Sorry, the title field is missing - Please enter a title');
    err.status = 400;
    next(err);
  
    //Check if description is empty
  } else if(!req.body.description) {
    const err = new Error('Sorry, the description field is missing - Please enter a description');
    err.status = 400;
    next(err);
  
  //Check if course already exists
  } else {
    Course.findOne({ where: {title: req.body.title}})
      .then(title => {

        //If already exists = true
        if (title) {
          const err = new Error('Sorry, this course already exists, please enter a new course');
          err.status = 400;
          next(err);
        
        //If false = create new course
        } else {
          req.body.userId = req.currentUser.id;
          Course.create(req.body)
            .then (course => {
              res.location('/api/courses/' + course.id);
              res.status(201).end();
            });
        }
      });
  }
});


// Send a PUT request to /courses/:id to UPDATE a course and returns no content
router.put('/:id', authenticate, (req, res, next) => {
  
  //Check if ID is empty
  if(!req.body.id) {
    const err = new Error('Sorry, the ID field is missing - Please enter an ID');
    err.status = 400;
    next(err);
  
  //Check if title is empty
  } else if (!req.body.title) {
    const err = new Error('Sorry, the title field is missing - Please enter a title');
    err.status = 400;
    next(err);

    //Check if description is empty
  } else if(!req.body.description) {
    const err = new Error('Sorry, the description field is missing - Please enter a description');
    err.status = 400;
    next(err);

  //Find course by ID
  } else { Course.findOne({ where: {id: req.body.id}})
    .then(course => {

      //Check if course exists if true = doesn't exist
      if (!course) {
        const err = new Error("Sorry, that course ID doesn't exist");
        err.status = 403;
        next(err);

      //Check if the user is linked to the course
      } else if (course.userId !== req.currentUser.id) {
        const err = new Error("Sorry, you can't edit this course because it is not linked to you")
        err.status = 403;
        next(err);
        
      //Update course
      } else {
        course.update(req.body);
      }
      
    //End request & return no content
    }).then(() => {
      res.status(204).end();

    //catch errors
    }).catch(err => {
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


// Send a DELETE request to /courses/:id to DELETE a course and returns no content
router.delete('/:id', authenticate, (req, res, next) => {
  
  //Find the requested course to delete
  Course.findOne({ where: { id: req.params.id }})
    .then(course => {

      //Check if the course exists, if true = no course exists
      if (!course) {
        const err = new Error("Sorry, that course ID doesn't exist");
        err.status = 400;
        next(err);
                
      //Check if the user has authority to delete the course
      } else if (course.userId !== req.currentUser.id) {
          const err = new Error("Sorry, you can't delete this course because it is not linked to you");
          err.status = 403;
          next(err);

      //Proceed to delete course
      } else {
        course.destroy();
        res.status(204).end();
      }
    })
    //Catch errors
    .catch(err => {
      if (err.name === 'SequelizeValidationError') {
        err.message = "Error in credentials - Missing data";
        err.status = 400;
        next(err);
  
        } else {
        err.status = 400;
        next(err);
      }
    });
});

module.exports = router;