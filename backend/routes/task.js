const express = require('express');
const router = express.Router();
const taskController = require('../controllers/admin/task');
const passport = require('passport');
const multer = require('../config/multer');

const upload = multer.taskUpload || multer;

// Available to all authenticated users for their assigned tasks
router.get('/my', passport.authenticate('jwt', { session: false }), taskController.findForUser);
router.get('/get/:id', passport.authenticate('jwt', { session: false }), taskController.findById);
router.post('/status/:id', passport.authenticate('jwt', { session: false }), taskController.updateStatus);

// Management / admin operations
router.get('/get', passport.authenticate('jwt', { session: false }), taskController.find);
router.post('/get', passport.authenticate('jwt', { session: false }), taskController.find);
router.post('/create', passport.authenticate('jwt', { session: false }), upload.array('attachments', 10), taskController.create);
router.post('/update/:id', passport.authenticate('jwt', { session: false }), upload.array('attachments', 10), taskController.update);
router.post('/delete/:id', passport.authenticate('jwt', { session: false }), taskController.remove);

module.exports = router;
