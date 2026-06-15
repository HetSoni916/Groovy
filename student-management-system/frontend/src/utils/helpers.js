export const COURSES = [
  'Computer Science',
  'Information Technology',
  'Data Science',
  'Software Engineering',
  'Cybersecurity',
  'Artificial Intelligence',
  'Web Development',
  'Network Engineering',
  'Database Administration',
  'Cloud Computing',
];

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.errors?.[0]?.msg ||
  err?.message ||
  'Something went wrong';
