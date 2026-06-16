const { z } = require('zod');

const studentSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email format'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(20, 'Phone must be at most 20 characters')
    .regex(/^\+?[\d\s\-().]+$/, 'Invalid phone number format'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other'], { message: 'Invalid gender' }),
  address: z.string().min(1, 'Address is required'),
  course: z.string().min(1, 'Course is required').max(100),
  enrollment_date: z.string().min(1, 'Enrollment date is required'),
  status: z.enum(['Active', 'Inactive']).optional(),
});

const updateStudentSchema = studentSchema.partial();

const validateCreateStudent = (req, res, next) => {
  try {
    req.body = studentSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

const validateUpdateStudent = (req, res, next) => {
  try {
    req.body = updateStudentSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateCreateStudent, validateUpdateStudent };
