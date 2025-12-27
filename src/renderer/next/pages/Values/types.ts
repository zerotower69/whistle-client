/**
 * TypeScript type definitions for Values page
 */

export interface ValueItem {
  key: string; // Unique identifier
  name: string; // Display name
  content: string; // Content
  language: string; // Language type (json, javascript, html, css, text, xml, etc.)
  createTime: number; // Create time
  updateTime: number; // Update time
}

export interface ValueTreeNode {
  key: string;
  title: string;
  icon?: React.ReactNode;
  children?: ValueTreeNode[];
  isLeaf: boolean;
  data?: ValueItem;
}
