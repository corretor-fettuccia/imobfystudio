# Smart Plant 1.4.9

Ao selecionar uma planta e clicar no CTA que utiliza Form Sender V4 ou Agendamento Sender, o modal é fechado sem disparar um `scrollTo` de retorno às plantas. Esse retorno usava rolagem suave herdada do Core e podia competir com a ida para `#contato`. O fechamento comum do modal continua restaurando imediatamente a posição original. Texto e ID da planta continuam associados ao formulário escolhido.
