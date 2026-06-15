import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/studentService';

export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '', status: '', course: '',
    page: 1, limit: 10, sortBy: 'created_at', sortOrder: 'desc',
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await studentService.getAll(filters);
      setStudents(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const updateFilters = (updates) =>
    setFilters((prev) => ({ ...prev, ...updates, page: updates.page ?? 1 }));

  return { students, pagination, loading, error, filters, updateFilters, refetch: fetchStudents };
};
