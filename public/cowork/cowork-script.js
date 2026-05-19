// Implementation Cowork — orchestration
// State: login → welcome → active task → completion → (optional dashboard)
// Reuses patterns from demo-website/index.html (chat bubbles, streaming tokens,
// progress, dropzone). Mock data inspired by mock-data.js (Zava Agentic Retailer).

(() => {
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const SPEED = 1.0;

  // ───────────────────── Past sessions (left rail) ─────────────────────
  // Each session is an artifact the user built while planning and getting
  // ready for today's implementation. Active session is on top.
  const MOCK_TASKS = [
    {
      id: "t-active",
      title: "Configure USMF Legal Entity",
      sub: "Today · in progress",
      ind: "spin",
      active: true,
    },
    {
      id: "t-config-workbook",
      title: "Built configuration workbook (USMF)",
      sub: "Yesterday",
      ind: "circle",
    },
    {
      id: "t-coa-mapping",
      title: "Built chart of accounts mapping",
      sub: "2 days ago",
      ind: "circle",
    },
    {
      id: "t-test-plan",
      title: "Built test plan & UAT scenarios",
      sub: "3 days ago",
      ind: "circle",
    },
    {
      id: "t-blueprint",
      title: "Built solution blueprint v1",
      sub: "4 days ago",
      ind: "circle",
    },
    {
      id: "t-fitgap",
      title: "Built fit-gap workbook",
      sub: "Last week",
      ind: "circle",
    },
    {
      id: "t-charter",
      title: "Built project charter & scope",
      sub: "2 weeks ago",
      ind: "circle",
    },
    {
      id: "t-discovery",
      title: "Built discovery & process inventory",
      sub: "3 weeks ago",
      ind: "circle",
    },
  ];

  // ───────────────────── Mock skills ─────────────────────
  const SKILLS = [
    "IntakeParser",
    "ConfigExecutorAgent",
    "ClarificationAgent",
    "ReportGenerator",
    "PhantomWorker",
  ];

  // ───────────────────── State ─────────────────────
  const state = {
    activeTaskId: "t-active",
    artifacts: [],   // { name, kind, size }
    context: [],     // { name, kind }
    progress: { current: 0, total: 4, items: [] },
    localTasks: [],  // [{ name, status }] — sub-tasks of current activity, shown in right rail Progress
    skillsUsed: {},
    auditLog: [],    // { ts, who, action, target }
    waitingForInput: null, // { prompt, resolve }
    running: false,
  };

  // Persist completed tasks/audit so dashboard.html can read them, and
  // the SESSIONS list so it survives a navigation to /dashboard and back.
  function persist() {
    try {
      const prior = JSON.parse(localStorage.getItem("cowork-state") || "{}");
      localStorage.setItem(
        "cowork-state",
        JSON.stringify({
          ...prior,
          progress: state.progress,
          artifacts: state.artifacts,
          context: state.context,
          skillsUsed: state.skillsUsed,
          auditLog: state.auditLog,
          activeTitle: $("task-bar-title")?.textContent || "Configure USMF Legal Entity",
          completedAt: state.progress.current === state.progress.total ? Date.now() : null,
          sessions: MOCK_TASKS,
          activeTaskId: state.activeTaskId,
        })
      );
    } catch (e) { /* ignore */ }
  }

  // Restore the SESSIONS list on load, if previously persisted
  function restoreSessions() {
    try {
      const cached = JSON.parse(localStorage.getItem("cowork-state") || "{}");
      if (Array.isArray(cached.sessions) && cached.sessions.length) {
        MOCK_TASKS.length = 0;
        cached.sessions.forEach(s => MOCK_TASKS.push(s));
        if (cached.activeTaskId) state.activeTaskId = cached.activeTaskId;
      }
    } catch (e) { /* ignore */ }
  }

  // ───────────────────── Login ─────────────────────
  function bindLogin() {
    const overlay = $("login");
    const enter = $("login-enter");
    const skip = localStorage.getItem("cowork-logged-in");
    if (skip) {
      overlay.style.display = "none";
      document.body.classList.remove("lock");
      return;
    }
    enter.addEventListener("click", () => {
      const persona = $("login-persona").value;
      const name = ($("login-name").value || "Gokul Ramesh").trim();
      const initials = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
      const org = persona === "sme" ? "Zava Agentic Retailer" : "Microsoft FastTrack";
      $("user-name").textContent = name;
      $("user-org").textContent = org;
      $("user-avatar").textContent = initials;
      localStorage.setItem("cowork-logged-in", "1");
      localStorage.setItem("cowork-user", JSON.stringify({ name, org, initials }));
      overlay.style.display = "none";
      document.body.classList.remove("lock");
    });

    // restore avatar/name if saved
    const saved = localStorage.getItem("cowork-user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        $("user-name").textContent = u.name;
        $("user-org").textContent = u.org;
        $("user-avatar").textContent = u.initials;
      } catch (e) {}
    }
  }

  // ───────────────────── Task list rendering ─────────────────────
  function renderTaskList() {
    const list = $("task-list");
    list.innerHTML = "";
    MOCK_TASKS.forEach((t) => {
      const row = document.createElement("div");
      row.className = "task-row" + (t.id === state.activeTaskId ? " active" : "");
      row.dataset.id = t.id;
      let indHtml = "";
      if (t.ind === "dot")    indHtml = `<span class="ind-dot"></span>`;
      if (t.ind === "spin")   indHtml = `<span class="ind-spin"></span>`;
      if (t.ind === "circle") indHtml = `<span class="ind-circle"></span>`;
      row.innerHTML = `
        <div>
          <div class="title">${t.title}</div>
          <div class="sub">${t.sub}</div>
        </div>
        <div class="ind">${indHtml}</div>`;
      row.addEventListener("click", () => {
        if (t.active) {
          openTaskView();
          hideChatHistory();
        } else {
          flash(row);
          toast(`Past session "${t.title}" — preview-only.`);
        }
      });
      list.appendChild(row);
    });
  }
  function flash(el) {
    el.style.background = "var(--cw-accent-soft)";
    setTimeout(() => (el.style.background = ""), 350);
  }

  // ───────────────────── Welcome composer ─────────────────────
  function bindWelcome() {
    // If user just returned from the dashboard after the cutover validation,
    // show a return banner with a follow-up suggestion in the welcome view.
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("completed") === "cutover") {
        // Mark the just-returned active session as Complete and keep it on top
        const activeRow = MOCK_TASKS.find(t => t.id === state.activeTaskId);
        if (activeRow) {
          activeRow.active = true;       // keep it the active row
          activeRow.ind = "circle";      // not spinning anymore
          activeRow.sub = "Today · complete · ATL-01 live";
          renderTaskList();
          persist();
        }

        const wrap = document.querySelector("#view-welcome");
        if (wrap && !document.getElementById("cw-return-banner")) {
          const banner = document.createElement("div");
          banner.id = "cw-return-banner";
          banner.style.cssText = "max-width:760px;margin:0 auto 22px;background:#dff6dd;border:1px solid #92d39a;border-radius:14px;padding:16px 18px;text-align:left;";
          banner.innerHTML = `
            <div style="font-weight:600;color:#0b6a1f;margin-bottom:4px;">✓ Warehouse ATL-01 is live</div>
            <div style="font-size:13.5px;color:#0b6a1f;line-height:1.5;">
              All 7 warehouse tasks complete. Want me to schedule the cutover window or build a hypercare KPI tracker next?
            </div>`;
          const composer = wrap.querySelector(".composer-pill");
          if (composer) wrap.insertBefore(banner, composer);
          else wrap.prepend(banner);
        }
      }
    } catch (e) { /* ignore */ }

    // Chip row (replaces old .quick grid)
    document.querySelectorAll(".chips-row .chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const q = btn.dataset.q;
        $("welcome-input").value = q;
        startTask(q);
      });
    });
    // Send button (circular)
    $("welcome-start").addEventListener("click", () => {
      const v = $("welcome-input").value.trim();
      if (!v) return;
      startTask(v);
    });
    // Enter on single-line input fires Send
    $("welcome-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const v = $("welcome-input").value.trim();
        if (v) startTask(v);
      }
    });

    // File picker (no longer has a visible "+" button — kept for drag-drop landing)
    const fileInput = $("welcome-file");
    fileInput.addEventListener("change", () => {
      if (fileInput.files[0]) {
        $("welcome-input").value =
          "Set up new legal entity USMF for U.S. operations (see attached SOW)";
        startTask($("welcome-input").value, fileInput.files[0].name);
      }
    });

    // Drag and drop anywhere on the welcome area
    const dz = $("view-welcome");
    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.style.outline = "2px dashed var(--cw-accent)";
      dz.style.outlineOffset = "-12px";
    });
    dz.addEventListener("dragleave", () => {
      dz.style.outline = "";
    });
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.style.outline = "";
      const f = e.dataTransfer.files[0];
      if (f) {
        $("welcome-input").value =
          "Set up new legal entity USMF for U.S. operations (see attached SOW)";
        startTask($("welcome-input").value, f.name);
      }
    });
  }

  // ───────────────────── Task view ─────────────────────
  function openTaskView() {
    $("view-welcome").style.display = "none";
    $("view-task").style.display = "flex";
    $("center").classList.add("task-mode");
  }
  function closeTaskView() {
    $("view-task").style.display = "none";
    $("view-welcome").style.display = "block";
    $("center").classList.remove("task-mode");
  }

  // Single document-level click delegator so every button responds even
  // if its DOM element didn't exist yet at boot time.
  function wireAllButtons() {
    // Wire the IDed buttons that we know exist
    $("btn-back").addEventListener("click", closeTaskView);
    $("btn-dashboard").addEventListener("click", () => {
      persist();
      window.location.href = "/cowork/dashboard";
    });
    $("task-send").addEventListener("click", sendUserReply);
    $("task-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendUserReply();
      }
    });
    $("task-add").addEventListener("click", () => $("welcome-file").click());

    // Document-level delegation for everything else
    document.addEventListener("click", onDocClick);
  }

  function onDocClick(e) {
    const t = e.target;

    // 1. Right-rail panel chevron / head — toggle collapse
    const head = t.closest(".panel-head");
    if (head && head.parentElement && head.parentElement.classList.contains("panel")) {
      head.parentElement.classList.toggle("collapsed");
      return;
    }

    // 2. Right-rail close (×)
    if (t.closest("#right-close")) {
      toggleRight();
      return;
    }

    // 3. Rail toggle (top-right of left rail) — collapse whole rail
    if (t.closest("#rail-toggle")) {
      toggleRail();
      return;
    }
    // 3b. Show-rail pill restores it
    if (t.closest("#show-rail")) {
      toggleRail();
      return;
    }

    // 4. Chat / Cowork segmented tabs
    const seg = t.closest(".seg button");
    if (seg) {
      seg.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      seg.classList.add("active");
      if (seg.dataset.tab === "chat") showChatHistory();
      else showCoworkMode();
      return;
    }

    // 5. + New task button
    if (t.closest("#new-task")) {
      // Reset to welcome view, focus composer
      closeTaskView();
      hideChatHistory();
      // ensure Cowork tab active
      document.querySelectorAll(".seg button").forEach((b) => {
        b.classList.toggle("active", b.dataset.tab === "cowork");
      });
      setTimeout(() => $("welcome-input")?.focus(), 50);
      return;
    }

    // 6. Persona menu chevron — toggle popover
    if (t.closest("#persona-menu-btn")) {
      $("persona-menu").hidden = !$("persona-menu").hidden;
      return;
    }
    // 6b. Persona menu actions
    const menuAct = t.closest("#persona-menu button");
    if (menuAct) {
      $("persona-menu").hidden = true;
      if (menuAct.dataset.act === "reset") {
        localStorage.removeItem("cowork-state");
        toast("Workspace reset. Reloading…");
        setTimeout(() => { location.href = "/cowork"; }, 600);
      } else if (menuAct.dataset.act === "signout") {
        localStorage.clear();
        toast("Signed out. Reloading…");
        setTimeout(() => location.reload(), 800);
      }
      return;
    }
    // close persona menu on outside click
    if (!$("persona-menu").hidden && !t.closest("#persona-menu") && !t.closest("#persona-menu-btn")) {
      $("persona-menu").hidden = true;
    }

    // 7. Click on the user persona row itself opens the menu too
    if (t.closest(".rail-footer .persona") || t.closest(".rail-footer .avatar")) {
      $("persona-menu").hidden = !$("persona-menu").hidden;
      return;
    }

    // 8. Chat history items resume the active task
    const chatItem = t.closest(".chat-history-item");
    if (chatItem) {
      hideChatHistory();
      // restore Cowork tab
      document.querySelectorAll(".seg button").forEach((b) => {
        b.classList.toggle("active", b.dataset.tab === "cowork");
      });
      const id = chatItem.dataset.id;
      if (id === "t-active" || id === "active") {
        openTaskView();
      } else {
        toast("That conversation is read-only in this preview.");
      }
      return;
    }
  }

  // ───────────────────── Rail / Right toggles ─────────────────────
  function toggleRail() {
    const rail = document.querySelector(".rail");
    const shell = document.querySelector(".shell");
    const pill  = $("show-rail");
    const next = !rail.classList.contains("collapsed");
    rail.classList.toggle("collapsed", next);
    shell.classList.toggle("rail-collapsed", next);
    if (pill) pill.classList.toggle("show", next);
  }
  function toggleRight() {
    const pane = $("right");
    const shell = document.querySelector(".shell");
    const next = !pane.classList.contains("collapsed");
    pane.classList.toggle("collapsed", next);
    shell.classList.toggle("right-collapsed", next);
  }

  // ───────────────────── Chat history view ─────────────────────
  const CHAT_HISTORY = [
    {
      id: "t-active",
      title: "Configure USMF Legal Entity",
      snip: "Reading the SOW… extracting requirements for Zava Agentic Retailer (ZAUS).",
      meta: "Today · 4 of 4 steps",
    },
    {
      id: "t-coa",
      title: "Build Chart of Accounts for Zava",
      snip: "I'll import 214 main accounts via DMF. The ConfigMaster template covers Assets, Liabilities, Equity, Revenue, COGS, Expenses, Intercompany.",
      meta: "Yesterday · in progress",
    },
    {
      id: "t-zauk",
      title: "Generate plan for ZAUK entity",
      snip: "Researching processes from the Companies House registry and previous ZAUS implementation pattern. Will propose a UK-localized variant.",
      meta: "2 days ago · step 3 of 4",
    },
    {
      id: "t-gst",
      title: "Validate ZAIN GST setup",
      snip: "Checking Indian GST configuration: GSTIN format, HSN codes, place-of-supply rules.",
      meta: "3 days ago · gathering sources",
    },
    {
      id: "t-cutover",
      title: "Compile cutover checklist",
      snip: "9 items: GL freeze, AP cutoff, AR cutoff, inventory snapshot, payroll, tax periods, bank reconciliation, security review, sign-off.",
      meta: "3 days ago · complete",
    },
  ];

  function showChatHistory() {
    $("view-welcome").style.display = "none";
    $("view-task").style.display = "none";
    const list = $("chat-history-list");
    list.innerHTML = "";
    CHAT_HISTORY.forEach((c) => {
      const it = document.createElement("div");
      it.className = "chat-history-item";
      it.dataset.id = c.id;
      it.innerHTML = `
        <div class="h-title">${escapeHtml(c.title)}</div>
        <div class="h-snip">${escapeHtml(c.snip)}</div>
        <div class="h-meta">${escapeHtml(c.meta)}</div>`;
      list.appendChild(it);
    });
    $("view-chat").style.display = "block";
    $("center").classList.remove("task-mode");
  }
  function hideChatHistory() {
    $("view-chat").style.display = "none";
  }
  function showCoworkMode() {
    hideChatHistory();
    if ($("view-task").style.display !== "none") {
      // already in task view, leave it
    } else {
      $("view-welcome").style.display = "block";
    }
  }

  // ───────────────────── Toast helper ─────────────────────
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2900);
  }

  function sendUserReply() {
    const input = $("task-input");
    const v = input.value.trim();
    if (!v) return;
    input.value = "";
    addUserMsg(v);

    // If the agent is waiting for input, resolve it
    if (state.waitingForInput) {
      const resolve = state.waitingForInput.resolve;
      state.waitingForInput = null;
      resolve(v);
    }
  }

  // ───────────────────── Chat thread ─────────────────────
  function addUserMsg(text, fileName) {
    const m = document.createElement("div");
    m.className = "msg user";
    const fileChip = fileName
      ? `<span class="file-chip"><span class="doc">📄</span> ${escapeHtml(fileName)}</span><br/>`
      : "";
    m.innerHTML = `<div class="bubble">${fileChip}${escapeHtml(text)}</div>`;
    $("thread").appendChild(m);
    scrollThread();
    state.auditLog.push({ ts: Date.now(), who: "user", action: "message", target: text });
  }
  function addBotMsg(html) {
    const m = document.createElement("div");
    m.className = "msg bot";
    m.innerHTML = `<div class="bubble">${html}</div>`;
    $("thread").appendChild(m);
    scrollThread();
    return m.querySelector(".bubble");
  }
  async function streamBotMsg(text, opts = {}) {
    const bubble = addBotMsg("");
    const cps = opts.cps || 35;
    const wait = 1000 / cps;
    for (let i = 0; i < text.length; i++) {
      bubble.innerHTML += text[i] === "\n" ? "<br/>" : text[i];
      if (i % 2 === 0) await sleep(wait);
      scrollThread();
    }
    state.auditLog.push({ ts: Date.now(), who: "agent", action: "stream", target: text.slice(0, 80) });
    return bubble;
  }
  function addTyping() {
    const m = document.createElement("div");
    m.className = "msg bot";
    m.id = "typing";
    m.innerHTML = `<div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div>`;
    $("thread").appendChild(m);
    scrollThread();
  }
  function removeTyping() {
    const t = $("typing");
    if (t) t.remove();
  }
  function scrollThread() {
    const t = $("thread");
    t.scrollTop = t.scrollHeight;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ───────────────────── Right rail updates ─────────────────────
  function hide(elId) { const el = $(elId); if (el) el.style.display = "none"; }
  function show(elId) { const el = $(elId); if (el) el.style.display = ""; }

  function updateProgress(idx, items) {
    state.progress.current = idx;
    state.progress.total = items.length;
    state.progress.items = items;

    hide("progress-empty");
    show("progress-active");

    const row = $("progress-steps");
    row.innerHTML = "";
    for (let i = 0; i < items.length; i++) {
      const step = document.createElement("div");
      step.className = "pstep" + (i < idx ? " done" : i === idx ? " cur" : "");
      step.innerHTML = i < idx ? `<span>✓</span>` : `<span>${i + 1}</span>`;
      row.appendChild(step);
      if (i < items.length - 1) {
        const dash = document.createElement("div");
        dash.className = "pdash" + (i < idx ? " done" : "");
        row.appendChild(dash);
      }
    }
    const list = $("progress-step-list");
    list.style.display = "block";
    list.style.marginTop = "12px";
    list.innerHTML = items
      .map((it, i) => {
        const cls = i < idx ? "done" : i === idx ? "cur" : "";
        const badge = i < idx ? "DONE" : i === idx ? "RUN" : "TODO";
        return `<div class="item ${cls}"><span class="badge">${badge}</span><span class="name">${it}</span></div>`;
      })
      .join("");

    persist();
  }

  function addArtifact(name, kind, size) {
    state.artifacts.push({ name, kind, size, ts: Date.now() });
    hide("output-empty");
    const list = $("artifact-list");
    const row = document.createElement("div");
    row.className = "artifact";
    row.innerHTML = `<span class="file">📄</span><span>${escapeHtml(name)}</span><span class="meta">${escapeHtml(size || kind)}</span>`;
    list.appendChild(row);
    persist();
  }

  function addContext(name, kind) {
    state.context.push({ name, kind });
    hide("input-empty");
    const list = $("context-list");
    const row = document.createElement("div");
    row.className = "context-item";
    row.innerHTML = `<span style="color: var(--cw-accent);">⌘</span><span>${escapeHtml(name)}</span><span class="meta">${escapeHtml(kind)}</span>`;
    list.appendChild(row);
  }

  // ───────────────────── Local tasks (right-rail Progress) ─────────────────────
  function setLocalTasks(items) {
    state.localTasks = items.map((it) => (typeof it === "string" ? { name: it, status: "todo" } : it));
    hide("progress-empty");
    show("progress-active");
    renderLocalTasks();
  }
  function renderLocalTasks() {
    const list = $("local-task-list");
    list.innerHTML = "";
    state.localTasks.forEach((t, i) => {
      const row = document.createElement("div");
      row.className = "local-task " + (t.status || "todo");
      row.dataset.i = i;
      const inner =
        t.status === "done" ? "✓" :
        t.status === "wait" ? "?" : "";
      // Allow rich HTML in name (for inline <code>) by opt-in via t.html === true.
      const nameHtml = t.html ? t.name : escapeHtml(t.name);
      const metaHtml = t.meta ? `<span class="ltmeta">${t.meta}</span>` : "";
      row.innerHTML = `
        <span class="circ">${inner}</span>
        <span class="lt-body">
          <span class="ltname">${nameHtml}</span>
          ${metaHtml}
        </span>`;
      list.appendChild(row);
    });
    const total = state.localTasks.length;
    const done = state.localTasks.filter((x) => x.status === "done").length;
    const cEl = $("progress-counter");
    cEl.hidden = total === 0;
    cEl.textContent = `${done} / ${total}`;
    // Auto-scroll: keep the currently active step (or the latest done) in view
    requestAnimationFrame(() => {
      const rows = list.querySelectorAll(".local-task");
      if (!rows.length) return;
      let target = list.querySelector(".local-task.cur")
                || list.querySelector(".local-task.wait")
                || rows[Math.min(done, rows.length - 1)];
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
    persist();
  }
  function findLocalTask(key) {
    if (typeof key === "number") return state.localTasks[key];
    return state.localTasks.find((x) => x.name === key);
  }
  function startLocalTask(key) {
    const t = findLocalTask(key);
    if (t) { t.status = "cur"; renderLocalTasks(); }
  }
  function completeLocalTask(key) {
    const t = findLocalTask(key);
    if (t) { t.status = "done"; renderLocalTasks(); }
  }
  function setLocalTaskStatus(key, status) {
    const t = findLocalTask(key);
    if (t) { t.status = status; renderLocalTasks(); }
  }
  function clearLocalTasks() {
    state.localTasks = [];
    show("progress-empty");
    hide("progress-active");
    $("local-task-list").innerHTML = "";
    $("progress-counter").hidden = true;
    persist();
  }

  // ───────────────────── Choice card (multi-choice popup in chat) ─────────────────────
  // opts = {
  //   title: string,
  //   counter: '1 of 2',
  //   options: [{ key, title, desc }],
  //   allowFreeText: boolean,
  //   onPick: (key, freeText) => void
  // }
  function postChoiceCard(opts) {
    const m = document.createElement("div");
    m.className = "msg bot";
    const optionsHtml = opts.options.map((o, i) => `
      <button type="button" class="choice-option ${i === 0 ? "selected" : ""}" data-key="${escapeHtml(o.key)}">
        <span class="radio"></span>
        <span class="opt-body">
          <div class="opt-title">${escapeHtml(o.title)}</div>
          ${o.desc ? `<div class="opt-desc">${escapeHtml(o.desc)}</div>` : ""}
        </span>
      </button>`).join("");

    const freeHtml = opts.allowFreeText ? `
      <div class="choice-option free" data-key="__free__">
        <span class="radio"></span>
        <span class="opt-body" style="flex:1;">
          <input type="text" placeholder="Describe another option" />
        </span>
      </div>` : "";

    m.innerHTML = `
      <div class="bubble" style="padding: 0;">
        <div class="choice-card" tabindex="0">
          <div class="ch-head">
            <span class="title">${escapeHtml(opts.title || "Choose one")}</span>
            <span class="meta">
              <span>${escapeHtml(opts.counter || "")}</span>
              <button type="button" class="x" aria-label="Skip">✕</button>
            </span>
          </div>
          <div class="options">
            ${optionsHtml}
            ${freeHtml}
          </div>
          <div class="ch-foot">
            <span class="kbd"><b>↑↓</b> to navigate · <b>Space</b> to select · <b>Esc</b> to skip</span>
            <button type="button" class="skip-btn">Skip</button>
          </div>
        </div>
      </div>`;
    $("thread").appendChild(m);
    scrollThread();

    const card = m.querySelector(".choice-card");
    let activeIdx = 0;
    const btns = card.querySelectorAll(".choice-option");
    function setActive(i) {
      btns.forEach((b) => b.classList.remove("selected"));
      btns[i]?.classList.add("selected");
      activeIdx = i;
    }
    btns.forEach((b, i) => {
      b.addEventListener("click", () => {
        setActive(i);
      });
    });

    // double-click confirms; or single click and then "space"
    btns.forEach((b) =>
      b.addEventListener("dblclick", () => commit(b.dataset.key, b.querySelector("input")?.value))
    );

    function commit(key, freeText) {
      // gray the card out, mark it inert
      card.style.opacity = "0.6";
      card.style.pointerEvents = "none";
      btns.forEach((b) => b.style.cursor = "default");
      const skipBtn = card.querySelector(".skip-btn");
      if (skipBtn) skipBtn.disabled = true;
      const xBtn = card.querySelector(".x");
      if (xBtn) xBtn.disabled = true;

      const picked = opts.options.find((o) => o.key === key);
      if (picked) addUserMsg(`Selected: ${picked.title}`);
      else if (key === "__free__" && freeText) addUserMsg(freeText);
      else addUserMsg("Skipped");

      if (typeof opts.onPick === "function") opts.onPick(key, freeText);
    }

    // Confirm with Enter on whichever is selected; or click the radio to commit too
    btns.forEach((b, i) => {
      b.addEventListener("click", () => {
        // first click selects, second click commits
        if (b.classList.contains("selected") && b.dataset.committedOnce) {
          commit(b.dataset.key, b.querySelector("input")?.value);
        } else {
          setActive(i);
          b.dataset.committedOnce = "1";
          // schedule a micro-delay before commit on a 2nd click; immediate single-click commit is also OK
        }
      });
    });

    // single-click commit (simpler UX): commit immediately on first click
    btns.forEach((b) => {
      b.replaceWith(b.cloneNode(true));
    });
    // re-query after clone-replace
    const btns2 = card.querySelectorAll(".choice-option");
    btns2.forEach((b, i) => {
      b.addEventListener("click", (e) => {
        // Don't commit if user is typing in the free-text input
        if (e.target.tagName === "INPUT") return;
        setActiveLater(b, i);
      });
      function setActiveLater(node, idx) {
        btns2.forEach((x) => x.classList.remove("selected"));
        node.classList.add("selected");
        setTimeout(() => commit(node.dataset.key, node.querySelector("input")?.value), 220);
      }
    });

    // Free-text: commit when user presses Enter inside the input
    const freeInput = card.querySelector(".choice-option.free input");
    if (freeInput) {
      freeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && freeInput.value.trim()) {
          e.preventDefault();
          commit("__free__", freeInput.value.trim());
        }
      });
    }

    // Skip / X buttons
    card.querySelector(".x")?.addEventListener("click", () => commit("__skip__"));
    card.querySelector(".skip-btn")?.addEventListener("click", () => commit("__skip__"));

    // Esc-to-skip while card has focus
    card.addEventListener("keydown", (e) => {
      if (e.key === "Escape") commit("__skip__");
    });

    return m;
  }

  function renderSkills() {
    const list = $("skills-list");
    list.innerHTML = "";
    const entries = Object.entries(state.skillsUsed);
    if (entries.length === 0) {
      show("skills-empty");
      return;
    }
    hide("skills-empty");
    entries.forEach(([name, runs]) => {
      const row = document.createElement("div");
      row.className = "skill-row";
      row.innerHTML = `<span class="lit">💡</span><span class="name">${escapeHtml(name)}</span><span class="runs">${runs} run${runs === 1 ? "" : "s"}</span>`;
      list.appendChild(row);
    });
  }

  // ───────────────────── Plan card ─────────────────────
  const PLAN_STEPS = [
    {
      name: "Configure Legal Entity USMF",
      meta: "L01 · LegalEntity · MCPData",
      diff: `<span class="key">POST</span> /data/LegalEntities\n{\n  <span class="add">"CompanyCode": "ZAUS"</span>,\n  <span class="add">"Name": "Zava Agentic Retailer Inc."</span>,\n  <span class="add">"Country": "USA"</span>,\n  <span class="add">"Currency": "USD"</span>,\n  <span class="add">"Address": "500 Innovation Blvd, Austin TX"</span>\n}`,
    },
    {
      name: "Setup Base Currency USD",
      meta: "L01 · Currency · MCPData",
      diff: `<span class="key">POST</span> /data/Currencys\n{\n  <span class="add">"CurrencyCode": "USD"</span>,\n  <span class="add">"ISO": "USD"</span>,\n  <span class="add">"Rounding": 0.01</span>\n}`,
    },
    {
      name: "Create Fiscal Calendar FY2026",
      meta: "L01 · FiscalCalendar · MCPData",
      diff: `<span class="key">POST</span> /data/FiscalCalendars\n{\n  <span class="add">"Calendar": "FY2026"</span>,\n  <span class="add">"Periods": 12</span>,\n  <span class="add">"StartDate": "2026-01-01"</span>\n}`,
    },
    {
      name: "Setup Default Posting Profile",
      meta: "L03 · VendPostingProfile · MCPData",
      diff: `<span class="key">POST</span> /data/VendPostingProfiles\n{\n  <span class="add">"Profile": "USMF-DEFAULT"</span>,\n  <span class="add">"LiabilityAccount": "200100"</span>\n}`,
    },
  ];

  function planCardHtml() {
    const stepsHtml = PLAN_STEPS.map(
      (s, i) => `
        <div class="plan-step" data-i="${i}">
          <div class="plan-step-head">
            <span class="check">☐</span>
            <span class="name">${s.name}</span>
            <span class="meta">${s.meta}</span>
            <span class="caret">▸</span>
          </div>
          <div class="diff">${s.diff}</div>
        </div>`
    ).join("");

    return `
      <div class="plan-card">
        <h3>Implementation plan — Phase 1</h3>
        <div class="plan-sub">4 configuration steps · estimated 8–12 minutes · environment <span class="mono">d365perflab.sandbox.operations.dynamics.com</span></div>
        ${stepsHtml}
        <div class="plan-decisions">
          <b>Decisions needed</b>
          1. Use shared global Chart of Accounts across ZAUS / ZAUK / ZAIN, or entity-specific COA per legal entity?<br/>
          2. Cutoff date for migrating 156 legacy AP open invoices and 124 legacy AR open invoices.
        </div>
        <div class="plan-cta">
          <button class="pill" id="plan-edit">Edit plan</button>
          <button class="pill primary" id="plan-confirm">Confirm and execute</button>
        </div>
      </div>`;
  }

  function bindPlanCard() {
    document.querySelectorAll(".plan-step-head").forEach((h) => {
      h.addEventListener("click", () => h.parentElement.classList.toggle("open"));
    });
    $("plan-confirm").addEventListener("click", () => {
      $("plan-confirm").disabled = true;
      $("plan-confirm").style.opacity = "0.5";
      executePlan();
    });
    $("plan-edit").addEventListener("click", () => {
      addBotMsg("<i style='color: var(--cw-text-muted);'>Edit mode is not wired in this preview. Click <b>Confirm and execute</b> to continue.</i>");
    });
  }

  // ───────────────────── Demo flow ─────────────────────
  function prependSession(intent) {
    // Demote the currently active row to a past session
    const currentActive = MOCK_TASKS.find(t => t.id === state.activeTaskId);
    if (currentActive) {
      currentActive.active = false;
      currentActive.ind = "circle";
      currentActive.sub = "Just now";
    }
    // Prepend a new active session with the user's intent as the title
    const newId = "t-" + Date.now();
    const title = intent.length > 56 ? intent.slice(0, 53).trim() + "…" : intent;
    MOCK_TASKS.unshift({ id: newId, title, sub: "Today · in progress", ind: "spin", active: true });
    state.activeTaskId = newId;
    renderTaskList();
    persist();
  }

  async function startTask(intent, fileName) {
    openTaskView();
    prependSession(intent);
    // Pick the right reference file based on intent so the agent's
    // "I read X" feels grounded to the request the user actually made.
    const isWarehouse = /(warehouse|wms|dc[\s-]?atlanta|atl-?01)/i.test(intent);
    const defaultFile = isWarehouse ? "ATL-policy-brief.md" : "SOW-Zava-USMF.md";
    addUserMsg(intent, fileName || defaultFile);

    // Route to build-deliverables flow on certain phrases
    if (/build (all )?(deliverable|document|docs|materials|files)/i.test(intent)) {
      await runBuildDeliverablesFlow();
      return;
    }

    // Route to warehouse / WMS flow
    if (isWarehouse) {
      await runWarehouseFlow();
      return;
    }

    addContext("SOW-Zava-USMF.md", "input");
    addContext("d365perflab.sandbox.operations.dynamics.com", "environment");
    addContext("ft_tasks (Dataverse)", "tool");
    await sleep(300);

    addTyping();
    await sleep(800);
    removeTyping();

    await streamBotMsg(
      "Reading the SOW… extracting requirements for Zava Agentic Retailer (ZAUS).",
      { cps: 60 }
    );
    bumpSkill("IntakeParser");
    await sleep(300);

    await streamBotMsg(
      "I see this is a Phase 1 legal entity setup for U.S. operations. Four configuration steps in dependency layer L01–L03. I'll prepare a plan with the OData payloads I'd write — review it before I execute.",
      { cps: 70 }
    );

    await sleep(400);
    const planMsg = addBotMsg(planCardHtml());
    bindPlanCard();

    updateProgress(0, ["Plan", "Confirm", "Execute", "Report"]);
  }

  async function executePlan() {
    state.running = true;
    addUserMsg("Confirm and execute.");
    updateProgress(2, ["Plan", "Confirm", "Execute", "Report"]);
    bumpSkill("ConfigExecutorAgent");

    await sleep(300);
    await streamBotMsg("Executing 4 configuration steps in order. Live progress on the right →", { cps: 70 });

    for (let i = 0; i < PLAN_STEPS.length; i++) {
      const step = PLAN_STEPS[i];
      await sleep(400);
      const live = await streamBotMsg(`▸ <b>${step.name}</b>\n   ${step.meta}`, { cps: 80 });

      // simulate the missing-zip clarification on step 1
      if (i === 0) {
        await sleep(600);
        await streamBotMsg("⏸  Wait. The SOW is missing the zip code for the Austin TX address. I need that before I write the legal entity record.", { cps: 70 });
        const tag = `<span class="skill-tag">⌘ ClarificationAgent</span> requesting input from you…`;
        addBotMsg(tag);
        bumpSkill("ClarificationAgent");

        const reply = await waitForUserInput("Please reply with the zip code for 500 Innovation Blvd, Austin TX (5 digits).");
        await sleep(300);
        await streamBotMsg(`Got it — using zip <b>${escapeHtml(reply)}</b>. Resuming step 1.`, { cps: 80 });
      }

      await sleep(400);
      live.innerHTML += `\n   POST /data/${guessEntity(step)}s → <span style="color: #15803d;"><b>201 Created</b></span>`;
      addArtifact(`${step.name.replace(/\s+/g, "-")}.json`, "OData payload", "1.2 KB");
    }

    bumpSkill("ReportGenerator");
    updateProgress(3, ["Plan", "Confirm", "Execute", "Report"]);
    await sleep(500);
    await streamBotMsg(
      "All 4 steps complete. Implementation summary written to <span class='mono'>.d365-impl/report/zava-phase1.md</span>.",
      { cps: 70 }
    );
    addArtifact("zava-phase1.md", "report", "8.4 KB");
    addArtifact("dmf-package-coa.zip", "DMF", "42 KB");

    updateProgress(4, ["Plan", "Confirm", "Execute", "Report"]);

    await sleep(400);
    addBotMsg(`
      <div class="plan-card" style="margin-top: 8px;">
        <h3>Done.</h3>
        <div class="plan-sub">4 of 4 configuration steps complete. View the audit trail in the Power Apps dashboard.</div>
        <div class="plan-cta">
          <button class="pill primary" onclick="window.location.href='/cowork/dashboard'">Open Dashboard →</button>
        </div>
      </div>
    `);

    // mark this row as done in the inbox
    const row = MOCK_TASKS.find((t) => t.id === state.activeTaskId);
    if (row) {
      row.sub = "Complete · 4 / 4 steps";
      row.ind = "circle";
      renderTaskList();
    }

    state.running = false;
    persist();
  }

  // Sibling WMS tasks shown in the left rail while the warehouse flow is active
  const WAREHOUSE_RELATED_TASKS = [
    { id: "t-active",      title: "Configure DC-Atlanta Warehouse",       sub: "Step 2 of 5 · Awaiting decision", ind: "spin",   active: true },
    { id: "t-cycle-count", title: "Generate cycle-count plan for ATL-01", sub: "Queued",                           ind: "circle" },
    { id: "t-wave",        title: "Set up wave templates for ZAUS",       sub: "Queued",                           ind: "circle" },
    { id: "t-zauk-mirror", title: "Validate ZAUK warehouse mirror",       sub: "Queued",                           ind: "circle" },
    { id: "t-i2p",         title: "Run end-to-end inbound-to-pick",       sub: "Queued",                           ind: "circle" },
    { id: "t-cutover",     title: "Compile WMS cutover checklist",        sub: "Queued",                           ind: "circle" },
  ];

  function swapTaskList(newTasks) {
    MOCK_TASKS.length = 0;
    newTasks.forEach((t) => MOCK_TASKS.push(t));
    renderTaskList();
  }

  // ───────────────────── Build-deliverables flow ─────────────────────
  const DOC_BUNDLES = {
    full: [
      "Build Project Charter (Word)",
      "Build Fit-Gap Workbook (Excel)",
      "Build Solution Blueprint (Word)",
      "Build Configuration Workbook (Excel)",
      "Build Test Plan (Excel)",
      "Build Cutover Runbook (Word)",
      "Build Hypercare KPI Tracker (Excel)",
    ],
    full_plus_deck: [
      "Build Project Charter (Word)",
      "Build Fit-Gap Workbook (Excel)",
      "Build Solution Blueprint (Word)",
      "Build Configuration Workbook (Excel)",
      "Build Test Plan (Excel)",
      "Build Cutover Runbook (Word)",
      "Build Hypercare KPI Tracker (Excel)",
      "Build Kickoff Deck (PowerPoint)",
    ],
    core4: [
      "Build Project Charter (Word)",
      "Build Fit-Gap Workbook (Excel)",
      "Build Configuration Workbook (Excel)",
      "Build Cutover Runbook (Word)",
    ],
  };

  async function runBuildDeliverablesFlow() {
    addContext("Engagement scope (in-memory)", "input");
    addContext("d365perflab.sandbox.operations.dynamics.com", "environment");
    addContext("ft_tasks (Dataverse)", "tool");

    addTyping();
    await sleep(700);
    removeTyping();

    bumpSkill("IntakeParser");
    await streamBotMsg(
      "I'll build a complete document set — one deliverable per phase. Given the scope, let me confirm priorities first, then build.",
      { cps: 65 }
    );
    await sleep(300);

    postChoiceCard({
      title: "Doc scope",
      counter: "1 of 2",
      allowFreeText: true,
      options: [
        {
          key: "full",
          title: "Full set (7 docs, recommended)",
          desc: "Project Charter (Word), Fit-Gap Workbook (Excel), Solution Blueprint (Word), Configuration Workbook (Excel), Test Plan (Excel), Cutover Runbook (Word), Hypercare KPI Tracker (Excel)",
        },
        {
          key: "full_plus_deck",
          title: "Full + Kickoff Deck (8 docs)",
          desc: "Everything above plus a PowerPoint kickoff deck for the Initiate phase",
        },
        {
          key: "core4",
          title: "Core 4 only",
          desc: "Project Charter, Fit-Gap Workbook, Configuration Workbook, Cutover Runbook — fastest turnaround",
        },
      ],
      onPick: async (key, freeText) => {
        if (key === "__skip__") {
          await streamBotMsg("Skipped — let me know when you're ready to choose.", { cps: 80 });
          return;
        }
        if (key === "__free__" && freeText) {
          await streamBotMsg(`Got it — I'll tailor the doc set to: <i>${escapeHtml(freeText)}</i>. Building those now.`, { cps: 70 });
          await buildDeliverables(["Build Custom Deliverable (per request)"]);
          return;
        }
        const list = DOC_BUNDLES[key] || DOC_BUNDLES.full;
        const labels = { full: "Full set", full_plus_deck: "Full + Kickoff Deck", core4: "Core 4 only" };
        await streamBotMsg(`<b>${labels[key]}</b> — building ${list.length} deliverable${list.length === 1 ? "" : "s"} now. Watch the right rail.`, { cps: 70 });
        await buildDeliverables(list);
      },
    });
  }

  async function buildDeliverables(items) {
    setLocalTasks(items.map((n) => ({ name: n, status: "todo" })));
    bumpSkill("ConfigExecutorAgent");
    bumpSkill("ReportGenerator");

    for (const name of items) {
      startLocalTask(name);
      await sleep(900 + Math.random() * 600);
      // Add an artifact corresponding to this build
      const file = name.replace(/^Build /, "").replace(/\s*\(.*\)$/, "");
      const ext  = /\(Excel\)/.test(name) ? ".xlsx" :
                   /\(Word\)/.test(name)  ? ".docx" :
                   /\(PowerPoint\)/.test(name) ? ".pptx" : ".md";
      addArtifact(file.replace(/\s+/g, "-") + ext, "deliverable", randSize());
      completeLocalTask(name);
    }

    await sleep(400);
    await streamBotMsg(`All ${items.length} deliverables are ready in the <b>Output folder</b>. Want me to zip them up or push to SharePoint?`, { cps: 70 });
  }

  function randSize() {
    const k = 8 + Math.floor(Math.random() * 80);
    return k + " KB";
  }

  // ───────────────────── Warehouse / WMS flow (DC-Atlanta) ─────────────────────
  async function runWarehouseFlow() {
    // Update breadcrumb (left rail session was already prepended in startTask)
    if ($("task-bar-title")) {
      $("task-bar-title").textContent = "Configure DC-Atlanta Warehouse";
    }

    // Pre-populate Input folder with the files / tools the agent has loaded
    addContext("ATL-warehouse-footprint.xlsx", "input · 480-row bin map");
    addContext("ATL-policy-brief.md",          "input · zoning, LP, cycle-count rules");
    addContext("d365perflab.sandbox.operations.dynamics.com", "environment");
    addContext("ft_tasks (Dataverse)", "tool");
    addContext("WHS-MCPData", "tool");

    // Pre-populate Skills (FootprintParser already used; LocationGridGenerator not yet run)
    bumpSkill("FootprintParser");
    if (!state.skillsUsed["LocationGridGenerator"]) {
      state.skillsUsed["LocationGridGenerator"] = 0;
      renderSkills();
    }

    // Pre-populate the right-rail Progress with verification work that's
    // already complete + the current "wait for user" beat + the pending writes.
    setLocalTasks([
      { name: "Parsed warehouse footprint", meta: "480 bins · 4 zones · 12 aisles", status: "done" },
      { name: 'Verified site <code>US-SE</code> exists in USMF', meta: "via <code>OperatingUnits</code> · 1 row", status: "done", html: true },
      { name: "Validated user has WHSAdmin role", meta: "gokul.ramesh@…onmicrosoft.com", status: "done" },
      { name: "Awaiting user — license plate scope", meta: "Decision 1 of 2", status: "wait" },
      { name: 'Write <code>InventWarehouse</code> record (ATL-01)', status: "todo", html: true },
      { name: 'Write 4 <code>WHSZone</code> records', status: "todo", html: true },
      { name: 'Bulk-write 480 <code>WHSLocation</code> records', status: "todo", html: true },
      { name: "Apply 3 location profiles", status: "todo" },
      { name: "Update task status → \"Awaiting cutover sign-off\"", status: "todo" },
    ]);

    await sleep(300);
    addTyping();
    await sleep(700);
    removeTyping();

    await streamBotMsg(
      "Reading the warehouse footprint and policy doc… extracting requirements for DC-Atlanta (Zava Agentic Retailer, USMF).",
      { cps: 60 }
    );
    await sleep(300);

    await streamBotMsg(
      "I see this is a WMS-enabled DC with 4 zones, 12 aisles, ~480 bin locations. Five configuration steps in dependency layer W01–W03. I'll prepare a plan with the OData payloads I'd write — review it before I execute.",
      { cps: 65 }
    );
    await sleep(300);

    // Plan card with W01–W03 steps + 2 decisions
    const planHtml = `
      <div class="plan-card">
        <h3>Implementation plan — DC-Atlanta</h3>
        <div class="plan-sub">5 configuration steps · estimated 10–14 minutes · environment <span class="mono">d365perflab.sandbox.operations.dynamics.com</span></div>

        <div class="plan-step" data-i="0">
          <div class="plan-step-head">
            <span class="check">☐</span>
            <span class="name">Create Warehouse <code>ATL-01</code> (site US-SE)</span>
            <span class="meta">W01 · InventWarehouse · MCPData</span>
            <span class="caret">▸</span>
          </div>
          <div class="diff"><span class="key">POST</span> /data/InventWarehouses\n{\n  <span class="add">"WarehouseId": "ATL-01"</span>,\n  <span class="add">"Site": "US-SE"</span>,\n  <span class="add">"Name": "Atlanta Distribution Center"</span>,\n  <span class="add">"WMSEnabled": true</span>\n}</div>
        </div>
        <div class="plan-step" data-i="1">
          <div class="plan-step-head">
            <span class="check">☐</span>
            <span class="name">Define Zones — RCV, BULK, PICK, SHIP</span>
            <span class="meta">W02 · WHSZone · MCPData</span>
            <span class="caret">▸</span>
          </div>
          <div class="diff"><span class="key">POST</span> /data/WHSZones × 4\n[\n  { <span class="add">"ZoneId": "RCV"</span>, <span class="add">"Type": "Receiving"</span> },\n  { <span class="add">"ZoneId": "BULK"</span>, <span class="add">"Type": "Storage"</span> },\n  { <span class="add">"ZoneId": "PICK"</span>, <span class="add">"Type": "Picking"</span> },\n  { <span class="add">"ZoneId": "SHIP"</span>, <span class="add">"Type": "Shipping"</span> }\n]</div>
        </div>
        <div class="plan-step" data-i="2">
          <div class="plan-step-head">
            <span class="check">☐</span>
            <span class="name">Generate 480 Locations from footprint CSV</span>
            <span class="meta">W02 · WHSLocation · MCPData</span>
            <span class="caret">▸</span>
          </div>
          <div class="diff"><span class="key">POST</span> /data/WHSLocations × 480\n# Generated by <span class="add">LocationGridGenerator</span>\n# 12 aisles × 8 racks × 5 levels = 480 bins\n{ "Aisle": "01..12", "Rack": "A..H", "Bin": "1..5" }</div>
        </div>
        <div class="plan-step" data-i="3">
          <div class="plan-step-head">
            <span class="check">☐</span>
            <span class="name">Apply Location Profiles (Floor / Rack / Bin)</span>
            <span class="meta">W03 · WHSLocationProfile · MCPData</span>
            <span class="caret">▸</span>
          </div>
          <div class="diff"><span class="key">POST</span> /data/WHSLocationProfiles\n{\n  <span class="add">"Floor"</span>: "150 bins (RCV/SHIP)",\n  <span class="add">"Rack"</span>:  "240 bins (BULK)",\n  <span class="add">"Bin"</span>:   "90 bins (PICK)"\n}</div>
        </div>
        <div class="plan-step" data-i="4">
          <div class="plan-step-head">
            <span class="check">☐</span>
            <span class="name">Set default Receiving + Shipping docks</span>
            <span class="meta">W03 · InventWarehouseDocks · MCPData</span>
            <span class="caret">▸</span>
          </div>
          <div class="diff"><span class="key">POST</span> /data/InventWarehouseDocks × 2\n[\n  { <span class="add">"DockId": "RCV-DOCK-1"</span>, <span class="add">"ZoneId": "RCV"</span> },\n  { <span class="add">"DockId": "SHIP-DOCK-1"</span>, <span class="add">"ZoneId": "SHIP"</span> }\n]</div>
        </div>

        <div class="plan-decisions">
          <b>Decisions needed</b>
          1. License plate tracking — enable on all zones, or PICK / SHIP only?<br/>
          2. Cycle-count plan — adopt USMF default, or import the ATL-specific plan from the footprint doc?
        </div>

        <div class="plan-cta">
          <button class="pill" id="wh-edit">Edit plan</button>
          <button class="pill primary" id="wh-confirm">Confirm and execute</button>
        </div>
      </div>`;
    addBotMsg(planHtml);

    document.querySelectorAll(".plan-step-head").forEach((h) => {
      h.addEventListener("click", () => h.parentElement.classList.toggle("open"));
    });

    // Stage the suggested answer but DO NOT auto-fill — wait until the user
    // clicks/focuses the textbox so the prefill feels natural, not robotic.
    const ti = $("task-input");
    const suggested = "License plate tracking on PICK / SHIP only.\nCycle-count plan — use USMF default.";
    ti.value = "";
    ti.placeholder = "Click here — I have a suggested answer ready";
    const fillOnce = () => {
      if (!ti.value) {
        ti.value = suggested;
        ti.dispatchEvent(new Event("input", { bubbles: true }));
      }
      ti.placeholder = "Edit if you'd like, or click Send to confirm";
      ti.removeEventListener("focus", fillOnce);
      ti.removeEventListener("click", fillOnce);
    };
    ti.addEventListener("focus", fillOnce);
    ti.addEventListener("click", fillOnce);
    state.waitingForInput = {
      prompt: "Awaiting plan confirmation",
      resolve: () => {
        ti.placeholder = "Reply to the agent or paste more context";
        executeWarehousePlan();
      },
    };

    // Confirm button just acts as Send (so the user's typed answer is the message)
    $("wh-confirm").addEventListener("click", () => {
      $("wh-confirm").disabled = true;
      $("wh-confirm").style.opacity = "0.5";
      $("task-send").click();
    });
    $("wh-edit").addEventListener("click", () => {
      addBotMsg("<i style='color: var(--cw-text-muted);'>Edit mode is not wired in this preview. Click <b>Confirm and execute</b> to continue.</i>");
    });
  }

  async function executeWarehousePlan() {
    state.running = true;
    bumpSkill("ConfigExecutorAgent");
    bumpSkill("LocationGridGenerator");

    await sleep(300);
    await streamBotMsg("Got it — license plates on PICK/SHIP, USMF default cycle-count. Resolving the wait state and resuming.", { cps: 70 });

    // Resolve the awaiting-user step
    const waiter = state.localTasks.find((t) => t.status === "wait");
    if (waiter) { waiter.status = "done"; renderLocalTasks(); }

    // Run through the remaining todo items
    const todoNames = state.localTasks.filter((t) => t.status === "todo").map((t) => t.name);
    const artifactsByStep = [
      { file: "InventWarehouse-ATL-01.json",  kind: "OData payload", size: "1.4 KB" },
      { file: "WHSZones-x4.json",              kind: "OData batch",   size: "2.8 KB" },
      { file: "WHSLocations-x480.json",        kind: "OData batch",   size: "62 KB" },
      { file: "WHSLocationProfiles.json",      kind: "OData payload", size: "3.2 KB" },
      { file: "task-status-update.json",       kind: "Dataverse PATCH", size: "0.6 KB" },
    ];

    for (let i = 0; i < todoNames.length; i++) {
      // Find by stripped name (because some have <code> in them)
      const idx = state.localTasks.findIndex((t) => t.name === todoNames[i]);
      if (idx === -1) continue;
      startLocalTask(idx);
      await sleep(900 + Math.random() * 500);
      const a = artifactsByStep[i] || { file: `step-${i}.json`, kind: "OData", size: randSize() };
      addArtifact(a.file, a.kind, a.size);
      completeLocalTask(idx);
    }

    // ── All progress complete → push final task status to Dataverse ──
    await sleep(400);
    await streamBotMsg("✓ All progress complete. Pushing the final task to Dataverse to seal the configuration.", { cps: 70 });

    state.localTasks.push({
      name: "Push to <code>ft_tasks</code> (Dataverse) — configuration complete",
      meta: "PATCH ft_tasks(ATL-01) · ft_status = Complete",
      status: "cur",
      html: true,
    });
    renderLocalTasks();
    await sleep(1100);
    const finalIdx = state.localTasks.length - 1;
    state.localTasks[finalIdx].status = "done";
    renderLocalTasks();
    addArtifact("ft_tasks-ATL-01-complete.json", "Dataverse PATCH", "0.4 KB");
    await sleep(300);
    await streamBotMsg(
      "All set. The Atlanta warehouse is configured and saved. Task <b>ATL-01</b> is marked <b>Complete</b>, and a full audit trail has been recorded.",
      { cps: 70 }
    );

    // Persist a handoff payload for the Power Apps dashboard
    try {
      const handoff = {
        startedAt: Date.now(),
        decisions: { licensePlate: "PICK / SHIP only", cycleCount: "USMF default" },
        steps: [
          { id: "t-w01", name: "Create Warehouse ATL-01",          layer: "W01", entity: "InventWarehouse",      status: "COMPLETE" },
          { id: "t-w02", name: "Define Zones (RCV/BULK/PICK/SHIP)", layer: "W02", entity: "WHSZone",              status: "COMPLETE" },
          { id: "t-w03", name: "Generate 480 Locations",            layer: "W02", entity: "WHSLocation",          status: "COMPLETE" },
          { id: "t-w04", name: "Apply Location Profiles",           layer: "W03", entity: "WHSLocationProfile",   status: "COMPLETE" },
          { id: "t-w05", name: "Set default Receiving/Shipping docks", layer: "W03", entity: "InventWarehouseDocks", status: "COMPLETE" },
          { id: "t-w06", name: "License plate scope (PICK/SHIP)",   layer: "W03", entity: "WHSParameters",        status: "COMPLETE" },
        ],
        cutoverStatus: "RUNNING",
      };
      const persisted = JSON.parse(localStorage.getItem("cowork-state") || "{}");
      persisted.warehouseHandoff = handoff;
      localStorage.setItem("cowork-state", JSON.stringify(persisted));
    } catch (e) { /* ignore */ }

    await sleep(300);
    addBotMsg(`
      <div style="background: linear-gradient(135deg, #f3eeff 0%, #fafaf9 100%); border: 1px solid #d6c7ff; border-radius: 14px; padding: 18px 18px 16px; max-width: 560px;">
        <div style="font-weight: 600; margin-bottom: 4px;">📌 Submitted to Implementation Tracker</div>
        <div style="font-size: 13px; color: var(--cw-text-muted); margin-bottom: 14px; line-height: 1.45;">
          I've submitted the cutover validation task to Power Apps. Open the Dataverse dashboard to watch it run end-to-end with full audit trail.
        </div>
        <a href="/cowork/dashboard?run=cutover" class="pill primary" style="text-decoration: none; display: inline-block;">Open Dataverse Dashboard →</a>
      </div>
    `);

    state.running = false;
    persist();
  }

  function guessEntity(step) {
    if (step.name.includes("Currency")) return "Currency";
    if (step.name.includes("Calendar")) return "FiscalCalendar";
    if (step.name.includes("Posting")) return "VendPostingProfile";
    return "LegalEntitie";
  }

  function bumpSkill(name) {
    state.skillsUsed[name] = (state.skillsUsed[name] || 0) + 1;
    renderSkills();
    persist();
  }

  // ───────────────────── User-input gate ─────────────────────
  function waitForUserInput(prompt) {
    return new Promise((resolve) => {
      addBotMsg(`<i style="color: var(--cw-text-muted);">${escapeHtml(prompt)}</i>`);
      $("task-input").focus();
      $("task-input").placeholder = prompt;
      state.waitingForInput = { prompt, resolve: (val) => {
        $("task-input").placeholder = "Reply to the agent or paste more context";
        resolve(val);
      }};
    });
  }

  // ───────────────────── Run-demo button (auto-play whole flow) ─────────────────────
  async function runDemo() {
    // restart from fresh
    $("thread").innerHTML = "";
    state.running = true;
    state.skillsUsed = {};
    state.artifacts = [];
    state.context = [];
    state.localTasks = [];
    state.progress = { current: 0, total: 4, items: [] };
    $("artifact-list").innerHTML = "";
    $("context-list").innerHTML = "";
    $("skills-list").innerHTML = "";
    $("local-task-list").innerHTML = "";
    $("progress-counter").hidden = true;
    show("output-empty");
    show("input-empty");
    show("skills-empty");
    show("progress-empty");
    hide("progress-active");

    await streamBotMsg("Hi! I'll show you a full Project Mia run end to end. Drop in.", { cps: 90 });
    await sleep(400);
    await startTask(
      "Set up new legal entity USMF for U.S. operations (Zava Agentic Retailer)",
      "SOW-Zava-USMF.md"
    );

    // auto-confirm after a beat (simulating the user clicking Confirm)
    await sleep(2000);
    if (!$("plan-confirm").disabled) $("plan-confirm").click();

    // when the agent pauses for input, auto-fill the zip after 2.5s
    waitAndFill("78701", 3500);
  }

  function waitAndFill(value, delay) {
    const tick = () => {
      if (state.waitingForInput) {
        $("task-input").value = value;
        setTimeout(() => {
          $("task-send").click();
        }, 400);
      } else {
        setTimeout(tick, 250);
      }
    };
    setTimeout(tick, delay);
  }

  // ───────────────────── Boot ─────────────────────
  function boot() {
    bindLogin();
    restoreSessions();

    // If arriving from the Mia Console with a warehouse-decision handoff,
    // re-cast the active session card as "Configuration decision assigned
    // to you" and auto-trigger the warehouse plan so the user lands directly
    // on the license-plate decision the demo script calls out.
    let miaHandoff = false;
    try {
      const qs = new URLSearchParams(location.search);
      if (qs.get("from") === "mia") {
        miaHandoff = qs.get("task") !== null ? qs.get("task") === "warehouse" : true;
        // Promote/replace the top session row with the Mia-friendly label.
        const top = MOCK_TASKS[0];
        if (top) {
          top.id = "t-active";
          top.title = "Configuration decision assigned to you";
          top.sub = "Today · Awaiting decision · DC-Atlanta";
          top.ind = "spin";
          top.active = true;
          state.activeTaskId = "t-active";
        }
      }
    } catch (e) { /* URL unavailable — fall back to default flow */ }

    renderTaskList();
    bindWelcome();
    wireAllButtons();

    // attempt restore
    try {
      const cached = JSON.parse(localStorage.getItem("cowork-state") || "null");
      if (cached && cached.activeTitle) {
        // (could resume — left as future work)
      }
    } catch (e) {}

    // Auto-launch the warehouse flow for the Mia handoff.
    if (miaHandoff) {
      // Defer one tick so the welcome view paints first; gives the demo a
      // brief "loading from Mia" beat before the plan card appears.
      setTimeout(() => {
        startTask(
          "Help me configure a new warehouse — DC-Atlanta for the ZAUS legal entity",
          "ATL-policy-brief.md"
        );
        // Override the just-prepended session row title so the SESSIONS
        // rail shows the Mia-friendly label "Configuration decision
        // assigned to you" instead of the long warehouse intent string.
        // prependSession runs synchronously inside startTask, so the new
        // row is already at MOCK_TASKS[0] by the time this runs.
        const top = MOCK_TASKS[0];
        if (top) {
          top.title = "Configuration decision assigned to you";
          top.sub = "Today · Awaiting decision · DC-Atlanta";
          renderTaskList();
        }
      }, 250);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // expose for debugging
  window.Cowork = { state, MOCK_TASKS, runDemo, openTaskView, closeTaskView };
})();
