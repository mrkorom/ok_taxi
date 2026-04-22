import { useState } from 'react';

export default function VehicleCard({ vehicle, assignment, dailyStatus, drivers, assignedDriverIds = [], onAssign, onRemove, onStatusChange, onSwap, isAdmin, isCompactView }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [shift, setShift] = useState('전일');
  const [notes, setNotes] = useState('');
  
  const effectiveStatus = vehicle.status === '정비중' ? '정비' : (dailyStatus?.status || '정상');
  
  const handleAssign = () => {
    if (!selectedDriverId) return;
    if (selectedDriverId === 'REMOVE') {
      if (assignment?.id) {
        onRemove(assignment.id);
        setIsEditing(false);
      }
      return;
    }
    onAssign(vehicle.id, selectedDriverId, shift, notes);
    setIsEditing(false);
  };
  
  const handleDragStart = (e: React.DragEvent) => {
    if (!isAdmin || !assignment) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('sourceVehicleId', vehicle.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    if (isAdmin) {
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isAdmin) return;

    const sourceVehicleIdStr = e.dataTransfer.getData('sourceVehicleId');
    if (sourceVehicleIdStr) {
      const sourceVehicleId = parseInt(sourceVehicleIdStr, 10);
      if (sourceVehicleId !== vehicle.id) {
        onSwap(sourceVehicleId, vehicle.id);
      }
    }
  };
  
  return (
    <div 
      className={`bg-white hover:shadow-lg border transition-all duration-300 
        ${isCompactView ? 'p-2' : 'p-4'} 
        ${isDragOver ? 'border-dashed border-2 bg-blue-50 border-blue-500 transform scale-105' : 'border-gray-200 hover:border-blue-500'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`flex justify-between items-center border-b ${isCompactView ? 'mb-2 pb-1' : 'mb-4 pb-2'}`}>
        <div>
          <h3 className={`font-bold text-gray-800 ${isCompactView ? 'text-sm' : 'text-xl'}`}>{vehicle.vehicle_number.slice(-4)}</h3>
          <div className={`flex items-center gap-1 mt-1 ${isCompactView ? 'hidden' : ''}`}>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{vehicle.vehicle_type}</span>
            {vehicle.car_model && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                {vehicle.car_model} {vehicle.model_year && `(${vehicle.model_year})`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && vehicle.status !== '정비중' ? (
            <select
              value={effectiveStatus}
              onChange={(e) => onStatusChange(vehicle.id, e.target.value)}
              className={`rounded-full font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 appearance-none text-center ${
                isCompactView ? 'px-1 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
              } ${
                effectiveStatus === '정상' ? 'bg-green-100 text-green-700' : 
                effectiveStatus === '정비' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              <option value="정상">정상</option>
              <option value="점검">점검</option>
              <option value="부제">부제</option>
              <option value="대기">대기</option>
            </select>
          ) : (
            <div className={`rounded-full font-semibold ${
              isCompactView ? 'px-1 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
            } ${
              effectiveStatus === '정상' ? 'bg-green-100 text-green-700' : 
              effectiveStatus === '정비' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {effectiveStatus}
            </div>
          )}
        </div>
      </div>
      
      {/* Driver Information */}
      <div 
        className={`${isCompactView ? 'min-h-[40px]' : 'min-h-[100px]'} flex flex-col justify-center`}
        draggable={isAdmin && !!assignment && !isEditing}
        onDragStart={handleDragStart}
        style={{ cursor: isAdmin && assignment && !isEditing ? 'grab' : 'default' }}
      >
        {/* Non-normal status: show status badge, block assignment */}
        {effectiveStatus !== '정상' ? (
          <div className="flex flex-col items-center justify-center space-y-1 h-full py-2">
            <span className={`font-extrabold tracking-wide rounded-lg px-3 py-2 text-center ${
              effectiveStatus === '정비' ? 'bg-red-100 text-red-700 text-base' :
              effectiveStatus === '부제' ? 'bg-purple-100 text-purple-700 text-base' :
              effectiveStatus === '점검' ? 'bg-orange-100 text-orange-700 text-base' :
              effectiveStatus === '대기' ? 'bg-yellow-100 text-yellow-700 text-base' : ''
            } ${isCompactView ? 'text-[11px] px-2 py-1' : 'text-base'}`}>
              {effectiveStatus === '정비' ? '구조 · 정비 중' :
               effectiveStatus === '부제' ? '부제' :
               effectiveStatus === '점검' ? '주기 관리 · 점검 중' :
               effectiveStatus === '대기' ? '대기 차량' : effectiveStatus}
            </span>
            {!isCompactView && (
              <p className="text-xs text-gray-400 mt-1">배차가 제한된 상태입니다</p>
            )}
          </div>
        ) : assignment && !isEditing ? (
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className={`${isCompactView ? 'w-[50px] h-[50px] min-w-[50px]' : 'w-20 h-20'} bg-blue-100 rounded-[5px] flex items-center justify-center text-blue-600 font-bold overflow-hidden shadow-sm border border-gray-100`}>
                {assignment.photo_url ? (
                  <img src={assignment.photo_url} alt={assignment.driver_name} className="w-full h-full object-cover" />
                ) : (
                  <span className={isCompactView ? 'text-xl' : 'text-3xl'}>{assignment.driver_name.charAt(0)}</span>
                )}
              </div>
              <div className="text-center w-full">
                <p className={`font-bold text-gray-800 ${isCompactView ? 'text-xs' : 'text-xl'}`}>{assignment.driver_name}</p>
                <div className={`flex items-center justify-center gap-1 mt-0.5 text-gray-500 ${isCompactView ? 'text-[10px]' : 'bg-gray-50 px-2 py-0.5 rounded-full text-sm border border-gray-100'}`}>
                   {!isCompactView && (
                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                     </svg>
                   )}
                   <span>{assignment.phone}</span>
                </div>
              </div>
            </div>
            {assignment.notes && !isCompactView && (
              <p className="text-xs text-gray-500 mt-2 italic text-center bg-yellow-50 p-1.5 rounded">{assignment.notes}</p>
            )}
            
            {isAdmin && (
              <button 
                onClick={() => setIsEditing(true)}
                className={`text-blue-600 hover:text-blue-800 underline self-end ${isCompactView ? 'text-[10px] mt-0' : 'text-sm mt-2'}`}
              >
                배차 변경
              </button>
            )}
          </div>
        ) : isEditing ? (
          <div className="flex flex-col space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">기사 선택</label>
              <select 
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md py-1.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-800"
              >
                <option value="">-- 기사 선택 --</option>
                {assignment && (
                  <option value="REMOVE" className="text-red-600 font-semibold">🚫 배차 제거</option>
                )}
                {drivers
                  .filter((d: any) => !assignedDriverIds.includes(d.id))
                  .map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.driver_code}) - {d.work_type}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">근무 형태</label>
                <select 
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full text-sm border-gray-300 rounded-md py-1.5 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-800"
                >
                  <option value="전일">전일</option>
                  <option value="주간">주간</option>
                  <option value="야간">야간</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">비고</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="선택 사항"
                  className="w-full text-sm border-gray-300 rounded-md py-1.5 px-2 border shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-800"
                />
              </div>
            </div>
            
            <div className="flex flex-row space-x-2 pt-2">
              <button 
                onClick={handleAssign}
                disabled={!selectedDriverId}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                  selectedDriverId === 'REMOVE'
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
                }`}
              >
                {selectedDriverId === 'REMOVE' ? '배차 제거' : '저장'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-1.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 h-full pb-1">
            {!isCompactView && (
              <div className="text-gray-300 bg-gray-50 rounded-full p-3 border-2 border-dashed border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <p className={`text-gray-500 font-medium ${isCompactView ? 'text-[10px]' : 'text-sm'}`}>
              {effectiveStatus === '정비' ? '정비 중' :
               effectiveStatus === '부제' ? '부제 (휴무)' :
               effectiveStatus === '점검' ? '점검 중' :
               effectiveStatus === '대기' ? '대기 차량' : '미배차'}
            </p>
            
            {isAdmin && !isCompactView && (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-gray-800 text-white px-4 py-1.5 rounded-md text-sm hover:bg-black transition-colors shadow-sm"
              >
                배차 지정하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
