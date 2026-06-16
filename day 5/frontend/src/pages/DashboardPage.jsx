import { useState, useEffect } from 'react';
import { HiOutlineUserGroup, HiOutlineUser, HiOutlineAcademicCap } from 'react-icons/hi';
import StatsCard from '../components/common/StatsCard';
import Loader from '../components/common/Loader';
import { studentService } from '../services/studentService';
import { formatDate } from '../utils/helpers';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, studentsRes] = await Promise.all([
          studentService.getStats(),
          studentService.getAll({ limit: 5, sortBy: 'created_at', sortOrder: 'DESC' }),
        ]);
        setStats(statsRes.data);
        setRecentStudents(studentsRes.data.students);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Students',
      value: stats?.total_students || 0,
      icon: HiOutlineUserGroup,
      color: 'primary',
    },
    {
      title: 'Active Students',
      value: stats?.active_students || 0,
      icon: HiOutlineUser,
      color: 'green',
    },
    {
      title: 'New This Month',
      value: stats?.new_admissions_this_month || 0,
      icon: HiOutlineAcademicCap,
      color: 'yellow',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your student management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <StatsCard key={idx} {...card} />
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recently Enrolled Students</h2>
        {recentStudents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No students enrolled yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Course</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">{s.student_id}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{s.course}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          s.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{formatDate(s.enrollment_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
