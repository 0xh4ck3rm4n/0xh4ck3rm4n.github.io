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
    {
      name: "Discord",
      url: "https://discord.com/users/mcdonaldsandwich",
      username: "mcdonaldsandwich",
    },
  ],
  mastheadLabel: "cybersec · ctf · notes",
  mastheadTitle: "Giving up is not in the blood,",
  mastheadAccent: " sir.",
  mastheadTitle2: "— Nims Dai Purja",
  alias: "ecst4sy",
  heroGreeting: "hey, i'm",
  heroSubtitle: "currently: breaking things @ Softwarica College",
  heroTags: ["cybersecurity", "ctf player", "builder", "ai/ml"],
  aboutBio:
    "Cybersecurity student (Ethical Hacking & Cybersecurity, 4.0 GPA) building offensive-security skills through CTF competition, coursework, and self-directed tooling. CNSP-certified, currently competing with team v1olet across HTB, BrunnerCTF, and independent CTFs.",
  ctfLog: [
    { event: "BrunnerCTF 2026", team: "v1olet", result: "2nd / 1,103 teams" },
    { event: "0xV01D CTF", team: "v1olet", result: "2nd place" },
    {
      event: "Cyber Apocalypse CTF 2026 (HTB)",
      team: "—",
      result: "Team rank #105 · 136/136 solved",
    },
    { event: "Athena CTF 2026", team: "—", result: "Rank #39 · 24-hour jeopardy" },
  ],
  homePrompt: "cd ~/home",
  aboutPrompt: "cd ~/about",
  rssPrompt: "open ~/rss.xml",
  bootLines: [
    "INITIALIZING SIGNAL…",
    "LOADING PROFILE: ESCT4SY",
    "MOUNTING ~/writeups",
    "ACCESS GRANTED",
  ],
  terminalLines: [
    { cmd: "whoami", out: "esct4sy // cybersecurity student · ctf player · builder" },
    { cmd: "cat mission.txt", out: "break it, understand it, patch it, write it up." },
    {
      cmd: "ls ~/certs",
      out: "athena-ctf-2026  cllmse-2026  cyber-apocalypse-2026  dataforgood-2026  brunnerctf-2026",
    },
    { cmd: "cat stats.txt", out: "4.0 gpa // cnsp certified // 5 certs // 11 writeups shipped" },
  ],
  techniques: [
    "OWASP TOP 10",
    "PENETRATION TESTING",
    "NETWORK SECURITY",
    "WEB APPLICATION SECURITY",
    "RED TEAMING",
    "BINARY EXPLOITATION (PWN)",
    "REVERSE ENGINEERING",
    "DIGITAL FORENSICS",
    "CRYPTOGRAPHY",
    "CTF METHODOLOGY",
    "INCIDENT RESPONSE",
    "SOLIDITY",
    "FOUNDRY",
    "PYTHON",
    "MACHINE LEARNING",
  ],
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
  event?: string
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
      const category = String(fm.category ?? slug.split("/")[0] ?? "notes")
      const difficulty = typeof fm.difficulty === "string" ? fm.difficulty : undefined
      const image = typeof fm.image === "string" ? fm.image : undefined
      const event = typeof fm.event === "string" ? fm.event : undefined
      return {
        slug,
        title,
        date: getDate(f),
        description,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        difficulty,
        tags,
        image,
        event,
      }
    })
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
}

const SearchIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

const FunnelIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
)

const UpIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <line x1="12" y1="19" x2="12" y2="6"></line>
    <polyline points="6 12 12 6 18 12"></polyline>
  </svg>
)

const CategoryIcons: Record<string, JSX.Element> = {
  web: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </svg>
  ),
  forensics: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="20" y1="20" x2="15.5" y2="15.5" />
    </svg>
  ),
  reversing: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  ),
  network: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <circle cx="5" cy="6" r="2.2" />
      <circle cx="19" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M6.9 7.4 10.5 16M17.1 7.4 13.5 16M7.2 6h9.6" />
    </svg>
  ),
  malware: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2.2 2.2M16.8 16.8 19 19M5 19l2.2-2.2M16.8 7.2 19 5" />
    </svg>
  ),
  misics: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  writeup: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <path d="M5 3h9l5 5v13H5z" />
      <path d="M14 3v5h5M8 13h8M8 17h8" />
    </svg>
  ),
}

function categoryIconFor(tags: string[]): JSX.Element {
  for (const t of tags) {
    const key = t.toLowerCase()
    if (key === "writeup") continue
    const icon = CategoryIcons[key]
    if (icon) return icon
  }
  return CategoryIcons.writeup
}

function SectionHeader({
  n,
  label,
  hint,
}: {
  n: string
  label: string
  hint: JSX.Element | string
}) {
  return (
    <div class="section-header">
      <span class="section-header__n">{n}</span>
      <span class="section-header__label">{label}</span>
      <span class="section-header__rule" aria-hidden="true"></span>
      <span class="section-header__hint">{hint}</span>
    </div>
  )
}

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

function ArchiveGrid({
  componentData,
  basePath,
}: {
  componentData: PageFrameProps["componentData"]
  basePath: string
}) {
  const posts = buildPosts(componentData.allFiles)
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort()

  return (
    <section class="post-grid" id="field-notes">
      <div class="post-grid-head">
        <p class="post-grid-prompt">
          <span class="post-grid-prompt__sigil">$</span> ls ~/writeups
          <span class="post-grid-prompt__cursor" aria-hidden="true"></span>
        </p>
        <SectionHeader
          n="03"
          label="Active Case Files"
          hint={
            <>
              <strong data-result-count="true">{posts.length}</strong> posts · live from ~/writeups
            </>
          }
        />
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
          <button
            type="button"
            class="post-grid-search__clear"
            data-clear-search="true"
            aria-label="Clear search"
            hidden
          >
            ×
          </button>
          <kbd>/</kbd>
        </label>
        <div class="post-grid-actions">
          <button type="button" class="tag-filter clear filter-clear" data-clear-all="true" hidden>
            Clear all filters
          </button>
          <button
            type="button"
            class="filter-toggle"
            data-toggle-tags="true"
            aria-expanded="false"
            aria-label="Toggle tags"
          >
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
          const searchText = [
            post.title,
            post.category,
            post.description,
            post.slug,
            post.tags.join(" "),
            post.event ?? "",
          ]
            .join(" ")
            .toLowerCase()
          const sev = post.difficulty ? post.difficulty.toLowerCase() : ""
          const diff = sev ? ` post-card-diff--${sev}` : ""
          const caseId = String(i + 1).padStart(3, "0")
          return (
            <li
              class={`post-card${sev ? ` post-card--${sev}` : ""}`}
              data-tags={JSON.stringify(post.tags)}
              data-search={searchText}
              data-title={post.title}
              data-reveal-index={String(i % 6)}
            >
              <a class="post-card-link internal" href={`${basePath}/${post.slug}`}>
                <div class="post-card-media">
                  <span class="post-card-glyph" aria-hidden="true">
                    {categoryIconFor(post.tags)}
                  </span>
                  <span class="post-card-case-id">#{caseId}</span>
                  {post.difficulty ? (
                    <span class={`post-card-diff${diff}`}>{post.difficulty}</span>
                  ) : null}
                  {post.event ? <span class="post-card-event">{post.event}</span> : null}
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
                  {post.description ? (
                    <p class="post-card-description">{post.description}</p>
                  ) : null}
                  {post.tags.length > 0 ? (
                    <ul class="post-card-tags">
                      {post.tags.map((t) => (
                        <li>#{t}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p class="post-card-cta">
                    READ WRITEUP <span class="post-card-cta__arrow">→</span>
                  </p>
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

  function initBoot() {
    var el = document.querySelector("[data-boot]");
    if (!el) return;
    if (window.__signalBooted) { el.remove(); return; }
    window.__signalBooted = true;
    var already = false;
    try { already = sessionStorage.getItem("signal-booted") === "1"; } catch (e) {}
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (already || reduced) { el.remove(); return; }
    try { sessionStorage.setItem("signal-booted", "1"); } catch (e) {}
    el.classList.add("is-active");
    var lines = Array.prototype.slice.call(el.querySelectorAll("[data-boot-line]"));
    var i = 0;
    function finish() {
      document.removeEventListener("keydown", skip);
      document.removeEventListener("click", skip);
      el.classList.add("is-done");
      setTimeout(function () { el.remove(); }, 420);
    }
    function skip() { finish(); }
    function showNext() {
      if (i >= lines.length) { setTimeout(finish, 420); return; }
      lines[i].classList.add("is-visible");
      i++;
      setTimeout(showNext, 240);
    }
    document.addEventListener("keydown", skip, { once: true });
    document.addEventListener("click", skip, { once: true });
    setTimeout(showNext, 260);
  }

  function initGraph() {
    var canvas = document.querySelector("[data-signal-graph]");
    if (!canvas || window.__signalGraphBound) return;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !canvas.getContext) return;
    window.__signalGraphBound = true;
    var ctx = canvas.getContext("2d");
    var w = 0, h = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [];
    var COUNT = 46;
    var LINK_DIST = 150;
    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      nodes = [];
      for (var i = 0; i < COUNT; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
        });
      }
    }
    resize();
    seed();
    on(window, "resize", resize, { passive: true });
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            ctx.strokeStyle = "rgba(185,163,245," + (0.14 * (1 - dist / LINK_DIST)).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(185,163,245,0.55)";
      for (var i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    canvas.classList.add("is-ready");
    requestAnimationFrame(frame);
  }

  function initClock() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-hud-clock]"));
    if (!els.length || window.__signalClockBound) return;
    window.__signalClockBound = true;
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    function tick() {
      var d = new Date();
      var s = pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds());
      els.forEach(function (el) { el.textContent = s; });
    }
    tick();
    setInterval(tick, 1000);
  }

  function initTerminal() {
    var body = document.querySelector("[data-terminal-lines]");
    if (!body || window.__signalTerminalBound) return;
    window.__signalTerminalBound = true;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    var data;
    try { data = JSON.parse(body.getAttribute("data-terminal-lines")); } catch (e) { return; }
    if (!Array.isArray(data) || !data.length) return;
    var staticEl = body.querySelector(".terminal-panel__static");
    if (staticEl) staticEl.hidden = true;
    var dyn = document.createElement("div");
    dyn.className = "terminal-panel__dynamic";
    body.appendChild(dyn);
    var li = 0;
    function typeLine() {
      if (li >= data.length) {
        var cursor = document.createElement("span");
        cursor.className = "terminal-panel__cursor";
        dyn.appendChild(cursor);
        return;
      }
      var line = data[li];
      var p = document.createElement("p");
      var prompt = document.createElement("span");
      prompt.className = "terminal-panel__prompt";
      prompt.textContent = "$ ";
      var cmdSpan = document.createElement("span");
      p.appendChild(prompt);
      p.appendChild(cmdSpan);
      dyn.appendChild(p);
      var cmd = line.cmd || "";
      var ci = 0;
      (function typeChar() {
        if (ci <= cmd.length) {
          cmdSpan.textContent = cmd.slice(0, ci);
          ci++;
          setTimeout(typeChar, 34);
        } else {
          var out = document.createElement("span");
          out.className = "terminal-panel__out";
          out.textContent = line.out || "";
          p.appendChild(document.createElement("br"));
          p.appendChild(out);
          li++;
          setTimeout(typeLine, 420);
        }
      })();
    }
    typeLine();
  }

  function initHeroTypeline() {
    var wrap = document.querySelector("[data-typeline]");
    if (!wrap || window.__signalTypelineBound) return;
    window.__signalTypelineBound = true;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    var text = wrap.getAttribute("data-typeline") || "";
    var staticEl = wrap.querySelector(".hero-greet__static");
    if (staticEl) staticEl.hidden = true;
    var dyn = document.createElement("span");
    dyn.className = "hero-greet__dynamic";
    wrap.appendChild(dyn);
    var ci = 0;
    (function typeChar() {
      if (ci <= text.length) {
        dyn.textContent = text.slice(0, ci);
        ci++;
        setTimeout(typeChar, 38);
      }
    })();
  }

  function boot() {
    initDrawer(); initGrid(); initProgress(); initDecrypt(); initHeroTypeline();
    initBoot(); initGraph(); initClock(); initTerminal();
  }
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
        <div class="site-graph-fallback" aria-hidden="true"></div>
        <canvas class="site-graph" data-signal-graph="true" aria-hidden="true"></canvas>
        <div class="site-grain" aria-hidden="true"></div>
        <div class="boot-sequence" data-boot="true" aria-hidden="true">
          <div class="boot-sequence__inner">
            {SITE.bootLines.map((line, i) => (
              <p
                class={`boot-sequence__line${i === SITE.bootLines.length - 1 ? " boot-sequence__line--ok" : ""}`}
                data-boot-line="true"
              >
                &gt; {line}
              </p>
            ))}
          </div>
          <p class="boot-sequence__skip">press any key to skip</p>
        </div>
        <header class="portal-nav">
          <div class="site-nav">
            <div class="site-nav__inner">
              <a class="site-nav__identity" href={`${basePath}/`} aria-label={`${wordmark} home`}>
                <img src={`${basePath}/static/icon.png`} alt={wordmark} width="48" height="48" />
              </a>
              <div class="site-nav__hud" aria-hidden="true">
                <span class="hud-status-dot"></span>
                <span class="hud-status-label">LIVE</span>
                <time class="hud-clock" data-hud-clock="true">
                  00:00:00
                </time>
              </div>
              <nav class="site-nav__links" aria-label="Primary navigation">
                <a href="#ctf-log">CTF</a>
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

        <div class="signal-ticker" aria-hidden="true">
          <div class="signal-ticker__track">
            {SITE.techniques.map((t) => (
              <span class="signal-ticker__item">
                {t}
                <span class="signal-ticker__dot">·</span>
              </span>
            ))}
            {SITE.techniques.map((t) => (
              <span class="signal-ticker__item signal-ticker__item--dup">
                {t}
                <span class="signal-ticker__dot">·</span>
              </span>
            ))}
          </div>
        </div>

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
              <section class="hero-greet">
                <p class="hero-greet__eyebrow">{SITE.mastheadLabel}</p>
                <h1 class="hero-greet__title">
                  <span class="decrypt-target" data-decrypt={SITE.heroGreeting}>
                    {SITE.heroGreeting}
                  </span>{" "}
                  <span class="hero-greet__name decrypt-target" data-decrypt={SITE.alias}>
                    {SITE.alias}
                  </span>
                </h1>
                <p class="hero-greet__subtitle">
                  <span class="hero-greet__prompt">&gt;</span>{" "}
                  <span data-typeline={SITE.heroSubtitle}>
                    <span class="hero-greet__static">{SITE.heroSubtitle}</span>
                  </span>
                  <span class="hero-greet__cursor" aria-hidden="true"></span>
                </p>
                <ul class="hero-greet__tags">
                  {SITE.heroTags.map((t) => (
                    <li>{t}</li>
                  ))}
                </ul>
                <a href="#about-me" class="hero-scroll">
                  <span aria-hidden="true">▽</span> scroll <span aria-hidden="true">▽</span>
                </a>
              </section>
            </div>
            <div class="page-content">
              <section class="about-me" id="about-me">
                <SectionHeader n="01" label="about_me" hint="whoami" />
                <div class="about-me__grid">
                  <p class="about-me__bio">{SITE.aboutBio}</p>
                  <div class="terminal-panel" aria-hidden="true">
                    <div class="terminal-panel__bar">
                      <span class="terminal-panel__dot"></span>
                      <span class="terminal-panel__dot"></span>
                      <span class="terminal-panel__dot"></span>
                      <em>{SITE.hostname}</em>
                    </div>
                    <div
                      class="terminal-panel__body"
                      data-terminal-lines={JSON.stringify(SITE.terminalLines)}
                    >
                      <div class="terminal-panel__static">
                        {SITE.terminalLines.map((l) => (
                          <p>
                            <span class="terminal-panel__prompt">$ </span>
                            <span>{l.cmd}</span>
                            <br />
                            <span class="terminal-panel__out">{l.out}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="ctf-log" id="ctf-log">
                <SectionHeader n="02" label="ctf_log" hint="team v1olet" />
                <div class="ctf-log__table">
                  <div class="ctf-log__row ctf-log__row--head">
                    <span>Event</span>
                    <span>Team</span>
                    <span>Result</span>
                  </div>
                  {SITE.ctfLog.map((row) => (
                    <div class="ctf-log__row">
                      <span class="ctf-log__event">{row.event}</span>
                      <span class="ctf-log__team">{row.team}</span>
                      <span class="ctf-log__result">{row.result}</span>
                    </div>
                  ))}
                </div>
              </section>

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
          <p class="footer-status">
            <span class="hud-status-dot" aria-hidden="true"></span>
            SYSTEM OPERATIONAL
          </p>
          <p class="footer-mark">{mark} / 攻</p>
          <p class="footer-credit">Giving up is not in the blood, sir. · © {year}</p>
          <p class="footer-tagline">
            SIGNAL v2 · hand-tuned Quartz theme ·{" "}
            <time class="hud-clock" data-hud-clock="true">
              00:00:00
            </time>{" "}
            UTC
          </p>
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
