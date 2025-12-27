import React, { useState, useMemo } from 'react';
import { Layout, Splitter } from 'antd';
import Toolbar from './components/Toolbar';
import WaterfallViewer from './components/WaterfallViewer';
import RequestTable from './components/RequestTable';
import RequestDetails from './components/RequestDetails';
import { useNetworkCapture } from './hooks/useNetworkCapture';
import { useNetworkFilter } from './hooks/useNetworkFilter';
import { convertToHAR } from './utils/convertToHAR';
import { exportHARFile } from './utils/exportHAR';
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

  // Convert to HAR format
  const harData = useMemo(() => {
    return convertToHAR(filteredRequests);
  }, [filteredRequests]);

  // Export HAR
  const handleExportHAR = () => {
    const success = exportHARFile(harData, `network-${Date.now()}.har`);
    if (success) {
      console.log('HAR exported successfully');
    }
  };

  // Handle waterfall request selection
  const handleWaterfallSelect = (requestId: string) => {
    const request = filteredRequests.find((r) => new Date(r.startTime).toISOString() === requestId);
    if (request) {
      setSelectedRequest(request);
    }
  };

  return (
    <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fff',
        }}
      >
        <Toolbar
          isPaused={isPaused}
          togglePause={togglePause}
          clearRequests={clearRequests}
          onExportHAR={handleExportHAR}
          requestCount={requests.length}
          {...filterProps}
        />
      </div>

      {/* Waterfall area */}
      <div style={{ height: 400, flexShrink: 0 }}>
        <WaterfallViewer
          harData={harData}
          height={400}
          selectedId={selectedRequest ? new Date(selectedRequest.startTime).toISOString() : null}
          onRequestSelect={handleWaterfallSelect}
        />
      </div>

      {/* Request list + details */}
      <Content style={{ flex: 1, overflow: 'hidden' }}>
        <Splitter layout="vertical">
          {/* Request list */}
          <Splitter.Panel defaultSize="60%" min="40%" max="80%">
            <RequestTable
              requests={filteredRequests}
              selectedId={selectedRequest?.id || null}
              onSelectRequest={setSelectedRequest}
            />
          </Splitter.Panel>

          {/* Request details */}
          <Splitter.Panel>
            <RequestDetails request={selectedRequest} />
          </Splitter.Panel>
        </Splitter>
      </Content>
    </Layout>
  );
};

export default Network;
