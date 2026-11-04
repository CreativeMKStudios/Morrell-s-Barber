import { services } from "../data/salon.ts";
import {
  addDays,
  calendarCells,
  formatLongDate,
  formatRange,
  hoursFor,
  londonNow,
  monthLabel,
  slotsFor,
} from "../lib/slots.ts";

const form = document.querySelector<HTMLFormElement>("#book-form");
if (form) {
  form.classList.add("is-ready");
  const daysEl = form.querySelector<HTMLElement>("[data-days]")!;
  const timesEl = form.querySelector<HTMLElement>("[data-times]")!;
  const monthEl = form.querySelector<HTMLElement>("[data-month-label]")!;
  const summaryEl = form.querySelector<HTMLElement>("[data-summary]")!;
  const errorEl = form.querySelector<HTMLElement>("[data-error]")!;
  const dateInput = form.querySelector<HTMLInputElement>('input[name="date"]')!;
  const timeInput = form.querySelector<HTMLInputElement>('input[name="time"]')!;
  const serviceInputs = [...form.querySelectorAll<HTMLInputElement>('input[name="serviceId"]')];

  const params = new URLSearchParams(location.search);
  const wanted = params.get("service");
  if (wanted && serviceInputs.some((input) => input.value === wanted)) {
    serviceInputs.forEach((input) => {
      input.checked = input.value === wanted;
    });
  }

  const today = londonNow();
  let cursor = { year: today.year, month: today.month };
  let selectedDate = "";
  let selectedTime = "";

  function selectedService() {
    const id = serviceInputs.find((input) => input.checked)?.value || services[0].id;
    return services.find((service) => service.id === id) || services[0];
  }

  function firstBookable() {
    for (let offset = 0; offset <= 21; offset += 1) {
      const iso = addDays(today.iso, offset);
      if (slotsFor(iso, selectedService().minutes).length) return iso;
    }
    return today.iso;
  }

  selectedDate = firstBookable();
  const [startYear, startMonth] = selectedDate.split("-").map(Number);
  cursor = { year: startYear, month: startMonth };

  function paint() {
    const service = selectedService();
    monthEl.textContent = monthLabel(cursor.year, cursor.month);
    const cells = calendarCells(cursor.year, cursor.month);
    daysEl.replaceChildren();
    for (const cell of cells) {
      if (!cell) {
        const blank = document.createElement("span");
        daysEl.append(blank);
        continue;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "day";
      button.textContent = String(cell.day);
      const open = hoursFor(cell.iso);
      const past = cell.iso < today.iso || cell.iso > addDays(today.iso, 56);
      const bookable = !past && open && slotsFor(cell.iso, service.minutes).length > 0;
      button.disabled = !bookable;
      button.setAttribute("aria-pressed", cell.iso === selectedDate ? "true" : "false");
      button.setAttribute(
        "aria-label",
        `${formatLongDate(cell.iso)}${bookable ? "" : ", not available"}`,
      );
      button.addEventListener("click", () => {
        selectedDate = cell.iso;
        selectedTime = "";
        paint();
      });
      daysEl.append(button);
    }

    const slots = selectedDate ? slotsFor(selectedDate, service.minutes) : [];
    timesEl.replaceChildren();
    if (!slots.length) {
      const note = document.createElement("p");
      note.className = "fine";
      note.textContent = "No times that day. Pick another date.";
      timesEl.append(note);
    }
    for (const slot of slots) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "time";
      button.textContent = formatRange(slot, service.minutes);
      button.setAttribute("aria-pressed", slot === selectedTime ? "true" : "false");
      button.addEventListener("click", () => {
        selectedTime = slot;
        paint();
      });
      timesEl.append(button);
    }

    dateInput.value = selectedDate;
    timeInput.value = selectedTime;
    const when = selectedDate ? formatLongDate(selectedDate) : "Choose a day";
    const timeLabel = selectedTime ? formatRange(selectedTime, service.minutes) : "Choose a time";
    summaryEl.innerHTML = `<span>${when}</span><strong>${timeLabel}</strong>`;
  }

  form.querySelector("[data-prev]")?.addEventListener("click", () => {
    const min = `${today.year}-${String(today.month).padStart(2, "0")}`;
    const current = `${cursor.year}-${String(cursor.month).padStart(2, "0")}`;
    if (current <= min) return;
    cursor.month -= 1;
    if (cursor.month < 1) {
      cursor.month = 12;
      cursor.year -= 1;
    }
    paint();
  });
  form.querySelector("[data-next]")?.addEventListener("click", () => {
    const maxDate = addDays(today.iso, 56);
    const [maxYear, maxMonth] = maxDate.split("-").map(Number);
    if (cursor.year > maxYear || (cursor.year === maxYear && cursor.month >= maxMonth)) return;
    cursor.month += 1;
    if (cursor.month > 12) {
      cursor.month = 1;
      cursor.year += 1;
    }
    paint();
  });
  serviceInputs.forEach((input) => input.addEventListener("change", paint));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.textContent = "";
    if (!selectedDate || !selectedTime) {
      errorEl.textContent = "Choose a day and a time first.";
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
    button.disabled = true;
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json();
      if (!response.ok) {
        errorEl.textContent = body.error || "That booking did not save. Please call the salon.";
        button.disabled = false;
        return;
      }
      sessionStorage.setItem("morrells-booking-message", body.message || "");
      location.href = `/book/confirmed?ref=${encodeURIComponent(body.ref)}`;
    } catch {
      errorEl.textContent = "The page could not reach the salon system. Please call 01536 481561.";
      button.disabled = false;
    }
  });

  paint();
}
