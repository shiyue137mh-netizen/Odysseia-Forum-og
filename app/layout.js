export const metadata = {
  title: 'Odysseia Forum OG Service',
  description: '类脑索引独立 Open Graph 图片生成服务',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: '#101217', color: '#f4f4f5', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
