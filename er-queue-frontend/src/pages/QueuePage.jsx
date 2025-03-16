import React from 'react';
import { useQueue } from '../contexts/QueueContext';

const QueuePage = () => {
  const { queue, loading, error } = useQueue();

  const calculateEstimatedWaitTime = (position, urgencyScore) => {
    // Simple wait time calculation: base time + position - urgency factor
    // Higher urgency = shorter wait
    const baseTimePerPatient = 15; // minutes
    const urgencyFactor = Math.floor(urgencyScore / 5);
    
    const estimatedMinutes = (position + 1) * baseTimePerPatient - urgencyFactor;
    
    if (estimatedMinutes <= 0) return 'Immediate';
    if (estimatedMinutes < 60) return `${estimatedMinutes} minutes`;
    
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min` : ''}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading queue data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient Queue</h1>
        <div className="flex items-center">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            <span className="font-bold">Last updated:</span> {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
      {queue.length === 0 ? (
       <div className="bg-white shadow-md rounded-lg p-6 text-center">
         <p className="text-gray-500">No patients currently in the queue.</p>
       </div>
     ) : (
       <div className="bg-white shadow-md rounded-lg overflow-hidden">
         <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Position
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Patient
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Urgency Score
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Wait Time
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Entry Time
               </th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {queue.map((entry, index) => (
               <tr 
                 key={entry.id}
                 className={entry.urgency_score > 15 ? 'bg-red-50' : ''}
               >
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   {index + 1}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-medium text-gray-900">
                     {entry.triage.patient.first_name} {entry.triage.patient.last_name}
                   </div>
                   <div className="text-sm text-gray-500">
                     MRN: {entry.triage.patient.medical_record_number}
                   </div>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                     ${entry.urgency_score > 15 
                       ? 'bg-red-100 text-red-800' 
                       : entry.urgency_score > 10 
                         ? 'bg-yellow-100 text-yellow-800' 
                         : 'bg-green-100 text-green-800'}`}
                   >
                     {entry.urgency_score}
                   </span>
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {calculateEstimatedWaitTime(index, entry.urgency_score)}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {new Date(entry.entry_time).toLocaleTimeString()}
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     )}
     
     <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
       <h3 className="text-lg font-semibold text-blue-800 mb-2">About Urgency Scores</h3>
       <p className="text-sm text-blue-700 mb-2">
         Patients are sorted by urgency and entry time. Higher scores indicate more urgent cases.
       </p>
       <ul className="text-sm text-blue-700 list-disc list-inside">
         <li>High urgency (16+): Immediate attention needed (red)</li>
         <li>Medium urgency (11-15): Attend soon (yellow)</li>
         <li>Standard urgency (1-10): Regular queue (green)</li>
       </ul>
     </div>
   </div>
 );
};

export default QueuePage;