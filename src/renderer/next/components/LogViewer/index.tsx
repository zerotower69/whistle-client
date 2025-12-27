import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Button, Space, Select, Badge, Tooltip } from 'antd';
import './index.css';

const { Option } = Select;

const LogViewer: React.FC = () => {
  console.log('[LogViewer] Rendering...');
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const isInitialized = useRef(false);

  // 初始化加载状态
  useEffect(() => {
    const { ipcRenderer } = window.require('electron');
    const loadSettings = async () => {
      const savedVisible = await ipcRenderer.invoke('get-setting', 'log-viewer-visible');
      const savedMinimized = await ipcRenderer.invoke('get-setting', 'log-viewer-minimized');
      const savedFilter = await ipcRenderer.invoke('get-setting', 'log-viewer-filter');

      if (savedVisible !== null) setVisible(!!savedVisible);
      if (savedMinimized !== null) setMinimized(!!savedMinimized);
      if (savedFilter !== null) setFilter(String(savedFilter));
      isInitialized.current = true;
    };
    loadSettings();
  }, []);

  // 状态变更时保存
  useEffect(() => {
    if (!isInitialized.current) return;
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.invoke('set-setting', { key: 'log-viewer-visible', value: visible });
  }, [visible]);

  useEffect(() => {
    if (!isInitialized.current) return;
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.invoke('set-setting', { key: 'log-viewer-minimized', value: minimized });
  }, [minimized]);

  useEffect(() => {
    if (!isInitialized.current) return;
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.invoke('set-setting', { key: 'log-viewer-filter', value: filter });
  }, [filter]);

  useEffect(() => {
    if (!visible || minimized || !terminalRef.current) return;

    if (!xtermRef.current) {
      const term = new Terminal({
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#aeafad',
          selectionBackground: '#264f78',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
        },
        fontSize: 12,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        scrollback: 5000,
        disableStdin: true,
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // 监听窗口大小变化
      const handleResize = () => fitAddon.fit();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } else {
      // 重新调整大小
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    }
  }, [visible, minimized]);

  useEffect(() => {
    const { ipcRenderer } = window.require('electron');

    const handleLog = (_: any, data: { level: string; message: string }) => {
      if (!visible || minimized) {
        setUnreadCount((prev) => prev + 1);
      }

      if (xtermRef.current) {
        // 根据过滤级别决定是否显示
        if (filter === 'all' || filter === data.level) {
          let color = '';
          switch (data.level) {
            case 'error':
              color = '\x1b[31m';
              break; // Red
            case 'warn':
              color = '\x1b[33m';
              break; // Yellow
            case 'info':
              color = '\x1b[32m';
              break; // Green
            default:
              color = '\x1b[37m';
              break; // White
          }
          xtermRef.current.writeln(`${color}${data.message}\x1b[0m`);
        }
      }
    };

    const handleHistory = (_: any, lines: string[]) => {
      if (xtermRef.current) {
        xtermRef.current.clear();
        lines.forEach((line) => {
          const isError = line.includes('[error]');
          const isWarn = line.includes('[warn]');
          const isInfo = line.includes('[info]');

          let level = 'info';
          if (isError) level = 'error';
          else if (isWarn) level = 'warn';

          if (filter === 'all' || filter === level) {
            let color = '\x1b[37m'; // Default white
            if (isError) color = '\x1b[31m';
            else if (isWarn) color = '\x1b[33m';
            else if (isInfo) color = '\x1b[32m';
            xtermRef.current?.writeln(`${color}${line}\x1b[0m`);
          }
        });
        xtermRef.current.scrollToBottom();
      }
    };

    ipcRenderer.on('log-data', handleLog);
    ipcRenderer.on('log-history', handleHistory);

    if (visible && !minimized) {
      ipcRenderer.send('request-logs');
    }

    return () => {
      ipcRenderer.removeListener('log-data', handleLog);
      ipcRenderer.removeListener('log-history', handleHistory);
    };
  }, [visible, minimized, filter]);

  const clearLogs = () => {
    xtermRef.current?.clear();
  };

  const scrollToBottom = () => {
    xtermRef.current?.scrollToBottom();
  };

  const toggleVisible = () => {
    setVisible(!visible);
    if (!visible) {
      setUnreadCount(0);
      setMinimized(false);
    }
  };

  if (!visible || minimized) {
    return (
      <div className="log-viewer-trigger">
        <Badge count={unreadCount} size="small">
          <Button
            type="primary"
            shape="circle"
            icon={<div className="i-mdi:terminal w-6 h-6" />}
            onClick={() => {
              setVisible(true);
              setMinimized(false);
              setUnreadCount(0);
            }}
            size="large"
          />
        </Badge>
      </div>
    );
  }

  return (
    <div className="log-viewer-container">
      <div className="log-viewer-header">
        <div className="header-title">
          <div className="i-mdi:terminal w-4 h-4 mr-2" />
          运行日志
        </div>
        <div className="header-actions">
          <Space size="small">
            <Select
              size="small"
              value={filter}
              onChange={setFilter}
              style={{ width: 100 }}
              dropdownMatchSelectWidth={false}
            >
              <Option value="all">全部级别</Option>
              <Option value="info">Info</Option>
              <Option value="warn">Warning</Option>
              <Option value="error">Error</Option>
            </Select>
            <Tooltip title="清空日志">
              <Button
                size="small"
                type="text"
                icon={<div className="i-mdi:delete w-4 h-4" />}
                onClick={clearLogs}
              />
            </Tooltip>
            <Tooltip title="滚动到底部">
              <Button
                size="small"
                type="text"
                icon={<div className="i-mdi:arrow-down w-4 h-4" />}
                onClick={scrollToBottom}
              />
            </Tooltip>
            <Tooltip title="最小化">
              <Button
                size="small"
                type="text"
                icon={<div className="i-mdi:minus w-4 h-4" />}
                onClick={() => setMinimized(true)}
              />
            </Tooltip>
            <Button
              size="small"
              type="text"
              icon={<div className="i-mdi:close w-4 h-4" />}
              onClick={toggleVisible}
            />
          </Space>
        </div>
      </div>
      <div
        className="log-viewer-body"
        ref={terminalRef}
        style={{ display: minimized ? 'none' : 'block' }}
      />
    </div>
  );
};

export default LogViewer;
