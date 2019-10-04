const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('./logger');
const BookmarksService = require('./bookmarks-service');

const bookmarksRouter = express.Router();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
});


bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })
  .post((req, res, next) => {
    const { title, url, description, rating } = req.body;
    const newBookmark = {
      title,
      url,
      description,
      rating
    };
    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }
  
    if ( rating < 1 || rating > 5 ) {
      logger.error('Rating should be an integer of 1-5');
      return res.status(400).json('Rating should be a number including only 1-5');
    }
  
   
    BookmarksService.insertBookmarks(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${bookmark.id}`))
          .json(bookmark);
      })
      .catch(next);
  
    logger.info('Bookmark was created');
  });

bookmarksRouter
  .route('/:id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getById(knexInstance, req.params.id)
   
      .then(bookmark => {
        if(!bookmark){
          return res.status(404).json({
            error:{message: 'bookmark doesn\'t exist'}
          });
    
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeBookmark(res.bookmark));
  })
  .delete(( req, res, next ) => {
  
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      req.params.id
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch((req, res, next) => {
    const { title, url, description, rating } = req.body;
    const bookmarkToUpdate = {title, url, description, rating};

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: 'Request body must content either \'title\', \'url\', \'description\' or \'rating\''
        }
      });
    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;