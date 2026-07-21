type SchemaNode = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export function generateOrganizationSchema(input: {
  name: string;
  url: string;
  logo: string;
  description: string;
  contactPoint?: { telephone?: string; email?: string; contactType: string };
  sameAs?: string[];
}): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    logo: input.logo,
    description: input.description,
    ...(input.contactPoint
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            ...input.contactPoint
          }
        }
      : {}),
    sameAs: input.sameAs ?? []
  };
}

export function generateWebsiteSchema(input: {
  name: string;
  url: string;
  searchTarget: string;
}): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: input.searchTarget
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function generateServiceSchema(input: {
  name: string;
  description: string;
  url: string;
  serviceType: string | string[];
  provider: { name: string; url: string };
  audience: string | string[];
  areaServed: string | string[];
}): SchemaNode {
  const audience = Array.isArray(input.audience) ? input.audience : [input.audience];
  const areas = Array.isArray(input.areaServed) ? input.areaServed : [input.areaServed];

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: input.url,
    serviceType: input.serviceType,
    provider: {
      "@type": "Organization",
      name: input.provider.name,
      url: input.provider.url
    },
    audience: audience.map((name) => ({ "@type": "Audience", audienceType: name })),
    areaServed: areas.map((name) => ({ "@type": "Place", name }))
  };
}

export function generateFaqSchema(items: FaqItem[]): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function generateCompanySchema(input: {
  name: string;
  url: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
}): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.website ? { sameAs: [input.website] } : { sameAs: [] }),
    ...(input.industry ? { knowsAbout: input.industry } : {}),
    ...(input.location
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: input.location
          }
        }
      : {})
  };
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function serializeJsonLd(schema: SchemaNode) {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
