(() => {
  "use strict";

  /* ------------------------------------------------------------------------
     Site configuration
     Replace these placeholders with real URLs and an email address when ready.
     The contact form works in validation-only mode until formEndpoint is set
     to a service that accepts a POST request (for example, Formspree).
     ------------------------------------------------------------------------ */
  const SITE = Object.freeze({
    email: "suraj@example.com",
    github: "https://github.com/",
    linkedin: "https://www.linkedin.com/",
    formEndpoint: ""
  });

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const root = document.documentElement;

  /* ------------------------------------------------------------------------
     Personal links & current year
     ------------------------------------------------------------------------ */
  $$('[data-site-link="github"]').forEach((link) => {
    link.href = SITE.github;
  });

  $$('[data-site-link="linkedin"]').forEach((link) => {
    link.href = SITE.linkedin;
  });

  $$('[data-site-email]').forEach((link) => {
    link.href = `mailto:${SITE.email}`;
  });

  $$('[data-site-email-text]').forEach((element) => {
    element.textContent = SITE.email;
  });

  $$('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------------
     Theme toggle
     ------------------------------------------------------------------------ */
  const THEME_KEY = "suraj-theme";
  const themeToggle = $("[data-theme-toggle]");
  const themeColorMeta = $('meta[name="theme-color"]');

  function getCurrentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function syncThemeControls() {
    if (!themeToggle) return;

    const isDark = getCurrentTheme() === "dark";
    const nextTheme = isDark ? "light" : "dark";
    const label = `Switch to ${nextTheme} theme`;

    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);

    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", isDark ? "#07080b" : "#f4f2ed");
    }
  }

  if (themeToggle) {
    syncThemeControls();

    themeToggle.addEventListener("click", () => {
      const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", nextTheme);
      syncThemeControls();

      try {
        window.localStorage.setItem(THEME_KEY, nextTheme);
      } catch (error) {
        // The theme still changes for this session when storage is blocked.
      }
    });
  }

  /* ------------------------------------------------------------------------
     Header state, reading progress and active navigation
     ------------------------------------------------------------------------ */
  const header = $("[data-site-header]");
  const progressBar = $("[data-scroll-progress]");
  const allSections = $$("main section[id]");
  const allNavLinks = $$("[data-nav-link], [data-mobile-nav-link]");
  const navHrefs = new Set(allNavLinks.map((link) => link.getAttribute("href")));
  const navSections = allSections.filter((section) => navHrefs.has(`#${section.id}`));

  function updateActiveNavigation() {
    if (!navSections.length) return;

    const marker = window.scrollY + Math.min(window.innerHeight * 0.3, 300);
    let currentId = navSections[0].id;

    navSections.forEach((section) => {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;

      if (sectionTop <= marker) {
        currentId = section.id;
      }
    });

    const nearPageEnd =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 8;

    if (nearPageEnd) {
      currentId = navSections[navSections.length - 1].id;
    }

    allNavLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${currentId}`;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateScrollUI() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    if (progressBar) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }

    updateActiveNavigation();
  }

  let scrollFrame = 0;

  function requestScrollUpdate() {
    if (scrollFrame) return;

    scrollFrame = window.requestAnimationFrame(() => {
      updateScrollUI();
      scrollFrame = 0;
    });
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  window.addEventListener("load", updateScrollUI);
  updateScrollUI();

  /* ------------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------------ */
  const menuToggle = $("[data-menu-toggle]");
  const mobileMenu = $("[data-mobile-menu]");
  const mainContent = $("#main-content");
  const siteFooter = $(".site-footer");
  const desktopQuery = window.matchMedia("(min-width: 981px)");
  let lastFocusedElement = null;

  function setMenuState(isOpen, { returnFocus = true } = {}) {
    if (!menuToggle || !mobileMenu) return;

    if (isOpen) {
      if (!mobileMenu.hidden) return;

      lastFocusedElement = document.activeElement;
      mobileMenu.hidden = false;
      document.body.classList.add("menu-open");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close menu");

      if (mainContent) mainContent.setAttribute("inert", "");
      if (siteFooter) siteFooter.setAttribute("inert", "");

      window.requestAnimationFrame(() => {
        mobileMenu.classList.add("is-open");
        const firstLink = $("[data-mobile-nav-link]", mobileMenu);

        if (firstLink) {
          firstLink.focus({ preventScroll: true });
        }
      });

      return;
    }

    if (mobileMenu.hidden) return;

    mobileMenu.classList.remove("is-open");
    mobileMenu.hidden = true;
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");

    if (mainContent) mainContent.removeAttribute("inert");
    if (siteFooter) siteFooter.removeAttribute("inert");

    if (returnFocus) {
      const focusTarget =
        lastFocusedElement instanceof HTMLElement ? lastFocusedElement : menuToggle;
      focusTarget.focus({ preventScroll: true });
    }

    lastFocusedElement = null;
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      setMenuState(mobileMenu.hidden);
    });

    $$("a", mobileMenu).forEach((link) => {
      link.addEventListener("click", () => {
        setMenuState(false);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !mobileMenu.hidden) {
        setMenuState(false);
      }
    });

    desktopQuery.addEventListener("change", (event) => {
      if (event.matches && !mobileMenu.hidden) {
        setMenuState(false, { returnFocus: false });
      }
    });
  }

  /* ------------------------------------------------------------------------
     Contact form
     ------------------------------------------------------------------------ */
  const contactForm = $("[data-contact-form]");

  if (contactForm) {
    const formStatus = $("[data-form-status]", contactForm);
    const submitButton = $("[data-submit-button]", contactForm);
    const submitLabel = $("[data-submit-label]", contactForm);
    const messageField = $("#message", contactForm);
    const characterCount = $("[data-character-count]", contactForm);
    const formNote = $(".form-note", contactForm);
    const fields = $$("input, textarea", contactForm);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (formNote && SITE.formEndpoint) {
      formNote.textContent = "Your details will only be used to reply to this message.";
    }

    function getFieldError(field) {
      const value = field.value.trim();

      if (field.name === "name") {
        if (!value) return "Please enter your name.";
        if (value.length < 2) return "Your name needs at least 2 characters.";
        if (value.length > 80) return "Please keep your name under 80 characters.";
      }

      if (field.name === "email") {
        if (!value) return "Please enter your email address.";
        if (!emailPattern.test(value)) return "Please enter a valid email address.";
      }

      if (field.name === "subject") {
        if (!value) return "Please add a subject.";
        if (value.length < 3) return "Please make the subject a little longer.";
      }

      if (field.name === "message") {
        if (!value) return "Please write a message.";
        if (value.length < 10) return "Please add a little more detail (10 characters minimum).";
      }

      return "";
    }

    function validateField(field) {
      const wrapper = field.closest(".form-field");
      const errorElement = $(`[data-error-for="${field.name}"]`, contactForm);
      const error = getFieldError(field);

      if (wrapper) wrapper.classList.toggle("has-error", Boolean(error));

      if (errorElement) {
        errorElement.textContent = error;
      }

      if (error) {
        field.setAttribute("aria-invalid", "true");
      } else {
        field.removeAttribute("aria-invalid");
      }

      return !error;
    }

    function updateCharacterCount() {
      if (!messageField || !characterCount) return;

      characterCount.textContent = `${messageField.value.length} / 1500`;
    }

    function clearFormStatus() {
      if (!formStatus) return;

      formStatus.className = "form-status";
      formStatus.replaceChildren();
    }

    function showFormStatus(type, message, link) {
      if (!formStatus) return;

      formStatus.className = `form-status is-${type}`;
      formStatus.replaceChildren();

      const text = document.createElement("p");
      text.textContent = message;
      formStatus.append(text);

      if (link) {
        const anchor = document.createElement("a");
        anchor.className = "form-status-link";
        anchor.href = link.href;
        anchor.textContent = link.label;
        formStatus.append(anchor);
      }
    }

    function buildMailto(details) {
      const subject = `Portfolio enquiry — ${details.subject}`;
      const body = [
        `Hi Suraj,`,
        "",
        details.message,
        "",
        `— ${details.name}`,
        details.email
      ].join("\n");

      return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    updateCharacterCount();

    if (messageField) {
      messageField.addEventListener("input", updateCharacterCount);
    }

    fields.forEach((field) => {
      field.addEventListener("blur", () => {
        if (field.value.trim()) validateField(field);
      });

      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") {
          validateField(field);
        }

        if (formStatus && formStatus.childNodes.length) {
          clearFormStatus();
        }
      });
    });

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const invalidFields = fields.filter((field) => !validateField(field));

      if (invalidFields.length) {
        invalidFields[0].focus();
        showFormStatus("error", "Please check the highlighted fields and try again.");
        return;
      }

      const details = Object.fromEntries(new FormData(contactForm).entries());
      const directMailLink = buildMailto(details);

      // This static site has no delivery backend by default. Never pretend the
      // message was sent when it has only passed browser validation.
      if (!SITE.formEndpoint) {
        showFormStatus(
          "info",
          "This form isn't connected to an email service yet, so nothing has been sent. Your message is ready to go — open a pre-filled email instead, or use the email link on this page.",
          { href: directMailLink, label: "Open pre-filled email ↗" }
        );
        return;
      }

      submitButton.disabled = true;
      submitLabel.textContent = "Sending…";
      clearFormStatus();

      try {
        const response = await fetch(SITE.formEndpoint, {
          method: "POST",
          body: new FormData(contactForm),
          headers: { Accept: "application/json" }
        });

        if (!response.ok) {
          throw new Error(`Form request failed with status ${response.status}`);
        }

        contactForm.reset();
        updateCharacterCount();
        showFormStatus(
          "success",
          "Message sent. Thank you for reaching out — I'll get back to you soon."
        );
      } catch (error) {
        showFormStatus(
          "error",
          "Your message couldn't be sent right now. Please try again, or email me directly.",
          { href: directMailLink, label: "Open pre-filled email ↗" }
        );
      } finally {
        submitButton.disabled = false;
        submitLabel.textContent = "Send Message";
      }
    });
  }
})();
