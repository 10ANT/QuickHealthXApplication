import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doctorService } from '../api';
import { useQueue } from '../contexts/QueueContext';

const DoctorPage = () => {
  const { currentUser } = useAuth();
  const { refreshQueue, connected } = useQueue();
  const [isAvailable, setIsAvailable] = useState(currentUser?.available || false);
  const [currentSession, setCurrentSession] = useState(null);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCurrentSession = async () => {
    setLoading(true);
    try {
      const response = await doctorService.getCurrentSession();
      setCurrentSession(response);
    } catch (error) {
      // Don't show error for 404 (no current session)
      if (error.response?.status !== 404) {
        console.error('Error fetching current session:', error);
        setError('Failed to load current session data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentSession();
  }, []);

  const handleToggleAvailability = async () => {
    setActionLoading(true);
    try {
      const response = await doctorService.toggleAvailability();
      setIsAvailable(response.available);
      setSuccessMessage(response.available ? 
        'You are now marked as available for patients' : 
        'You are now marked as unavailable for patients');
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Try to refresh the queue
      if (connected) {
        refreshQueue();
      }
      
      // If doctor became available, try to get a patient
      if (response.available) {
        await handleGetNextPatient();
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      setError('Failed to update availability');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGetNextPatient = async () => {
    if (currentSession) {
      setError('You already have an active session. Complete it before getting a new patient.');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await doctorService.assignPatient();
      setCurrentSession(response);
      setIsAvailable(false);
      setSuccessMessage('New patient assigned to you');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh queue after getting a patient
      if (connected) {
        refreshQueue();
      }
    } catch (error) {
      console.error('Error getting next patient:', error);
      setError('Failed to assign patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!currentSession) {
      setError('No active session to complete');
      return;
    }
    
    if (!medicalNotes.trim()) {
      setError('Please enter medical notes before completing the session');
      return;
    }
    
    setActionLoading(true);
    try {
      await doctorService.completeSession(currentSession.id, medicalNotes);
      setCurrentSession(null);
      setMedicalNotes('');
      setSuccessMessage('Session completed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh queue after completing a session
      if (connected) {
        refreshQueue();
      }
    } catch (error) {
      console.error('Error completing session:', error);
      setError('Failed to complete session');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <p className="text-gray-500">Loading doctor panel...</p>
    </div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Doctor Panel</h1>
      
      {!connected && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p>WebSocket connection unavailable. Queue updates may be delayed.</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Availability</h2>
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="mr-4">{isAvailable ? 'Available' : 'Busy'}</span>
            <button
              className={`btn ${isAvailable ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleToggleAvailability}
              disabled={actionLoading}
            >
              {actionLoading ? 'Updating...' : isAvailable ? 'Set Unavailable' : 'Set Available'}
            </button>
          </div>
        </div>
      </div>
      
      {!currentSession ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">No Active Patient Session</h2>
            <p className="text-gray-600 mb-6">You don't have any active patient sessions. Get the next patient in queue or mark yourself as available.</p>
            <button
              className="btn btn-primary"
              onClick={handleGetNextPatient}
              disabled={actionLoading || !isAvailable}
            >
              {actionLoading ? 'Getting Patient...' : 'Get Next Patient'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Current Patient</h2>
            <div className="text-sm text-gray-600">
              Session started: {new Date(currentSession.start_time).toLocaleTimeString()}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-gray-500 text-sm">Patient</h3>
                <p className="font-medium">{currentSession.patient.first_name} {currentSession.patient.last_name}</p>
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Medical Record Number</h3>
                <p className="font-medium">{currentSession.patient.medical_record_number}</p>
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Date of Birth</h3>
                <p className="font-medium">{currentSession.patient.date_of_birth && new Date(currentSession.patient.date_of_birth).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Triage Information</h3>
            {currentSession.patient.triages && currentSession.patient.triages.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="text-gray-500 text-sm">Heart Rate</h4>
                    <p className="font-medium">{currentSession.patient.triages[0].heart_rate} bpm</p>
                  </div>
                  <div>
                    <h4 className="text-gray-500 text-sm">Blood Pressure</h4>
                    <p className="font-medium">{currentSession.patient.triages[0].blood_pressure}</p>
                  </div>
                  <div>
                    <h4 className="text-gray-500 text-sm">Pain Level</h4>
                    <p className="font-medium">{currentSession.patient.triages[0].pain_level}/10</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-gray-500 text-sm">Symptoms</h4>
                  <p className="mt-1">{currentSession.patient.triages[0].symptoms}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 italic">No triage information available</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="medical_notes">
              Medical Notes
            </label>
            <textarea
              id="medical_notes"
              className="form-input w-full p-2 border rounded"
              rows="5"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="Enter your medical notes, diagnosis, and treatment plan..."
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              onClick={handleCompleteSession}
              disabled={actionLoading || !medicalNotes.trim()}
            >
              {actionLoading ? 'Completing...' : 'Complete Session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPage;