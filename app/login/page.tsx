'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthResponse } from '@/types';

export default function LoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        console.log('🔐 로그인 시도 시작');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone, password }),
            });

            console.log('📡 서버 응답 상태:', response.status);
            const data: AuthResponse = await response.json();
            console.log('📦 응답 데이터:', data);

            if (data.success && data.token) {
                console.log('✅ 로그인 성공, 토큰 저장 중...');

                // 토큰을 로컬 스토리지에 저장
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // 쿠키에도 토큰 저장 (서버 사이드 미들웨어 접근용)
                document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7일

                console.log('🍪 쿠키에 토큰 저장 완료');
                console.log('🚀 대시보드로 이동 중...');

                // 대시보드로 이동
                router.push('/dashboard');
            } else {
                console.log('❌ 로그인 실패:', data.message);
                setError(data.message || '로그인에 실패했습니다.');
            }
        } catch (err) {
            console.error('💥 로그인 오류:', err);
            setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="w-full max-w-md p-8">
                {/* 로고 및 타이틀 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        택시 운용 관리
                    </h1>
                    <p className="text-gray-600">로그인하여 시스템을 이용하세요</p>
                </div>

                {/* 로그인 폼 */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 전화번호 입력 */}
                        <div>
                            <label
                                htmlFor="phone"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                전화번호
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="01012345678"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* 비밀번호 입력 */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                비밀번호
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호를 입력하세요"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* 에러 메시지 */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* 로그인 버튼 */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    {/* 초기화면 바로가기 */}
                    <div className="mt-4 text-center">
                        <a
                            href="/"
                            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            로그인 없이 초기화면 보기
                        </a>
                    </div>

                    {/* 도움말 */}
                    <div className="mt-4 text-center text-sm text-gray-600">
                        <p>초기 관리자 계정</p>
                        <p className="font-mono mt-1">
                            전화번호: 01000000000 | 비밀번호: 1234
                        </p>
                    </div>
                </div>

                {/* 하단 정보 */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    문제가 있으신가요?{' '}
                    <a href="#" className="text-indigo-600 hover:underline">
                        관리자에게 문의
                    </a>
                </div>
            </div>
        </div>
    );
}
