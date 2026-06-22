import { useState, useEffect } from 'react';
import { getWeekDates, formatDate } from './utils';
import { WeeklyDashboard } from './components/WeeklyDashboard';
import { MemberManagement } from './components/MemberManagement';
import { PostModal } from './components/PostModal';
import {
  memberAPI,
  categoryAPI,
  postingAPI,
  convertWeeklyPostingsToDailyPosts,
} from './api/client';
import logoImg from './imports/KakaoTalk_Photo_2026-02-10-16-27-27.jpeg';
import './App.css';

const DAYS_KO = ['월', '화', '수', '목', '금', '토', '일'];

export function App() {
  const [tab, setTab] = useState('dashboard');
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [postModal, setPostModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 초기 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 멤버, 카테고리 동시 로드
        const [membersRes, categoriesRes] = await Promise.all([
          memberAPI.getAll(),
          categoryAPI.getAll(),
        ]);

        // 응답 형식 정리
        const membersList = (membersRes?.content || []).map((m, idx) => ({
          id: String(m.id),
          nickname: m.nickname || `멤버${idx + 1}`,
          name: m.name || '',
          blogUrl: `https://blog.naver.com/${m.nickname || 'unknown'}`,
          avatar: m.nickname?.substring(0, 2).toUpperCase() || 'N/A',
          categoryId: m.categoryCode || '',
        }));

        const categoriesList = (categoriesRes?.content || []).map((c) => ({
          id: c.categoryCode || '',
          name: c.categoryName || '',
        }));

        console.log('[멤버 데이터]', membersList);
        console.log('[카테고리 데이터]', categoriesList);
        setMembers(membersList);
        setCategories(categoriesList);

        // 현재 주의 포스팅 조회
        const todayForSeed = new Date();
        const seedWeek = getWeekDates(todayForSeed);
        const seedStartDate = formatDate(seedWeek[0]);

        console.log(
          `[초기 로드] 주간=${formatDate(seedWeek[0])} ~ ${formatDate(seedWeek[6])}, startDate=${seedStartDate}`
        );

        const postingsRes = await postingAPI.getWeekly(seedStartDate);

        if (postingsRes?.content) {
          const dailyPosts = convertWeeklyPostingsToDailyPosts(postingsRes.content, seedWeek[0]);
          setPosts(dailyPosts);
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 주간 이동 시 포스팅 데이터 갱신
  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const referenceDate = new Date();
        referenceDate.setDate(referenceDate.getDate() + weekOffset * 7);
        const weekDatesForFetch = getWeekDates(referenceDate);
        const startDateStr = formatDate(weekDatesForFetch[0]);

        console.log(
          `[주간 조회] weekOffset=${weekOffset}, 주간=${formatDate(weekDatesForFetch[0])} ~ ${formatDate(weekDatesForFetch[6])}, startDate=${startDateStr}`
        );

        const postingsRes = await postingAPI.getWeekly(startDateStr);

        if (postingsRes?.content) {
          const dailyPosts = convertWeeklyPostingsToDailyPosts(
            postingsRes.content,
            weekDatesForFetch[0]
          );
          setPosts(dailyPosts);
        }
      } catch (err) {
        console.error('포스팅 데이터 조회 실패:', err);
        setError(err.message);
      }
    })();
  }, [weekOffset]);

  // 탭 전환 시 데이터 갱신
  useEffect(() => {
    (async () => {
      try {
        if (tab === 'dashboard') {
          console.log('[탭 전환] 대시보드 탭 - 포스팅 데이터 갱신');
          const referenceDate = new Date();
          referenceDate.setDate(referenceDate.getDate() + weekOffset * 7);
          const weekDatesForFetch = getWeekDates(referenceDate);
          const postingsRes = await postingAPI.getWeekly(formatDate(weekDatesForFetch[0]));

          if (postingsRes?.content) {
            const dailyPosts = convertWeeklyPostingsToDailyPosts(
              postingsRes.content,
              weekDatesForFetch[0]
            );
            setPosts(dailyPosts);
          }
        } else if (tab === 'members') {
          console.log('[탭 전환] 인원 관리 탭 - 멤버/카테고리 데이터 갱신');
          const [membersRes, categoriesRes] = await Promise.all([
            memberAPI.getAll(),
            categoryAPI.getAll(),
          ]);

          const membersList = (membersRes?.content || []).map((m, idx) => ({
            id: String(m.id),
            nickname: m.nickname || `멤버${idx + 1}`,
            name: m.name || '',
            blogUrl: `https://blog.naver.com/${m.nickname || 'unknown'}`,
            avatar: m.nickname?.substring(0, 2).toUpperCase() || 'N/A',
            categoryId: m.categoryCode || '',
          }));

          const categoriesList = (categoriesRes?.content || []).map((c) => ({
            id: c.categoryCode || '',
            name: c.categoryName || '',
          }));

          setMembers(membersList);
          setCategories(categoriesList);
        }
      } catch (err) {
        console.error('탭 전환 시 데이터 갱신 실패:', err);
      }
    })();
  }, [tab, weekOffset]);

  const today = new Date();
  const referenceDate = new Date();
  referenceDate.setDate(referenceDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(referenceDate);

  const weekLabel = (() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 — ${end.getMonth() + 1}월 ${end.getDate()}일`;
  })();

  const getCount = (memberId, date) => {
    const entry = posts.find((p) => p.memberId === memberId && p.date === date);
    return entry ? entry.count : 0;
  };

  const handleSavePost = (memberId, date, count) => {
    setPosts((prev) => {
      const existing = prev.findIndex((p) => p.memberId === memberId && p.date === date);
      if (existing !== -1) {
        const updated = [...prev];
        if (count === 0) updated.splice(existing, 1);
        else updated[existing] = { ...updated[existing], count };
        return updated;
      }
      if (count === 0) return prev;
      return [...prev, { memberId, date, count }];
    });
    setPostModal(null);
  };

  // 멤버 추가
  const handleAddMember = async (m) => {
    try {
      await memberAPI.create(m.nickname, m.name, m.categoryId);
      setMembers((prev) => [...prev, m]);
    } catch (err) {
      console.error('멤버 추가 실패:', err);
    }
  };

  // 멤버 삭제
  const handleRemoveMember = async (id) => {
    try {
      await memberAPI.delete(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setPosts((prev) => prev.filter((p) => p.memberId !== id));
    } catch (err) {
      console.error('멤버 삭제 실패:', err);
    }
  };

  // 카테고리 추가
  const handleAddCategory = async (c) => {
    try {
      await categoryAPI.create(c.id, c.name, c.color);
      setCategories((prev) => [...prev, c]);
    } catch (err) {
      console.error('카테고리 추가 실패:', err);
    }
  };

  // 카테고리 삭제
  const handleRemoveCategory = async (id) => {
    try {
      await categoryAPI.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setMembers((prev) => prev.map((m) => (m.categoryId === id ? { ...m, categoryId: '' } : m)));
    } catch (err) {
      console.error('카테고리 삭제 실패:', err);
    }
  };

  // 카테고리 수정
  const handleUpdateCategory = async (id, updates) => {
    try {
      await categoryAPI.update(id, updates.name, updates.color);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: updates.name, color: updates.color } : c))
      );
    } catch (err) {
      console.error('카테고리 수정 실패:', err);
    }
  };

  const totalThisWeek = members.reduce((sum, m) => {
    return sum + weekDates.reduce((s, d) => s + getCount(m.id, formatDate(d)), 0);
  }, 0);

  const activeMembers = members.filter((m) =>
    weekDates.some((d) => getCount(m.id, formatDate(d)) > 0)
  ).length;

  if (loading) {
    return (
      <div className="app">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p>데이터 로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="app-header">
        <div className="app-header-content">
          <div className="app-logo-section">
            <img src={logoImg} alt="AMAZON" className="app-logo" />
            <div>
              <div className="app-title-group">
                <span className="app-title">AMAZON</span>
                <span className="app-badge">NAVER BLOG GROUP</span>
              </div>
              <p className="app-subtitle">Amazing Amateurs · 블로그 포스팅 현황</p>
            </div>
          </div>

          <nav className="app-tabs">
            <button
              className={`tab-button ${tab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setTab('dashboard')}
              aria-label="대시보드 탭"
            >
              대시보드
            </button>
            <button
              className={`tab-button ${tab === 'members' ? 'active' : ''}`}
              onClick={() => setTab('members')}
              aria-label="인원 관리 탭"
            >
              인원 관리
            </button>
          </nav>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="app-content">
        {tab === 'dashboard' && (
          <>
            {/* 통계 */}
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">이번 주 총 포스팅</p>
                <p className="stat-value">
                  {totalThisWeek}
                  <span className="stat-unit">개</span>
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-label">활동 인원</p>
                <p className="stat-value">
                  {activeMembers} / {members.length}
                  <span className="stat-unit">명</span>
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-label">1인 평균 포스팅</p>
                <p className="stat-value">
                  {members.length ? (totalThisWeek / members.length).toFixed(1) : '0'}
                  <span className="stat-unit">개</span>
                </p>
              </div>
            </div>

            {/* 주간 네비게이션 */}
            <div className="week-nav">
              <h2>주간 포스팅 현황</h2>
              <div className="week-controls">
                <button
                  className="week-btn"
                  onClick={() => setWeekOffset((o) => o - 1)}
                  aria-label="이전 주"
                >
                  ← 이전
                </button>
                <span className="week-label">{weekLabel}</span>
                <button
                  className="week-btn"
                  onClick={() => setWeekOffset((o) => o + 1)}
                  disabled={weekOffset >= 0}
                  aria-label="다음 주"
                >
                  다음 →
                </button>
                {weekOffset !== 0 && (
                  <button className="week-btn week-btn-today" onClick={() => setWeekOffset(0)}>
                    이번 주
                  </button>
                )}
              </div>
            </div>

            <WeeklyDashboard
              members={members}
              categories={categories}
              weekDates={weekDates}
              daysKo={DAYS_KO}
              getCount={getCount}
              formatDate={formatDate}
              today={today}
              error={error}
              onCellClick={(memberId, date) => setPostModal({ open: true, memberId, date })}
              onBatchExecute={async (startDate, endDate) => {
                try {
                  console.log(`[배치 실행] startDate=${startDate}, endDate=${endDate}`);
                  await postingAPI.executeBatch(startDate, endDate);
                  const postingsRes = await postingAPI.getWeekly(startDate);
                  if (postingsRes?.content) {
                    const dailyPosts = convertWeeklyPostingsToDailyPosts(
                      postingsRes.content,
                      new Date(startDate)
                    );
                    setPosts(dailyPosts);
                  }
                } catch (err) {
                  console.error('배치 실행 실패:', err);
                }
              }}
            />
          </>
        )}

        {tab === 'members' && (
          <>
            <MemberManagement
              error={error}
              members={members}
              categories={categories}
              weekDates={weekDates}
              getCount={getCount}
              formatDate={formatDate}
              onAddMember={(m) => handleAddMember(m)}
              onRemoveMember={(id) => handleRemoveMember(id)}
              onAddCategory={(c) => handleAddCategory(c)}
              onRemoveCategory={(id) => handleRemoveCategory(id)}
              onUpdateCategory={(id, updates) => handleUpdateCategory(id, updates)}
            />
          </>
        )}
      </main>

      {postModal && (
        <PostModal
          members={members}
          memberId={postModal.memberId}
          date={postModal.date}
          currentCount={getCount(postModal.memberId, postModal.date)}
          onSave={handleSavePost}
          onClose={() => setPostModal(null)}
        />
      )}
    </div>
  );
}
