// src/api/doctorService.js
const mockCurrentSession = null; // Set to null to simulate no active session

export const doctorService = {
  getCurrentSession: async () => {
    // Simulate the API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (mockCurrentSession) {
          resolve(mockCurrentSession);
        } else {
          const error = new Error('Not found');
          error.response = { status: 404 };
          reject(error);
        }
      }, 500);
    });
  },
  
  toggleAvailability: async () => {
    // Simulate the API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ available: true });
      }, 500);
    });
  },
  
  assignPatient: async () => {
    // Simulate the API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'session123',
          start_time: new Date().toISOString(),
          patient: {
            first_name: 'John',
            last_name: 'Doe',
            medical_record_number: 'MRN12345',
            date_of_birth: '1990-01-01',
            triages: [
              {
                heart_rate: 75,
                blood_pressure: '120/80',
                pain_level: 3,
                symptoms: 'Headache and mild fever'
              }
            ]
          }
        });
      }, 500);
    });
  },
  
  completeSession: async (sessionId, notes) => {
    // Simulate the API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }
};