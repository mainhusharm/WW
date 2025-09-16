import api from '.';

export const logActivity = async (activity_type: string, activity_details: any) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const body = {
      customerId: user._id,
      activity_type,
      activity_details,
      ip_address: '127.0.0.1', // Placeholder
    };
    await api.post('/api/activity', body);
  } catch (err) {
    console.error('Failed to log activity', err);
  }
};
