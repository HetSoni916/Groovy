import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { studentService } from '../services/studentService';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import ConfirmModal from '../components/ConfirmModal';
import { formatDate, getErrorMessage } from '../utils/helpers';

const Field = ({ label, value }) => (
  <div>
    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd>
  </div>
);

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    studentService.getById(id)
      .then(({ data }) => setStudent(data))
      .catch(() => {
        toast.error('Student not found');
        navigate('/students');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await studentService.delete(id);
      toast.success('Student deleted');
      navigate('/students');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner size="lg" className="mt-20" />;
  if (!student) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link to="/students" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Back to Students
        </Link>
        <div className="flex gap-2">
          <Link to={`/students/${id}/edit`} className="btn-secondary flex items-center gap-2 text-sm">
            <Pencil size={15} /> Edit
          </Link>
          <button onClick={() => setShowDelete(true)} className="btn-danger flex items-center gap-2 text-sm">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="card flex flex-col sm:flex-row items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {student.first_name[0]}{student.last_name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{student.first_name} {student.last_name}</h2>
            <StatusBadge status={student.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{student.student_id}</p>
          <p className="text-sm text-gray-600 mt-1">{student.email}</p>
        </div>
      </div>

      {/* Personal Info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Personal Information</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" value={student.first_name} />
          <Field label="Last Name" value={student.last_name} />
          <Field label="Email" value={student.email} />
          <Field label="Phone" value={student.phone} />
          <Field label="Date of Birth" value={formatDate(student.date_of_birth)} />
          <Field label="Gender" value={student.gender} />
          <div className="sm:col-span-2">
            <Field label="Address" value={student.address} />
          </div>
        </dl>
      </div>

      {/* Academic Info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Academic Information</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Course" value={student.course} />
          <Field label="Enrollment Date" value={formatDate(student.enrollment_date)} />
          <Field label="Status" value={student.status} />
          <Field label="Record Created" value={formatDate(student.created_at)} />
        </dl>
      </div>

      <ConfirmModal
        isOpen={showDelete}
        title="Delete Student"
        message={`Are you sure you want to delete ${student.first_name} ${student.last_name}?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        loading={deleting}
      />
    </div>
  );
};

export default StudentDetailPage;
