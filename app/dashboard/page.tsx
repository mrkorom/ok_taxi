'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalDrivers: 0,
        totalVehicles: 0,
        lastAssignmentDate: null as string | null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    // Format the date if it exists
    const formattedLastDate = stats.lastAssignmentDate 
        ? new Date(stats.lastAssignmentDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : '배차 기록 없음';

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 환영 메시지 */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        대시보드
                    </h2>
                    <p className="text-gray-600">
                        택시 운용 현황을 한눈에 확인하세요
                    </p>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">
                                전체 기사
                            </h3>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">👤</span>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">
                            {loading ? '...' : `${stats.totalDrivers}명`}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">등록된 기사 수</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">
                                전체 차량
                            </h3>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">🚕</span>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">
                            {loading ? '...' : `${stats.totalVehicles}대`}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">등록된 차량 수</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">
                                오늘 배차
                            </h3>
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 truncate" title={formattedLastDate}>
                            {loading ? '...' : formattedLastDate}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">최근 배차 지정일</p>
                    </div>
                </div>

                {/* 빠른 메뉴 */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">빠른 메뉴</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link
                            href="/dashboard/drivers"
                            className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group"
                        >
                            <div className="text-4xl mb-2">👥</div>
                            <p className="font-semibold text-gray-700 group-hover:text-indigo-600">
                                기사 관리
                            </p>
                        </Link>

                        <Link
                            href="/dashboard/vehicles"
                            className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group"
                        >
                            <div className="text-4xl mb-2">🚗</div>
                            <p className="font-semibold text-gray-700 group-hover:text-indigo-600">
                                차량 관리
                            </p>
                        </Link>

                        <Link
                            href="/dashboard/assignments"
                            className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group"
                        >
                            <div className="text-4xl mb-2">📅</div>
                            <p className="font-semibold text-gray-700 group-hover:text-indigo-600">
                                배차 관리
                            </p>
                        </Link>

                        <Link
                            href="/dashboard/statistics"
                            className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group"
                        >
                            <div className="text-4xl mb-2">📊</div>
                            <p className="font-semibold text-gray-700 group-hover:text-indigo-600">
                                통계 보기
                            </p>
                        </Link>
                    </div>
                </div>

                {/* 최근 활동 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">최근 활동</h3>
                    <div className="text-center py-12 text-gray-500">
                        <p>아직 활동 내역이 없습니다.</p>
                        <p className="text-sm mt-2">기사와 차량을 등록하여 시작하세요.</p>
                    </div>
                </div>
        </main>
    );
}
