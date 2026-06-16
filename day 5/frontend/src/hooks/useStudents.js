import { useState, useCallback } from 'react';
import { studentService } from '../services/studentService';
import toast from 'react-hot-toast';

export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getAll(params);
      setStudents(res.data.students);
      setPagination(res.data.pagination);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch students';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteStudent = useCallback(async (id) => {
    try {
      await studentService.delete(id);
      toast.success('Student deleted successfully');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
      return false;
    }
  }, []);

  return { students, pagination, loading, error, fetchStudents, deleteStudent };
};
