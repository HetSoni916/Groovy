import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Eye, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { useStudents } from '../hooks/useStudents';
import { studentService } from '../services/studentService';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import Spinner from '../components/Spinner';
import { formatDate, getErrorMessage, COURSES } from '../utils/helpers';

const SortIcon = ({ field, sortBy, sortOrder }) => {
  if (sortBy !== field) return <ChevronUp size={14} className="text-gray-300" />;
  return sortOrder === 'asc'
    ? <ChevronUp size={14} className="text-primary-600" />
    : <ChevronDown size={14} className="text-primary-600" />;
};

const StudentsPage = () => {
  const { students, pagination, loading, error, filters, updateFilters, refetch } = useStudents();
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleSort = (field) => {
    updateFilters({
      sortBy: field,
      sortOrder: filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await studentService.delete(deleteId);
      toast.success('Student deleted successfully');
      setDeleteId(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const cols = [
    { field: 'student_id', label: 'Student ID' },
    { field: 'first_name', label: 'Name' },
    { field: 'email', label: 'Email' },
    { field: 'course', label: 'Course' },
    { field: 'enrollment_date', label: 'Enrolled' },
    { field: 'status', label: 'Status' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card !p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, course..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="input-field pl-9"
            />
          </div>
          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="input-field md:w-40"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {/* Course filter */}
          <select
            value={filters.course}
            onChange={(e) => updateFilters({ course: e.target.value })}
            className="input-field md:w-52"
          >
            <option value="">All Courses</option>
            {COURSES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {/* Per page */}
          <select
            value={filters.limit}
            onChange={(e) => updateFilters({ limit: parseInt(e.target.value), page: 1 })}
            className="input-field md:w-28"
          >
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <Link to="/students/new" className="btn-primary whitespace-nowrap">+ Add Student</Link>
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {error && (
          <div className="p-4 text-red-600 text-sm">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {cols.map(({ field, label }) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      <SortIcon field={field} sortBy={filters.sortBy} sortOrder={filters.sortOrder} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12"><Spinner /></td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No students found</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.student_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="px-4 py-3 text-gray-600">{s.course || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(s.enrollment_date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/students/${s.id}`)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/students/${s.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(p) => updateFilters({ page: p })} />
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Student"
        message="This will permanently remove the student record. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
};

export default StudentsPage;
