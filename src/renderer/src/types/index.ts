import React from 'react';

/**
 * 菜单项类型定义
 */
export interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

/**
 * 代理状态类型定义
 */
export interface ProxyStatus {
  enabled: boolean;
  port: number;
  host: string;
}

/**
 * 主题类型定义
 */
export type ThemeMode = 'light' | 'dark';

/**
 * 应用配置类型定义
 */
export interface AppConfig {
  theme: ThemeMode;
  proxyStatus: ProxyStatus;
  sidebarCollapsed: boolean;
}
