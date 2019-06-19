'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');
const sequelize = require('./models').sequelize;

// Test the connection to the database
sequelize
  .authenticate()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('The connection failed.'));

const routes = require('./routes');
const courseRoutes = require('./routes/courses');
const userRoutes = require('./routes/users');

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

// setup morgan which gives us http request logging
app.use(morgan('dev'));

// Setup req body JSON parsing
app.use(express.json());

// TODO setup your api routes here
app.use('/api', routes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);

// setup a friendly greeting for the root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

sequelize.sync()
  .then(() => {
    // start listening on our port
    const server = app.listen(app.get('port'), () => {
      console.log(`Express server is listening on port ${server.address().port}`);
    });
  })
  .catch(err => console.log(`Can't connect to database - error: ${err}`));
