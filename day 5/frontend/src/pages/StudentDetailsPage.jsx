import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { studentService } from '../services/studentService';
import { PageLoader } from '../components/common/Loader';
import { formatDate, getGenderColor, getStatusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const StudentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await studentService.getById(id);
        setStudent(res.data);
      } catch (err) {
        toast.error('Student not found');
        navigate('/students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      await studentService.delete(id);
      toast.success('Student deleted successfully');
      navigate('/students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
      setDeleteConfirm(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!student) return null;

  const details = [
    { label: 'Student ID', value: student.student_id },
    { label: 'First Name', value: student.first_name },
    { label: 'Last Name', value: student.last_name },
    { label: 'Email', value: student.email },
    { label: 'Phone', value: student.phone },
    { label: 'Date of Birth', value: formatDate(student.date_of_birth) },
    { label: 'Gender', value: student.gender },
    { label: 'Address', value: student.address },
    { label: 'Course', value: student.course },
    { label: 'Enrollment Date', value: formatDate(student.enrollment_date) },
    { label: 'Created At', value: formatDate(student.created_at) },
    { label: 'Updated At', value: formatDate(student.updated_at) },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/students')} className="p-2 rounded-lg hover:bg-gray-100">
            <HiOutlineArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-gray-500 text-sm">{student.student_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/students/${id}/edit`)}
            className="btn-secondary flex items-center gap-2"
          >
            <HiOutlinePencil className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="btn-danger flex items-center gap-2"
          >
            <HiOutlineTrash className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(student.status)}`}>
            {student.status}
          </span>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getGenderColor(student.gender)}`}>
            {student.gender}
          </span>
          <span className="text-sm text-gray-500">{student.course}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {details.map((d) => (
            <div key={d.label}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{d.label}</p>
              <p className="text-sm text-gray-900 mt-1">{d.value || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{student.first_name} {student.last_name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetailsPage;
