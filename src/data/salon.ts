/** Facts checked against the Google listing on 4 November 2026.
 *  Do not invent prices, staff rotas, or offers.
 */

export const salon = {
  name: "Morrell's",
  legalName: "Morrell's",
  category: "Hairdresser",
  tagline: "Ladies and gentlemen's hairdresser",
  phoneDisplay: "01536 481561",
  phoneTel: "+441536481561",
  emailPublic: null as string | null,
  address: {
    street: "2 Trafalgar Road",
    locality: "Kettering",
    region: "Northamptonshire",
    postalCode: "NN16 8DA",
    country: "GB",
    countryName: "United Kingdom",
  },
  geo: {
    latitude: 52.4005658,
    longitude: -0.7293985,
  },
  plusCode: "C72C+66 Kettering",
  mapsCid: "5834682863339105061",
  mapsUrl: "https://www.google.com/maps?cid=5834682863339105061",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=2+Trafalgar+Road%2C+Kettering+NN16+8DA",
  facebookUrl: "https://www.facebook.com/315296929157552",
  thatTimeUrl: "https://that-time.co.uk/morrells",
  rating: 4.5,
  reviewCount: 82,
  ratingChecked: "2026-11-04",
  photoTaken: "2019-06",
  /** Chairs we will hold for the same start time. Not shown as a fact on the site. */
  defaultChairs: 2,
} as const;

export type Opening = { open: string; close: string } | null;

/** Google listing hours. Wednesday close was showing live on 4 November 2026. */
export const weekdayHours: Record<number, Opening> = {
  0: null,
  1: null,
  2: { open: "09:00", close: "17:00" },
  3: { open: "09:00", close: "16:00" },
  4: null,
  5: { open: "09:00", close: "18:00" },
  6: { open: "08:30", close: "16:00" },
};

export const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const hoursRows = weekdayNames.map((name, index) => ({
  name,
  index,
  hours: weekdayHours[index],
}));

export type Service = {
  id: string;
  name: string;
  minutes: number;
  group: "Cuts" | "Colour" | "Blow dry" | "Straighten";
  summary: string;
  detail: string;
  /** Pence. Null until the salon publishes a current price. */
  pricePence: number | null;
};

export const services: Service[] = [
  {
    id: "cut-finish",
    name: "Cut and finish",
    minutes: 45,
    group: "Cuts",
    summary: "A wash, a cut, and a simple finish.",
    detail:
      "The usual visit. We hold 45 minutes. Tell us how you wear your hair now, and what you want changed.",
    pricePence: null,
  },
  {
    id: "dry-cut",
    name: "Dry cut",
    minutes: 30,
    group: "Cuts",
    summary: "A trim on dry hair. No wash.",
    detail:
      "For a shape-up between fuller visits. Guests on Google have booked dry cuts here. We hold 30 minutes.",
    pricePence: null,
  },
  {
    id: "restyle",
    name: "Restyle",
    minutes: 75,
    group: "Cuts",
    summary: "A new shape, not a tiny trim.",
    detail:
      "Bring a photo if you have one. A restyle takes longer than a trim. We hold 75 minutes.",
    pricePence: null,
  },
  {
    id: "dry-shake",
    name: "Dry shake up",
    minutes: 40,
    group: "Blow dry",
    summary: "Blow-dry and shape. No cut.",
    detail:
      "A guest who booked this on the salon's app said the slot was about 40 minutes. We hold 40 minutes.",
    pricePence: null,
  },
  {
    id: "cut-blow",
    name: "Cut and blow dry",
    minutes: 60,
    group: "Blow dry",
    summary: "Cut, then a blow dry.",
    detail: "A full dry finish after the cut. We hold 60 minutes.",
    pricePence: null,
  },
  {
    id: "cut-straighten",
    name: "Cut and straighten",
    minutes: 75,
    group: "Straighten",
    summary: "Cut, then straightened smooth.",
    detail:
      "People book a cut and straighten here. Straightening adds time. We hold 75 minutes.",
    pricePence: null,
  },
  {
    id: "colour",
    name: "Colour",
    minutes: 150,
    group: "Colour",
    summary: "Colour work. Time depends on your hair.",
    detail:
      "Guests write about colour, including lifting box dye. We hold two and a half hours. A big change can take longer. The salon will say so.",
    pricePence: null,
  },
  {
    id: "colour-cut-finish",
    name: "Colour, cut and finish",
    minutes: 180,
    group: "Colour",
    summary: "Colour, then a cut and finish.",
    detail:
      "The full visit. We hold three hours. If your hair needs more time, the salon will tell you before you sit down.",
    pricePence: null,
  },
];

export const serviceGroups = ["Cuts", "Colour", "Blow dry", "Straighten"] as const;

export function serviceById(id: string) {
  return services.find((service) => service.id === id) ?? null;
}

export function formatPrice(pence: number | null) {
  if (pence == null) return "Price in the salon";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!rest) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours} hr ${rest} min`;
}

export type Review = {
  id: string;
  author: string;
  date: string;
  /** Only set when the public Google copy of this review included a score. */
  rating: number | null;
  text: string;
};

/** Real Google review text. Spelling is the guest's. Names only where a public copy of the same review carried one. */
export const reviews: Review[] = [
  {
    id: "nov-2024-jodie-charlotte",
    author: "Google reviewer",
    date: "2024-11-22",
    rating: 5,
    text: "My best place to get my hair sorted the girls are lovely, the weather was freezing I had 4 hour hair appointment, they made me very comfortable with hot water bottle and a blanket with plenty of hot drinks. Thank you Jodie & Charlotte for your lovely caring service. It never disappoints.",
  },
  {
    id: "mar-2024-shqipe",
    author: "Google reviewer",
    date: "2024-03-14",
    rating: 5,
    text: "I just had my hair cut here, the lovely Shqipe cut my hair and style too, she did such an amazing job, and she was so nice and lovely and asking me each time if its okay if is what i want, it was the best experience since i moved in UK at the hair salon, thank you so much for the amazing haircut and hairstyle!",
  },
  {
    id: "dec-2023-ivana",
    author: "Ivana",
    date: "2023-12-19",
    rating: null,
    text: "Staff are all lovely girls. Welcoming, polite, never feel rushed. Salon has a tropical feel to it with all the green plants.",
  },
  {
    id: "oct-2023-addie",
    author: "Addie",
    date: "2023-10-30",
    rating: null,
    text: "Absolutly amazing cut, offered great advice and fixed a botched previous cut for me, defo would go there again xx",
  },
  {
    id: "oct-2023-karen",
    author: "Karen",
    date: "2023-09-19",
    rating: 5,
    text: "I visited the salon today to correct a cut I had elsewhere! Very nervous. The staff (Liz) was lovely and friendly and made me feel at ease as soon as i walked in, I left very happy with my hair. I was initially recommended here by a friend and I will definately pass on a recommendation. Great service! Thank you so much!",
  },
  {
    id: "sep-2023-mollie",
    author: "Mollie",
    date: "2023-09-24",
    rating: null,
    text: "Been going here for a while now trying to get my hair blonde from it being box died black and they never fail to amaze me. They've helped me so much to bring it to the colour I've wanted and all staff have been so friendly and welcoming. Always will recommend.",
  },
  {
    id: "sep-2023-peej",
    author: "Peej",
    date: "2023-09-18",
    rating: null,
    text: "Brilliant staff! Cut my hair perfectly, very nice atmosphere and was relaxing! 10/10 would recommend!",
  },
  {
    id: "sep-2023-atlanta",
    author: "Atlanta",
    date: "2023-09-09",
    rating: null,
    text: "Always leave the salon with my hair looking lovely. All the stylists are really welcoming and great value for money!",
  },
  {
    id: "jan-2022-jan",
    author: "Jan",
    date: "2022-01-24",
    rating: null,
    text: "Chloe, who works at Morells has been cutting my hair and my family's too for the past 15 years. She is an excellent stylist and is extremely personable and welcoming too with a lovely warm, friendly nature. I would recommend her highly!",
  },
  {
    id: "jan-2022-tracey",
    author: "Tracey",
    date: "2022-01-02",
    rating: 5,
    text: "The salon has a lovely feel and Charlotte and her team are friendly and welcoming every time I go there. I have also witnessed them help people who have had bad experiences with other salons - being totally professional at all time. Have my hair done regularly by Ellie here - in fact followed her from my previous salon as wouldn't trust anyone else to do it. She has never given me a bad cut or indeed a colour - in fact her work is so good my husband even notices! Can't wait for my next visit!",
  },
];

export const faqs = [
  {
    question: "Where is Morrell's?",
    answer:
      "2 Trafalgar Road, Kettering, NN16 8DA. The number 2 is on the shop front. The plus code is C72C+66 Kettering.",
  },
  {
    question: "Do you cut men's and women's hair?",
    answer:
      "Yes. Google lists Morrell's as a hairdresser. The shop window says ladies and gentlemen's hairdressers.",
  },
  {
    question: "Which days are you open?",
    answer:
      "Tuesday 9am to 5pm, Wednesday 9am to 4pm, Friday 9am to 6pm, and Saturday 8:30am to 4pm. Closed Monday, Thursday, and Sunday. These hours are from the Google listing. On 4 November 2026, Google showed the salon open and closing at 4pm, which matches Wednesday.",
  },
  {
    question: "How do I pay?",
    answer:
      "Pay in the salon on the day, or choose pay online when you book. This website never asks for your card number. Online card taking only runs if the salon has switched it on. If it is off, you still get the time and you pay in the shop.",
  },
  {
    question: "How much is a cut or colour?",
    answer:
      "The salon has not published a current price list. A poster in the June 2019 shop photo said colour, cut and finish for £69.95. That figure is from 2019. Ask for today's price when you book. You are told the price before you pay.",
  },
  {
    question: "Can I walk in?",
    answer:
      "The June 2019 window reads Non-Appointment Salon. For a set time, book on this site. For today, call 01536 481561 and ask if a chair is free.",
  },
  {
    question: "Is there parking?",
    answer:
      "The salon has not listed its own car park. Trafalgar Road is a town street. Read the kerb signs before you leave the car.",
  },
  {
    question: "Can I ask for a stylist?",
    answer:
      "Yes. Write the name in the booking note. Reviews mention Charlotte, Jodie, Shqipe, Liz, Ellie, and Chloe. This site does not promise who is working this week. The salon will tell you.",
  },
];
