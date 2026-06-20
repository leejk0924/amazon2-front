import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

// API 모킹
vi.mock('./api/client', () => ({
  memberAPI: {
    getAll: vi.fn(() =>
      Promise.resolve({
        content: [
          { id: 1, nickname: '김민준', categoryCode: 'c1' },
          { id: 2, nickname: '이서연', categoryCode: 'c2' },
        ],
      })
    ),
    create: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  },
  categoryAPI: {
    getAll: vi.fn(() =>
      Promise.resolve({
        content: [
          { code: 'c1', name: '뷰티/패션', description: '#ec4899' },
          { code: 'c2', name: '음식/맛집', description: '#f97316' },
        ],
      })
    ),
    create: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  },
  postingAPI: {
    getWeekly: vi.fn(() =>
      Promise.resolve({
        content: [{ memberId: 1, mon: 2, tue: 1, wed: 0, thu: 3, fri: 0, sat: 0, sun: 1 }],
      })
    ),
  },
  convertWeeklyPostingsToDailyPosts: vi.fn((postings) => postings),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('should render App component', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      });
    });

    it('should display AMAZON title', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText('AMAZON')).toBeInTheDocument();
      });
    });

    it('should display subtitle', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText(/Amazing Amateurs/)).toBeInTheDocument();
      });
    });

    it('should have dashboard and members tab buttons', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /대시보드/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /인원 관리/ })).toBeInTheDocument();
      });
    });
  });

  describe('탭 전환', () => {
    it('should initially show dashboard tab', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText(/주간 포스팅 현황/)).toBeInTheDocument();
      });
    });

    it('should switch to members tab', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /인원 관리/ })).toBeInTheDocument();
      });

      const membersBtn = screen.getByRole('button', { name: /인원 관리/ });
      await userEvent.click(membersBtn);

      await waitFor(() => {
        expect(screen.getByText(/멤버 추가/)).toBeInTheDocument();
      });
    });
  });

  describe('통계', () => {
    it('should display stats cards', async () => {
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText(/이번 주 총 포스팅/)).toBeInTheDocument();
        expect(screen.getByText(/활동 인원/)).toBeInTheDocument();
        expect(screen.getByText(/1인 평균 포스팅/)).toBeInTheDocument();
      });
    });
  });
});
