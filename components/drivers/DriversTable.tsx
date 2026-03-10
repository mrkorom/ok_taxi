import { useState, useEffect } from 'react';
import DriverModal from './DriverModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type Driver = {
  id: number;
  driver_code: string;
  name: string;
  phone: string;
  status: string;
  role: string;
  work_type: string;
  start_date: string;
  created_at: string;
  photo_url?: string;
};

export default function DriversTable() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [totalDriversCount, setTotalDriversCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [workTypeFilter, setWorkTypeFilter] = useState('전체');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drivers?mode=all&status=${statusFilter}&work_type=${workTypeFilter}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.drivers) {
        setDrivers(data.drivers);
        setFilteredDrivers(data.drivers);
      }
      if (data.totalCount !== undefined) {
        setTotalDriversCount(data.totalCount);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      alert('기사 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [statusFilter, workTypeFilter]); // trigger search when status or work type filter changes

  // Update filtered list when typing on search input locally
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredDrivers(drivers);
    } else {
      const term = search.toLowerCase();
      setFilteredDrivers(drivers.filter(d => 
        d.name.toLowerCase().includes(term) || 
        d.driver_code.includes(term) || 
        d.phone.includes(term)
      ));
    }
  }, [search, drivers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDrivers();
  };

  const openNewDriverModal = () => {
    setSelectedDriver(null);
    setIsModalOpen(true);
  };

  const handleExportPDF = async () => {
    const tableElement = document.getElementById('drivers-table-container');
    if (!tableElement) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // A4 ratio: 1200px width = ~1697px height. Safe max height ~1550px for margins.
      const pxWidth = 1200;
      const maxPagePxHeight = 1550; 
      
      const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

      // Create a hidden measuring container
      const measureContainer = document.createElement('div');
      measureContainer.style.position = 'absolute';
      measureContainer.style.left = '-9999px';
      measureContainer.style.top = '0';
      document.body.appendChild(measureContainer);

      const createPageWrapper = (pageNum: number) => {
        const wrapper = document.createElement('div');
        wrapper.style.padding = '40px'; // Page margins
        wrapper.style.backgroundColor = 'white';
        wrapper.style.width = `${pxWidth}px`;
        
        // Header
        const headerFlex = document.createElement('div');
        headerFlex.style.display = 'flex';
        headerFlex.style.justifyContent = 'space-between';
        headerFlex.style.alignItems = 'flex-end';
        headerFlex.style.marginBottom = '20px';
        headerFlex.style.borderBottom = '2px solid #1f2937';
        headerFlex.style.paddingBottom = '10px';
        
        const title = document.createElement('h1');
        title.innerText = '기사 리스트';
        title.style.fontSize = '28px';
        title.style.fontWeight = 'bold';
        title.style.color = '#111827';
        title.style.margin = '0';
        
        const dateEl = document.createElement('p');
        dateEl.innerText = `출력 일자: ${dateStr} | 페이지: ${pageNum}`;
        dateEl.style.fontSize = '14px';
        dateEl.style.color = '#4b5563';
        dateEl.style.margin = '0';

        headerFlex.appendChild(title);
        headerFlex.appendChild(dateEl);
        wrapper.appendChild(headerFlex);

        // Table
        const tableClone = document.createElement('table');
        tableClone.className = "w-full text-left whitespace-nowrap";
        
        const originalThead = tableElement.querySelector('thead');
        if (originalThead) {
           const theadClone = originalThead.cloneNode(true) as HTMLElement;
           const ths = theadClone.querySelectorAll('th');
           if (ths.length > 0) ths[ths.length - 1].remove(); // remove management
           tableClone.appendChild(theadClone);
        }
        
        const tbody = document.createElement('tbody');
        tbody.className = "divide-y divide-gray-100 text-sm";
        tableClone.appendChild(tbody);
        wrapper.appendChild(tableClone);
        
        return { wrapper, tbody };
      };

      const addPageToPdf = async (wrapper: HTMLElement, isFirstPage: boolean) => {
         const canvas = await html2canvas(wrapper, {
            scale: 2, 
            useCORS: true,
            backgroundColor: '#ffffff'
         });
         const imgData = canvas.toDataURL('image/png');
         const imgHeight = (canvas.height * pdfWidth) / canvas.width;
         
         if (!isFirstPage) {
             pdf.addPage();
         }
         // Center it vertically or just start at top edge (since padding is built into the canvas)
         pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      };

      let pageNum = 1;
      let { wrapper: currentWrapper, tbody: currentTbody } = createPageWrapper(pageNum);
      measureContainer.appendChild(currentWrapper);

      const rows = Array.from(tableElement.querySelectorAll('tbody tr'));

      for (let i = 0; i < rows.length; i++) {
        const rowClone = rows[i].cloneNode(true) as HTMLElement;
        const cells = rowClone.querySelectorAll('td');
        if (cells.length > 0) cells[cells.length - 1].remove();

        currentTbody.appendChild(rowClone);

        // If adding this row makes the wrapper too tall, and it's not the only row
        if (currentWrapper.clientHeight > maxPagePxHeight && currentTbody.children.length > 1) {
            currentTbody.removeChild(rowClone); // Revert
            
            await addPageToPdf(currentWrapper, pageNum === 1);
            
            measureContainer.removeChild(currentWrapper);
            pageNum++;
            const newPage = createPageWrapper(pageNum);
            currentWrapper = newPage.wrapper;
            currentTbody = newPage.tbody;
            measureContainer.appendChild(currentWrapper);
            
            i--; // Retry this row on the new page
        }
      }
      
      // Render the last page if it has rows
      if (currentTbody.children.length > 0) {
         await addPageToPdf(currentWrapper, pageNum === 1);
      }

      document.body.removeChild(measureContainer);
      pdf.save(`기사리스트_${dateStr.replace(/[\.\s]/g, '')}.pdf`);

    } catch (e) {
      console.error('PDF Export Error:', e);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  const openEditModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`${name} 기사를 삭제(퇴사 처리)하시겠습니까?`)) return;
    
    try {
      const res = await fetch(`/api/drivers?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      
      fetchDrivers();
    } catch (error) {
      alert('기사 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50 flex flex-col justify-between gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            <input 
              type="text" 
              placeholder="이름, 사번, 폰번호로 검색" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="전체">전체 상태</option>
            <option value="운행">운행 중</option>
            <option value="휴직">휴직 상태</option>
            <option value="퇴사">퇴사자</option>
          </select>
          <select 
            value={workTypeFilter}
            onChange={(e) => setWorkTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="전체">전체 운용</option>
            <option value="일차">일차</option>
            <option value="격일A">격일A</option>
            <option value="격일B">격일B</option>
          </select>
          
          <div className="ml-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-sm font-medium whitespace-nowrap hidden lg:block">
            검색: <span className="font-bold">{filteredDrivers.length}</span>명 / 총 <span className="font-bold">{totalDriversCount}</span>명
          </div>
        </form>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExportPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center font-medium transition-colors shadow-sm justify-center flex-1 sm:flex-none"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF 다운로드
          </button>
          <button 
            onClick={openNewDriverModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center font-medium transition-colors shadow-sm justify-center flex-1 sm:flex-none"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            신규 기사 등록
          </button>
        </div>
      </div>
      
      {/* Mobile-only count display */}
      <div className="block lg:hidden bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100 text-sm font-medium w-full text-center mt-2">
        검색: <span className="font-bold">{filteredDrivers.length}</span>명 / 총 <span className="font-bold">{totalDriversCount}</span>명
      </div>
    </div>

      {/* Table Data */}
      <div className="overflow-x-auto w-full" id="drivers-table-container">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-white text-gray-600 text-sm border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold">사번</th>
              <th className="px-6 py-4 font-semibold">이름</th>
              <th className="px-6 py-4 font-semibold">연락처</th>
              <th className="px-6 py-4 font-semibold">상태</th>
              <th className="px-6 py-4 font-semibold">운용방식</th>
              <th className="px-6 py-4 font-semibold">고용/운용일자</th>
              <th className="px-6 py-4 font-semibold text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3">데이터를 불러오는 중...</span>
                  </div>
                </td>
              </tr>
            ) : filteredDrivers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <p className="text-lg mb-1">🔍 등록된 기사가 없습니다</p>
                  <p className="text-sm">조건을 변경하거나 새로운 기사를 등록해 주세요.</p>
                </td>
              </tr>
            ) : (
              filteredDrivers.map(driver => (
                <tr key={driver.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{driver.driver_code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {driver.photo_url ? (
                        <div className="w-9 h-9 rounded-full overflow-hidden mr-3 border border-gray-200 flex-shrink-0 bg-gray-50">
                          <img src={driver.photo_url} alt={`${driver.name} 사진`} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                          {driver.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 flex items-center">
                          {driver.name}
                          {driver.role === 'admin' && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide font-bold">Admin</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{driver.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      driver.status === '운행' ? 'bg-green-100 text-green-700' :
                      driver.status === '휴직' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {driver.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {driver.work_type || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatDate(driver.start_date)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => openEditModal(driver)}
                      className="text-blue-600 hover:text-blue-900 font-medium bg-blue-50 px-3 py-1.5 rounded"
                    >
                      편집
                    </button>
                    {driver.role !== 'admin' && driver.status !== '퇴사' && (
                      <button 
                        onClick={() => handleDelete(driver.id, driver.name)}
                        className="text-red-600 hover:text-red-900 font-medium bg-red-50 px-3 py-1.5 rounded"
                      >
                        삭제
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DriverModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchDrivers} 
        driver={selectedDriver}
      />
    </div>
  );
}
