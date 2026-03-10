'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AssignmentGrid from '@/components/assignments/AssignmentGrid';

export default function DispatchPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Format date correctly YYYY-MM-DD for local time
  const getTodayFormatted = () => {
    const today = new Date();
    // Use local time instead of UTC to prevent timezone issues
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayFormatted());

  useEffect(() => {
    // Check auth status
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        
        const data = await res.json();
        // Allow both admin and manager to edit assignments
        setIsAdmin(data.user?.role === 'admin' || data.user?.role === 'manager');
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  // Move date by 1 day
  const changeDateByDays = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    
    setSelectedDate(`${year}-${month}-${day}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Format date for display (e.g., 2026년 3월 6일 금요일)
  const displayDate = new Date(selectedDate).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      {/* Header section with Date Picker */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">일일 배차 관리</h1>
              <p className="text-sm text-gray-500 mt-1">차량 번호별 기사 배차 현황</p>
            </div>
            
            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <button 
                onClick={() => changeDateByDays(-1)}
                className="p-2 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="이전 날짜"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex flex-col items-center px-4">
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="font-medium text-gray-800 bg-transparent border-none focus:ring-0 p-0 text-center cursor-pointer"
                />
                <span className="text-xs text-gray-500 mt-1">{displayDate}</span>
              </div>
              
              <button 
                onClick={() => changeDateByDays(1)}
                className="p-2 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="다음 날짜"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button 
                onClick={() => setSelectedDate(getTodayFormatted())}
                className="ml-2 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                오늘
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AssignmentGrid date={selectedDate} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
