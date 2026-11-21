# Imobify Studio 5.0.1.25

## Dados estruturados imobiliários / Search Console

- Remove o uso automático de `Product` para imóveis e empreendimentos.
- Passa a publicar `RealEstateListing` para a página e um tipo imobiliário Schema.org configurável (`Place`, `Residence`, `House`, `SingleFamilyResidence`, `Apartment` ou `ApartmentComplex`) para o imóvel.
- `Offer` é gerado somente quando existe preço numérico válido; preço passa a ser opcional.
- Corrige o erro crítico do Google Search Console: `Especifique offers, review ou aggregateRating`, causado por `Product` sem oferta.
- Corrige normalização monetária brasileira (`R$ 389.900,00`, `389.900`, `389900`).
- O endereço do imóvel não é mais atribuído ao `RealEstateAgent`.
- Checklist SEO passa a validar dados estruturados imobiliários, sem exigir preço.
