'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type Driver = {
  id: number;
  driver_code: string;
  name: string;
  phone: string;
  photo_url?: string;
  work_type?: string;
};

export default function PublicContactsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch('/api/drivers?mode=active'); // Only active drivers
        if (res.ok) {
          const data = await res.json();
          setDrivers(data.drivers);
        }
      } catch (error) {
        console.error('Failed to fetch drivers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const filteredDrivers = drivers.filter(driver => 
    driver.name.includes(searchTerm) || driver.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="bg-white shadow-sm border-b sticky top-16 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">연락망</h1>
              <p className="text-sm text-gray-500 mt-1">현재 운행 중인 전체 동료 기사의 연락처 목록</p>
            </div>
            
            <div className="relative w-full md:w-72">
              <input 
                type="text"
                placeholder="이름 또는 전화번호 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 border bg-gray-50 text-gray-900"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-lg">검색된 동료 기사가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredDrivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-5 flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 relative rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-inner flex items-center justify-center">
                  {driver.photo_url ? (
                    <Image
                      src={driver.photo_url}
                      alt={driver.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-400">{driver.name.charAt(0)}</span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">{driver.name}</h3>
                
                <div className="flex items-center gap-1.5 justify-center mt-2 mb-3 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium w-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${driver.phone}`} className="hover:underline">{driver.phone}</a>
                </div>

                <div className="flex gap-2 w-full pt-3 border-t border-gray-100">
                  <span className="flex-1 bg-gray-50 text-gray-600 text-xs px-2 py-1.5 rounded text-center border border-gray-200">
                    사번: {driver.driver_code}
                  </span>
                  {driver.work_type && (
                    <span className="flex-1 bg-purple-50 text-purple-700 text-xs px-2 py-1.5 rounded font-medium text-center border border-purple-100">
                      {driver.work_type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
