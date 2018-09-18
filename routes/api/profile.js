const express = require('express')
const router = express.Router()
const mongoogse = require('mongoose')
const passport = require('passport')

// Load validation
const validateProfileInput = require('../../validation/profile')
const validateExperienceInput = require('../../validation/experience')
const validateEducationInput = require('../../validation/education')

// Load Profile model
const Profile = require('../../models/Profile')

// Load User model
const User = require('../../models/User')

// @route   GET api/profile/all
// @desc    Get all profiles
// @access  Public
router.get('/all', (req, res) => {
  const errors = {}
  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = 'There are no profiles.'
        return res.status(404).json(errors)
      }
      return res.json(profiles)
    })
    .catch(err => res.status(404).json({ profile: 'There are no profiles.' }))
})

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
      .populate('user', ['name', 'avatar'])
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

// @route   GET api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public
router.get('/handle/:handle', (req, res) => {
  const handle = req.params.handle
  const errors = {}
  Profile.findOne({ handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user.'
        return res.status(404).json(errors)
      }
      res.json(profile)
    })
    .catch(err => res.status(404).json(err))
})

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', (req, res) => {
  const user_id = req.params.user_id
  const errors = {}
  Profile.findOne({ user: user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user.'
        return res.status(404).json(errors)
      }
      res.json(profile)
    })
    .catch(err =>
      res.status(404).json({ profile: 'There is no profile for this user.' })
    )
})

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body)

    // Check validation
    if (!isValid) {
      return res.status(400).json(errors)
    }

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

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post(
  '/experience',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const body = req.body
    const { errors, isValid } = validateExperienceInput(body)

    // Check validation
    if (!isValid) {
      return res.status(400).json(errors)
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newExp = {
        title: body.title,
        company: body.company,
        location: body.location,
        from: body.from,
        to: body.to,
        current: body.current,
        description: body.description
      }

      // Add exp array
      profile.experience.unshift(newExp)
      profile.save().then(profile => res.json(profile))
    })
  }
)

// @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private
router.post(
  '/education',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const body = req.body
    const { errors, isValid } = validateEducationInput(body)

    // Check validation
    if (!isValid) {
      return res.status(400).json(errors)
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newEdu = {
        school: body.school,
        degree: body.degree,
        fieldofstudy: body.fieldofstudy,
        from: body.from,
        to: body.to,
        current: body.current,
        description: body.description
      }

      // Add exp array
      profile.education.unshift(newEdu)
      profile.save().then(profile => res.json(profile))
    })
  }
)

// @route   DELETE api/profile/experience/:exp_id
// @desc    delete education from profile
// @access  Private
router.delete(
  '/experience/:exp_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {}
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id)

        // Splice out of array
        if (removeIndex > -1) {
          profile.experience.splice(removeIndex, 1)
          // Save
          profile.save().then(profile => res.json(profile))
        } else {
          errors.experience = 'Experience not found.'
          res.status(404).json(errors)
        }
      })
      .catch(err => res.status(404).json(err))
  }
)

// @route   DELETE api/profile/education/:edu_id
// @desc    delete education from profile
// @access  Private
router.delete(
  '/education/:edu_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {}
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id)

        // Splice out of array
        if (removeIndex > -1) {
          profile.education.splice(removeIndex, 1)
          // Save
          profile.save().then(profile => res.json(profile))
        } else {
          errors.education = 'Education not found.'
          res.status(404).json(errors)
        }
      })
      .catch(err => res.status(404).json(err))
  }
)

// @route   DELETE api/profile/
// @desc    delete user and profile
// @access  Private
router.delete(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() =>
        res.json({ success: true })
      )
    })
  }
)

module.exports = router
