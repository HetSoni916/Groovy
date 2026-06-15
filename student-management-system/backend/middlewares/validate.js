const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });
  next();
};

const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const studentRules = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').optional().matches(/^[\d\s\-+()]+$/).withMessage('Invalid phone number'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('status').optional().isIn(['Active', 'Inactive']).withMessage('Invalid status'),
  body('enrollment_date').notEmpty().withMessage('Enrollment date required'),
];

module.exports = { validate, loginRules, studentRules };
