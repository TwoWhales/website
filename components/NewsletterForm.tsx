import React, { useState } from 'react';

export const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'submitting'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('submitting');
    // Simulate API call
    setTimeout(() => {
      console.log(`Signed up: ${email}`);
      setStatus('success');
      setEmail('');
    }, 1000);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 mb-8 p-4 border-2 border-dashed border-zinc-800 text-center">
      <h3 className="text-xl font-bold mb-4 uppercase tracking-tighter">
        Join the Horde (Newsletter)
      </h3>
      
      {status === 'success' ? (
        <div className="p-4 bg-zinc-900 text-green-500 font-bold border border-green-900">
          > EMAIL REGISTERED. WELCOME.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="email" className="sr-only">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="ENTER_EMAIL_ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-600 p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono"
              required
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-zinc-900 border border-zinc-600 p-3 text-white uppercase hover:bg-white hover:text-black transition-colors font-bold disabled:opacity-50"
            >
              {status === 'submitting' ? 'PROCESSING...' : 'SUBSCRIBE'}
            </button>
        </form>
      )}
      
      <p className="text-xs text-zinc-600 mt-4">
        No spam. Only updates on new creations.
      </p>
    </div>
  );
};
