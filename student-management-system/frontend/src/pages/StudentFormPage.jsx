import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function StudentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    date_of_birth: '', gender: 'Male', address: '', course: '',
    enrollment_date: new Date().toISOString().split('T')[0], status: 'Active',
  });

  useEffect(() => {
    if (isEdit) {
      studentAPI.getById(id).then(s => {
        setForm({
          first_name: s.first_name || '',
          last_name: s.last_name || '',
          email: s.email || '',
          phone: s.phone || '',
          date_of_birth: s.date_of_birth ? s.date_of_birth.split('T')[0] : '',
          gender: s.gender || 'Male',
          address: s.address || '',
          course: s.course || '',
          enrollment_date: s.enrollment_date ? s.enrollment_date.split('T')[0] : '',
          status: s.status || 'Active',
        });
      }).catch(() => navigate('/students'));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await studentAPI.update(id, form);
        toast.success('Student updated');
      } else {
        await studentAPI.create(form);
        toast.success('Student created');
      }
      navigate('/students');
    } catch {} finally { setLoading(false); }
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const fields = [
    { label: 'First Name', field: 'first_name', type: 'text', required: true },
    { label: 'Last Name', field: 'last_name', type: 'text', required: true },
    { label: 'Email', field: 'email', type: 'email', required: true },
    { label: 'Phone', field: 'phone', type: 'text' },
    { label: 'Date of Birth', field: 'date_of_birth', type: 'date' },
    { label: 'Gender', field: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
    { label: 'Address', field: 'address', type: 'textarea' },
    { label: 'Course', field: 'course', type: 'text', required: true },
    { label: 'Enrollment Date', field: 'enrollment_date', type: 'date', required: true },
    { label: 'Status', field: 'status', type: 'select', options: ['Active', 'Inactive'] },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">{isEdit ? 'Edit Student' : 'Add Student'}</h2>
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {fields.map(({ label, field, type, required, options }) => (
            <div key={field} className={type === 'textarea' ? 'col-span-2' : ''}>
              <label className="text-sm text-gray-400 mb-1 block">{label}{required && ' *'}</label>
              {type === 'select' ? (
                <select value={form[field]} onChange={e => update(field, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : type === 'textarea' ? (
                <textarea value={form[field]} onChange={e => update(field, e.target.value)} rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              ) : (
                <input type={type} value={form[field]} onChange={e => update(field, e.target.value)} required={required}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Create Student'}
          </button>
          <button type="button" onClick={() => navigate('/students')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm border border-gray-700 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
