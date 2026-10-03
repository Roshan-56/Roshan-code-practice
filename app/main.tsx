import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@/lib/api';
import Practice from './practice';
import './globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><AuthProvider><Practice/></AuthProvider></React.StrictMode>);
