import { JSX } from "preact"
import { PageFrame, PageFrameProps } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"

/**
 * Site identity — edit these to match your own branding.
 */
const SITE = {
  hostname: "guest@dojo: ~",
  github: "https://github.com/0xh4ck3rm4n/blog",
  email: "gaurav.poudel2061@gmail.com",
  socials: [
    { name: "GitHub", url: "https://github.com/0xh4ck3rm4n/blog" },
    { name: "LinkedIn", url: "https://linkedin.com/in/ecstasyy" },
    { name: "X", url: "https://x.com/esctasyxo" },
    { name: "Discord", url: "https://discord.com/users/mcdonaldsandwich", username: "mcdonaldsandwich" },
  ],
  mastheadLabel: "cybersec · ctf · notes",
  mastheadTitle: "Giving up is not in the blood,",
  mastheadAccent: " sir.",
  mastheadTitle2: "— Nims Dai Purja",
  homePrompt: "cd ~/home",
  aboutPrompt: "cd ~/about",
  rssPrompt: "open ~/rss.xml",
}

function getDate(data: QuartzPluginData): Date | undefined {
  const type = data.defaultDateType as string | undefined
  if (!type) return undefined
  const dates = data.dates as Record<string, Date> | undefined
  return dates?.[type]
}

function fmtDate(d: Date | undefined): string {
  if (!d) return ""
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })
}

interface Post {
  slug: string
  title: string
  date?: Date
  description: string
  category: string
  difficulty?: string
  tags: string[]
  image?: string
}

function buildPosts(allFiles: QuartzPluginData[]): Post[] {
  return allFiles
    .filter((f) => {
      if (f.slug === "index" || f.slug === "404") return false
      const fm = (f.frontmatter ?? {}) as Record<string, unknown>
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : []
      return tags.includes("writeup")
    })
    .map((f) => {
      const fm = (f.frontmatter ?? {}) as Record<string, unknown>
      const slug = String(f.slug ?? "")
      const title = String(fm.title ?? f.title ?? slug.split("/").pop() ?? slug)
      const description = String(fm.description ?? f.description ?? "")
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : []
      const category = String(
        fm.category ?? slug.split("/")[0] ?? "notes",
      )
      const difficulty = typeof fm.difficulty === "string" ? fm.difficulty : undefined
      const image = typeof fm.image === "string" ? fm.image : undefined
      return {
        slug,
        title,
        date: getDate(f),
        description,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        difficulty,
        tags,
        image,
      }
    })
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
}

const SearchIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

const FunnelIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
)

const UpIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="19" x2="12" y2="6"></line>
    <polyline points="6 12 12 6 18 12"></polyline>
  </svg>
)

const SocialIcons: Record<string, JSX.Element> = {
  GitHub: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.2 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  ),
  X: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z" />
    </svg>
  ),
  Discord: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.93-1.51 13.98 13.98 0 0 0-.64 1.28 18.27 18.27 0 0 0-5.5 0 13.98 13.98 0 0 0-.64-1.28 19.74 19.74 0 0 0-4.93 1.51C.53 9.1-.32 13.7.1 18.25a19.9 19.9 0 0 0 6.07 3.07 14.5 14.5 0 0 0 1.3-2.11c-.71-.27-1.4-.59-2.05-.95l.5-.39c3.99 1.84 8.31 1.84 12.26 0l.5.39c-.65.36-1.35.68-2.06.95a14.5 14.5 0 0 0 1.3 2.11 19.83 19.83 0 0 0 6.07-3.07c.51-5.22-.86-9.78-3.67-13.88ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.95-2.42 2.16-2.42 1.21 0 2.18 1.09 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Zm7.96 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.95-2.42 2.16-2.42 1.21 0 2.18 1.09 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
    </svg>
  ),
}

function ArchiveGrid({ componentData, basePath }: { componentData: PageFrameProps["componentData"]; basePath: string }) {
  const posts = buildPosts(componentData.allFiles)
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort()

  return (
    <section class="post-grid" id="field-notes">
      <div class="post-grid-head">
        <p class="post-grid-prompt">
          <span class="post-grid-prompt__sigil">$</span> ls ~/writeups
          <span class="post-grid-prompt__cursor" aria-hidden="true"></span>
        </p>
        <h2 class="post-grid-title">Archive</h2>
        <p class="post-grid-sub">
          <strong data-result-count="true">{posts.length}</strong> posts
        </p>
      </div>

      <div class="post-grid-tools">
        <label class="post-grid-search">
          <span class="post-grid-search__icon">{SearchIcon}</span>
          <span class="sr-only">Search</span>
          <input
            type="search"
            placeholder="Search writeups, blogs, notes…"
            autocomplete="off"
            data-filter-search="true"
          />
          <button type="button" class="post-grid-search__clear" data-clear-search="true" aria-label="Clear search" hidden>
            ×
          </button>
          <kbd>/</kbd>
        </label>
        <div class="post-grid-actions">
          <button type="button" class="tag-filter clear filter-clear" data-clear-all="true" hidden>
            Clear all filters
          </button>
          <button type="button" class="filter-toggle" data-toggle-tags="true" aria-expanded="false" aria-label="Toggle tags">
            {FunnelIcon}
          </button>
        </div>
      </div>

      <div class="post-grid-filters">
        <div class="filter-tags" data-filter-tags="true">
          {allTags.map((tag) => (
            <button type="button" class="tag-filter" data-tag={tag} aria-pressed="false">
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <ul class="post-grid-list">
        {posts.map((post, i) => {
          const searchText = [post.title, post.category, post.description, post.slug, post.tags.join(" ")]
            .join(" ")
            .toLowerCase()
          const diff = post.difficulty ? ` post-card-diff--${post.difficulty.toLowerCase()}` : ""
          return (
            <li
              class="post-card"
              data-tags={JSON.stringify(post.tags)}
              data-search={searchText}
              data-title={post.title}
              data-reveal-index={String(i % 6)}
            >
              <a class="post-card-link internal" href={`${basePath}/${post.slug}`}>
                <div class="post-card-media">
                  {post.image ? <img src={post.image} alt="" loading="eager" /> : null}
                  {post.difficulty ? (
                    <span class={`post-card-diff${diff}`}>{post.difficulty}</span>
                  ) : null}
                  <span class="post-card-arrow">↗</span>
                </div>
                <div class="post-card-body">
                  <p class="post-card-meta">
                    <time datetime={post.date?.toISOString()}>{fmtDate(post.date)}</time>
                  </p>
                  <h3>
                    <span class="post-card-title__text" data-decrypt-hover={post.title}>
                      {post.title}
                    </span>
                  </h3>
                  <p class="post-card-sub">{post.category}</p>
                  {post.description ? <p class="post-card-description">{post.description}</p> : null}
                  {post.tags.length > 0 ? (
                    <ul class="post-card-tags">
                      {post.tags.map((t) => (
                        <li>#{t}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </a>
            </li>
          )
        })}
      </ul>

      <p class="post-grid-empty" data-empty-state="true" role="status" hidden>
        No signal found. Try a broader search or clear the active tags.
      </p>
    </section>
  )
}

const PortalScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `(function () {
  var on = function (el, evt, fn, opts) {
    el.addEventListener(evt, fn, opts);
    if (typeof window.addCleanup === "function")
      window.addCleanup(function () { el.removeEventListener(evt, fn, opts); });
  };

  var SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890!<>-_\\/[]{}=+*^?#$%&";
  function scramble(el, final, frameMs) {
    if (el.__scrambleTimer) clearInterval(el.__scrambleTimer);
    var frame = 0;
    var totalFrames = Math.max(10, final.length * 2.4);
    el.__scrambleTimer = setInterval(function () {
      var revealCount = Math.floor((frame / totalFrames) * final.length);
      var out = "";
      for (var i = 0; i < final.length; i++) {
        if (final[i] === " ") { out += " "; continue; }
        out += i < revealCount ? final[i] : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      el.textContent = out;
      frame++;
      if (revealCount >= final.length) {
        clearInterval(el.__scrambleTimer);
        el.__scrambleTimer = null;
        el.textContent = final;
      }
    }, frameMs || 32);
  }

  function initDecrypt() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-decrypt]"));
    if (!els.length) return;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    els.forEach(function (el, order) {
      if (el.dataset.decrypted === "true") return;
      el.dataset.decrypted = "true";
      var final = el.getAttribute("data-decrypt") || el.textContent;
      if (reduced) { el.textContent = final; return; }
      setTimeout(function () { scramble(el, final, 30); }, order * 140);
    });
  }

  function initDrawer() {
    if (window.__portalMenuBound) return;
    window.__portalMenuBound = true;
    var btn = function () { return document.querySelector('[data-menu-toggle="true"]'); };
    var menu = function () { return document.querySelector('[data-site-menu="true"]'); };
    function setOpen(v) {
      var b = btn(), m = menu();
      if (!b || !m) return;
      b.setAttribute("aria-expanded", String(v));
      m.setAttribute("aria-hidden", String(!v));
      document.body.classList.toggle("menu-open", v);
      if (v) {
        var panel = m.querySelector(".site-drawer__panel");
        var focusables = panel ? Array.prototype.slice.call(panel.querySelectorAll("a, button")) : [];
        if (focusables.length) focusables[0].focus();
      }
    }
    function toggle() {
      var b = btn();
      setOpen(!b || b.getAttribute("aria-expanded") !== "true");
    }
    document.addEventListener("click", function (e) {
      var b = btn(), m = menu();
      if (!b || !m) return;
      if (b.contains(e.target)) { e.stopPropagation(); toggle(); return; }
      if (m.getAttribute("aria-hidden") === "false") {
        var panel = m.querySelector(".site-drawer__panel");
        if (!panel || !panel.contains(e.target)) setOpen(false);
      }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    document.addEventListener("nav", function () { setOpen(false); });
  }

  function initGrid() {
    var o = document.getElementById("field-notes");
    if (!o || o.dataset.enhanced === "true") return;
    o.dataset.enhanced = "true";
    var cards = Array.prototype.slice.call(o.querySelectorAll("[data-tags]"));
    var tagBtns = Array.prototype.slice.call(o.querySelectorAll("[data-tag]"));
    var searchInput = o.querySelector("[data-filter-search]");
    var clearSearch = o.querySelector("[data-clear-search]");
    var clearAll = o.querySelector("[data-clear-all]");
    var resultCount = o.querySelector("[data-result-count]");
    var emptyState = o.querySelector("[data-empty-state]");
    var toggleTags = o.querySelector("[data-toggle-tags]");
    var tagWrap = o.querySelector("[data-filter-tags]");
    var active = new Set();
    var q = "";
    function tagsOf(el) {
      try { var p = JSON.parse(el.getAttribute("data-tags")); return Array.isArray(p) ? p : []; }
      catch (e) { return []; }
    }
    function matches(el) {
      var tags = tagsOf(el);
      var okTags = active.size === 0 || Array.prototype.every.call(active, function (t) { return tags.indexOf(t) !== -1; });
      var t = q.trim().toLowerCase();
      var okQ = !t ||
        (el.getAttribute("data-search") || "").toLowerCase().indexOf(t) !== -1 ||
        (el.getAttribute("data-title") || "").toLowerCase().indexOf(t) !== -1;
      return okTags && okQ;
    }
    function apply() {
      var n = 0;
      cards.forEach(function (el) {
        var m = matches(el);
        if (m) n++;
        el.classList.toggle("is-hidden", !m);
      });
      if (resultCount) resultCount.textContent = String(n);
      if (emptyState) emptyState.hidden = n !== 0;
      if (clearAll) clearAll.hidden = active.size === 0 && !q.trim();
      tagBtns.forEach(function (b) {
        var t = b.getAttribute("data-tag");
        var isOn = active.has(t);
        b.setAttribute("aria-pressed", isOn ? "true" : "false");
        b.classList.toggle("active", isOn);
      });
    }
    if (searchInput) {
      on(searchInput, "input", function () {
        q = searchInput.value;
        if (clearSearch) clearSearch.hidden = !searchInput.value;
        apply();
      });
      if (clearSearch) on(clearSearch, "click", function () {
        searchInput.value = ""; q = ""; clearSearch.hidden = true; apply(); searchInput.focus();
      });
      on(document, "keydown", function (e) {
        if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
        var a = document.activeElement;
        if (a && ["INPUT", "TEXTAREA", "SELECT"].indexOf(a.tagName) !== -1) return;
        e.preventDefault(); searchInput.focus();
      });
    }
    tagBtns.forEach(function (b) {
      var t = b.getAttribute("data-tag");
      on(b, "click", function (e) {
        e.preventDefault();
        if (active.has(t)) active.delete(t); else active.add(t);
        apply();
      });
    });
    if (clearAll) on(clearAll, "click", function () {
      active.clear(); q = ""; if (searchInput) searchInput.value = ""; apply();
    });
    if (toggleTags && tagWrap) {
      var collapsed = false;
      on(toggleTags, "click", function () {
        collapsed = !collapsed;
        tagWrap.classList.toggle("is-collapsed", collapsed);
        toggleTags.setAttribute("aria-expanded", String(!collapsed));
        toggleTags.classList.toggle("active", !collapsed);
      });
    }
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var scrollTimelineSupported = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: view()"));
    if (!reduced && !scrollTimelineSupported && "IntersectionObserver" in window) {
      cards.forEach(function (c) { c.classList.add("reveal-pending"); });
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var idx = Number(el.dataset.revealIndex || 0);
          el.style.transitionDelay = Math.min(idx, 5) * 60 + "ms";
          el.classList.add("is-revealed");
          obs.unobserve(el);
          setTimeout(function () { el.style.transitionDelay = ""; el.classList.remove("reveal-pending", "is-revealed"); }, 800);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
      cards.forEach(function (c) { io.observe(c); });
    }
    var list = o.querySelector(".post-grid-list");
    if (!reduced && list && window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var activeMagLink = null;
      function resetMag(link) {
        link.style.setProperty("--mag-x", "0px");
        link.style.setProperty("--mag-y", "0px");
      }
      on(list, "pointermove", function (e) {
        var link = e.target.closest ? e.target.closest(".post-card-link") : null;
        if (!link) {
          if (activeMagLink) { resetMag(activeMagLink); activeMagLink = null; }
          return;
        }
        var r = link.getBoundingClientRect();
        link.style.setProperty("--spot-x", ((e.clientX - r.left) / r.width) * 100 + "%");
        link.style.setProperty("--spot-y", ((e.clientY - r.top) / r.height) * 100 + "%");
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var mx = Math.max(-8, Math.min(8, (e.clientX - cx) * 0.06));
        var my = Math.max(-8, Math.min(8, (e.clientY - cy) * 0.06));
        link.style.setProperty("--mag-x", mx + "px");
        link.style.setProperty("--mag-y", my + "px");
        if (activeMagLink && activeMagLink !== link) resetMag(activeMagLink);
        activeMagLink = link;
      });
      on(list, "pointerleave", function () {
        if (activeMagLink) { resetMag(activeMagLink); activeMagLink = null; }
      });
    }
    if (!reduced) {
      Array.prototype.forEach.call(o.querySelectorAll("[data-decrypt-hover]"), function (el) {
        on(el, "mouseenter", function () {
          scramble(el, el.getAttribute("data-decrypt-hover") || el.textContent, 26);
        });
      });
    }
    Array.prototype.forEach.call(o.querySelectorAll(".post-card-body h3"), function (h) {
      var s = h.querySelector(".post-card-title__text");
      if (!s) return;
      var w = s.scrollWidth - h.clientWidth;
      if (w > 4) {
        h.classList.add("is-scrollable");
        s.style.setProperty("--scroll", "-" + w + "px");
        s.style.setProperty("--scroll-dur", Math.max(1.2, w / 45) + "s");
      }
    });
    apply();
  }

  function initProgress() {
    var bar = document.querySelector("[data-reading-bar]");
    var top = document.querySelector("[data-back-to-top]");
    if (!bar && !top) return;
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (bar) bar.style.width = p + "%";
      if (top) top.hidden = h.scrollTop < 400;
    }
    on(window, "scroll", onScroll, { passive: true });
    onScroll();
    if (top) on(top, "click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  function initCursorReticle() {
    if (window.__portalReticleBound) return;
    var el = document.querySelector("[data-cursor-reticle]");
    if (!el) return;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduced || !fine) return;
    window.__portalReticleBound = true;
    var x = 0, y = 0, active = false;
    on(window, "pointermove", function (e) {
      x = e.clientX; y = e.clientY;
      el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      if (!active) { active = true; el.classList.add("is-active"); }
      var target = e.target.closest ? e.target.closest("a, button, input, .post-card-link") : null;
      el.classList.toggle("is-target", !!target);
    }, { passive: true });
    on(document, "pointerleave", function () {
      active = false;
      el.classList.remove("is-active");
    });
  }

  function boot() { initDrawer(); initGrid(); initProgress(); initCursorReticle(); initDecrypt(); }
  boot();
  document.addEventListener("nav", boot);
})();`,
    }}
  />
)

const DefaultFrame: PageFrame = {
  name: "default",
  render({ componentData, beforeBody, pageBody: Content, afterBody }: PageFrameProps): JSX.Element {
    const cfg = componentData.cfg
    const basePath =
      componentData.ctx.argv.serve || !cfg.baseUrl
        ? ""
        : new URL(`https://${cfg.baseUrl}`).pathname.replace(/\/$/, "")
    const isHome = componentData.fileData.slug === "index"
    const wordmark = cfg.pageTitle
    const mark = (wordmark || "dojo").toUpperCase().split(" ")[0] || "DOJO"
    const year = new Date().getFullYear()

    return (
      <>
        <video class="site-background" src={`${basePath}/static/bg.mp4`} autoplay muted loop playsinline aria-hidden="true"></video>
        <div class="site-grain" aria-hidden="true"></div>
        <div class="cursor-reticle" data-cursor-reticle="true" aria-hidden="true">
          <span class="cursor-reticle__h"></span>
          <span class="cursor-reticle__v"></span>
        </div>
        <header class="portal-nav">
          <div class="site-nav">
            <div class="site-nav__inner">
              <a class="site-nav__identity" href={`${basePath}/`} aria-label={`${wordmark} home`}>
                <img src={`${basePath}/static/icon.png`} alt={wordmark} width="48" height="48" />
              </a>
              <nav class="site-nav__links" aria-label="Primary navigation">
                <a href="#field-notes">Archive</a>
                <a href={`${basePath}/about`}>About</a>
                <a href={SITE.github} target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
              </nav>
              <button
                class="site-nav__menu-button"
                type="button"
                aria-label="Open navigation"
                aria-expanded="false"
                aria-controls="site-drawer"
                data-menu-toggle="true"
              >
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </header>

        <div class="site-drawer" id="site-drawer" aria-hidden="true" data-site-menu="true">
          <nav class="site-drawer__panel" aria-label="Site navigation">
            <div class="site-drawer__bar">
              <span class="site-drawer__dot"></span>
              <span class="site-drawer__dot"></span>
              <span class="site-drawer__dot"></span>
              <em>{SITE.hostname}</em>
            </div>
            <div class="site-drawer__links">
              <a href={`${basePath}/`}>
                <span class="site-drawer__prompt">$</span> {SITE.homePrompt}
              </a>
              <a href={`${basePath}/about`}>
                <span class="site-drawer__prompt">$</span> {SITE.aboutPrompt}
              </a>
              <a href={`${basePath}/index.xml`}>
                <span class="site-drawer__prompt">$</span> {SITE.rssPrompt}
              </a>
            </div>
            <div class="site-drawer__foot">
              <span class="site-drawer__prompt">$</span>
              <span class="site-drawer__cursor" aria-hidden="true"></span>
              <span>esc / click outside to close</span>
            </div>
          </nav>
        </div>

        {isHome ? (
          <main id="main-content" class="site-main site-main--home">
            <div class="page-lead popover-hint">
              <section class="home-masthead" aria-hidden="true">
                <div class="home-masthead__copy">
                  <p>{SITE.mastheadLabel}</p>
                  <h1>
                    <span class="decrypt-target" data-decrypt={SITE.mastheadTitle}>
                      {SITE.mastheadTitle}
                    </span>
                    <span
                      class="home-masthead__accent decrypt-target"
                      data-decrypt={SITE.mastheadAccent}
                    >
                      {SITE.mastheadAccent}
                    </span>
                    <span class="home-masthead__cursor" aria-hidden="true"></span>
                  </h1>
                </div>
              </section>
            </div>
            <div class="page-content">
              <ArchiveGrid componentData={componentData} basePath={basePath} />
            </div>
            <div class="page-tail">
              <div class="site-flair" aria-hidden="true"></div>
            </div>
          </main>
        ) : (
          <main id="main-content" class="site-main site-main--content">
            <div class="page-lead popover-hint">
              {beforeBody.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
            </div>
            <div class="page-content">
              <Content {...componentData} />
            </div>
            <div class="page-tail">
              {afterBody.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
              <div class="site-flair" aria-hidden="true"></div>
            </div>
          </main>
        )}

        <div class="reading-progress" aria-hidden="true">
          <span class="reading-progress__bar" data-reading-bar="true"></span>
        </div>
        <button
          type="button"
          class="back-to-top"
          data-back-to-top="true"
          aria-label="Back to top"
          title="Back to top"
          hidden
        >
          {UpIcon}
        </button>

        <footer>
          <p class="footer-mark">{mark} / 攻</p>
          <p class="footer-credit">Giving up is not in the blood, sir. · © {year}</p>
          <div class="footer-socials">
            {SITE.socials.map((s) => {
              const Icon = SocialIcons[s.name]
              return Icon ? (
                <a
                  key={s.name}
                  class="footer-social"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.name}
                  title={s.username ?? s.name}
                >
                  {Icon}
                </a>
              ) : null
            })}
          </div>
        </footer>

        <PortalScript />
      </>
    )
  },
}

export { DefaultFrame }
