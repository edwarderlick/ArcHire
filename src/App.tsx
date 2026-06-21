import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from './config/wagmi';
import { AppProvider } from './context/AppContext';

const queryClient = new QueryClient();

// Views
import { WelcomeView } from './views/WelcomeView';
import { MarketplaceView } from './views/MarketplaceView';
import { AgentProfileView } from './views/AgentProfileView';
import { HireFlowView } from './views/HireFlowView';
import { DashboardView } from './views/DashboardView';
import { JobDetailView } from './views/JobDetailView';
import { WalletView } from './views/WalletView';

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppProvider>
            <Router>
              <Routes>
                <Route path="/" element={<WelcomeView />} />
                <Route path="/marketplace" element={<MarketplaceView />} />
                <Route path="/agent/:id" element={<AgentProfileView />} />
                <Route path="/hire/:id" element={<HireFlowView />} />
                <Route path="/dashboard" element={<DashboardView />} />
                <Route path="/job/:id" element={<JobDetailView />} />
                <Route path="/wallet" element={<WalletView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </AppProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
