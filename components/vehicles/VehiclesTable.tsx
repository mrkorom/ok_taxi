'use client';

import { useState, useEffect, useMemo } from 'react';
import VehicleModal from './VehicleModal';

type Vehicle = {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  car_model?: string;
  model_year?: string;
  fuel_type: string;
  registration_date: string;
  status: string;
};

export default function VehiclesTable() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vehicles?mode=all&status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
      const data = await res.json();
      setVehicles(data.vehicles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    setCurrentPage(1); // Reset page on filter change
  }, [statusFilter, searchTerm]);

  const handleDelete = async (id: number, number: string) => {
    if (!confirm(`정말 차량 [${number}]의 정보를 삭제하시겠습니까?\n주의: 기존 배차 기록이 삭제될 수 있으므로 가급적 상태를 '폐차'로 변경해 주세요.`)) return;
    
    try {
      const res = await fetch(`/api/vehicles?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제에 실패했습니다.');
      fetchVehicles();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleNewClick = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  // Pagination Logic
  const totalPages = Math.ceil(vehicles.length / itemsPerPage);
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return vehicles.slice(start, start + itemsPerPage);
  }, [vehicles, currentPage]);

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            className="border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="전체">모든 상태</option>
            <option value="운행가능">운행가능</option>
            <option value="정비중">정비중</option>
            <option value="폐차">폐차</option>
          </select>
          
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text"
              placeholder="차량번호, 차종 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <button 
          onClick={handleNewClick}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          신규 차량 등록
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border-b border-red-100 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold">차량 번호</th>
              <th scope="col" className="px-6 py-3 font-semibold">차종 (상세/연식)</th>
              <th scope="col" className="px-6 py-3 font-semibold">연료형태</th>
              <th scope="col" className="px-6 py-3 font-semibold">현재 상태</th>
              <th scope="col" className="px-6 py-3 font-semibold">등록일자</th>
              <th scope="col" className="px-6 py-3 font-semibold text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedVehicles.length > 0 ? (
              paginatedVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 text-base">{vehicle.vehicle_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="text-gray-700 bg-gray-100 inline-block px-2 py-1 rounded text-xs font-medium border border-gray-200 w-fit">
                        {vehicle.vehicle_type}
                      </div>
                      {(vehicle.car_model || vehicle.model_year) && (
                        <div className="text-sm font-medium text-blue-800">
                          {vehicle.car_model} {vehicle.model_year && `(${vehicle.model_year})`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        vehicle.fuel_type === '전기' ? 'bg-blue-400' : 
                        vehicle.fuel_type === 'LPG' ? 'bg-orange-400' : 'bg-gray-400'
                      }`}></span>
                      <span className="font-medium text-gray-700">{vehicle.fuel_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                      vehicle.status === '운행가능' ? 'bg-green-50 text-green-700 border-green-200' :
                      vehicle.status === '정비중' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(vehicle.registration_date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(vehicle)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                      >
                        편집
                      </button>
                      <button 
                        onClick={() => handleDelete(vehicle.id, vehicle.vehicle_number)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-500">조회된 차량 정보가 없습니다.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-700">
            총 <span className="font-medium">{vehicles.length}</span>대 중 
            <span className="font-medium ml-1">{(currentPage - 1) * itemsPerPage + 1}</span>-
            <span className="font-medium ml-1">{Math.min(currentPage * itemsPerPage, vehicles.length)}</span>대 보여주는 중
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <VehicleModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={fetchVehicles} 
          vehicle={selectedVehicle} 
        />
      )}
    </div>
  );
}
