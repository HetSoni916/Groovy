import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useEffect } from 'react';
import FormField from './FormField';
import { COURSES } from '../utils/helpers';

const schema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().matches(/^[\d\s\-+()]*$/, 'Invalid phone').nullable(),
  date_of_birth: yup.string().nullable(),
  gender: yup.string().oneOf(['Male', 'Female', 'Other', '']).nullable(),
  address: yup.string().nullable(),
  course: yup.string().nullable(),
  enrollment_date: yup.string().required('Enrollment date is required'),
  status: yup.string().oneOf(['Active', 'Inactive']).required(),
});

const StudentForm = ({ defaultValues, onSubmit, isSubmitting }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: '', last_name: '', email: '', phone: '',
      date_of_birth: '', gender: '', address: '', course: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        ...defaultValues,
        date_of_birth: defaultValues.date_of_birth?.split('T')[0] || '',
        enrollment_date: defaultValues.enrollment_date?.split('T')[0] || '',
      });
    }
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="First Name" required error={errors.first_name?.message}>
            <input {...register('first_name')} className="input-field" placeholder="Alice" />
          </FormField>
          <FormField label="Last Name" required error={errors.last_name?.message}>
            <input {...register('last_name')} className="input-field" placeholder="Johnson" />
          </FormField>
          <FormField label="Email Address" required error={errors.email?.message}>
            <input type="email" {...register('email')} className="input-field" placeholder="alice@example.com" />
          </FormField>
          <FormField label="Phone Number" error={errors.phone?.message}>
            <input {...register('phone')} className="input-field" placeholder="555-0101" />
          </FormField>
          <FormField label="Date of Birth" error={errors.date_of_birth?.message}>
            <input type="date" {...register('date_of_birth')} className="input-field" />
          </FormField>
          <FormField label="Gender" error={errors.gender?.message}>
            <select {...register('gender')} className="input-field">
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Address" error={errors.address?.message}>
              <textarea {...register('address')} rows={2} className="input-field resize-none" placeholder="123 Main St, City" />
            </FormField>
          </div>
        </div>
      </div>

      {/* Academic Info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Academic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Course" error={errors.course?.message}>
            <select {...register('course')} className="input-field">
              <option value="">Select course</option>
              {COURSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Enrollment Date" required error={errors.enrollment_date?.message}>
            <input type="date" {...register('enrollment_date')} className="input-field" />
          </FormField>
          <FormField label="Status" required error={errors.status?.message}>
            <select {...register('status')} className="input-field">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </FormField>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => window.history.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary px-8">
          {isSubmitting ? 'Saving...' : 'Save Student'}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
