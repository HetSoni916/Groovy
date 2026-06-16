import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineFilter, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye } from 'react-icons/hi';
import Table from '../components/common/Table';
import Pagination from '../components/common/Pagination';
import Loader from '../components/common/Loader';
import { useStudents } from '../hooks/useStudents';
import { formatDate, getStatusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const StudentListPage = () => {
  const navigate = useNavigate();
  const { students, pagination, loading, fetchStudents, deleteStudent } = useStudents();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadStudents = useCallback(() => {
    fetchStudents({ search, status: statusFilter, sortBy, sortOrder, page: pagination.page, limit: 10 });
  }, [search, statusFilter, sortBy, sortOrder, pagination.page, fetchStudents]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    fetchStudents({ search, status: statusFilter, sortBy, sortOrder, page: 1, limit: 10 });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents({ search, status: statusFilter, sortBy, sortOrder, page: 1, limit: 10 });
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(key);
      setSortOrder('ASC');
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    const success = await deleteStudent(id);
    if (success) {
      loadStudents();
    }
    setDeleteConfirm(null);
    setDeleting(false);
  };

  const columns = [
    {
      key: 'student_id',
      label: 'Student ID',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-gray-500">{row.student_id}</span>,
    },
    {
      key: 'first_name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'course', label: 'Course', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'enrollment_date',
      label: 'Enrolled',
      sortable: true,
      render: (row) => <span className="text-gray-500">{formatDate(row.enrollment_date)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/students/${row.id}`); }}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
            title="View"
          >
            <HiOutlineEye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/students/${row.id}/edit`); }}
            className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600"
            title="Edit"
          >
            <HiOutlinePencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
            title="Delete"
          >
            <HiOutlineTrash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">Manage all student records</p>
        </div>
        <button onClick={() => navigate('/students/add')} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="h-5 w-5" />
          Add Student
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or course..."
            className="input-field pl-10"
          />
        </form>
        <div className="relative">
          <HiOutlineFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              fetchStudents({ search, status: e.target.value, sortBy, sortOrder, page: 1, limit: 10 });
            }}
            className="input-field pl-10 pr-8 appearance-none"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={students}
        loading={loading}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onRowClick={(row) => navigate(`/students/${row.id}`)}
      />

      <Pagination pagination={pagination} onPageChange={(p) => fetchStudents({ search, status: statusFilter, sortBy, sortOrder, page: p, limit: 10 })} />

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>?
              This action uses soft delete and can be reversed.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" disabled={deleting}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentListPage;
