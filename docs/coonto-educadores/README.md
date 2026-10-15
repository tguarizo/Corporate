# Apresentação pública do Coonto Educação

Fonte editorial: `tguarizo/dev.coonto.com`, branch `feature/apresentacao-educadores`, commit `eda2a42`. O diretório `site/` preserva os arquivos dessa publicação para o fluxo com acesso já configurado à VPS.

- Página institucional: https://coonto.com/para-educadores/
- PDF: https://coonto.com/materiais/coonto-educacao-parcerias.pdf
- Experiência interativa: https://dev.coonto.com

A auditoria confirmou que coonto.com é servido como arquivos estáticos em `/opt/coonto/prod` dentro do Caddy. A experiência atual é servida separadamente em dev.coonto.com. Publicar o código completo de desenvolvimento no domínio principal substituiria a experiência existente, fora do escopo desta entrega.

O publicador valida o domínio e o diretório, identifica o bind mount correspondente, salva cópia dos arquivos afetados e escreve apenas os cinco arquivos do material e um link no HTML inicial. Os arquivos da experiência, as rotas do proxy, os contêineres e os dados existentes são preservados. Em erro de verificação pública, restaura os arquivos anteriores.

O navegador verifica a entrada pela página inicial, a página de educadores em computador e celular, o download com o nome esperado, a identidade binária do PDF, o link da experiência e os contatos. O documento de quatro páginas foi conferido antes desta publicação.
