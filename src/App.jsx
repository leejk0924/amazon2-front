import { useState, useEffect, useRef } from 'react';
import { getWeekDates, formatDate } from './utils';
import { WeeklyDashboard } from './components/WeeklyDashboard';
import { MemberManagement } from './components/MemberManagement';
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
  const [dashboardMembers, setDashboardMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [batchLoading, setBatchLoading] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({
    totalPostingCount: 0,
    activeMemberCount: 0,
    totalMemberCount: 0,
    averagePostingPerActiveMember: 0,
  });

  // 탭/주간 변경 감지용
  const prevTabRef = useRef();
  const prevWeekOffsetRef = useRef();

  // 초기 데이터 로드
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 멤버(모두), 카테고리 동시 로드
        const [membersRes, categoriesRes] = await Promise.all([
          memberAPI.getAll(0, 1000),
          categoryAPI.getAll(),
        ]);

        // 응답 형식 정리
        const membersList = (membersRes?.content || []).map((m, idx) => ({
          id: m.nickname,
          nickname: m.nickname || `멤버${idx + 1}`,
          name: m.name || '',
          blogUrl: `https://blog.naver.com/${m.nickname || 'unknown'}`,
          avatar: m.nickname?.substring(0, 2).toUpperCase() || 'N/A',
          categoryId: m.categoryCode || '',
          status: m.status || 'active',
        }));

        const categoriesList = (categoriesRes?.content || []).map((c) => ({
          id: c.categoryCode || '',
          name: c.categoryName || '',
          description: c.description || '',
        }));

        setMembers(membersList);
        setDashboardMembers(membersList);
        setCategories(categoriesList);

        // 통계용 데이터: 현재 주의 전체 포스팅
        const todayForSeed = new Date();
        const seedWeek = getWeekDates(todayForSeed);
        const seedStartDate = formatDate(seedWeek[0]);

        const postingsRes = await postingAPI.getWeekly(seedStartDate, pageSize, 0);

        if (postingsRes?.content) {
          const dailyPosts = convertWeeklyPostingsToDailyPosts(postingsRes.content, seedWeek[0]);
          setPosts(dailyPosts);

          // 테이블용 데이터: 첫 페이지 멤버 추출
          const uniqueMembers = {};
          postingsRes.content.forEach((posting) => {
            if (!uniqueMembers[posting.memberNickname]) {
              uniqueMembers[posting.memberNickname] = {
                id: posting.memberNickname,
                nickname: posting.memberNickname,
                name: posting.memberName || '',
                blogUrl: `https://blog.naver.com/${posting.memberNickname}`,
                avatar: posting.memberNickname?.substring(0, 2).toUpperCase() || 'N/A',
                categoryId: '',
                status: 'active',
              };
            }
          });
          setDashboardMembers(Object.values(uniqueMembers));

          // 전체 데이터 기반 totalPages 계산
          const calculatedTotalPages = Math.ceil(Object.keys(uniqueMembers).length / pageSize);
          setTotalPages(calculatedTotalPages);
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 주간 통계 조회
  useEffect(() => {
    if (tab === 'dashboard') {
      (async () => {
        try {
          const referenceDate = new Date();
          referenceDate.setDate(referenceDate.getDate() + weekOffset * 7);
          const weekDatesForFetch = getWeekDates(referenceDate);
          const startDateStr = formatDate(weekDatesForFetch[0]);

          const statsRes = await postingAPI.getWeeklyStatistics(startDateStr);
          if (statsRes) {
            setWeeklyStats(statsRes);
          }
        } catch (err) {
          console.error('주간 통계 조회 실패:', err);
        }
      })();
    }
  }, [tab, weekOffset]);

  // 대시보드 탭 활성화 또는 주간/페이지 변경 시 postings 갱신
  // 역할: 통계 + 테이블 데이터 로드 (탭/주간 변경 시 자동 페이지 리셋)
  useEffect(() => {
    if (tab === 'dashboard' && !loading) {
      (async () => {
        try {
          setError(null);

          // 탭이나 주간이 변경되었으면 페이지를 0으로 리셋
          const hasTabChanged = prevTabRef.current !== tab;
          const hasWeekOffsetChanged = prevWeekOffsetRef.current !== weekOffset;
          const pageToUse = hasTabChanged || hasWeekOffsetChanged ? 0 : currentPage;

          // 이전 값 업데이트
          prevTabRef.current = tab;
          prevWeekOffsetRef.current = weekOffset;

          // 페이지 변경이 필요하면 상태 업데이트 (비동기)
          if (pageToUse !== currentPage) {
            setCurrentPage(pageToUse);
          }

          const referenceDate = new Date();
          referenceDate.setDate(referenceDate.getDate() + weekOffset * 7);
          const weekDatesForFetch = getWeekDates(referenceDate);
          const startDateStr = formatDate(weekDatesForFetch[0]);

          // 포스팅 데이터 조회
          const postingsRes = await postingAPI.getWeekly(startDateStr, pageSize, pageToUse);

          if (postingsRes?.content) {
            const dailyPosts = convertWeeklyPostingsToDailyPosts(
              postingsRes.content,
              weekDatesForFetch[0]
            );
            setPosts(dailyPosts);

            const uniqueMembers = {};
            postingsRes.content.forEach((posting) => {
              if (!uniqueMembers[posting.memberNickname]) {
                uniqueMembers[posting.memberNickname] = {
                  id: posting.memberNickname,
                  nickname: posting.memberNickname,
                  name: posting.memberName || '',
                  blogUrl: `https://blog.naver.com/${posting.memberNickname}`,
                  avatar: posting.memberNickname?.substring(0, 2).toUpperCase() || 'N/A',
                  categoryId: '',
                  status: 'active',
                };
              }
            });
            setDashboardMembers(Object.values(uniqueMembers));

            // totalPages 계산
            const uniqueMemberCount = new Set(postingsRes.content.map((p) => p.memberNickname))
              .size;
            const calculatedTotalPages = Math.ceil(uniqueMemberCount / pageSize);
            setTotalPages(calculatedTotalPages);
          }
        } catch (err) {
          console.error('포스팅 데이터 조회 실패:', err);
          setError(err.message);
        }
      })();
    }
  }, [tab, weekOffset, pageSize, currentPage, loading]);

  // 탭 전환 시 데이터 갱신
  useEffect(() => {
    (async () => {
      try {
        if (tab === 'members') {
          const [membersRes, categoriesRes] = await Promise.all([
            memberAPI.getAll(0, 1000, 'active'),
            categoryAPI.getAll(),
          ]);

          const membersList = (membersRes?.content || []).map((m, idx) => ({
            id: m.nickname,
            nickname: m.nickname || `멤버${idx + 1}`,
            name: m.name || '',
            blogUrl: `https://blog.naver.com/${m.nickname || 'unknown'}`,
            avatar: m.nickname?.substring(0, 2).toUpperCase() || 'N/A',
            categoryId: m.categoryCode || '',
            status: m.status || 'active',
          }));

          const categoriesList = (categoriesRes?.content || []).map((c) => ({
            id: c.categoryCode || '',
            name: c.categoryName || '',
            description: c.description || '',
          }));

          setMembers(membersList);
          setCategories(categoriesList);
        }
      } catch (err) {
        console.error('탭 전환 시 데이터 갱신 실패:', err);
      }
    })();
  }, [tab]);

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

  // 멤버 추가
  const handleAddMember = async (m) => {
    try {
      await memberAPI.create(m.nickname, m.name, m.categoryId);
      setMembers((prev) => [...prev, m]);
    } catch (err) {
      console.error('멤버 추가 실패:', err);
    }
  };

  // 멤버 삭제 (soft delete)
  const handleRemoveMember = async (id) => {
    try {
      await memberAPI.delete(id);
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'deleted' } : m)));
    } catch (err) {
      console.error('멤버 삭제 실패:', err);
    }
  };

  // 멤버 정보 수정
  const handleUpdateMember = async (id, updates) => {
    try {
      await memberAPI.update(id, updates.nickname, updates.categoryId);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                nickname: updates.nickname,
                name: updates.name,
                categoryId: updates.categoryId,
              }
            : m
        )
      );
    } catch (err) {
      console.error('멤버 수정 실패:', err);
    }
  };

  // 멤버 영구 삭제
  const handlePermanentDeleteMember = async (id) => {
    try {
      await memberAPI.permanentDelete(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setPosts((prev) => prev.filter((p) => p.memberId !== id));
    } catch (err) {
      console.error('멤버 영구 삭제 실패:', err);
    }
  };

  // 멤버 복원
  const handleRestoreMember = async (nickname) => {
    try {
      await memberAPI.restore(nickname);
      setMembers((prev) =>
        prev.map((m) => (m.nickname === nickname ? { ...m, status: 'active' } : m))
      );
    } catch (err) {
      console.error('멤버 복원 실패:', err);
    }
  };

  // 배치 데이터 수집
  const handleBatchExecute = async (startDate, endDate) => {
    setBatchLoading(true);
    try {
      await postingAPI.executeBatch(startDate, endDate);
      const postingsRes = await postingAPI.getWeekly(startDate, pageSize);
      if (postingsRes?.content) {
        const dailyPosts = convertWeeklyPostingsToDailyPosts(
          postingsRes.content,
          new Date(startDate)
        );
        setPosts(dailyPosts);
      }
    } catch (err) {
      console.error('배치 실행 실패:', err);
    } finally {
      setBatchLoading(false);
    }
  };

  // 카테고리 추가
  const handleAddCategory = async (c) => {
    try {
      await categoryAPI.create(c.id, c.name, c.description);
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
      await categoryAPI.update(id, updates.name, updates.description);
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, name: updates.name, description: updates.description } : c
        )
      );
    } catch (err) {
      console.error('카테고리 수정 실패:', err);
    }
  };

  // 멤버 필터 변경 (active/deleted)
  const handleFilterChange = async (status) => {
    try {
      const membersRes = await memberAPI.getAll(0, 1000, status);
      const membersList = (membersRes?.content || []).map((m, idx) => ({
        id: m.nickname,
        nickname: m.nickname || `멤버${idx + 1}`,
        name: m.name || '',
        blogUrl: `https://blog.naver.com/${m.nickname || 'unknown'}`,
        avatar: m.nickname?.substring(0, 2).toUpperCase() || 'N/A',
        categoryId: m.categoryCode || '',
        status: m.status || 'active',
      }));
      setMembers(membersList);
    } catch (err) {
      console.error('멤버 필터 조회 실패:', err);
    }
  };

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
          <button
            className="app-logo-section"
            onClick={() => setTab('dashboard')}
            aria-label="홈으로 이동"
          >
            <img src={logoImg} alt="AMAZON" className="app-logo" />
            <span className="app-title">AMAZON</span>
          </button>

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
                  {weeklyStats.totalPostingCount}
                  <span className="stat-unit">개</span>
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-label">활동 인원</p>
                <p className="stat-value">
                  {weeklyStats.activeMemberCount} / {weeklyStats.totalMemberCount}
                  <span className="stat-unit">명</span>
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-label">1인 평균 포스팅</p>
                <p className="stat-value">
                  {weeklyStats.averagePostingPerActiveMember.toFixed(2)}
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
              members={dashboardMembers}
              categories={categories}
              weekDates={weekDates}
              daysKo={DAYS_KO}
              getCount={getCount}
              formatDate={formatDate}
              today={today}
              error={error}
              weekOffset={weekOffset}
              totalPages={totalPages}
              batchLoading={batchLoading}
              onPageSizeChange={setPageSize}
              onPageChange={setCurrentPage}
              onCellClick={(memberId, date) => {
                const url = `https://blog.naver.com/PostList.naver?blogId=${memberId}&viewdate=${date}`;
                window.open(url, '_blank');
              }}
              onBatchExecute={handleBatchExecute}
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
              onUpdateMember={(id, updates) => handleUpdateMember(id, updates)}
              onAddCategory={(c) => handleAddCategory(c)}
              onRemoveCategory={(id) => handleRemoveCategory(id)}
              onUpdateCategory={(id, updates) => handleUpdateCategory(id, updates)}
              onPermanentDeleteMember={(id) => handlePermanentDeleteMember(id)}
              onRestoreMember={(nickname) => handleRestoreMember(nickname)}
              onFilterChange={handleFilterChange}
            />
          </>
        )}
      </main>
    </div>
  );
}
