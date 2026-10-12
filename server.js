const http = require('http');

const PORT = process.env.PORT || 3000;
const VERSION = '0.1.0-alpha';

const server = http.createServer((req, res) => {
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'coonto-corporate',
      version: VERSION,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coonto Corporate — v${VERSION}</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0b0f19;
      color: #f3f4f6;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 2.5rem;
      max-width: 600px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      background: #064e3b;
      color: #34d399;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      letter-spacing: 0.05em;
    }
    h1 {
      font-size: 2rem;
      margin: 0 0 1rem;
      color: #ffffff;
    }
    p {
      color: #9ca3af;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .info {
      background: #1e293b;
      border-radius: 8px;
      padding: 1rem;
      font-family: monospace;
      font-size: 0.85rem;
      color: #38bdf8;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">AMBIENTE PRONTO — v${VERSION}</div>
    <h1>Coonto Corporate</h1>
    <p>A infraestrutura de desenvolvimento na VPS atual foi provisionada com sucesso e está aguardando o primeiro release do repositório.</p>
    <div class="info">
      <div>Ambiente: corporate-dev.coonto.com</div>
      <div>Porta interna: ${PORT}</div>
      <div>Banco: PostgreSQL 16 (Isolado)</div>
      <div>Status: Saudável (/api/health)</div>
    </div>
  </div>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Coonto Corporate v${VERSION} escutando na porta ${PORT}`);
});
