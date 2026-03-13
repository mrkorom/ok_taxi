'use client';

import { useState, useEffect, useCallback } from 'react';

interface DailyNoticeProps {
  date: string;
  isAdmin: boolean;
}

interface Notice {
  id: number;
  notice_date: string;
  content: string;
  is_active: boolean;
  updated_at: string;
}

export default function DailyNotice({ date, isAdmin }: DailyNoticeProps) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/daily-notices?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setNotice(data.notice);
        setEditContent(data.notice?.content ?? '');
      }
    } catch (error) {
      console.error('Failed to fetch daily notice:', error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchNotice();
    // 편집 모드 초기화
    setIsEditing(false);
  }, [fetchNotice]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/daily-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notice_date: date,
          content: editContent,
          is_active: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '저장에 실패했습니다.');
      }

      const data = await res.json();
      setNotice(data.notice);
      setIsEditing(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(notice?.content ?? '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('공지를 삭제하시겠습니까?')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/daily-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notice_date: date,
          content: '',
          is_active: false,
        }),
      });
      if (res.ok) {
        setNotice(null);
        setEditContent('');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to delete notice:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  // ─── 관리자 편집 모드 ─────────────────────────────────────────
  if (isAdmin && isEditing) {
    return (
      <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 shadow-sm overflow-hidden">
        {/* 편집 헤더 */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 border-b border-amber-200">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm font-semibold text-amber-800">공지사항 편집</span>
        </div>

        {/* 텍스트 입력 */}
        <div className="p-4">
          <textarea
            className="w-full min-h-[90px] text-sm text-gray-800 border border-amber-200 rounded-lg bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y placeholder-gray-400"
            placeholder="오늘의 배차 공지사항을 입력하세요..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
          />
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2 px-4 pb-3">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    );
  }

  // ─── 공지가 있을 때 (공통) ──────────────────────────────────────
  if (notice && notice.content) {
    return (
      <div className="mb-5 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3">
          {/* 아이콘 */}
          <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">오늘의 공지</span>
              {notice.updated_at && (
                <span className="text-xs text-amber-500">
                  {new Date(notice.updated_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 업데이트
                </span>
              )}
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
          </div>

          {/* 관리자 버튼 */}
          {isAdmin && (
            <div className="flex-shrink-0 flex gap-1.5 ml-2">
              <button
                onClick={() => { setEditContent(notice.content); setIsEditing(true); }}
                className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-md transition-colors"
                title="편집"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-red-400 hover:bg-red-50 rounded-md transition-colors"
                title="삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── 공지 없음 ─────────────────────────────────────────────────
  if (isAdmin) {
    // 관리자: 공지 등록 버튼 표시
    return (
      <div className="mb-5">
        <button
          onClick={() => { setEditContent(''); setIsEditing(true); }}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-400 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">오늘의 공지사항 등록</span>
        </button>
      </div>
    );
  }

  // 일반 사용자: 공지 없으면 아무것도 표시 안 함
  return null;
}
