import { verifyAuth } from '@/lib/auth-edge';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import VehiclesTable from '@/components/vehicles/VehiclesTable';

export default async function VehiclesPage() {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') || '';
  
  const request = new Request('http://localhost', {
    headers: {
      cookie: cookieHeader
    }
  });
  
  const authResult = await verifyAuth(request);
  
  if (!authResult.isAuthenticated) {
    redirect('/login');
  }

  // Only admins and managers can access this page
  if (authResult.role !== 'admin' && authResult.role !== 'manager') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      {/* Header section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
              차량 관리
            </h1>
            <p className="text-sm text-gray-500 mt-2 ml-1">
              택시 운영 차량들의 등록 현황과 유종, 상태를 통합 관리합니다.
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VehiclesTable />
      </div>
    </div>
  );
}
