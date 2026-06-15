import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import StudentForm from '../components/StudentForm';
import Spinner from '../components/Spinner';
import { studentService } from '../services/studentService';
import { getErrorMessage } from '../utils/helpers';

const EditStudentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService.getById(id)
      .then(({ data }) => setStudent(data))
      .catch(() => {
        toast.error('Student not found');
        navigate('/students');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const onSubmit = async (data) => {
    try {
      await studentService.update(id, data);
      toast.success('Student updated successfully!');
      navigate(`/students/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div className="max-w-3xl mx-auto">
      <StudentForm defaultValues={student} onSubmit={onSubmit} />
    </div>
  );
};

export default EditStudentPage;
