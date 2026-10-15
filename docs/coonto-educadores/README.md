# Apresentação pública do Coonto Educação

Fonte editorial: `tguarizo/dev.coonto.com`, branch `feature/apresentacao-educadores`, commit `eda2a42`. O diretório `site/` preserva os arquivos dessa publicação para o fluxo com acesso já configurado à VPS.

- Página principal: https://coonto.com/
- Página para educadores: https://coonto.com/para-educadores.html
- PDF: https://coonto.com/materiais/coonto-educacao-parcerias.pdf
- Experiência interativa: https://dev.coonto.com

A auditoria confirmou que coonto.com é servido como arquivos estáticos em `/opt/coonto/prod` dentro do Caddy. A experiência atual é servida separadamente em dev.coonto.com. Publicar o código completo de desenvolvimento no domínio principal substituiria a experiência existente, fora do escopo desta entrega.

O publicador valida o domínio e o diretório, identifica o bind mount correspondente, salva cópia dos arquivos afetados e publica a página principal aprovada e os cinco arquivos da apresentação. A página inicial destaca “Entre na história. Descubra o livro.”, com “Experimentar o Coonto” como ação principal e o PDF como ação secundária. Os arquivos da experiência anterior, as rotas do proxy, os contêineres e os dados existentes são preservados. Em erro de verificação pública, restaura os arquivos anteriores.

O navegador verifica a página inicial em computador e celular, a hierarquia das ações, o download com o nome esperado e a identidade binária do PDF, a navegação para educadores e de volta ao início, o link da experiência e os contatos. O documento de quatro páginas foi conferido antes desta publicação.
