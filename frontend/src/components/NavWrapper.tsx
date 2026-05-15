'use client';

import Nav from './Nav';

interface NavWrapperProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalSignals: number;
  highSig: number;
  activeSources: number;
  lastUpdatedIso: string | null;
}

export default function NavWrapper(props: NavWrapperProps) {
  return <Nav {...props} />;
}
