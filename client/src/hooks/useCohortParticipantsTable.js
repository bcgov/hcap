import { useState } from 'react';

export const useCohortParticipantsTable = (rows = []) => {
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const handleRequestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return {
    selectedParticipants,
    setSelectedParticipants,
    sortConfig,
    handleRequestSort,
  };
};
