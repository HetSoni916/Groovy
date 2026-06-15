import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StudentForm from '../components/StudentForm';
import { studentService } from '../services/studentService';
import { getErrorMessage } from '../utils/helpers';

const AddStudentPage = () => {
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await studentService.create(data);
      toast.success('Student added successfully!');
      navigate('/students');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <StudentForm onSubmit={onSubmit} />
    </div>
  );
};

export default AddStudentPage;
