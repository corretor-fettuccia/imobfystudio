# ImobStudio 6.0.68 — Agendamento Sender 1.1.0

- Herança real de tokens globais de cor, tipografia, raio e botões; modo local opcional.
- Presets auto por perfil estratégico do projeto; Popular, Contemporâneo, Sofisticado e Minimalista.
- Sete toggles de dias atendidos; os indisponíveis aparecem no calendário riscados, desabilitados (inclusive blockedDates) e excluídos do envio.
- Calendário cronológico mantém datas bloqueadas nas posições reais; primeiro dia disponível é selecionado e navegação automática.
- Preserva o contrato FormSender V4 e o feedback de notificações da 6.0.67.
- Corrigida a referência `__projectProfile` no renderizador de plugins, habilitando presets automáticos do projeto.
- Migração preserva os ajustes legados `skipSaturday` e `skipSunday`, bem como as cores manuais em projetos antigos; novos projetos usam tema global e toggles explícitos.
- Sem integração com calendário externo; solicitação continua pendente.
