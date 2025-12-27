import React, { useState } from 'react';
import { Layout, Splitter, message } from 'antd';
import Toolbar from './components/Toolbar';
import RequestTable from './components/RequestTable';
import RequestDetails from './components/RequestDetails';
import { useNetworkCapture } from './hooks/useNetworkCapture';
import { useNetworkFilter } from './hooks/useNetworkFilter';
import { downloadHAR } from './utils/exportHAR';
import type { NetworkRequest } from './types';

const { Header, Content } = Layout;

/**
 * Network monitoring page
 * Used for monitoring and analyzing HTTP/HTTPS requests
 */
const Network: React.FC = () => {
  const { requests, isPaused, togglePause, clearRequests } = useNetworkCapture();
  const {
    filteredRequests,
    searchText,
    setSearchText,
    selectedMethods,
    setSelectedMethods,
    selectedTypes,
    setSelectedTypes,
  } = useNetworkFilter(requests);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);

  const handleExportHAR = () => {
    try {
      downloadHAR(filteredRequests);
      message.success('HAR 文件导出成功');
    } catch (error) {
      message.error('HAR 文件导出失败');
    }
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          height: 64,
        }}
      >
        <Toolbar
          isPaused={isPaused}
          togglePause={togglePause}
          clearRequests={clearRequests}
          exportHAR={handleExportHAR}
          requestCount={requests.length}
          searchText={searchText}
          onSearchChange={setSearchText}
          selectedMethods={selectedMethods}
          onMethodsChange={setSelectedMethods}
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
        />
      </Header>

      <Content style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        <Splitter layout="vertical" style={{ height: '100%' }}>
          <Splitter.Panel defaultSize="60%" min="40%" max="80%">
            <RequestTable
              requests={filteredRequests}
              selectedId={selectedRequest?.id || null}
              onSelectRequest={setSelectedRequest}
            />
          </Splitter.Panel>

          <Splitter.Panel>
            <RequestDetails request={selectedRequest} />
          </Splitter.Panel>
        </Splitter>
      </Content>
    </Layout>
  );
};

export default Network;
