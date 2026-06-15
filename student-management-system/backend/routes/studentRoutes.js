const express = require('express');
const {
  getStudents, getStudentById, createStudent,
  updateStudent, deleteStudent, getStats,
} = require('../controllers/studentController');
const { authenticate } = require('../middlewares/auth');
const { studentRules, validate } = require('../middlewares/validate');

const router = express.Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/', studentRules, validate, createStudent);
router.put('/:id', studentRules, validate, updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
