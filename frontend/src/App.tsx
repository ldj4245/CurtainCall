import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { useAuthStore } from './store/authStore'
import { authApi } from './api/auth'
import Navbar from './components/common/Navbar'
import MobileTabBar from './components/common/MobileTabBar'

const HomePage = lazy(() => import('./pages/Home/HomePage'))
const ShowListPage = lazy(() => import('./pages/Shows/ShowListPage'))
const ShowDetailPage = lazy(() => import('./pages/Shows/ShowDetailPage'))
const DiaryPage = lazy(() => import('./pages/Diary/DiaryPage'))
const MyPage = lazy(() => import('./pages/MyPage/MyPage'))
const ChatListPage = lazy(() => import('./pages/Chat/ChatListPage'))
const ChatRoomPage = lazy(() => import('./pages/Chat/ChatRoomPage'))
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'))
const SignUpPage = lazy(() => import('./pages/Auth/SignUpPage'))
const OAuth2Callback = lazy(() => import('./pages/Auth/OAuth2Callback'))
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'))
const DesignMockupPage = lazy(() => import('./pages/Mockup/DesignMockupPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" state={{ from: location }} replace />
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex justify-center selection:bg-brand selection:text-white">
      {/* 중앙 모바일 웹앱 프레임 (460px) */}
      <div className="w-full max-w-[460px] min-h-screen bg-surface-base relative flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] sm:border-x sm:border-slate-800/80">
        <Navbar />
        <main className="flex-1 pb-20 overflow-x-hidden">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  )
}

function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex justify-center">
      <div className="w-full max-w-[460px] min-h-screen bg-surface-base relative flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] sm:border-x sm:border-slate-800/80">
        <Outlet />
      </div>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, accessToken, setUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      authApi.getMe().then(setUser).catch(() => { })
    }
  }, [isAuthenticated, accessToken, setUser])

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-brand" />
      </div>
    }>
      <Routes>
        {/* 인증 라우트 */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
        </Route>
        <Route path="/mockup" element={<DesignMockupPage />} />

        {/* 메인 웹앱 라우트 */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shows" element={<ShowListPage />} />
          <Route path="/shows/:id" element={<ShowDetailPage />} />
          <Route
            path="/diary"
            element={
              <ProtectedRoute>
                <DiaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my"
            element={
              <ProtectedRoute>
                <MyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:roomId"
            element={
              <ProtectedRoute>
                <ChatRoomPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
