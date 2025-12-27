import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography } from 'antd';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Result
            status="error"
            title="页面崩溃了"
            subTitle="很抱歉，应用程序遇到了一个意外错误。"
            extra={[
              <Button type="primary" key="reload" onClick={() => window.location.reload()}>
                刷新页面
              </Button>,
              <Button key="home" onClick={() => window.location.href = '/'}>
                返回首页
              </Button>,
            ]}
          >
            <div className="desc">
              <Paragraph>
                <Text strong style={{ fontSize: 16 }}>
                  错误详情:
                </Text>
              </Paragraph>
              <Paragraph copyable>
                <Text type="danger">{this.state.error?.toString()}</Text>
              </Paragraph>
              {this.state.errorInfo && (
                <details style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>
                  <summary>查看堆栈信息</summary>
                  {this.state.errorInfo.componentStack}
                </details>
              )}
            </div>
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
