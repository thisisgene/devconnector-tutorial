const Validator = require('validator')
const isEmpty = require('./is-empty')

module.exports = function validateRegisterInput(data) {
  let errors = {}

  if (!Validator.isLength(data.name, { min: 3, max: 32 })) {
    errors.name = 'Name must be between 3 and 32 Characters.'
  }

  return {
    errors,
    isValid: isEmpty(errors)
  }
}
