import { useState, useEffect } from 'react';

type Driver = {
  id: number;
  driver_code: string;
  name: string;
  phone: string;
  status: string;
  role: string;
  work_type: string;
  start_date: string;
  photo_url?: string;
};

type DriverModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  driver: Driver | null;
};

export default function DriverModal({ isOpen, onClose, onSave, driver }: DriverModalProps) {
  const [formData, setFormData] = useState({
    driver_code: '',
    name: '',
    phone: '',
    status: '운행',
    role: 'driver',
    work_type: '일차',
    start_date: new Date().toISOString().split('T')[0],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (driver) {
      setFormData({
        driver_code: driver.driver_code,
        name: driver.name,
        phone: driver.phone,
        status: driver.status,
        role: driver.role,
        work_type: driver.role === 'driver' ? (driver.work_type || '일차') : '',
        start_date: driver.start_date ? new Date(driver.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
      setPhotoPreview(driver.photo_url || null);
    } else {
      setFormData({
        driver_code: '',
        name: '',
        phone: '',
        status: '운행',
        role: 'driver',
        work_type: '일차',
        start_date: new Date().toISOString().split('T')[0],
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setError('');
  }, [driver, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = '/api/drivers';
      const method = driver ? 'PUT' : 'POST';
      
      const submitData = new FormData();
      if (driver) submitData.append('id', driver.id.toString());
      Object.entries(formData).forEach(([key, value]) => {
        // Only send work_type if role is driver
        if (key === 'work_type' && formData.role !== 'driver') {
            submitData.append(key, '');
        } else {
            submitData.append(key, value);
        }
      });
      
      if (photoFile) {
        submitData.append('photo', photoFile);
      }

      const res = await fetch(url, {
        method,
        body: submitData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '저장 중 오류가 발생했습니다.');
      }

      onSave();
      onClose();
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
            {driver ? '기사 정보 수정' : '신규 기사 등록'}
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
            {/* Photo Upload Area */}
            <div className="flex items-center space-x-6 mb-6">
              <div className="h-24 w-24 rounded-full bg-gray-100 flex-shrink-0 relative overflow-hidden ring-4 ring-gray-50 flex items-center justify-center border border-gray-200">
                {photoPreview ? (
                  <img src={photoPreview} alt="기사 사진 미리보기" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">프사 (기사 사진)</label>
                <div className="flex items-center">
                  <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <span>사진 업로드</span>
                    <input type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                  </label>
                  <span className="ml-3 text-xs text-gray-500">
                    JPG, PNG 최대 2MB (배차 표에 출력)
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">고유코드 (사번)</label>
                <input
                  type="text"
                  name="driver_code"
                  value={formData.driver_code}
                  onChange={handleChange}
                  disabled={!!driver}
                  required
                  placeholder="예: 9001"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처 (로그인 ID)</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="01012345678"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="운행">운행</option>
                  <option value="휴직">휴직</option>
                  <option value="퇴사">퇴사</option>
                </select>
              </div>
              <div>
                {formData.role === 'driver' && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">운용 방식</label>
                    <select
                      name="work_type"
                      value={formData.work_type}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="일차">일차</option>
                      <option value="격일A">격일A</option>
                      <option value="격일B">격일B</option>
                    </select>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">고용/운용 시작일</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시스템 권한</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="driver">기사 (Driver)</option>
                  <option value="manager">매니저 (Manager)</option>
                  <option value="admin">최고관리자 (Admin)</option>
                </select>
              </div>
            </div>
            {!driver && (
              <p className="text-xs text-gray-500 mt-2 italic">
                * 신규 생성 시 초기 비밀번호는 <strong>1234</strong>로 설정됩니다.
              </p>
            )}
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
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
