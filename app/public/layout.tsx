'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/public/assignments', label: '오늘의 배차표' },
    { href: '/public/contacts', label: '동료 연락망' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Global Navigation Header for Public Views */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                 <span className="bg-blue-600 text-white p-1.5 rounded-md">🚕</span>
                 TAXI MANAGER
              </Link>
              
              <nav className="flex space-x-1">
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
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                관리자 로그인
              </Link>
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
