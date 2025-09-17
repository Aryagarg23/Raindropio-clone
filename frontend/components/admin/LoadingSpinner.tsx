import React from 'react';
import { GlobalLoadingState } from '../shared/GlobalLoadingState';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <GlobalLoadingState message={message} />
  );
}