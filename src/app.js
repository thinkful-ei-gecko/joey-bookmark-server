require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const logger = require('./logger');
const bookmarksRouter = require('./bookmarks-router');


const app = express();


const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());



app.use(function validateBearerToken( req, res, next) {
  const authToken = process.env.API_TOKEN;
  const userToken = req.get('Authorization');

  if (!userToken || userToken.split(' ')[1] !== authToken) {
    logger.error('Unauthorized request received');
    return res.status(401).json({ error: 'Unauthorized request '});
  }

  next();
});
app.use('/api/bookmarks', bookmarksRouter);


app.get('/', ( req, res ) => {
  res.send('Hello world!');
});

app.use(function errorHandler( error, req, res, next ) {
  let response;
  if(NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    logger.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;