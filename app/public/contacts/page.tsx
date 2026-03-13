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

type SortKey = 'driver_code' | 'name' | 'phone' | 'work_type';
type SortDir = 'asc' | 'desc';

export default function PublicContactsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTableView, setIsTableView] = useState(false);

  // 정렬 상태 (기본: 사번 내림차순)
  const [sortKey, setSortKey] = useState<SortKey>('driver_code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return (
      <svg className="w-3 h-3 text-gray-400 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
    return sortDir === 'desc' ? (
      <svg className="w-3 h-3 text-blue-500 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-blue-500 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch('/api/drivers?mode=active');
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

  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    const valA = (a[sortKey] ?? '').toString().toLowerCase();
    const valB = (b[sortKey] ?? '').toString().toLowerCase();
    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const formatPhone = (phone: string) =>
    phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <div className="bg-white shadow-sm border-b sticky top-16 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">연락망</h1>
              <p className="text-sm text-gray-500 mt-1">현재 운행 중인 전체 동료 기사의 연락처 목록</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* 검색 */}
              <div className="relative flex-1 md:w-72">
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

              {/* 카드뷰 전용 정렬 선택 */}
              {!isTableView && (
                <select
                  value={`${sortKey}_${sortDir}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    const idx = val.lastIndexOf('_');
                    const key = val.substring(0, idx) as SortKey;
                    const dir = val.substring(idx + 1) as SortDir;
                    setSortKey(key);
                    setSortDir(dir);
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500 flex-shrink-0"
                >
                  <option value="driver_code_asc">사번 ↑ (올림)</option>
                  <option value="driver_code_desc">사번 ↓ (내림)</option>
                  <option value="name_asc">이름 ↑ (가나다)</option>
                  <option value="name_desc">이름 ↓ (역순)</option>
                  <option value="work_type_asc">운용방식 ↑</option>
                  <option value="work_type_desc">운용방식 ↓</option>
                </select>
              )}

              {/* 보기 전환 토글 */}
              <button
                onClick={() => setIsTableView(!isTableView)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  isTableView
                    ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title={isTableView ? '카드 보기' : '간략히 보기'}
              >
                {isTableView ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    카드 보기
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    간략히 보기
                  </>
                )}
              </button>
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
        ) : isTableView ? (
          /* ── 테이블 뷰 ── */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">
                총 <span className="font-bold text-blue-600">{filteredDrivers.length}</span>명
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b border-gray-200">
                  <tr>
                    {([
                      { key: 'driver_code' as SortKey, label: '사번' },
                      { key: 'name' as SortKey, label: '이름' },
                      { key: 'phone' as SortKey, label: '연락처' },
                      { key: 'work_type' as SortKey, label: '운용방식' },
                    ]).map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-5 py-3 font-semibold cursor-pointer select-none hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort(key)}
                      >
                        {label}<SortIcon col={key} />
                      </th>
                    ))}
                    <th className="px-5 py-3 font-semibold">전화</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                          {driver.driver_code}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {driver.photo_url ? (
                              <Image src={driver.photo_url} alt={driver.name} width={32} height={32} className="object-cover w-full h-full" />
                            ) : (
                              driver.name.charAt(0)
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{driver.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{formatPhone(driver.phone)}</td>
                      <td className="px-5 py-3">
                        {driver.work_type && (
                          <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded border border-purple-100 font-medium">
                            {driver.work_type}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <a
                          href={`tel:${driver.phone}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          전화
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── 카드 뷰 (기존) ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedDrivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-5 flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 relative rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-inner flex items-center justify-center">
                  {driver.photo_url ? (
                    <Image src={driver.photo_url} alt={driver.name} fill className="object-cover" />
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
