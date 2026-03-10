'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const router = useRouter();

    // 로그인 상태 확인 및 자동 리다이렉트
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // 토큰이 있으면 대시보드로 이동
            router.push('/dashboard');
        }
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center space-y-8 p-8 max-w-2xl">
                <h1 className="text-5xl font-bold text-gray-800 mb-4">
                    택시 운영 관리 시스템
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    기사 및 차량 배차를 효율적으로 관리하세요
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/public/assignments"
                        className="px-8 py-4 bg-green-50 text-green-700 border-2 border-green-200 text-lg rounded-lg hover:bg-green-100 transition-colors font-semibold shadow-sm flex items-center justify-center gap-2"
                    >
                        <span>📋</span>
                        오늘의 배차표 열람
                    </Link>
                    <Link
                        href="/public/contacts"
                        className="px-8 py-4 bg-blue-50 text-blue-700 border-2 border-blue-200 text-lg rounded-lg hover:bg-blue-100 transition-colors font-semibold shadow-sm flex items-center justify-center gap-2"
                    >
                        <span>📞</span>
                        기사 동료 연락망
                    </Link>
                    <Link
                        href="/login"
                        className="px-8 py-4 bg-indigo-600 border-2 border-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-lg hover:shadow-xl mt-4 sm:mt-0 flex items-center justify-center"
                    >
                        관리자 로그인
                    </Link>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="text-4xl mb-3">👥</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            기사 관리
                        </h3>
                        <p className="text-gray-600 text-sm">
                            기사 등록 및 운용 상태 관리
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="text-4xl mb-3">🚕</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            차량 관리
                        </h3>
                        <p className="text-gray-600 text-sm">
                            차량 등록 및 상태 관리
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="text-4xl mb-3">📋</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            배차표 관리
                        </h3>
                        <p className="text-gray-600 text-sm">
                            일일 배차표 생성 및 조회
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
