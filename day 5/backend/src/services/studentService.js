const Student = require('../models/Student');

class StudentService {
  async getAll(query) {
    const { search, status, sortBy, sortOrder, page, limit } = query;
    return Student.findAll({
      search,
      status,
      sortBy,
      sortOrder,
      page: parseInt(page, 10) || 1,
      limit: Math.min(parseInt(limit, 10) || 10, 100),
    });
  }

  async getById(id) {
    const student = await Student.findById(id);
    if (!student) {
      throw Object.assign(new Error('Student not found'), { statusCode: 404 });
    }
    return student;
  }

  async create(data, userId) {
    const existingEmail = await Student.findByEmail(data.email);
    if (existingEmail) {
      throw Object.assign(new Error('A student with this email already exists'), { statusCode: 409 });
    }

    return Student.create({ ...data, created_by: userId });
  }

  async update(id, data) {
    const student = await Student.findById(id);
    if (!student) {
      throw Object.assign(new Error('Student not found'), { statusCode: 404 });
    }

    if (data.email && data.email !== student.email) {
      const existingEmail = await Student.findByEmail(data.email);
      if (existingEmail) {
        throw Object.assign(new Error('A student with this email already exists'), { statusCode: 409 });
      }
    }

    const updated = await Student.update(id, data);
    return updated;
  }

  async delete(id) {
    const student = await Student.findById(id);
    if (!student) {
      throw Object.assign(new Error('Student not found'), { statusCode: 404 });
    }

    return Student.softDelete(id);
  }

  async getStats() {
    return Student.getStats();
  }
}

module.exports = new StudentService();
