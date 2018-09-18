const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const passport = require('passport')

const Post = require('../../models/Post')

// @route   GET api/posts/test
// @desc    Tests posts route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Posts works' }))

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const body = req.body
    const newPost = new Post({
      text: body.text,
      name: body.name,
      avatar: body.avatar,
      user: req.user.id
    })

    newPost.save().then(post => res.json(post))
  }
)

module.exports = router
