export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

export const getGenderColor = (gender) => {
  switch (gender) {
    case 'Male':
      return 'bg-blue-100 text-blue-800';
    case 'Female':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-purple-100 text-purple-800';
  }
};

export const getStatusColor = (status) => {
  return status === 'Active'
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';
};
