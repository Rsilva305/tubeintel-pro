'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestBillingLink() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Dropdown
      </button>

      {dropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded">
          <button 
            onClick={() => {
              setDropdownOpen(false);
              window.location.href = '/api/stripe/create-portal';
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Billing (Test)
          </button>
        </div>
      )}
    </div>
  );
} 