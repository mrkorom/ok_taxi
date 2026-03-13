import { useState, useEffect } from 'react';

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

type VehicleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  vehicle: Vehicle | null;
};

export default function VehicleModal({ isOpen, onClose, onSave, vehicle }: VehicleModalProps) {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '중형',
    car_model: '',
    model_year: '',
    fuel_type: 'LPG',
    status: '운행가능',
    registration_date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_number: vehicle.vehicle_number,
        vehicle_type: vehicle.vehicle_type || '중형',
        car_model: vehicle.car_model || '',
        model_year: vehicle.model_year || '',
        fuel_type: vehicle.fuel_type || 'LPG',
        status: vehicle.status || '운행가능',
        registration_date: vehicle.registration_date 
          ? new Date(vehicle.registration_date).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        vehicle_number: '',
        vehicle_type: '중형',
        car_model: '',
        model_year: '',
        fuel_type: 'LPG',
        status: '운행가능',
        registration_date: new Date().toISOString().split('T')[0],
      });
    }
    setError('');
  }, [vehicle, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = '/api/vehicles';
      const method = vehicle ? 'PUT' : 'POST';
      const body = vehicle ? { ...formData, id: vehicle.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '저장 중 오류가 발생했습니다.');
      }

      onSave(); // Refresh data
      onClose(); // Close modal
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">
            {vehicle ? '차량 정보 수정' : '신규 차량 등록'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">차량 번호</label>
              <input
                type="text"
                name="vehicle_number"
                value={formData.vehicle_number}
                onChange={handleChange}
                required
                placeholder="예: 경남20바1201"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">차종 분류</label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="중형">중형</option>
                  <option value="대형">대형</option>
                  <option value="모범">모범</option>
                  <option value="전기차">전기차</option>
                  <option value="승합">승합</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 차종 (선택)</label>
                <input
                  type="text"
                  name="car_model"
                  value={formData.car_model}
                  onChange={handleChange}
                  placeholder="예: 쏘나타, K5"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연식 (선택)</label>
                <input
                  type="text"
                  name="model_year"
                  value={formData.model_year}
                  onChange={handleChange}
                  placeholder="예: 2023"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
              
            <div className="grid grid-cols-2 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연료 형태</label>
                <select
                  name="fuel_type"
                  value={formData.fuel_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LPG">LPG</option>
                  <option value="전기">전기</option>
                  <option value="가솔린">가솔린</option>
                  <option value="수소">수소</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">현재 상태</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="운행가능">운행가능</option>
                  <option value="정비중">정비중</option>
                  <option value="폐차">폐차</option>
                  <option value="말소">말소</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최초 등록일</label>
                <input
                  type="date"
                  name="registration_date"
                  value={formData.registration_date}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2 italic">
              * 상태를 <strong>'폐차'</strong>, <strong>'말소'</strong> 또는 <strong>'정비중'</strong>으로 변경하더라도, 기존의 배차 기록은 보존됩니다. 단, 신규 배차 시 선택목록에서는 제외됩니다.
            </p>
          </div>

          <div className="mt-8 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
