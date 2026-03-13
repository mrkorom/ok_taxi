'use client';

import { useState } from 'react';
import AssignmentGrid from '@/components/assignments/AssignmentGrid';

export default function PublicAssignmentsPage() {
  const getTodayFormatted = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayFormatted());

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const changeDateByDays = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const displayDate = new Date(selectedDate).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="bg-white shadow-sm border-b sticky top-16 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">배차표</h1>
              <p className="text-sm text-gray-500 mt-1">로그인 없이 확인하는 일일 배차 현황 (읽기 전용)</p>
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

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AssignmentGrid date={selectedDate} isAdmin={false} />
      </div>
    </div>
  );
}
