import React, { useState, useEffect } from 'react';
import { patientService, triageService } from '../api';
import { useQueue } from '../contexts/QueueContext';

const TriagePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [triageData, setTriageData] = useState({
    heart_rate: '',
    blood_pressure: '',
    pain_level: '5',
    symptoms: '',
  });
  const [patientData, setPatientData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    medical_record_number: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { refreshQueue } = useQueue();

  const searchPatients = async () => {
    if (searchQuery.length < 2) {
      setSearchError('Please enter at least 2 characters to search');
      return;
    }
    
    setIsSearching(true);
    setSearchError('');
    
    try {
      const data = await patientService.search(searchQuery);
      setPatients(data);
      if (data.length === 0) {
        setSearchError('No patients found. Consider creating a new patient.');
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchError('Error searching for patients');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setPatients([]);
    setSearchQuery(`${patient.first_name} ${patient.last_name} (${patient.medical_record_number})`);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!patientData.first_name) newErrors.first_name = 'First name is required';
    if (!patientData.last_name) newErrors.last_name = 'Last name is required';
    if (!patientData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!patientData.medical_record_number) newErrors.medical_record_number = 'Medical record number is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const createdPatient = await patientService.create(patientData);
      setSelectedPatient(createdPatient);
      setSearchQuery(`${createdPatient.first_name} ${createdPatient.last_name} (${createdPatient.medical_record_number})`);
      setIsCreatingPatient(false);
      setErrors({});
      setPatientData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        medical_record_number: '',
      });
    } catch (error) {
      console.error('Error creating patient:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
    } else {
        setErrors({ general: 'Error creating patient' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleSubmitTriage = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setErrors({ general: 'Please select a patient first' });
      return;
    }
    
    // Validation
    const newErrors = {};
    if (!triageData.heart_rate) newErrors.heart_rate = 'Heart rate is required';
    if (!triageData.blood_pressure) newErrors.blood_pressure = 'Blood pressure is required';
    if (!triageData.symptoms) newErrors.symptoms = 'Symptoms are required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const data = await triageService.create({
        patient_id: selectedPatient.id,
        ...triageData,
        heart_rate: parseInt(triageData.heart_rate),
        pain_level: parseInt(triageData.pain_level),
      });
      
      setSuccessMessage(`Patient ${selectedPatient.first_name} ${selectedPatient.last_name} has been added to the queue.`);
      setTriageData({
        heart_rate: '',
        blood_pressure: '',
        pain_level: '5',
        symptoms: '',
      });
      setSelectedPatient(null);
      setSearchQuery('');
      refreshQueue();
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error submitting triage:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Error submitting triage data' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value) {
      setPatients([]);
      setSelectedPatient(null);
    }
  };
 
  const handleTriageInputChange = (e) => {
    const { name, value } = e.target;
    setTriageData({
      ...triageData,
      [name]: value,
    });
  };
 
  const handlePatientInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData({
      ...patientData,
      [name]: value,
    });
  };
 
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Patient Triage</h1>
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{successMessage}</p>
        </div>
      )}
      
      {errors.general && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{errors.general}</p>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Find Patient</h2>
        
        <div className="flex items-end gap-4 mb-2">
          <div className="flex-grow">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="searchQuery">
              Search by name or medical record number
            </label>
            <input
              id="searchQuery"
              type="text"
              className="form-input"
              placeholder="Search for patients..."
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary h-10"
            onClick={searchPatients}
            disabled={isSearching || searchQuery.length < 2}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            className="btn btn-secondary h-10"
            onClick={() => setIsCreatingPatient(true)}
          >
            New Patient
          </button>
        </div>
        
        {searchError && <p className="text-red-500 text-sm mt-1">{searchError}</p>}
        
        {patients.length > 0 && (
          <div className="mt-4 border rounded-md max-h-48 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {patients.map((patient) => (
                <li 
                  key={patient.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                  <p className="text-sm text-gray-600">
                    MRN: {patient.medical_record_number} | DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {isCreatingPatient && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Create New Patient</h2>
            <button 
              type="button" 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsCreatingPatient(false)}
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={handleCreatePatient}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="first_name">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  className={`form-input ${errors.first_name ? 'border-red-500' : ''}`}
                  value={patientData.first_name}
                  onChange={handlePatientInputChange}
                />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="last_name">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  className={`form-input ${errors.last_name ? 'border-red-500' : ''}`}
                  value={patientData.last_name}
                  onChange={handlePatientInputChange}
                />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date_of_birth">
                  Date of Birth
                </label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  className={`form-input ${errors.date_of_birth ? 'border-red-500' : ''}`}
                  value={patientData.date_of_birth}
                  onChange={handlePatientInputChange}
                />
                {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="medical_record_number">
                  Medical Record Number
                </label>
                <input
                  id="medical_record_number"
                  name="medical_record_number"
                  type="text"
                  className={`form-input ${errors.medical_record_number ? 'border-red-500' : ''}`}
                  value={patientData.medical_record_number}
                  onChange={handlePatientInputChange}
                />
                {errors.medical_record_number && <p className="text-red-500 text-xs mt-1">{errors.medical_record_number}</p>}
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Patient'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {selectedPatient && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Triage Assessment for {selectedPatient.first_name} {selectedPatient.last_name}</h2>
          
          <form onSubmit={handleSubmitTriage}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="heart_rate">
                  Heart Rate (bpm)
                </label>
                <input
                  id="heart_rate"
                  name="heart_rate"
                  type="number"
                  min="0"
                  max="250"
                  className={`form-input ${errors.heart_rate ? 'border-red-500' : ''}`}
                  value={triageData.heart_rate}
                  onChange={handleTriageInputChange}
                />
                {errors.heart_rate && <p className="text-red-500 text-xs mt-1">{errors.heart_rate}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="blood_pressure">
                  Blood Pressure (e.g., 120/80)
                </label>
                <input
                  id="blood_pressure"
                  name="blood_pressure"
                  type="text"
                  className={`form-input ${errors.blood_pressure ? 'border-red-500' : ''}`}
                  value={triageData.blood_pressure}
                  onChange={handleTriageInputChange}
                  placeholder="e.g., 120/80"
                />
                {errors.blood_pressure && <p className="text-red-500 text-xs mt-1">{errors.blood_pressure}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pain_level">
                  Pain Level (1-10)
                </label>
                <input
                  id="pain_level"
                  name="pain_level"
                  type="range"
                  min="1"
                  max="10"
                  className="w-full"
                  value={triageData.pain_level}
                  onChange={handleTriageInputChange}
                />
                <div className="flex justify-between text-xs">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                  <span>8</span>
                  <span>9</span>
                  <span>10</span>
                </div>
                <p className="text-center mt-1">Selected: {triageData.pain_level}</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="symptoms">
                  Symptoms and Notes
                </label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  rows="4"
                  className={`form-input ${errors.symptoms ? 'border-red-500' : ''}`}
                  value={triageData.symptoms}
                  onChange={handleTriageInputChange}
                  placeholder="Describe symptoms and any other relevant information..."
                ></textarea>
                {errors.symptoms && <p className="text-red-500 text-xs mt-1">{errors.symptoms}</p>}
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding to Queue...' : 'Add to Queue'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
 };
 
 export default TriagePage;