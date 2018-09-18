const express = require('express')
const router = express.Router()
const mongoogse = require('mongoose')
const passport = require('passport')

const Profile = require('../../models/Profile')
const User = require('../../models/User')

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Profile works' }))

// @route   GET api/profile
// @desc    Get current user's profile
// @access  Private
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const user = req.user
    const errors = {}
    Profile.findOne({ user: user.id })
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user'
          return res.status(404).json(errors)
        }
        res.json(profile)
      })
      .catch(err => res.status(404).json(err))
  }
)

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    // Get fields
    const profileFields = {}
    profileFields.user = req.user.id
    profileFields.handle = req.body.handle && req.body.handle
    profileFields.company = req.body.company && req.body.company
    profileFields.website = req.body.website && req.body.website
    profileFields.location = req.body.location && req.body.location
    profileFields.bio = req.body.bio && req.body.bio
    profileFields.status = req.body.status && req.body.status
    profileFields.githubusername =
      req.body.githubusername && req.body.githubusername

    // Skills - Split into array
    if (typeof req.body.skills !== 'undefined') {
      profileFields.skills = req.body.skills.split(',')
    }

    // Social
    profileFields.social = {}
    profileFields.social.youtube = req.body.youtube && req.body.youtube
    profileFields.social.twitter = req.body.twitter && req.body.twitter
    profileFields.social.facebook = req.body.facebook && req.body.facebook
    profileFields.social.instagram = req.body.instagram && req.body.instagram
    profileFields.social.linkedin = req.body.linkedin && req.body.linkedin

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        ).then(profile => res.json(profile))
      } else {
        // Create

        // Check if handle exists
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = 'That handle is already taken.'
            res.status(400).json(errors)
          }

          // Save Profile
          new Profile(profileFields).save().then(profile => res.json(profile))
        })
      }
    })
  }
)

module.exports = router
