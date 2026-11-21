# Imobify Studio 7.3.8 — SEO e ícones

- Open Graph: seleção PNG/JPEG, compressão no navegador, preservação do formato, limite estrito inferior a 300 KiB, saída `share.png` ou `share.jpg` na raiz do ZIP; conferência adicional pelo compilador.
- Favicon: vetorizador original integrado via modal e iframe isolado no próprio domínio, saída `icon.svg`; prévia e tamanho do arquivo.
- Apple Touch Icon: PNG de 180 × 180 gerado do SVG e incluído como `apple-touch-icon.png`; referência no HTML compilado.
- Prévia SEO: mostra imagem OG e ícone carregados.
- Compatibilidade: referências existentes PNG/WebP de favicon mantidas, URLs remotas preservadas; imagens sociais WebP legadas continuam como URL externa ou mídia de assets pelo caminho legado, mas novos uploads exigem PNG/JPEG.
- Testes: `node tests/seo-root-media-export.test.cjs`, `node --check assets/js/{app,compiler,renderer}.js`.
- Limites: o vetorizador simplifica imagens e pode alterar detalhes; Apple Touch é gerado com SVG rasterizado no navegador. Não foi realizado teste visual com rede social real ou iOS.
