import { useState } from 'react';
import { customFetch } from '../../utils/api/api';

/**
 * Custom hook to encapsulate social graph relationship transitions
 * @param {string} targetUserId - The ID of the user being interacted with
 * @param {string} initialStatus - The starting relationship status string
 */
export function useRelationship(targetUserId, initialStatus = 'NOT_FOLLOWING') {
  const [relationship, setRelationship] = useState(initialStatus);
  const [isProcessing, setIsProcessing] = useState(false);

  const executeRelationshipAction = async (method, nextStatus) => {
    if (isProcessing) return false;

    // Resolve structural endpoint pathing based on standard REST design constraints
    let endpoint = `/api/users/${targetUserId}/cancel`;
    if (method === 'POST') endpoint = `/api/users/${targetUserId}/follow`;
    if (method === 'PATCH') endpoint = `/api/users/${targetUserId}/accept`;

    try {
      setIsProcessing(true);
      const response = await customFetch(endpoint, { method });
      
      if (!response.ok) throw new Error('Network transaction rejected by server.');
      
      setRelationship(nextStatus);
      return true;
    } catch (err) {
      alert(`Action failed: ${err.message}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    relationship,
    setRelationship,
    isProcessing,
    executeRelationshipAction
  };
}
