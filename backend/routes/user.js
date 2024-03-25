const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {
  createUser,
  userSignIn,
  uploadProfile,
  signOut,
} = require('../controllers/userController');
const { isAuth } = require('../middlewares/auth');
const {
  validateUserSignUp,
  userValidation,
  validateUserSignIn,
} = require('../middlewares/validation/user');

router.post('/create-user', userValidation, createUser);
router.post('/sign-in', userSignIn);
router.post('/sign-out', isAuth, signOut);


module.exports = router;