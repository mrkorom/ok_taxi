import { useState, useEffect } from 'react';
import VehicleCard from './VehicleCard';

export default function AssignmentGrid({ date, isAdmin }: any) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [dailyStatuses, setDailyStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCompactView, setIsCompactView] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch vehicles, drivers, assignments, and daily statuses in parallel
      const [vehiclesRes, driversRes, assignmentsRes, statusesRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/drivers'),
        fetch(`/api/assignments?date=${date}`),
        fetch(`/api/daily-vehicle-status?date=${date}`)
      ]);
      
      const vehiclesData = await vehiclesRes.json();
      const driversData = await driversRes.json();
      const assignmentsData = await assignmentsRes.json();
      const statusesData = await statusesRes.json();
      
      if (vehiclesData.vehicles) setVehicles(vehiclesData.vehicles);
      if (driversData.drivers) setDrivers(driversData.drivers);
      if (assignmentsData.assignments) setAssignments(assignmentsData.assignments);
      if (statusesData.statuses) setDailyStatuses(statusesData.statuses);
      
    } catch (error) {
      console.error('Error fetching dispatch data:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  const handleAssign = async (vehicleId: number, driverId: number, shift: string, notes: string) => {
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_date: date,
          vehicle_id: vehicleId,
          driver_id: driverId,
          shift,
          notes
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign driver');
      }
      
      // Refresh assignments
      await fetchData();
      
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleStatusChange = async (vehicleId: number, status: string) => {
    try {
      const res = await fetch('/api/daily-vehicle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          vehicle_id: vehicleId,
          status
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }
      
      // Refresh data
      await fetchData();
      
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSwap = async (sourceVehicleId: number, targetVehicleId: number) => {
    if (sourceVehicleId === targetVehicleId) return;

    try {
      const res = await fetch('/api/assignments/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          source_vehicle_id: sourceVehicleId,
          target_vehicle_id: targetVehicleId
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to swap assignments');
      }

      // Optimistically swap locally or just refetch
      await fetchData();

    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCopyPastData = async (daysAgo: number) => {
    if (!isAdmin) return;

    const sourceDateObj = new Date(date);
    sourceDateObj.setDate(sourceDateObj.getDate() - daysAgo);
    
    const year = sourceDateObj.getFullYear();
    const month = String(sourceDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(sourceDateObj.getDate()).padStart(2, '0');
    const sourceDateStr = `${year}-${month}-${day}`;

    if (!confirm(`${daysAgo}일 전(${sourceDateStr})의 배차 데이터를 현재 날짜(${date})로 불러오시겠습니까?\n기존에 등록된 일부 배차가 덮어씌워질 수 있습니다.`)) {
      return;
    }

    try {
      const res = await fetch('/api/assignments/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_date: sourceDateStr,
          target_date: date
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to copy data');
      
      alert(data.message);
      await fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">배차 현황 요약</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-1">
            <p className="text-gray-500 text-sm">총 <span className="font-bold text-blue-600">{vehicles.length}</span>대 차량 중 <span className="font-bold text-green-600">{assignments.length}</span>대 배차 완료</p>
            {isAdmin && (
              <div className="flex gap-2 border-l border-gray-300 pl-3">
                <button 
                  onClick={() => handleCopyPastData(1)}
                  className="text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-2 py-1 rounded shadow-sm transition-colors"
                >
                  1일 전 불러오기
                </button>
                <button 
                  onClick={() => handleCopyPastData(2)}
                  className="text-xs bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded shadow-sm transition-colors font-medium"
                >
                  2일 전 불러오기
                </button>
              </div>
            )}
            <div className={`flex gap-2 ${isAdmin ? 'ml-2' : ''}`}>
              <button 
                onClick={() => setIsCompactView(!isCompactView)}
                className={`text-xs border px-3 py-1 rounded shadow-sm transition-colors font-semibold ${
                  isCompactView 
                    ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isCompactView ? '상세히 보기' : '간략히 보기'}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>배차완료 ({assignments.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>미배차 ({vehicles.length - assignments.length})</span>
          </div>
        </div>
      </div>
      
      {/* Grid Layout adjusts based on view mode */}
      <div 
        className={`grid gap-4 ${
          isCompactView 
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        }`}
      >
        {vehicles.map((vehicle: any) => {
          // Find assignment for this vehicle
          const assignment = assignments.find((a: any) => a.vehicle_id === vehicle.id);
          const dailyStatus = dailyStatuses.find((s: any) => s.vehicle_id === vehicle.id);
          
          return (
            <VehicleCard 
              key={(vehicle as any).id} 
              vehicle={vehicle} 
              assignment={assignment}
              dailyStatus={dailyStatus}
              drivers={drivers}
              onAssign={handleAssign}
              onStatusChange={handleStatusChange}
              onSwap={handleSwap}
              isAdmin={isAdmin}
              isCompactView={isCompactView}
            />
          );
        })}
      </div>
    </div>
  );
}
