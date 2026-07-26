export const COMPANY_RULE_IMAGE_BASE = '/images/revision/company-rule-early-acts';

export type CompanyRuleImageMeta = {
  src: string;
  width: number;
  height: number;
  alt: string;
  sizes?: string;
};

export const companyRuleRevisionImages = {
  regulatingAct1773: {
    src: `${COMPANY_RULE_IMAGE_BASE}/regulating-act-1773-illustration.png`,
    width: 582,
    height: 375,
    alt: 'British officer presenting the Regulating Act 1773 scroll from Parliament toward Fort William, Calcutta',
    sizes: '(max-width: 1024px) 100vw, 54vw',
  },
} as const satisfies Record<string, CompanyRuleImageMeta>;

export type CompanyRuleImageKey = keyof typeof companyRuleRevisionImages;

export function getCompanyRuleImage(key: CompanyRuleImageKey): CompanyRuleImageMeta {
  return companyRuleRevisionImages[key];
}
