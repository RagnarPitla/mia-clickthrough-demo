(function () {
  var STORAGE_KEY = "scm-cowork-state";
  var params = new URLSearchParams(window.location.search);
  var completedParam = params.get("completed");
  var shouldAutoStart = params.get("from") === "mia" || params.get("task") === "warehouse" || params.get("assigned") === "decision";

  var sessionsDefault = [
    { title: "Configuration decision assigned to you", status: "Awaiting license plate scope", active: false, done: false },
    { title: "Configure DC-Atlanta Warehouse", status: "Step 2 of 5, Awaiting decision", active: false, done: false },
    { title: "Generate cycle-count plan for ATL-01", status: "Queued", active: false, done: false },
    { title: "Set up wave templates for ZAUS", status: "Queued", active: false, done: false },
    { title: "Validate ZAUK warehouse mirror", status: "Queued", active: false, done: false },
    { title: "Run end-to-end inbound-to-pick", status: "Queued", active: false, done: false },
    { title: "Compile WMS cutover checklist", status: "Queued", active: false, done: false }
  ];

  var initialContext = [
    { name: "ATL-warehouse-footprint.xlsx", meta: "input - 480-row bin map" },
    { name: "ATL-policy-brief.md", meta: "input - zoning, LP, cycle-count rules" },
    { name: "d365perflab.sandbox.operations.dynamics.com", meta: "environment" },
    { name: "ft_tasks (Dataverse)", meta: "tool" },
    { name: "WHS-MCPData", meta: "tool" }
  ];

  var initialSkills = [
    { name: "FootprintParser", meta: "1 run" },
    { name: "LocationGridGenerator", meta: "0 runs" },
    { name: "ConfigExecutorAgent", meta: "ready" },
    { name: "ClarificationAgent", meta: "awaiting decision" },
    { name: "ReportGenerator", meta: "available" },
    { name: "PhantomWorker", meta: "mock skill" }
  ];

  var initialProgress = [
    { label: "Parsed warehouse footprint", detail: "480 bins, 4 zones, 12 aisles", state: "done" },
    { label: "Verified site US-SE exists in USMF", detail: "via OperatingUnits, 1 row", state: "done" },
    { label: "Validated user has WHSAdmin role", detail: "gokul.ramesh@...onmicrosoft.com", state: "done" },
    { label: "Awaiting user: license plate scope decision", detail: "Assigned to you - all zones or PICK/SHIP only?", state: "wait" },
    { label: "Write InventWarehouse record (ATL-01)", detail: "Pending", state: "todo" },
    { label: "Write 4 WHSZone records", detail: "Pending", state: "todo" },
    { label: "Bulk-write 480 WHSLocation records", detail: "Pending", state: "todo" },
    { label: "Apply 3 location profiles", detail: "Pending", state: "todo" },
    { label: "Update task status -> Awaiting cutover sign-off", detail: "Pending", state: "todo" }
  ];

  var artifactsToCreate = [
    { name: "InventWarehouse-ATL-01.json", meta: "OData payload - 1.4 KB", progressIndex: 4 },
    { name: "WHSZones-x4.json", meta: "OData batch - 2.8 KB", progressIndex: 5 },
    { name: "WHSLocations-x480.json", meta: "OData batch - 62 KB", progressIndex: 6 },
    { name: "WHSLocationProfiles.json", meta: "OData payload - 3.2 KB", progressIndex: 7 },
    { name: "task-status-update.json", meta: "Dataverse PATCH - 0.6 KB", progressIndex: 8 }
  ];

  if (shouldAutoStart && completedParam !== "cutover") {
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { console.warn("Could not reset SCM state", error); }
  }

  var state = readState();
  var els = {};

  document.addEventListener("DOMContentLoaded", function () {
    els.sessionList = document.getElementById("sessionList");
    els.progressList = document.getElementById("progressList");
    els.artifactList = document.getElementById("artifactList");
    els.contextList = document.getElementById("contextList");
    els.skillList = document.getElementById("skillList");
    els.welcomeView = document.getElementById("welcomeView");
    els.threadView = document.getElementById("threadView");
    els.threadMessages = document.getElementById("threadMessages");
    els.threadInput = document.getElementById("threadInput");
    els.returnBanner = document.getElementById("returnBanner");

    document.querySelectorAll("[data-intent]").forEach(function (button) {
      button.addEventListener("click", function () {
        startIntent(button.getAttribute("data-intent") || "");
      });
    });

    document.getElementById("welcomeComposer").addEventListener("submit", function (event) {
      event.preventDefault();
      startIntent(document.getElementById("welcomeInput").value);
    });

    document.getElementById("threadComposer").addEventListener("submit", function (event) {
      event.preventDefault();
      handleDecision();
    });

    if (completedParam === "cutover") {
      markReturnedComplete();
    } else if (shouldAutoStart && !state.started) {
      startIntent("Help me configure a new warehouse - DC-Atlanta for the ZAUS legal entity");
      return;
    }

    render();
  });

  function readState() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) return saved;
    } catch (error) {
      console.warn("Could not read SCM state", error);
    }

    return {
      started: false,
      completed: false,
      planShown: false,
      executing: false,
      messages: [],
      sessions: sessionsDefault.slice(),
      progress: [],
      artifacts: [],
      context: initialContext.slice(),
      skills: initialSkills.slice(),
      warehouseHandoff: {
        decisions: {},
        cutoverStatus: "NEW"
      }
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function render() {
    renderSessions();
    renderProgress();
    renderArtifacts();
    renderContext();
    renderSkills();
    renderMessages();

    els.welcomeView.hidden = state.started;
    els.threadView.hidden = !state.started;
    els.returnBanner.hidden = !state.completed;
  }

  function renderSessions() {
    els.sessionList.innerHTML = "";
    state.sessions.forEach(function (session) {
      var row = document.createElement("div");
      row.className = "session" + (session.active ? " active" : "") + (session.done ? " done" : "");
      row.innerHTML = '<div class="status-dot"></div><div><strong>' + escapeHtml(session.title) + '</strong><span>' + escapeHtml(session.status) + '</span></div>';
      els.sessionList.appendChild(row);
    });
  }

  function renderProgress() {
    els.progressList.innerHTML = "";
    var rows = state.started ? state.progress : [];
    if (!rows.length) {
      els.progressList.innerHTML = '<div class="empty">No active work yet.</div>';
      return;
    }

    rows.forEach(function (item) {
      var icon = item.state === "done" ? "&check;" : item.state === "run" ? "..." : item.state === "wait" ? "!" : "";
      var row = document.createElement("div");
      row.className = "progress-row";
      row.innerHTML = '<span class="state ' + item.state + '">' + icon + '</span><span><strong>' + escapeHtml(item.label) + '</strong>' + escapeHtml(item.detail) + '</span>';
      els.progressList.appendChild(row);
    });
  }

  function renderArtifacts() {
    els.artifactList.innerHTML = "";
    if (!state.artifacts.length) {
      els.artifactList.innerHTML = '<div class="empty">No artifacts yet.</div>';
      return;
    }

    state.artifacts.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "folder-row";
      row.innerHTML = '<span class="state done">&check;</span><span><strong>' + escapeHtml(item.name) + '</strong>' + escapeHtml(item.meta) + '</span>';
      els.artifactList.appendChild(row);
    });
  }

  function renderContext() {
    els.contextList.innerHTML = "";
    state.context.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "folder-row";
      row.innerHTML = '<span class="state todo"></span><span><strong>' + escapeHtml(item.name) + '</strong>' + escapeHtml(item.meta) + '</span>';
      els.contextList.appendChild(row);
    });
  }

  function renderSkills() {
    els.skillList.innerHTML = "";
    state.skills.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "skill-row";
      row.innerHTML = '<span class="state todo"></span><span><strong>' + escapeHtml(item.name) + '</strong>' + escapeHtml(item.meta) + '</span>';
      els.skillList.appendChild(row);
    });
  }

  function renderMessages() {
    els.threadMessages.innerHTML = "";
    state.messages.forEach(function (message) {
      if (message.type === "plan") {
        els.threadMessages.appendChild(planCard());
        return;
      }
      if (message.type === "handoff") {
        els.threadMessages.appendChild(handoffCard());
        return;
      }

      var div = document.createElement("div");
      div.className = "message " + message.role;
      div.innerHTML = message.html || escapeHtml(message.text);
      els.threadMessages.appendChild(div);
    });

    if (state.planShown && !state.executing && !state.completed) {
      els.threadInput.value = "License plate tracking on PICK / SHIP only.\nCycle-count plan - use USMF default.";
    }
  }

  function startIntent(intent) {
    var lower = intent.toLowerCase();
    if (lower.indexOf("warehouse") === -1 && lower.indexOf("wms") === -1 && lower.indexOf("dc-atlanta") === -1 && lower.indexOf("atl-01") === -1) {
      startSecondaryFlow(intent);
      return;
    }

    state.started = true;
    state.completed = false;
    state.executing = false;
    state.planShown = true;
    state.progress = initialProgress.map(clone);
    state.artifacts = [];
    state.context = initialContext.slice();
    state.skills = initialSkills.slice();
    state.sessions = sessionsDefault.map(clone);
    state.sessions[0].active = true;
    state.sessions[1].active = false;
    state.messages = [
      { role: "user", text: "Help me configure a new warehouse - DC-Atlanta for the ZAUS legal entity." },
      { role: "agent", text: "Reading the warehouse footprint and policy doc... extracting requirements for DC-Atlanta (Zava Agentic Retailer, USMF)." },
      { role: "agent", text: "I see this is a WMS-enabled DC with 4 zones, 12 aisles, ~480 bin locations. Five configuration steps in dependency layer W01-W03. I'll prepare a plan with the OData payloads I'd write - review it before I execute." },
      { type: "plan" }
    ];
    saveState();
    render();
  }

  function startSecondaryFlow(intent) {
    state.started = true;
    state.completed = false;
    state.planShown = false;
    state.executing = false;
    state.progress = [
      { label: "Read request", detail: "Preview flow loaded", state: "done" },
      { label: "Awaiting scenario expansion", detail: "Use the warehouse quick action for the full click-through", state: "wait" }
    ];
    state.artifacts = [];
    state.context = initialContext.slice(2, 4);
    state.sessions = sessionsDefault.map(clone);
    state.messages = [
      { role: "user", text: intent },
      { role: "agent", text: "I can run the full SCM click-through for DC-Atlanta now. Choose 'Help me configure a new warehouse' from the welcome path to launch the W01-W03 warehouse plan, decision point, generated payloads, and Dataverse dashboard animation." }
    ];
    saveState();
    render();
  }

  function planCard() {
    var div = document.createElement("div");
    div.className = "plan-card";
    div.innerHTML =
      '<div class="plan-title">' +
      '<div><h2>Implementation plan - DC-Atlanta</h2><p class="muted">5 configuration steps, estimated 10-14 minutes, environment d365perflab.sandbox.operations.dynamics.com</p></div>' +
      '<span class="badge">W01-W03 dependency layers</span>' +
      '</div>' +
      '<table><thead><tr><th></th><th>Step</th><th>Layer</th><th>Entity</th><th>Tool</th></tr></thead><tbody>' +
      '<tr><td><input type="checkbox" disabled></td><td>Create Warehouse ATL-01 (site US-SE)</td><td>W01</td><td>InventWarehouse</td><td>MCPData</td></tr>' +
      '<tr><td><input type="checkbox" disabled></td><td>Define Zones: RCV, BULK, PICK, SHIP</td><td>W02</td><td>WHSZone</td><td>MCPData</td></tr>' +
      '<tr><td><input type="checkbox" disabled></td><td>Generate 480 Locations from footprint CSV</td><td>W02</td><td>WHSLocation</td><td>MCPData</td></tr>' +
      '<tr><td><input type="checkbox" disabled></td><td>Apply Location Profiles (Floor / Rack / Bin)</td><td>W03</td><td>WHSLocationProfile</td><td>MCPData</td></tr>' +
      '<tr><td><input type="checkbox" disabled></td><td>Set default Receiving + Shipping docks</td><td>W03</td><td>InventWarehouseDocks</td><td>MCPData</td></tr>' +
      '</tbody></table>' +
      '<div class="decision-box"><strong>Configuration decision assigned to you</strong><p>License plate tracking - enable on every zone, or PICK / SHIP only?</p><p>Cycle-count plan - adopt USMF default, or import the ATL-specific plan from the footprint doc?</p></div>' +
      '<div class="card-actions"><button id="editPlan" class="btn secondary" type="button">Edit plan</button><button id="confirmPlan" class="btn primary" type="button">Confirm and execute</button></div>';

    setTimeout(function () {
      var edit = document.getElementById("editPlan");
      var confirm = document.getElementById("confirmPlan");
      if (edit) {
        edit.onclick = function () {
          addAgentMessage("Edit plan is preview-only in this click-through. You can continue with the recommended license plate and cycle-count decisions.");
        };
      }
      if (confirm) confirm.onclick = executeWarehouse;
    }, 0);

    return div;
  }

  function handoffCard() {
    var div = document.createElement("div");
    div.className = "plan-card";
    div.innerHTML =
      '<div class="plan-title"><div><h2>Submitted to Implementation Tracker</h2>' +
      '<p class="muted">I have submitted the cutover validation task to Power Apps. Open the Dataverse dashboard to watch every active and completed task with full audit trail.</p></div>' +
      '<span class="badge">ft_tasks</span></div>' +
      '<div class="card-actions"><button class="btn primary" type="button" id="openDashboard">Open Dataverse Dashboard</button></div>';
    setTimeout(function () {
      var button = document.getElementById("openDashboard");
      if (button) button.onclick = function () { window.location.href = "/SCM/dashboard?run=cutover"; };
    }, 0);
    return div;
  }

  function handleDecision() {
    if (!state.planShown || state.executing || state.completed) return;
    executeWarehouse();
  }

  function executeWarehouse() {
    if (state.executing) return;
    state.executing = true;
    state.warehouseHandoff.decisions = {
      licensePlate: "PICK / SHIP only",
      cycleCount: "USMF default"
    };
    state.messages.push({ role: "user", text: "License plate tracking on PICK / SHIP only.\nCycle-count plan - use USMF default." });
    state.messages.push({ role: "agent", text: "Got it - license plates on PICK/SHIP, USMF default cycle-count. Resolving the wait state and resuming." });
    state.progress[3].state = "done";
    state.progress[3].detail = "PICK / SHIP only, USMF default";
    state.sessions[0].active = false;
    state.sessions[0].done = true;
    state.sessions[0].status = "Complete - decision captured";
    state.sessions[1].active = true;
    state.sessions[1].status = "Executing warehouse configuration";
    state.skills[1].meta = "1 run";
    state.skills[3].meta = "decision captured";
    saveState();
    render();

    artifactsToCreate.forEach(function (artifact, index) {
      setTimeout(function () {
        state.progress[artifact.progressIndex].state = "run";
        state.progress[artifact.progressIndex].detail = "Writing via WHS-MCPData";
        saveState();
        render();

        setTimeout(function () {
          state.progress[artifact.progressIndex].state = "done";
          state.progress[artifact.progressIndex].detail = "Complete";
          state.artifacts.push({ name: artifact.name, meta: artifact.meta });
          saveState();
          render();

          if (index === artifactsToCreate.length - 1) {
            finishExecution();
          }
        }, 650);
      }, 850 + index * 1150);
    });
  }

  function finishExecution() {
    setTimeout(function () {
      state.messages.push({ role: "agent", text: "All progress complete. Pushing the final task to Dataverse to seal the configuration." });
      state.progress.push({ label: "Push to ft_tasks (Dataverse) - configuration complete", detail: "PATCH ft_tasks(ATL-01), ft_status = Complete", state: "run" });
      saveState();
      render();

      setTimeout(function () {
        state.progress[state.progress.length - 1].state = "done";
        state.artifacts.push({ name: "ft_tasks-ATL-01-complete.json", meta: "Dataverse PATCH - 0.4 KB" });
        state.messages.push({ role: "agent", text: "All set. The Atlanta warehouse is configured and saved. Task ATL-01 is marked Complete, and a full audit trail has been recorded." });
        state.messages.push({ type: "handoff" });
        state.sessions[1].active = false;
        state.sessions[1].done = true;
        state.sessions[1].status = "Ready for Dataverse dashboard";
        saveState();
        render();
      }, 900);
    }, 600);
  }

  function markReturnedComplete() {
    state.started = true;
    state.completed = true;
    state.executing = false;
    state.planShown = true;
    state.sessions = sessionsDefault.map(clone);
    state.sessions[0].active = false;
    state.sessions[0].done = true;
    state.sessions[0].status = "Today, complete, decision captured";
    state.sessions[1].active = false;
    state.sessions[1].done = true;
    state.sessions[1].status = "Today, complete, ATL-01 live";
    if (!state.progress.length) state.progress = initialProgress.map(clone);
    state.progress.forEach(function (row) {
      row.state = "done";
      if (row.detail === "Pending") row.detail = "Complete";
    });
    if (!state.artifacts.length) {
      state.artifacts = artifactsToCreate.map(function (artifact) {
        return { name: artifact.name, meta: artifact.meta };
      });
      state.artifacts.push({ name: "ft_tasks-ATL-01-complete.json", meta: "Dataverse PATCH - 0.4 KB" });
    }
    state.messages = [
      { role: "user", text: "Help me configure a new warehouse - DC-Atlanta for the ZAUS legal entity." },
      { role: "agent", text: "Warehouse ATL-01 is live. All 7 warehouse tasks complete, and the Dataverse audit trail has been recorded." }
    ];
    saveState();
  }

  function addAgentMessage(text) {
    state.messages.push({ role: "agent", text: text });
    saveState();
    render();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "<br>");
  }
})();
