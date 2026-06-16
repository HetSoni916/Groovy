const studentService = require('../services/studentService');

const getAll = async (req, res, next) => {
  try {
    const result = await studentService.getAll(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const student = await studentService.getById(req.params.id);
    res.json(student);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const student = await studentService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const student = await studentService.update(req.params.id, req.body);
    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await studentService.delete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await studentService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove, getStats };
