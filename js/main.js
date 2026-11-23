/* ==========================================================================
   Suraj Kumar — Portfolio interactions
   Vanilla JavaScript, no dependencies.
   ========================================================================== */
(function () {
  "use strict";

  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const themeToggle = document.getElementById("theme-toggle");
  const metaThemeColor = document.getElementById("meta-theme-color");

  /* ---------------------------------------------------------------------
     Theme
     --------------------------------------------------------------------- */
  const THEME_KEY = "suraj-theme";
  const THEME_COLORS = { dark: "#08090c", light: "#f2f0ea" };
  let themeTransitioning = false;

  function syncThemeUI(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    const isLight = nextTheme === "light";

    root.setAttribute("data-theme", nextTheme);

    if (themeToggle) {
      const label = isLight ? "Switch to dark theme" : "Switch to light theme";
      themeToggle.setAttribute("aria-label", label);
      themeToggle.setAttribute("title", label);
    }

    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", THEME_COLORS[nextTheme]);
    }
  }

  function commitTheme(theme) {
    syncThemeUI(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      /* Preference persistence is optional. */
    }
  }

  syncThemeUI(root.getAttribute("data-theme") || "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      if (themeTransitioning) return;

      const current = root.getAttribute("data-theme");
      const next = current === "light" ? "dark" : "light";

      if (document.startViewTransition && !prefersReducedMotion.matches) {
        themeTransitioning = true;
        const transition = document.startViewTransition(function () {
          commitTheme(next);
        });

        transition.finished.finally(function () {
          themeTransitioning = false;
        });
      } else {
        commitTheme(next);
      }
    });
  }

  /* ---------------------------------------------------------------------
     Header, scroll progress and active navigation
     --------------------------------------------------------------------- */
  const header = document.getElementById("site-header");
  const progressBar = document.getElementById("scroll-progress-bar");
  const navLinks = Array.from(document.querySelectorAll(".primary-nav .nav-link"));
  const allSectionLinks = Array.from(document.querySelectorAll(".nav-link, [data-menu-link]"));
  const sectionIds = Array.from(
    new Set(
      navLinks
        .map(function (link) { return link.getAttribute("href"); })
        .filter(function (href) { return href && href.charAt(0) === "#"; })
        .map(function (href) { return href.slice(1); })
    )
  );
  const sections = sectionIds
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  let scrollTicking = false;

  function updateOnScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;

    if (header) {
      header.classList.toggle("is-scrolled", scrollY > 12);
    }

    if (progressBar) {
      progressBar.style.transform = "scaleX(" + progress + ")";
    }

    if (sections.length) {
      const marker = scrollY + window.innerHeight * 0.34;
      let activeId = sections[0].id;

      sections.forEach(function (section) {
        if (section.offsetTop <= marker) {
          activeId = section.id;
        }
      });

      if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
        activeId = sections[sections.length - 1].id;
      }

      allSectionLinks.forEach(function (link) {
        const isActive = link.getAttribute("href") === "#" + activeId;
        if (link.classList.contains("nav-link")) {
          link.classList.toggle("is-active", isActive);
        }
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    scrollTicking = false;
  }

  function requestScrollUpdate() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateOnScroll);
    }
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  window.addEventListener("load", requestScrollUpdate, { once: true });
  updateOnScroll();

  /* ---------------------------------------------------------------------
     Mobile menu
     --------------------------------------------------------------------- */
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const mainContent = document.getElementById("main");
  const siteFooter = document.querySelector(".site-footer");
  const desktopQuery = window.matchMedia("(min-width: 1081px)");
  let menuOpen = false;
  let lastFocusedElement = null;

  function getMenuFocusable() {
    if (!header) return [];

    return Array.from(
      header.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (element) {
      return element.getClientRects().length > 0 && element.tabIndex !== -1;
    });
  }

  function lockPage(lock) {
    document.body.classList.toggle("menu-open", lock);
    if (mainContent) mainContent.inert = lock;
    if (siteFooter) siteFooter.inert = lock;
  }

  function openMenu() {
    if (!mobileMenu || !menuToggle || menuOpen) return;

    menuOpen = true;
    lastFocusedElement = document.activeElement;
    mobileMenu.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
    if (header) header.classList.add("is-menu-open");
    lockPage(true);

    const firstLink = mobileMenu.querySelector("a[href]");
    if (firstLink) {
      window.requestAnimationFrame(function () {
        firstLink.focus({ preventScroll: true });
      });
    }
  }

  function closeMenu(restoreFocus) {
    if (!mobileMenu || !menuToggle || !menuOpen) return;

    menuOpen = false;
    mobileMenu.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    if (header) header.classList.remove("is-menu-open");
    lockPage(false);

    if (restoreFocus && lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus({ preventScroll: true });
    } else if (restoreFocus) {
      menuToggle.focus({ preventScroll: true });
    }

    lastFocusedElement = null;
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function () {
      if (menuOpen) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu(true);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (!menuOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getMenuFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const handleDesktopChange = function (event) {
      if (event.matches && menuOpen) closeMenu(false);
    };

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleDesktopChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(handleDesktopChange);
    }
  }

  /* ---------------------------------------------------------------------
     Scroll reveals — progressive enhancement only
     --------------------------------------------------------------------- */
  const revealElements = Array.from(document.querySelectorAll("[data-reveal]"));
  let revealObserver = null;

  function revealAll() {
    revealElements.forEach(function (element) {
      element.classList.remove("will-reveal");
      element.classList.add("is-visible");
    });
    if (revealObserver) revealObserver.disconnect();
  }

  if (revealElements.length && !prefersReducedMotion.matches && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    revealElements.forEach(function (element) {
      element.classList.add("will-reveal");
      revealObserver.observe(element);
    });
  } else {
    revealAll();
  }

  if (typeof prefersReducedMotion.addEventListener === "function") {
    prefersReducedMotion.addEventListener("change", function (event) {
      if (event.matches) revealAll();
    });
  }

  /* ---------------------------------------------------------------------
     Contact form
     Uses native validation rules + custom messaging. No fake success:
     with no backend, a valid submission prepares a mailto draft only.
     --------------------------------------------------------------------- */
  const form = document.getElementById("contact-form");
  const statusBox = document.getElementById("form-status");
  const emailAddress = "suraj@example.com";
  const messageInput = document.getElementById("message");
  const messageCounter = document.getElementById("message-counter");
  const touchedFields = new Set();
  let submitAttempted = false;

  const validators = {
    name: function (value) {
      if (!value) return "Please enter your name.";
      if (value.length < 2) return "Your name needs at least 2 characters.";
      return "";
    },
    email: function (value) {
      if (!value) return "Please enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        return "Please enter a valid email address.";
      }
      return "";
    },
    subject: function (value) {
      if (!value) return "Please add a subject.";
      if (value.length < 3) return "The subject needs at least 3 characters.";
      return "";
    },
    message: function (value) {
      if (!value) return "Please write a message.";
      if (value.length < 10) return "A little more detail, please — at least 10 characters.";
      return "";
    },
  };

  function getFieldElements(name) {
    const input = form ? form.elements.namedItem(name) : null;
    if (!input || !input.closest) return null;
    return {
      input: input,
      wrapper: input.closest(".form-field"),
      error: document.getElementById(name + "-error"),
    };
  }

  function validateField(name, announce) {
    const elements = getFieldElements(name);
    if (!elements) return true;

    const value = elements.input.value.trim();
    const errorMessage = validators[name] ? validators[name](value) : "";
    const hasError = Boolean(errorMessage);

    elements.wrapper.classList.toggle("has-error", hasError);
    elements.input.setAttribute("aria-invalid", hasError ? "true" : "false");
    if (elements.error) {
      elements.error.textContent = announce === false ? "" : errorMessage;
    }

    return !hasError;
  }

  function updateCounter() {
    if (!messageInput || !messageCounter) return;
    messageCounter.textContent = messageInput.value.length + " / 1000";
  }

  function hideStatus() {
    if (!statusBox) return;
    statusBox.hidden = true;
    statusBox.replaceChildren();
  }

  function buildMailto(name, email, subject, message) {
    const mailSubject = "Portfolio message from " + name + " — " + subject;
    const body = [
      "Name: " + name,
      "Email: " + email,
      "",
      message,
      "",
      "— Sent from the portfolio contact form",
    ].join("\n");

    return (
      "mailto:" +
      emailAddress +
      "?subject=" +
      encodeURIComponent(mailSubject) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  function showPreparedStatus(name, email, subject, message) {
    if (!statusBox) return;

    const title = document.createElement("strong");
    title.textContent = "Your message is ready — but it has not been sent.";

    const explanation = document.createElement("span");
    explanation.className = "form-status__note";
    explanation.textContent =
      "This site is not connected to a form backend yet, so nothing was sent or stored. Use the link below to send your message from your email app.";

    const mailLink = document.createElement("a");
    mailLink.href = buildMailto(name, email, subject, message);
    mailLink.textContent = "Open in your email app →";

    const directEmail = document.createElement("span");
    directEmail.className = "form-status__note";
    directEmail.append("Or email me directly at ");
    const directLink = document.createElement("a");
    directLink.href = "mailto:" + emailAddress;
    directLink.textContent = emailAddress;
    directEmail.append(directLink, ".");

    statusBox.replaceChildren(title, explanation, mailLink, directEmail);
    statusBox.hidden = false;
    statusBox.focus({ preventScroll: true });
  }

  if (form) {
    const fieldNames = ["name", "email", "subject", "message"];

    fieldNames.forEach(function (name) {
      const elements = getFieldElements(name);
      if (!elements) return;

      elements.input.addEventListener("blur", function () {
        touchedFields.add(name);
        validateField(name, true);
      });

      elements.input.addEventListener("input", function () {
        hideStatus();
        if (name === "message") updateCounter();
        if (touchedFields.has(name) || submitAttempted) {
          validateField(name, true);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitAttempted = true;
      hideStatus();

      let firstInvalid = null;

      fieldNames.forEach(function (name) {
        touchedFields.add(name);
        const isValid = validateField(name, true);
        if (!isValid && !firstInvalid) {
          firstInvalid = getFieldElements(name).input;
        }
      });

      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: false });
        return;
      }

      const name = form.elements.namedItem("name").value.trim();
      const email = form.elements.namedItem("email").value.trim();
      const subject = form.elements.namedItem("subject").value.trim();
      const message = form.elements.namedItem("message").value.trim();

      showPreparedStatus(name, email, subject, message);
    });

    updateCounter();
  }

  /* ---------------------------------------------------------------------
     Small finishing details
     --------------------------------------------------------------------- */
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
})();
