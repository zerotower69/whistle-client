import React, { useState, useMemo, useCallback } from 'react';
import { Layout, Splitter } from 'antd';
import Toolbar from './components/Toolbar';
import WaterfallViewer from './components/WaterfallViewer';
import RequestTable from './components/RequestTable';
import RequestDetails from './components/RequestDetails';
import ErrorBoundary from '../../components/ErrorBoundary';
import { useNetworkCapture } from './hooks/useNetworkCapture';
import { useNetworkFilter } from './hooks/useNetworkFilter';
import { convertToHAR } from './utils/convertToHAR';
import { downloadHAR } from './utils/exportHAR';
import type { NetworkRequest } from './types';

const { Content } = Layout;

/**
 * 网络监控页面
 * 用于监控和分析 HTTP/HTTPS 请求
 */
const Network: React.FC = () => {
  // Network capture logic
  const { requests, isPaused, togglePause, clearRequests } = useNetworkCapture();

  // Filter logic
  const { filteredRequests, ...filterProps } = useNetworkFilter(requests);

  // Selected request
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);

  // Handle request selection
  const handleSelectRequest = useCallback((request: NetworkRequest | null) => {
    setSelectedRequest(request);
  }, []);

  // Convert to HAR format
  const harData = useMemo(() => {
    return convertToHAR(filteredRequests);
  }, [filteredRequests]);

  // Export HAR
  const handleExportHAR = () => {
    try {
      downloadHAR(filteredRequests, `network-${Date.now()}.har`);
    } catch (error) {
      console.error('Failed to export HAR:', error);
    }
  };

  // Handle waterfall request selection
  const handleWaterfallSelect = useCallback(
    (requestId: string) => {
      const request = filteredRequests.find((r) => {
        if (r.id === requestId) return true;
        try {
          return r.startTime && new Date(r.startTime).toISOString() === requestId;
        } catch {
          return false;
        }
      });
      if (request) {
        setSelectedRequest(request);
      }
    },
    [filteredRequests]
  );

  // Get selected ID for waterfall
  const selectedWaterfallId = useMemo(() => {
    if (!selectedRequest || !selectedRequest.startTime) return null;
    try {
      return new Date(selectedRequest.startTime).toISOString();
    } catch {
      return null;
    }
  }, [selectedRequest]);

  return (
    <Layout style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          backgroundColor: 'transparent',
        }}
      >
        <Toolbar
          isPaused={isPaused}
          togglePause={togglePause}
          clearRequests={clearRequests}
          exportHAR={handleExportHAR}
          requestCount={requests.length}
          searchText={filterProps.searchText}
          onSearchChange={filterProps.setSearchText}
          selectedMethods={filterProps.selectedMethods}
          onMethodsChange={filterProps.setSelectedMethods}
          selectedTypes={filterProps.selectedTypes}
          onTypesChange={filterProps.setSelectedTypes}
        />
      </div>

      {/* Main Content Area */}
      <Content style={{ flex: 1, overflow: 'hidden' }}>
        <Splitter orientation="vertical">
          {/* Waterfall area - Top Panel */}
          <Splitter.Panel defaultSize="30%" min="10%" max="60%">
            <ErrorBoundary>
              <WaterfallViewer
                harData={harData}
                height="100%"
                selectedId={selectedWaterfallId}
                onRequestSelect={handleWaterfallSelect}
              />
            </ErrorBoundary>
          </Splitter.Panel>

          {/* Request list + details - Bottom Panel */}
          <Splitter.Panel>
            <Splitter orientation="horizontal">
              {/* Request list */}
              <Splitter.Panel defaultSize="60%" min="20%">
                <ErrorBoundary>
                  <RequestTable
                    requests={filteredRequests}
                    selectedId={selectedRequest?.id || null}
                    onSelectRequest={handleSelectRequest}
                  />
                </ErrorBoundary>
              </Splitter.Panel>

              {/* Request details */}
              {selectedRequest && (
                <Splitter.Panel min="20%">
                  <ErrorBoundary>
                    <RequestDetails
                      request={selectedRequest}
                      onClose={() => handleSelectRequest(null)}
                    />
                  </ErrorBoundary>
                </Splitter.Panel>
              )}
            </Splitter>
          </Splitter.Panel>
        </Splitter>
      </Content>
    </Layout>
  );
};

export default Network;
