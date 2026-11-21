# Hero360Tour 1.2.2 — roteiro de validação de sensores

**Android (Chrome / Samsung Internet)**: publique a LP em HTTPS, abra diretamente no navegador (não dentro do iframe do editor), toque em "Explorar em 360°", confirme que aparece "Sensor conectado". Mova o celular horizontalmente e verticalmente: a cena deve acompanhar. Teste também com a tela girada, recalibrando em seguida. Caso apareça "Nenhuma leitura recebida", o navegador não disponibilizou leitura; a navegação manual continua.

**iPhone/iPad (Safari)**: em HTTPS, toque em "Explorar em 360°" e autorize movimento e orientação quando o sistema solicitar. Faça os mesmos testes de giro, inclinação, recentralização e troca de cena. A autorização depende do navegador e do aparelho.

**Preview do ImobStudio:** as prévias usam iframes com sandbox de segurança. Apesar da delegação dos recursos `accelerometer`, `gyroscope` e `magnetometer`, alguns navegadores continuam bloqueando os sensores dentro do editor. Para avaliar o movimento físico, use sempre a LP exportada e hospedada em HTTPS. Nunca remova o sandbox do preview apenas para liberar sensores.

**Diagnóstico:** `data-motion-state` no elemento `.ims360` mostra `waiting`, `connected`, `insecure`, `blocked`, `unsupported`, `denied` ou `no-data`; `data-motion-source` identifica `deviceorientation`, `deviceorientationabsolute` ou `generic`; `data-motion-readings` mostra o número de amostras recebidas. O componente não envia dados dos sensores a um servidor.

**Limitação dos testes desta versão:** testes automatizados simulam leituras nas rotas de Android/iOS e da Generic Sensor API. Não substituem os testes físicos em dispositivos reais.
