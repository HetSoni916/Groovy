import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { studentService } from '../services/studentService';
import toast from 'react-hot-toast';

const AddStudentPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await studentService.create(data);
      toast.success('Student added successfully');
      navigate('/students');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add student';
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `input-field ${errors[field] ? 'border-red-500 focus:ring-red-500' : ''}`;
  const errorMsg = (field) =>
    errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field].message}</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/students')} className="p-2 rounded-lg hover:bg-gray-100">
          <HiOutlineArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
          <p className="text-gray-500 mt-1">Enter the student details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              {...register('first_name', { required: 'First name is required' })}
              className={inputClass('first_name')}
            />
            {errorMsg('first_name')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              {...register('last_name', { required: 'Last name is required' })}
              className={inputClass('last_name')}
            />
            {errorMsg('last_name')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
              })}
              className={inputClass('email')}
            />
            {errorMsg('email')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              {...register('phone', {
                required: 'Phone is required',
                pattern: { value: /^\+?[\d\s\-().]+$/, message: 'Invalid phone' },
                minLength: { value: 10, message: 'Min 10 digits' },
              })}
              className={inputClass('phone')}
            />
            {errorMsg('phone')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
            <input
              type="date"
              {...register('date_of_birth', { required: 'Date of birth is required' })}
              className={inputClass('date_of_birth')}
            />
            {errorMsg('date_of_birth')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select {...register('gender', { required: 'Gender is required' })} className={inputClass('gender')}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errorMsg('gender')}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <textarea
              rows={2}
              {...register('address', { required: 'Address is required' })}
              className={inputClass('address')}
            />
            {errorMsg('address')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
            <input
              {...register('course', { required: 'Course is required' })}
              className={inputClass('course')}
            />
            {errorMsg('course')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date *</label>
            <input
              type="date"
              {...register('enrollment_date', { required: 'Enrollment date is required' })}
              className={inputClass('enrollment_date')}
            />
            {errorMsg('enrollment_date')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select {...register('status')} className="input-field">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/students')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudentPage;
