import React from 'react';
import BrutalScreen from '@/src/components/BrutalScreen';
import SavingsGoalsScreen from '@/src/screens/SavingsGoalsScreen';

export default function SavingsTabScreen() {
  return (
    <BrutalScreen>
      <SavingsGoalsScreen showAddButton />
    </BrutalScreen>
  );
}
