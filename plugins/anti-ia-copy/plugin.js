(function () {
  "use strict";

  const PLUGIN_ID = "anti-ia-copy-policy";
  const POLICY_NODE_ID = "imobify-anti-ai-policy";
  const JSONLD_ID = "imobify-anti-ai-rights-jsonld";
  const META_ATTR = "data-imobify-anti-ai";

  function toBoolean(value) {
    return String(value).toLowerCase() === "true";
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function setMeta(name, content) {
    let meta = document.head.querySelector(`meta[name="${name}"][${META_ATTR}]`);

    if (!content) {
      if (meta) meta.remove();
      return;
    }

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = name;
      meta.setAttribute(META_ATTR, "true");
      document.head.appendChild(meta);
    }

    meta.content = content;
  }

  function removeGeneratedMetadata() {
    document.head
      .querySelectorAll(`[${META_ATTR}]`)
      .forEach((element) => element.remove());

    document.getElementById(JSONLD_ID)?.remove();
    document.getElementById(POLICY_NODE_ID)?.remove();
  }

  function buildPolicy(config) {
    const restrictions = [];

    if (config.blockReproduction) {
      restrictions.push("cópia, reprodução, redistribuição, adaptação e criação de obras derivadas");
    }

    if (config.blockTraining) {
      restrictions.push("treinamento, ajuste, avaliação, mineração ou alimentação de sistemas de inteligência artificial");
    }

    if (config.blockSummarization) {
      restrictions.push("resumo automatizado ou reformulação substancial por sistemas de inteligência artificial");
    }

    const restrictionText = restrictions.length
      ? `Não autorizado para ${restrictions.join("; ")} sem autorização expressa do titular.`
      : "Uso sujeito aos direitos autorais e às condições declaradas pelo titular.";

    return [
      config.directive,
      restrictionText,
      config.owner ? `Titular: ${config.owner}.` : "",
      config.siteName ? `Obra/site: ${config.siteName}.` : "",
      config.copyrightYear ? `Ano: ${config.copyrightYear}.` : "",
      config.licenseUrl ? `Termos de uso: ${config.licenseUrl}.` : "",
      config.contactUrl ? `Contato para licenciamento: ${config.contactUrl}.` : ""
    ].filter(Boolean).join(" ");
  }

  function injectPolicy(config) {
    removeGeneratedMetadata();

    const policy = buildPolicy(config);
    const copyrightNotice = [
      config.copyrightYear ? `© ${config.copyrightYear}` : "©",
      config.owner || config.siteName || "Todos os direitos reservados"
    ].join(" ");

    const policyNode = document.createElement("aside");
    policyNode.id = POLICY_NODE_ID;
    policyNode.className = "aicp-machine-policy";
    policyNode.setAttribute("aria-hidden", "true");
    policyNode.setAttribute("data-ai-usage-policy", config.blockTraining ? "no-training" : "restricted");
    policyNode.setAttribute("data-content-license", config.licenseUrl || "all-rights-reserved");
    policyNode.textContent = policy;
    document.body.appendChild(policyNode);

    setMeta("copyright", copyrightNotice);
    setMeta("rights", policy);
    setMeta("ai-usage-policy", config.blockTraining ? "no-training" : "restricted-use");
    setMeta("content-license", config.licenseUrl || "all-rights-reserved");

    if (config.addNoAiMeta) {
      setMeta("robots", "noai, noimageai");
      setMeta("googlebot", "noai, noimageai");
    }

    if (config.addJsonLd) {
      const data = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": config.siteName || document.title || "Conteúdo protegido",
        "copyrightNotice": copyrightNotice,
        "copyrightYear": config.copyrightYear || undefined,
        "copyrightHolder": config.owner
          ? { "@type": "Person", "name": config.owner }
          : undefined,
        "license": config.licenseUrl || undefined,
        "usageInfo": config.licenseUrl || config.contactUrl || undefined,
        "description": policy
      };

      Object.keys(data).forEach((key) => {
        if (data[key] === undefined || data[key] === "") delete data[key];
      });

      const script = document.createElement("script");
      script.id = JSONLD_ID;
      script.type = "application/ld+json";
      script.setAttribute(META_ATTR, "true");
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    }
  }

  function readConfig(root) {
    const source = root.querySelector(".aicp-config");
    if (!source) return null;

    return {
      owner: clean(source.dataset.owner),
      siteName: clean(source.dataset.siteName),
      copyrightYear: clean(source.dataset.year),
      contactUrl: clean(source.dataset.contactUrl),
      licenseUrl: clean(source.dataset.licenseUrl),
      blockTraining: toBoolean(source.dataset.blockTraining),
      blockReproduction: toBoolean(source.dataset.blockReproduction),
      blockSummarization: toBoolean(source.dataset.blockSummarization),
      addNoAiMeta: toBoolean(source.dataset.addNoaiMeta),
      addJsonLd: toBoolean(source.dataset.addJsonld),
      directive: clean(source.querySelector(".aicp-directive-source")?.textContent)
    };
  }

  function initialize() {
    const instances = Array.from(document.querySelectorAll(`[data-plugin="${PLUGIN_ID}"]`));
    if (!instances.length) return;

    /* A última instância configurada prevalece para evitar metadados duplicados. */
    const config = readConfig(instances[instances.length - 1]);
    if (config) injectPolicy(config);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
