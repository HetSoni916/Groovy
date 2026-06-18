import { useEffect, useState } from 'react';
import { attendanceAPI, studentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiClock, FiAlertCircle, FiSave } from 'react-icons/fi';

const STATUSES = [
  { value: 'Present', color: 'green', icon: FiCheck },
  { value: 'Absent', color: 'red', icon: FiX },
  { value: 'Late', color: 'yellow', icon: FiClock },
  { value: 'Excused', color: 'gray', icon: FiAlertCircle },
];

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('mark'); // 'mark' or 'view'

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const [allStudents, existing] = await Promise.all([
        studentAPI.list({ search: '', status: 'Active', page: 1, limit: 1000, sortBy: 'first_name', sortOrder: 'asc' }),
        attendanceAPI.getByDate(date),
      ]);

      const attendanceMap = {};
      existing.records.forEach(r => {
        attendanceMap[r.student_id] = r.status;
      });

      setStudents(allStudents.data);
      setAttendance(attendanceMap);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadAttendance(); }, [date]);

  const setStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance)
        .filter(([_, status]) => status)
        .map(([studentId, status]) => ({ studentId, status }));

      if (records.length === 0) {
        toast.error('Mark at least one student');
        return;
      }

      await attendanceAPI.markBulk({ date, records });
      toast.success(`Attendance saved for ${records.length} students`);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Attendance Tracking</h2>
      </div>

      <div className="flex gap-3 items-center mb-6">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
        <span className="text-sm text-gray-500">
          {students.length} active students
        </span>
        <span className="text-xs text-gray-600">
          {Object.values(attendance).filter(Boolean).length} marked
        </span>
        <div className="flex-1" />
        <button onClick={handleSave} disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors">
          <FiSave /> {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : students.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No active students found</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                <th className="text-left p-3 font-medium">Student ID</th>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Course</th>
                <th className="text-center p-3 font-medium" colSpan={4}>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-3 text-gray-400 font-mono text-xs">{s.student_id}</td>
                  <td className="p-3 text-white font-medium">{s.first_name} {s.last_name}</td>
                  <td className="p-3 text-gray-400">{s.course}</td>
                  {STATUSES.map(({ value, color, icon: Icon }) => (
                    <td key={value} className="p-2 text-center">
                      <button
                        onClick={() => setStatus(s.id, value)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          attendance[s.id] === value
                            ? `bg-${color}-600/20 text-${color}-400 border border-${color}-500/50`
                            : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800 border border-transparent'
                        }`}
                      >
                        <Icon className="inline mr-1" />
                        {value}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex gap-4 text-xs text-gray-500">
        {STATUSES.map(({ value, color }) => (
          <span key={value}>
            <span className={`inline-block w-2 h-2 rounded-full bg-${color}-500 mr-1`} />
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
