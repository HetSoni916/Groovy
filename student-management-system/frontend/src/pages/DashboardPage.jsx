import { useEffect, useState } from 'react';
import { Users, UserCheck, UserPlus, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { studentService } from '../services/studentService';
import { toast } from 'react-toastify';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService.getStats()
      .then(({ data }) => setStats(data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Total Students', value: stats?.total, icon: Users, color: 'bg-blue-500', subtitle: 'All enrolled students' },
    { title: 'Active Students', value: stats?.active, icon: UserCheck, color: 'bg-green-500', subtitle: 'Currently active' },
    { title: 'New This Month', value: stats?.new_this_month, icon: UserPlus, color: 'bg-purple-500', subtitle: 'New admissions' },
    { title: 'Inactive Students', value: stats ? (stats.total - stats.active) : null, icon: BookOpen, color: 'bg-orange-500', subtitle: 'Inactive enrollment' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} value={loading ? null : card.value} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/students/new" className="btn-primary">
            + Add New Student
          </Link>
          <Link to="/students" className="btn-secondary">
            View All Students
          </Link>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6">
        <h3 className="text-xl font-bold mb-1">Welcome to Student Management System</h3>
        <p className="text-primary-200 text-sm">
          Manage student records, track enrollments, and monitor academic progress from one place.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
