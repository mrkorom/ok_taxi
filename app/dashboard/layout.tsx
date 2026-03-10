'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: '대시보드 홈' },
    { href: '/dashboard/assignments', label: '배차 관리' },
    { href: '/dashboard/drivers', label: '기사 관리' },
    { href: '/dashboard/vehicles', label: '차량 관리' },
    { href: '/dashboard/statistics', label: '통계 분석' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Global Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                 <span className="bg-blue-600 text-white p-1.5 rounded-md">🚕</span>
                 TAXI MANAGER
              </Link>
              
              <nav className="hidden md:flex space-x-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors font-medium border border-transparent hover:border-red-200 flex items-center gap-2"
              >
                <span>로그아웃</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
