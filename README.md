# Morrell's, Kettering

Website for Morrell's, the ladies and gentlemen's hairdresser at 2 Trafalgar Road, Kettering, NN16 8DA.

GitHub Actions builds the public pages for:

https://creativemkstudios.github.io/Morrell-s-Barber/

The workflow is on `main`. GitHub still has to have Pages turned on for this repository, with the source set to GitHub Actions, before that address serves the site. Booking emails run only when this app is hosted with the Node server and SMTP settings below.

## Run

```bash
npm install
npm test
npm run dev
```

Open http://localhost:4321

## Email

Copy `.env.example` to `.env`.

- Set `MANAGER_EMAIL` to the salon inboxes. Separate more than one with a comma.
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` to send real mail.
- A booking emails the customer and every manager address.
- Without SMTP, the booking is still saved and the guest is told to call 01536 481561. A copy is written to `data/outbox/`.
- `EMAIL_MODE=ethereal` is for a test inbox only. Do not use it on the live site.

Set `PUBLIC_SITE_URL` to the real domain before you build. Canonical links, the sitemap, and Open Graph use it.

## Pay online

The booking form lets a guest pay in the salon or ask to pay online. The form never takes a card number. Card charging stays off until the salon adds current prices and a Stripe secret. Do not publish the June 2019 window price (£69.95) as today's price.

## Facts

Hours, the 4.5 score, the review count, the address, and the phone number come from the Google listing and were checked on 4 November 2026. The shop photos are the June 2019 Google profile photo.
