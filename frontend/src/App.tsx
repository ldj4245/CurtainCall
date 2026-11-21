import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { useAuthStore } from './store/authStore'
import { authApi } from './api/auth'
import Navbar from './components/common/Navbar'

const PlansPage = lazy(() => import('./pages/Plans/PlansPage'))
const NotificationsPage = lazy(() => import('./pages/Notifications/NotificationsPage'))
const SharedRecordPage = lazy(() => import('./pages/Shared/SharedRecordPage'))
const HomePage = lazy(() => import('./pages/Home/HomePage'))
const ShowListPage = lazy(() => import('./pages/Shows/ShowListPage'))
const ShowDetailPage = lazy(() => import('./pages/Shows/ShowDetailPage'))
const DiaryPage = lazy(() => import('./pages/Diary/DiaryPage'))
const MyPage = lazy(() => import('./pages/MyPage/MyPage'))
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'))
const SignUpPage = lazy(() => import('./pages/Auth/SignUpPage'))
const OAuth2Callback = lazy(() => import('./pages/Auth/OAuth2Callback'))
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'))

import ErrorBoundary from './components/common/ErrorBoundary'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" state={{ from: location }} replace />
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-surface-base selection:bg-brand/15 selection:text-brand">
      <div className="min-h-screen relative flex flex-col">
        <Navbar />
        <main id="main-content" className="flex-1 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-base flex justify-center">
      <div className="w-full min-h-screen relative flex flex-col">
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
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-base">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line-base border-t-brand" />
        </div>
      }>
        <Routes>
        {/* 인증 라우트 */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
        </Route>

        {/* 메인 웹앱 라우트 */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shows" element={<ShowListPage />} />
          <Route path="/plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/shared/:token" element={<SharedRecordPage />} />
          <Route path="/shows/:id" element={<ShowDetailPage />} />
          <Route
            path="/diary"
            element={
              <DiaryPage />
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
    </ErrorBoundary>
  )
}
