import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI, attendanceAPI } from '../services/api';
import { FiUsers, FiUserCheck, FiUserPlus, FiCalendar } from 'react-icons/fi';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);

  useEffect(() => {
    studentAPI.getStats().then(setStats).catch(() => {});
    attendanceAPI.getStats().then(setAttendanceStats).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Students', value: stats?.total || 0, icon: FiUsers, color: 'blue' },
    { label: 'Active Students', value: stats?.active || 0, icon: FiUserCheck, color: 'green' },
    { label: 'New This Month', value: stats?.new_this_month || 0, icon: FiUserPlus, color: 'purple' },
    { label: 'Attendance Days', value: attendanceStats?.total_days || 0, icon: FiCalendar, color: 'orange' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-3xl text-${color}-500`}><Icon /></span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {attendanceStats && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Attendance Overview (Last 30 Days)</h3>
          <div className="flex gap-4 text-sm">
            <div><span className="text-green-400 font-bold">{attendanceStats.present || 0}</span> <span className="text-gray-500">Present</span></div>
            <div><span className="text-red-400 font-bold">{attendanceStats.absent || 0}</span> <span className="text-gray-500">Absent</span></div>
            <div><span className="text-yellow-400 font-bold">{attendanceStats.late || 0}</span> <span className="text-gray-500">Late</span></div>
            <div><span className="text-gray-400 font-bold">{attendanceStats.excused || 0}</span> <span className="text-gray-500">Excused</span></div>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link to="/students/add" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Add Student</Link>
        <Link to="/attendance" className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-700">Mark Attendance</Link>
      </div>
    </div>
  );
}
