# Imobify Studio 7.3.5 — correção Smart Plant → #contato

Base: 7.3.4. Revisão do fluxo de conversão conforme Ponytail (correção, segurança de estado, regressões, simplicidade).

## Causa identificada e corrigida

O Core usa `html { scroll-behavior: smooth; }`. Antes da navegação, `unlockPage()` chamava `window.scrollTo(0, lockedScrollY)` para retornar ao ponto das plantas. Essa chamada respeitava o scroll suave global e iniciava uma animação de retorno **mesmo ao clicar no CTA do formulário**. Isso podia concorrer com a navegação para `#contato`, especialmente após o fechamento do modal e a mudança de layout no celular.

## Fluxo atualizado

1. O CTA resolve Form Sender V4 ou Agendamento Sender (mantida a escolha explícita ou automática).
2. Fecha o modal, libera o bloqueio de scroll do `body` e **não inicia rolagem de retorno às plantas**.
3. Transfere a identificação, título, metragem e mensagem da planta selecionada ao formulário correspondente.
4. Navega para o ID da âncora configurada (`contato`, por exemplo), independentemente da seção que contém o formulário; dá foco ao nome, sem provocar nova rolagem.
5. O botão X, fundo do modal ou Escape **continuam restaurando** a posição original; essa restauração é imediata e não concorre com o CTA.

Smart Plant: 1.4.9. Studio: 7.3.5. Compatibilidade com projetos existentes preservada.

## Implantação

Abrir esta versão do Studio, importar o projeto existente, conferir Smart Plant → `Destino do CTA: Form Sender` e `Âncora: contato`, reexportar a landing page e republicar **todos** os arquivos gerados (incluindo `assets/js/site.js`). Eliminar cache/CDN de versões anteriores.

## Verificação

Fixture real de exportação e prévia do editor com Chromium nas larguras desktop e mobile, conferindo modal fechado, formulário preenchido, hash e rolagem; testes Node de integração e empacotamento. O envio ao endpoint comercial externo não foi exercitado.
