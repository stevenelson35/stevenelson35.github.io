/* Best-of-the-best photo browser (see DESIGN.md §12 backlog in the psort repo).
 * Loads browse-manifest.json (published by `psort publish-browse`) and does all filtering
 * and navigation client-side: no server, just the JSON plus the images already on Turbify.
 */
(function () {
  "use strict";

  var picsUrl = window.BROWSE_PICS_URL;
  var manifestUrl = picsUrl + "browse-manifest.json";
  var VIEW_SIZE = 1366; // <img> shown while browsing; srcset still offers the rest

  var state = {
    photos: [],       // all favorites, sorted by taken_at ascending
    events: [],
    active: [],       // person names currently selected
    exact: false,     // true: photos with exactly `active`; false: photos with at least `active`
    knownPeople: [],  // every name that appears on any favorite
    filtered: [],      // photos matching the filter, ascending
    index: -1          // position of the current photo within `filtered`
  };

  function $(id) { return document.getElementById(id); }

  function imgUrl(photo, size) {
    return size ? picsUrl + size + "/" + photo.id + "-" + size + ".jpg" : picsUrl + photo.id + ".jpg";
  }

  function matches(p) {
    var hasAll = state.active.every(function (name) { return p.people.indexOf(name) !== -1; });
    return hasAll && (!state.exact || p.people.length === state.active.length);
  }

  function recompute() {
    state.filtered = state.photos.filter(matches);
    if (state.filtered.length === 0) { state.index = -1; return; }
    var pos = state.currentPhotoId
      ? state.filtered.findIndex(function (p) { return p.id === state.currentPhotoId; })
      : -1;
    state.index = pos !== -1 ? pos : state.filtered.length - 1; // default: most recent match
  }

  function current() { return state.index >= 0 ? state.filtered[state.index] : null; }

  function jumpTo(pos) {
    if (pos < 0 || pos >= state.filtered.length) return;
    state.index = pos;
    state.currentPhotoId = state.filtered[pos].id;
    render();
  }

  function jumpToPhoto(photo) {
    recomputeKeepingCurrent(photo.id);
    render();
  }

  function recomputeKeepingCurrent(id) {
    state.currentPhotoId = id;
    recompute();
  }

  // ---- Chips ----
  function renderChips() {
    var c = current();
    var candidates = c ? c.people.slice() : [];
    state.active.forEach(function (n) { if (candidates.indexOf(n) === -1) candidates.push(n); });
    var box = $("browse-chips");
    box.innerHTML = "";
    candidates.forEach(function (name) {
      var chip = document.createElement("button");
      chip.className = "browse-chip" + (state.active.indexOf(name) !== -1 ? " on" : "");
      chip.textContent = name;
      chip.onclick = function () {
        var i = state.active.indexOf(name);
        if (i !== -1) state.active.splice(i, 1); else state.active.push(name);
        recomputeKeepingCurrent(c ? c.id : null);
        render();
      };
      box.appendChild(chip);
    });
    var addSel = $("browse-add-person");
    addSel.innerHTML = "<option value=''>+ add person…</option>";
    state.knownPeople.filter(function (n) { return candidates.indexOf(n) === -1; }).forEach(function (n) {
      var opt = document.createElement("option");
      opt.value = n; opt.textContent = n;
      addSel.appendChild(opt);
    });
  }

  // ---- Timeline ----
  function renderTimeline() {
    var track = $("browse-timeline-track");
    track.innerHTML = "";
    if (state.photos.length === 0) return;
    var min = new Date(state.photos[0].taken_at).getTime();
    var max = new Date(state.photos[state.photos.length - 1].taken_at).getTime();
    var span = Math.max(1, max - min);
    state.filtered.forEach(function (p, i) {
      var t = new Date(p.taken_at).getTime();
      var mark = document.createElement("div");
      mark.className = "browse-tick" + (i === state.index ? " current" : "");
      mark.style.left = (100 * (t - min) / span) + "%";
      mark.title = p.taken_at;
      mark.onclick = function () { jumpTo(i); };
      track.appendChild(mark);
    });
    state.events.forEach(function (e) {
      var overlap = state.filtered.some(function (p) { return p.taken_at >= e.start && p.taken_at <= e.end; });
      if (!overlap) return;
      var s = new Date(e.start).getTime(), en = new Date(e.end).getTime();
      var band = document.createElement("div");
      band.className = "browse-event-band";
      band.style.left = (100 * (s - min) / span) + "%";
      band.style.width = Math.max(0.3, 100 * (en - s) / span) + "%";
      band.title = e.name;
      track.appendChild(band);
    });
  }

  // ---- Events list (requirement 7) ----
  function renderEvents() {
    var list = $("browse-events");
    var matching = state.events.filter(function (e) {
      return state.filtered.some(function (p) { return p.taken_at >= e.start && p.taken_at <= e.end; });
    });
    list.innerHTML = matching.length
      ? matching.map(function (e) {
          return "<li><a href='#' data-slug='" + e.slug + "'>" + e.name + "</a></li>";
        }).join("")
      : "<li class='browse-muted'>No named events for the current filter.</li>";
    list.querySelectorAll("a").forEach(function (a) {
      a.onclick = function (ev) {
        ev.preventDefault();
        var e = state.events.filter(function (x) { return x.slug === a.dataset.slug; })[0];
        var first = state.filtered.filter(function (p) { return p.taken_at >= e.start && p.taken_at <= e.end; })[0];
        if (first) jumpToPhoto(first);
      };
    });
  }

  // ---- Main viewer ----
  function render() {
    var c = current();
    var img = $("browse-image");
    var caption = $("browse-caption");
    if (!c) {
      img.removeAttribute("src");
      caption.textContent = state.photos.length ? "No favorites match the selected people." :
        "No favorites published yet.";
    } else {
      img.src = imgUrl(c, VIEW_SIZE);
      img.srcset = [640, 768, 1024, 1366, 1600, 1920, 2048].map(function (s) {
        return imgUrl(c, s) + " " + s + "w";
      }).join(", ");
      img.alt = c.people.join(", ");
      caption.textContent = new Date(c.taken_at).toLocaleString() +
        (c.people.length ? "  ·  " + c.people.join(", ") : "") +
        (c.event ? "  ·  " + c.event.replace(/-/g, " ") : "");
    }
    $("browse-position").textContent = state.filtered.length
      ? (state.index + 1) + " / " + state.filtered.length : "0 / 0";
    renderChips();
    renderTimeline();
    renderEvents();
  }

  // ---- Wiring ----
  function wire() {
    $("browse-prev").onclick = function () { jumpTo(state.index - 1); };
    $("browse-next").onclick = function () { jumpTo(state.index + 1); };
    $("browse-first").onclick = function () { jumpTo(0); };
    $("browse-last").onclick = function () { jumpTo(state.filtered.length - 1); };
    $("browse-exact").onchange = function (e) {
      state.exact = e.target.checked;
      recomputeKeepingCurrent(state.currentPhotoId);
      render();
    };
    $("browse-add-person").onchange = function (e) {
      if (!e.target.value) return;
      state.active.push(e.target.value);
      e.target.value = "";
      recomputeKeepingCurrent(state.currentPhotoId);
      render();
    };
    document.addEventListener("keydown", function (e) {
      if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") jumpTo(state.index - 1);
      if (e.key === "ArrowRight") jumpTo(state.index + 1);
    });
    var viewer = $("browse-viewer"), startX = null, startY = null;
    viewer.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { startX = null; return; }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    viewer.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;  // a tap or a mostly-vertical scroll
      jumpTo(dx < 0 ? state.index + 1 : state.index - 1);
    }, { passive: true });
  }

  function boot(manifest) {
    state.photos = manifest.photos.slice().sort(function (a, b) { return a.taken_at < b.taken_at ? -1 : 1; });
    state.events = manifest.events || [];
    var names = {};
    state.photos.forEach(function (p) { p.people.forEach(function (n) { names[n] = true; }); });
    state.knownPeople = Object.keys(names).sort();
    var last = state.photos[state.photos.length - 1];
    state.active = last ? last.people.slice() : [];
    state.currentPhotoId = last ? last.id : null;
    recompute();
    wire();
    render();
  }

  fetch(manifestUrl).then(function (r) {
    if (!r.ok) throw new Error("manifest fetch failed: " + r.status);
    return r.json();
  }).then(boot).catch(function (err) {
    $("browse-caption").textContent = "Couldn't load the photo browser (" + err.message + ").";
  });
})();
