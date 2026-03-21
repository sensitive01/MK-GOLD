const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/admin/announcement');
const passport = require('passport');

// These routes are available to ALL authenticated users
router.get('/my', passport.authenticate('jwt', { session: false }), announcementController.getForUser);
router.post('/seen/:id', passport.authenticate('jwt', { session: false }), announcementController.markAsSeen);

module.exports = router;
