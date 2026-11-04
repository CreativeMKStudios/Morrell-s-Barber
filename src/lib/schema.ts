import { faqs, reviews, salon, services, hoursRows } from "../data/salon.ts";

export function absolute(site: URL | undefined, path: string) {
  if (!site) return path;
  return new URL(path, site).href;
}

export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function hairSalonSchema(site: URL | undefined) {
  const url = absolute(site, "/");
  const image = absolute(site, "/images/shop-1600.jpg");
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${url}#salon`,
    name: salon.name,
    description:
      "Ladies and gentlemen's hairdresser at 2 Trafalgar Road, Kettering. Cuts, colour, blow drys and straightening.",
    image,
    telephone: salon.phoneTel,
    url,
    currenciesAccepted: "GBP",
    address: {
      "@type": "PostalAddress",
      streetAddress: salon.address.street,
      addressLocality: salon.address.locality,
      addressRegion: salon.address.region,
      postalCode: salon.address.postalCode,
      addressCountry: salon.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: salon.geo.latitude,
      longitude: salon.geo.longitude,
    },
    hasMap: salon.mapsUrl,
    openingHoursSpecification: hoursRows
      .filter((row) => row.hours)
      .map((row) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${row.name}`,
        opens: row.hours!.open,
        closes: row.hours!.close,
      })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: salon.rating,
      reviewCount: salon.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews
      .filter((review) => review.rating)
      .map((review) => ({
        "@type": "Review",
        author: { "@type": "Person", name: review.author },
        datePublished: review.date,
        reviewBody: review.text,
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
      })),
    areaServed: { "@type": "City", name: "Kettering" },
    sameAs: [salon.mapsUrl, salon.facebookUrl, salon.thatTimeUrl],
    makesOffer: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        serviceType: service.group,
        description: service.summary,
        provider: { "@id": `${url}#salon` },
        areaServed: "Kettering",
      },
    })),
  };
}

export function breadcrumbSchema(
  site: URL | undefined,
  crumbs: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(site, crumb.path),
    })),
  };
}

export function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
