/**
 * VIAMICI Adventures screen — UI architecture only.
 *
 * This file owns layout state and interactions for ONE screen:
 * location, radius filter, event carousel, and the focused event group.
 *
 * It does not import, mutate, or replace any app data models, event-creation
 * flows, or event-detail screens. The catalog below is local mock data used
 * only so the carousel and radius filter have something to render.
 */
(() => {
  "use strict";

  /* --------------------------------------------------------------------------
   * Local demo catalog (screen-scoped, not a shared model)
   * ------------------------------------------------------------------------ */
  const PLACES = [
    { id: "milano", name: "Milano" },
    { id: "como", name: "Como" },
    { id: "lecco", name: "Lecco" },
    { id: "bergamo", name: "Bergamo" },
  ];

  const PEOPLE = {
    giulia: { id: "giulia", name: "Giulia", role: "Travel Buddy", seed: "GiuliaRiva" },
    marco: { id: "marco", name: "Marco", role: "Trail host", seed: "MarcoNeri" },
    lea: { id: "lea", name: "Lea", role: "Photographer", seed: "LeaBianchi" },
    tomas: { id: "tomas", name: "Tomás", role: "Runner", seed: "TomasVale" },
    noor: { id: "noor", name: "Noor", role: "Guide", seed: "NoorHadi" },
    elena: { id: "elena", name: "Elena", role: "Local host", seed: "ElenaCosta" },
    pio: { id: "pio", name: "Pio", role: "Camper", seed: "PioLago" },
    aya: { id: "aya", name: "Aya", role: "Weekend walker", seed: "AyaMoretti" },
  };

  const EVENTS = [
    {
      id: "como-sunrise",
      title: "Como sunrise walk",
      image: "https://images.unsplash.com/photo-1476514525535-07fd56833696?auto=format&fit=crop&w=900&q=80",
      pins: [{ x: 32, y: 38 }, { x: 62, y: 52 }, { x: 48, y: 28 }],
      organizerId: "giulia",
      people: ["giulia", "lea", "tomas", "aya"],
      distance: { milano: 12, como: 2, lecco: 28, bergamo: 46 },
    },
    {
      id: "sezione-brera",
      title: "Brera evening stroll",
      image: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=900&q=80",
      pins: [{ x: 40, y: 44 }, { x: 58, y: 36 }],
      organizerId: "elena",
      people: ["elena", "marco", "noor"],
      distance: { milano: 2, como: 48, lecco: 54, bergamo: 50 },
    },
    {
      id: "resegone",
      title: "Resegone ridge day",
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80",
      pins: [{ x: 28, y: 42 }, { x: 54, y: 30 }, { x: 70, y: 48 }, { x: 44, y: 58 }],
      organizerId: "marco",
      people: ["marco", "pio", "tomas", "lea", "aya"],
      distance: { milano: 42, como: 24, lecco: 9, bergamo: 38 },
    },
    {
      id: "navigli",
      title: "Navigli golden hour",
      image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80",
      pins: [{ x: 36, y: 48 }, { x: 60, y: 40 }],
      organizerId: "lea",
      people: ["lea", "giulia", "elena"],
      distance: { milano: 4, como: 50, lecco: 56, bergamo: 52 },
    },
    {
      id: "adda",
      title: "Adda river bikes",
      image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=900&q=80",
      pins: [{ x: 30, y: 36 }, { x: 52, y: 50 }, { x: 68, y: 32 }],
      organizerId: "tomas",
      people: ["tomas", "pio", "noor", "marco"],
      distance: { milano: 26, como: 34, lecco: 18, bergamo: 22 },
    },
    {
      id: "bergamo-alta",
      title: "Bergamo Alta walls",
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=80",
      pins: [{ x: 46, y: 34 }, { x: 62, y: 50 }],
      organizerId: "noor",
      people: ["noor", "aya", "elena", "giulia"],
      distance: { milano: 48, como: 62, lecco: 40, bergamo: 3 },
    },
  ];

  const avatarUrl = (seed) =>
    `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f3eee4`;

  /* --------------------------------------------------------------------------
   * Screen state — isolated to this view
   * ------------------------------------------------------------------------ */
  const state = {
    placeId: "milano",
    radiusKm: 15,
    focusedId: null,
    joined: new Set(),
    sheet: null,
  };

  const els = {};

  const currentPlace = () => PLACES.find((p) => p.id === state.placeId);

  /** Events inside the selected radius. Distance is per demo place. */
  const visibleEvents = () =>
    EVENTS.filter((event) => event.distance[state.placeId] <= state.radiusKm);

  const focusedEvent = () =>
    visibleEvents().find((event) => event.id === state.focusedId) || visibleEvents()[0] || null;

  /* --------------------------------------------------------------------------
   * Small UI helpers
   * ------------------------------------------------------------------------ */
  function pinSvg() {
    return `<svg class="pin" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#2f7d5b" d="M12 2.4c-3.6 0-6.5 2.8-6.5 6.3 0 4.7 6.5 12.9 6.5 12.9s6.5-8.2 6.5-12.9c0-3.5-2.9-6.3-6.5-6.3z"/>
      <circle cx="12" cy="8.6" r="2.3" fill="#fff8ee"/>
    </svg>`;
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-on");
    clearTimeout(toast.tid);
    toast.tid = setTimeout(() => els.toast.classList.remove("is-on"), 1600);
  }

  function openSheet(name) {
    state.sheet = name;
    els.backdrop.classList.add("is-open");
    document.querySelectorAll(".sheet").forEach((sheet) => {
      sheet.classList.toggle("is-open", sheet.dataset.sheet === name);
    });
  }

  function closeSheet() {
    state.sheet = null;
    els.backdrop.classList.remove("is-open");
    document.querySelectorAll(".sheet").forEach((sheet) => sheet.classList.remove("is-open"));
  }

  /* --------------------------------------------------------------------------
   * Location + radius
   * ------------------------------------------------------------------------ */
  function renderLocation() {
    els.locationName.textContent = currentPlace().name;
    renderPlaceSheet();
  }

  function renderPlaceSheet() {
    els.placeList.innerHTML = PLACES.map(
      (place) => `
        <button type="button" data-place="${place.id}" ${place.id === state.placeId ? 'aria-current="true"' : ""}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f7d5b" stroke-width="1.8">
            <path d="M12 21s7-6.2 7-11.2A7 7 0 1 0 5 9.8C5 14.8 12 21 12 21z"/>
            <circle cx="12" cy="9.8" r="2.2"/>
          </svg>
          ${place.name}
        </button>`
    ).join("");
  }

  /**
   * Radius slider: the label and track fill update on every input frame.
   * Filtering the tiny local catalog is cheap, so the carousel can refresh
   * immediately without a debounce that would make the UI feel laggy.
   */
  function bindRadiusSlider() {
    const apply = (value, rebuild) => {
      state.radiusKm = Number(value);
      const pct = ((state.radiusKm - 1) / 49) * 100;
      els.slider.style.setProperty("--fill", `${pct}%`);
      els.radiusValue.textContent = String(state.radiusKm);
      if (rebuild) renderCarousel(true);
    };

    apply(state.radiusKm, false);
    els.slider.addEventListener("input", (event) => apply(event.target.value, true));
  }

  /* --------------------------------------------------------------------------
   * Event carousel — snap-to-center + focused card
   * ------------------------------------------------------------------------ */
  function renderCarousel(keepFocus) {
    const events = visibleEvents();
    const stillVisible = events.some((event) => event.id === state.focusedId);

    if (!events.length) {
      state.focusedId = null;
      els.carousel.innerHTML = "";
      els.dots.innerHTML = "";
      els.empty.hidden = false;
      renderGroup();
      return;
    }

    els.empty.hidden = true;
    if (!keepFocus || !stillVisible) state.focusedId = events[0].id;

    els.carousel.innerHTML = events
      .map((event) => {
        const km = event.distance[state.placeId];
        const pins = event.pins
          .map((pin) => `<span style="left:${pin.x}%;top:${pin.y}%">${pinSvg()}</span>`)
          .join("");
        return `
          <article class="event-card${event.id === state.focusedId ? " is-active" : ""}" data-id="${event.id}">
            <img src="${event.image}" alt="" />
            <div class="shade"></div>
            <div class="pins">${pins}</div>
            <div class="card-meta">
              <span class="distance-chip">${km} km away</span>
              <h2>${event.title}</h2>
            </div>
          </article>`;
      })
      .join("");

    els.dots.innerHTML = events
      .map(
        (event) =>
          `<button type="button" data-go="${event.id}" aria-label="${event.title}" ${
            event.id === state.focusedId ? 'aria-current="true"' : ""
          }></button>`
      )
      .join("");

    requestAnimationFrame(() => snapTo(state.focusedId, false));
    renderGroup();
  }

  function snapTo(id, smooth) {
    const card = els.carousel.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    const left = card.offsetLeft - (els.carousel.clientWidth - card.clientWidth) / 2;
    els.carousel.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  }

  /**
   * After a swipe, measure which card sits nearest the carousel center.
   * CSS scroll-snap does the motion; this only syncs focused state.
   */
  function nearestCardId() {
    const cards = [...els.carousel.querySelectorAll(".event-card")];
    if (!cards.length) return null;
    const mid = els.carousel.scrollLeft + els.carousel.clientWidth / 2;
    return cards.reduce((best, card) => {
      const center = card.offsetLeft + card.clientWidth / 2;
      const dist = Math.abs(center - mid);
      return dist < best.dist ? { id: card.dataset.id, dist } : best;
    }, { id: cards[0].dataset.id, dist: Infinity }).id;
  }

  function bindCarousel() {
    let settle;
    els.carousel.addEventListener("scroll", () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        const id = nearestCardId();
        if (!id || id === state.focusedId) return;
        state.focusedId = id;
        highlightCards();
        renderGroup(true);
      }, 70);
    }, { passive: true });

    // Desktop / automation: drag the track instead of dragging the photo.
    let drag = null;
    let dragged = false;
    els.carousel.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      drag = { x: event.clientX, left: els.carousel.scrollLeft };
      dragged = false;
      els.carousel.classList.add("is-dragging");
      els.carousel.setPointerCapture(event.pointerId);
    });
    els.carousel.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      if (Math.abs(dx) > 6) dragged = true;
      els.carousel.scrollLeft = drag.left - dx;
    });
    const endDrag = () => {
      if (!drag) return;
      drag = null;
      els.carousel.classList.remove("is-dragging");
      const id = nearestCardId();
      if (id) {
        state.focusedId = id;
        highlightCards();
        snapTo(id, true);
        renderGroup(true);
      }
    };
    els.carousel.addEventListener("pointerup", endDrag);
    els.carousel.addEventListener("pointercancel", endDrag);

    els.carousel.addEventListener("click", (event) => {
      if (dragged) {
        dragged = false;
        return;
      }
      const card = event.target.closest(".event-card");
      if (!card || card.dataset.id === state.focusedId) return;
      state.focusedId = card.dataset.id;
      highlightCards();
      snapTo(card.dataset.id, true);
      renderGroup(true);
    });

    els.dots.addEventListener("click", (event) => {
      const id = event.target.closest("[data-go]")?.dataset.go;
      if (!id) return;
      state.focusedId = id;
      highlightCards();
      snapTo(id, true);
      renderGroup(true);
    });
  }

  function highlightCards() {
    els.carousel.querySelectorAll(".event-card").forEach((card) => {
      card.classList.toggle("is-active", card.dataset.id === state.focusedId);
    });
    els.dots.querySelectorAll("button").forEach((dot) => {
      dot.toggleAttribute("aria-current", dot.dataset.go === state.focusedId);
    });
  }

  /* --------------------------------------------------------------------------
   * Profiles + organizer — follow the focused carousel card
   * ------------------------------------------------------------------------ */
  function renderGroup(animate) {
    const event = focusedEvent();
    const swap = (node, html) => {
      const write = () => {
        node.innerHTML = html;
        node.classList.remove("is-exit");
        node.classList.add("is-enter");
      };
      if (!animate) {
        write();
        return;
      }
      node.classList.remove("is-enter");
      node.classList.add("is-exit");
      window.setTimeout(write, 180);
    };

    if (!event) {
      swap(els.avatars, "");
      swap(
        els.organizer,
        `<p style="margin:0;color:var(--muted);font-size:.85rem">Widen the radius to see who is going.</p>`
      );
      return;
    }

    const people = event.people.map((id) => PEOPLE[id]);
    swap(
      els.avatars,
      people
        .map((person) => {
          const host = person.id === event.organizerId ? " is-host" : "";
          return `
            <button class="avatar-btn${host}" type="button" data-person="${person.id}">
              <img src="${avatarUrl(person.seed)}" alt="" />
              <span>${person.name}</span>
            </button>`;
        })
        .join("")
    );

    const host = PEOPLE[event.organizerId];
    const joined = state.joined.has(event.id);
    swap(
      els.organizer,
      `
        <button type="button" data-person="${host.id}" aria-label="${host.name}">
          <img src="${avatarUrl(host.seed)}" alt="" />
        </button>
        <div class="organizer-copy">
          <strong>${host.name}</strong>
          <small>${host.role}</small>
        </div>
        <button class="join-btn${joined ? " is-joined" : ""}" type="button" data-join="${event.id}">
          <svg viewBox="0 0 24 24">${
            joined
              ? '<path d="M5 12.5l4.2 4.2L19 7.5"/>'
              : '<path d="M8 5.5v13l11-6.5z"/>'
          }</svg>
          ${joined ? "Joined" : "Join"}
        </button>`
    );
  }

  function bindGroup() {
    document.querySelector(".app").addEventListener("click", (event) => {
      const joinId = event.target.closest("[data-join]")?.dataset.join;
      if (joinId) {
        if (state.joined.has(joinId)) state.joined.delete(joinId);
        else state.joined.add(joinId);
        renderGroup(false);
        toast(state.joined.has(joinId) ? "You’re in. See you on the trail." : "Left this adventure.");
        return;
      }
      if (event.target.closest("[data-person]")) onPerson(event);
    });
  }

  function onPerson(event) {
    const id = event.target.closest("[data-person]")?.dataset.person;
    if (!id) return;
    const person = PEOPLE[id];
    els.profileSheet.innerHTML = `
      <h3>${person.name}</h3>
      <div class="sheet-person">
        <img src="${avatarUrl(person.seed)}" alt="" />
        <div>
          <strong>${person.role}</strong>
          <p>Profile routing stays outside this screen — tap is wired, destination is unchanged.</p>
        </div>
      </div>`;
    openSheet("profile");
  }

  /* --------------------------------------------------------------------------
   * Header sheets + bottom nav
   * ------------------------------------------------------------------------ */
  function bindChrome() {
    els.historyBtn.addEventListener("click", () => openSheet("history"));
    els.bellBtn.addEventListener("click", () => openSheet("alerts"));
    els.editLoc.addEventListener("click", () => openSheet("place"));
    els.backdrop.addEventListener("click", closeSheet);

    els.placeList.addEventListener("click", (event) => {
      const id = event.target.closest("[data-place]")?.dataset.place;
      if (!id) return;
      state.placeId = id;
      renderLocation();
      renderCarousel(false);
      closeSheet();
    });

    els.tabbar.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-tab]");
      if (!tab) return;
      const name = tab.dataset.tab;
      if (name === "adventures") return;
      toast(`${tab.dataset.label} stays on its own screen.`);
    });
  }

  /* --------------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------------ */
  function cacheEls() {
    const $ = (sel) => document.querySelector(sel);
    Object.assign(els, {
      locationName: $("#locationName"),
      editLoc: $("#editLocation"),
      slider: $("#radiusSlider"),
      radiusValue: $("#radiusValue"),
      carousel: $("#eventCarousel"),
      dots: $("#carouselDots"),
      empty: $("#emptyCarousel"),
      avatars: $("#avatarRow"),
      organizer: $("#organizerRow"),
      historyBtn: $("#historyBtn"),
      bellBtn: $("#bellBtn"),
      backdrop: $("#backdrop"),
      placeList: $("#placeList"),
      profileSheet: $("#profileSheet"),
      tabbar: $("#tabbar"),
      toast: $("#toast"),
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    cacheEls();
    renderLocation();
    bindRadiusSlider();
    bindCarousel();
    bindGroup();
    bindChrome();
    renderCarousel(false);
  });
})();
