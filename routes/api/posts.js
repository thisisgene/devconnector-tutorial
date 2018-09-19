const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const passport = require('passport')

// Post model
const Post = require('../../models/Post')

// Profile model
const Profile = require('../../models/Profile')

// validation
const validatePostInput = require('../../validation/post')

// @route   GET api/posts/test
// @desc    Tests posts route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Posts works' }))

// @route   GET api/posts
// @desc    Get posts
// @access  Public
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: 'No posts found.' }))
})

// @route   GET api/posts/:post_id
// @desc    Get post by ID
// @access  Public
router.get('/:post_id', (req, res) => {
  Post.findById(req.params.post_id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: 'No post found with that ID.' })
    )
})

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),

  (req, res) => {
    const body = req.body
    const { errors, isValid } = validatePostInput(body)

    if (!isValid) {
      return res.status(400).json(errors)
    }

    const newPost = new Post({
      text: body.text,
      name: body.name,
      avatar: body.avatar,
      user: req.user.id
    })

    newPost.save().then(post => res.json(post))
  }
)

// @route   DELETE api/posts/:post_id
// @desc    delete post by ID
// @access  Private
router.delete(
  '/:post_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.post_id)
      .then(post => {
        if (post.user.toString() !== req.user.id) {
          return res.status(401).json({ notauthorizes: 'User not authorized.' })
        }

        post.remove().then(() => res.json({ success: true }))
      })
      .catch(err =>
        res.status(404).json({ nopostfound: 'No post found with that ID.' })
      )
  }
)

// @route   POST api/posts/like/:post_id
// @desc    Like post
// @access  Private
router.post(
  '/like/:post_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { post_id } = req.params
    Post.findById(post_id, (err, foundPost) => {
      if (!foundPost || err) {
        res.status(404).json({ nopostfound: 'No post found with that ID.' })
      }
      const index = foundPost.likes.findIndex(value => {
        return value.user == req.user.id
      })
      if (index == -1) {
        foundPost.likes.push({ user: req.user.id })
      } else {
        foundPost.likes.splice(index, 1)
      }
      foundPost.save().then(savedPost => {
        res.status(202).json(savedPost)
      })
    })
  }
)

// @route   POST api/posts/comment/:post_id
// @desc    Add comment to post
// @access  Private
router.post(
  '/comment/:post_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const body = req.body
    const { errors, isValid } = validatePostInput(body)

    if (!isValid) {
      return res.status(400).json(errors)
    }

    const { post_id } = req.params
    Post.findById(post_id, (err, foundPost) => {
      if (!foundPost || err) {
        res.status(404).json({ nopostfound: 'No post found with that ID.' })
      }
      const newComment = {
        text: body.text,
        name: body.name,
        avatar: body.avatar,
        user: req.user.id
      }
      foundPost.comments.push(newComment)
      foundPost.save().then(post => res.json(post))
    })
  }
)

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    remove comment from post
// @access  Private
router.delete(
  '/comment/:post_id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.post_id)
      .then(post => {
        // Check to see if comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: "Comment doesn't exist" })
        }

        // Filter the comment to be deleted
        const updatedComments = post.comments.filter(
          comment =>
            !(
              comment.user.toString() === req.user.id &&
              comment._id.toString() === req.params.comment_id
            )
        )

        // Check to see if the user is authorized to delete that comment
        // They will only be able to delete that comment if they're the creator of it
        if (updatedComments.length === post.comments.length) {
          return res.status(401).json({
            notauthorized:
              "If you're seeing this that means either of three things \n 1. You used postman or some other tool to send this request to delete someone else's comment \n 2. You changed the JavaScript on the front-end to send this request \n 3. You made your own script to make the requst."
          })
        }
        // Update comments
        post.comments = updatedComments
        // Save to database
        post.save().then(post => res.json(post))
      })
      .catch(() => res.status(404).json({ postnotfound: 'No post found' }))
  }
)

module.exports = router
