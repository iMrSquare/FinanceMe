'use client';
import { useEffect } from 'react';
import { useVersionNotification } from './VersionProvider';

export default function VersionSeenMarker() {
  const { dismiss } = useVersionNotification();
  useEffect(() => { dismiss(); }, [dismiss]);
  return null;
}
