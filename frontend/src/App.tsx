import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
const JournalRefreshPreview = lazy(() => import('./pages/Preview/JournalRefreshPreview'))
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" state={{ from: location }} replace />
}

export default function App() {
  const { isAuthenticated, accessToken, setUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      authApi.getMe().then(setUser).catch(() => { })
    }
  }, [isAuthenticated, accessToken, setUser])

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-100 border-t-brand"></div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
          <Route path="/__preview/journal-refresh" element={<JournalRefreshPreview />} />
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <main className="flex-1 pb-20 sm:pb-0">
                  <Routes>
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
                  </Routes>
                </main>
                <MobileTabBar />
                <footer className="hidden sm:block border-t border-gray-100 bg-warm-50 text-gray-400 py-8 px-4 text-center text-sm">
                  <p className="font-medium text-gray-600">CurtainCall <span className="text-brand">—</span> 공연 아카이브 플랫폼</p>
                  <p className="mt-1">공연 정보는 KOPIS(공연예술통합전산망)에서 제공됩니다.</p>
                </footer>
              </>
            }
          />
        </Routes>
      </Suspense>
    </div>
  )
}
