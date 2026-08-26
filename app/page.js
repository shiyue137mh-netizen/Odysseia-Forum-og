const examples = [
  '/api/og/threads/1535568851536977981',
  '/api/og/authors/1175027899703758933',
  '/api/og/booklists/426',
  '/api/og/tournaments/4849',
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px', lineHeight: 1.7 }}>
      <h1 style={{ marginBottom: 8 }}>Odysseia Forum OG Service</h1>
      <p style={{ color: '#a1a1aa' }}>
        这个项目只负责根据后端内部分享元数据生成 1200×630 PNG，不承载论坛页面。
      </p>
      <h2 style={{ marginTop: 40 }}>路由</h2>
      <ul>
        {examples.map((path) => (
          <li key={path}><code>{path}</code></li>
        ))}
      </ul>
      <p style={{ marginTop: 40, color: '#a1a1aa' }}>
        路由需要在 Vercel 中配置 API_BASE_URL 与 OG_SERVICE_TOKEN。
      </p>
    </main>
  );
}
