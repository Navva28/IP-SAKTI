import React from 'react';
import { Header } from './components/Header';
import { Chat } from './components/Chat';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <Chat />
    </main>
  );
}
