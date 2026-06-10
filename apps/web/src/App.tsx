import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import IndexPage from './pages/index'
import SignupPage from './pages/signup'
import LoginPage from './pages/login'
import ForBusinessPage from './pages/for-business'
import ForConsumersPage from './pages/for-consumers'
import ForTeamsPage from './pages/for-teams'
import HowItWorksPage from './pages/how-it-works'
import AppLayout from './layouts/AppLayout'
import ProfilePage from './pages/profile/ProfilePage'
import StoresPage from './pages/stores/StoresPage'
import StoreDetailPage from './pages/stores/StoreDetailPage'
import HomePage from './pages/home/HomePage'
import CauseDetailPage from './pages/causes/CauseDetailPage'
import CausesListPage from './pages/causes/CausesListPage'
import MyCausesPage from './pages/causes/MyCausesPage'
import MyPurchasesPage from './pages/purchases/MyPurchasesPage'
import PendingPurchasesPage from './pages/merchant/PendingPurchasesPage'
import PublicLayout from './layouts/PublicLayout'
import ScrollToTop from './components/ScrollToTop'
import AdminLayout from './pages/admin/AdminLayout'
import AdminMerchantsPage from './pages/admin/AdminMerchantsPage'
import AdminMerchantNewPage from './pages/admin/AdminMerchantNewPage'
import AdminStoresPage from './pages/admin/AdminStoresPage'
import AdminStoreNewPage from './pages/admin/AdminStoreNewPage'
import AdminStoreCausesPage from './pages/admin/AdminStoreCausesPage'
import AdminCampaignsPage from './pages/admin/AdminCampaignsPage'
import AdminCampaignFormPage from './pages/admin/AdminCampaignNewPage'
import AdminCausesPage from './pages/admin/AdminCausesPage'
import AdminCauseFormPage from './pages/admin/AdminCauseFormPage'
import AdminMerchantEditPage from './pages/admin/AdminMerchantEditPage'
import AdminStoreEditPage from './pages/admin/AdminStoreEditPage'
import ForgotPasswordPage from './pages/forgot-password'
import ResetPasswordPage from './pages/reset-password'
import RoleGuard from './components/RoleGuard'
import ScanQR from './pages/app/ScanQR'
import PagarComercio from './pages/app/PagarComercio'
import PagoExitoso from './pages/app/PagoExitoso'
import PagoFallido from './pages/app/PagoFallido'

export default function App() {
    return (
        <BrowserRouter>
            {/* Ensure each navigation starts at top */}
            <ScrollToTop />
            <Routes>
                {/* Public area with public header/footer */}
                <Route element={<PublicLayout />}>
                    <Route index element={<IndexPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/for-consumers" element={<ForConsumersPage />} />
                    <Route path="/for-teams" element={<ForTeamsPage />} />
                    <Route path="/for-business" element={<ForBusinessPage />} />
                    <Route path="/for-merchants" element={<ForBusinessPage />} />
                    <Route path="/causas" element={<CausesListPage />} />
                    <Route path="/causas/:slug" element={<CauseDetailPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                {/* Private app with private header */}
                <Route path="/app" element={<AppLayout />}>
                    <Route index element={<Navigate to="home" replace />} />
                    <Route path="home" element={<HomePage />} />
                    <Route path="dashboard" element={<ProfilePage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="stores" element={<StoresPage />} />
                    <Route path="stores/:id" element={<StoreDetailPage />} />
                    <Route path="purchases" element={<MyPurchasesPage />} />
                    <Route path="merchant/purchases" element={<RoleGuard roles={['MERCHANT', 'ADMIN']}><PendingPurchasesPage /></RoleGuard>} />
                    <Route path="causes/:slug" element={<CauseDetailPage />} />
                    <Route path="causes" element={<MyCausesPage />} />
                    <Route path="settings" element={<div className="p-6">Settings (próximamente)</div>} />
                    <Route path="scan" element={<ScanQR />} />
                    <Route path="pagar/:slug" element={<PagarComercio />} />
                    <Route path="pago-exitoso" element={<PagoExitoso />} />
                    <Route path="pago-fallido" element={<PagoFallido />} />
                    <Route path="pago-pendiente" element={<PagoExitoso />} />
                    <Route path="admin" element={<AdminLayout />}>
                        <Route index element={<Navigate to="merchants" replace />} />
                        <Route path="merchants" element={<AdminMerchantsPage />} />
                        <Route path="merchants/new" element={<AdminMerchantNewPage />} />
                        <Route path="merchants/:id/edit" element={<AdminMerchantEditPage />} />
                        <Route path="stores" element={<AdminStoresPage />} />
                        <Route path="stores/new" element={<AdminStoreNewPage />} />
                        <Route path="stores/:id/edit" element={<AdminStoreEditPage />} />
                        <Route path="stores/:id/causes" element={<AdminStoreCausesPage />} />
                        <Route path="campaigns" element={<AdminCampaignsPage />} />
                        <Route path="campaigns/new" element={<AdminCampaignFormPage />} />
                        <Route path="campaigns/:id/edit" element={<AdminCampaignFormPage />} />
                        <Route path="causes" element={<AdminCausesPage />} />
                        <Route path="causes/new" element={<AdminCauseFormPage />} />
                        <Route path="causes/:slug/edit" element={<AdminCauseFormPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}
