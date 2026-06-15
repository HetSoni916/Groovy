const StudentModel = require('../models/studentModel');

const getStudents = async (req, res) => {
  const {
    search = '', status = '', course = '',
    page = 1, limit = 10,
    sortBy = 'created_at', sortOrder = 'desc',
  } = req.query;

  const result = await StudentModel.findAll({
    search, status, course,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sortBy, sortOrder,
  });

  res.json({
    data: result.students,
    pagination: {
      total: result.total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(result.total / limit),
    },
  });
};

const getStudentById = async (req, res) => {
  const student = await StudentModel.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
};

const createStudent = async (req, res) => {
  const student_id = await StudentModel.generateStudentId();
  const student = await StudentModel.create({ ...req.body, student_id });
  res.status(201).json(student);
};

const updateStudent = async (req, res) => {
  const student = await StudentModel.update(req.params.id, req.body);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
};

const deleteStudent = async (req, res) => {
  const result = await StudentModel.softDelete(req.params.id);
  if (!result) return res.status(404).json({ message: 'Student not found' });
  res.json({ message: 'Student deleted successfully' });
};

const getStats = async (req, res) => {
  const stats = await StudentModel.getStats();
  res.json(stats);
};

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent, getStats };
