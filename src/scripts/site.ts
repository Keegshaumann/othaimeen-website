// Site-wide behaviour: header state, mobile drawer, scroll reveals and the contact form.

export function initSite() {
  header();
  reveal();
  forms();
}

function header() {
  const el = document.querySelector<HTMLElement>("[data-header]");
  if (!el) return;
  const onScroll = () => el.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = el.querySelector<HTMLButtonElement>("[data-burger]");
  const drawer = el.querySelector<HTMLElement>("[data-drawer]");
  if (!burger || !drawer) return;
  const setOpen = (open: boolean) => {
    burger.setAttribute("aria-expanded", String(open));
    el.classList.toggle("open", open);
    drawer.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setOpen(burger.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.classList.contains("open")) {
      setOpen(false);
      burger.focus();
    }
  });
  window.matchMedia("(min-width: 1081px)").addEventListener("change", (m) => m.matches && setOpen(false));
}

function reveal() {
  const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    items.forEach((i) => i.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  items.forEach((i) => io.observe(i));
}

// Forms marked data-form post to /api/contact.php. Without JavaScript they still post and the
// server redirects back to /contact/?sent=1.
function forms() {
  document.querySelectorAll<HTMLFormElement>("form[data-form]").forEach((form) => {
    const ts = form.querySelector<HTMLInputElement>("[data-ts]");
    if (ts) ts.value = String(Date.now());
    const status = form.querySelector<HTMLElement>("[data-status]");
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (button) button.disabled = true;
      if (status) {
        status.dataset.state = "";
        status.textContent = "Sending…";
      }
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong. Please try again or email us.");
        if (status) {
          status.dataset.state = "ok";
          status.textContent = "Thank you. Your message is with our team and we will be in touch shortly.";
        }
        form.reset();
      } catch (err) {
        if (status) {
          status.dataset.state = "error";
          status.textContent = err instanceof Error ? err.message : String(err);
        }
      } finally {
        if (button) button.disabled = false;
        if (ts) ts.value = String(Date.now() - 4000);
      }
    });
  });
}
