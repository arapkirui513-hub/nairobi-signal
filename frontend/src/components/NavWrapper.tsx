'use client';
import { useState } from 'react';
import Nav from './Nav';

export default function NavWrapper() {
  const [active, setActive] = useState('FEED');
  return <Nav activeTab={active} onTabChange={setActive} />;
}
