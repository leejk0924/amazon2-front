const API_BASE_URL = 'http://localhost:8080';

// 에러 메시지 정제
function formatErrorMessage(error) {
  const message = error.message || error.toString();

  // JDBC/SQL 에러
  if (message.includes('JDBC') || message.includes('SQL')) {
    return '데이터 조회 중 오류가 발생했습니다. 백엔드 서버를 확인해주세요.';
  }

  // 네트워크 에러
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return '백엔드 서버에 연결할 수 없습니다.';
  }

  // CORS 에러
  if (message.includes('CORS') || message.includes('cross-origin')) {
    return '서버 연결 설정 오류입니다.';
  }

  // 기본 에러
  return '데이터 로드에 실패했습니다.';
}

// 기본 fetch 래퍼
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API 오류: ${response.status}`);
    }

    // 204 No Content 처리
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API 호출 실패: ${endpoint}`, error);
    throw new Error(formatErrorMessage(error), { cause: error });
  }
}

// ===== 멤버 API =====
export const memberAPI = {
  // 멤버 목록 조회
  getAll: async (page = 0, size = 100) => {
    return apiCall(`/members?page=${page}&size=${size}`);
  },

  // 멤버 상세 조회
  getById: async (id) => {
    return apiCall(`/members/${id}`);
  },

  // 멤버 생성
  create: async (nickname, name, categoryCode) => {
    return apiCall('/members', {
      method: 'POST',
      body: JSON.stringify({ nickname, name, categoryCode }),
    });
  },

  // 멤버 수정
  update: async (id, nickname, categoryCode) => {
    return apiCall(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nickname, categoryCode }),
    });
  },

  // 멤버 삭제
  delete: async (id) => {
    return apiCall(`/members/${id}`, {
      method: 'DELETE',
    });
  },
};

// ===== 카테고리 API =====
export const categoryAPI = {
  // 카테고리 목록 조회
  getAll: async (page = 0, size = 100) => {
    return apiCall(`/categories?page=${page}&size=${size}`);
  },

  // 카테고리 상세 조회
  getByCode: async (code) => {
    return apiCall(`/categories/${code}`);
  },

  // 카테고리 생성
  create: async (code, name, description = '') => {
    return apiCall('/categories', {
      method: 'POST',
      body: JSON.stringify({ code, name, description }),
    });
  },

  // 카테고리 수정
  update: async (code, name, description = '') => {
    return apiCall(`/categories/${code}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    });
  },

  // 카테고리 삭제
  delete: async (code) => {
    return apiCall(`/categories/${code}`, {
      method: 'DELETE',
    });
  },
};

// ===== 포스팅 API =====
export const postingAPI = {
  // 주간 포스팅 조회
  getWeekly: async (startDate) => {
    const dateStr = typeof startDate === 'string' ? startDate : formatDate(startDate);
    return apiCall(`/postings?startDate=${dateStr}`);
  },

  // 배치 작업 실행
  executeBatch: async (startDate, endDate) => {
    return apiCall('/batch', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate }),
    });
  },
};

// 날짜 포맷팅 (YYYY-MM-DD)
function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// ===== 데이터 변환 함수 =====

// 백엔드 주단위 포스팅 → 프론트 일단위 포스팅 변환
export function convertWeeklyPostingsToDailyPosts(apiPostings, startDate) {
  const posts = [];
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });

  apiPostings.forEach((posting) => {
    DAYS.forEach((day, index) => {
      const count = posting[day];
      if (count > 0) {
        posts.push({
          memberId: String(posting.memberId),
          date: formatDate(week[index]),
          count,
        });
      }
    });
  });

  return posts;
}

// 프론트 일단위 포스팅 → 백엔드 주단위 포스팅 변환 (필요 시)
export function convertDailyPostsToWeeklyPostings(dailyPosts, startDate) {
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return formatDate(date);
  });

  const membersMap = {};

  dailyPosts.forEach((post) => {
    const dayIndex = week.indexOf(post.date);
    if (dayIndex !== -1) {
      if (!membersMap[post.memberId]) {
        membersMap[post.memberId] = {
          memberId: Number(post.memberId),
          mon: 0,
          tue: 0,
          wed: 0,
          thu: 0,
          fri: 0,
          sat: 0,
          sun: 0,
        };
      }
      membersMap[post.memberId][DAYS[dayIndex]] = post.count;
    }
  });

  return Object.values(membersMap);
}
