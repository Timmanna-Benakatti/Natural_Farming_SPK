/* ============================================================
   site.js — drives homepage grid, glossary table, and episode
   pagination entirely from data/episodes.json + data/glossary.json.

   Adding or removing an episode NEVER requires editing this file,
   index.html, glossary.html, or any other episode's HTML.
   Just add/remove one entry in data/episodes.json (and matching
   rows in data/glossary.json if terms changed), and drop/remove
   the episode's own HTML file in episodes/. Everything else
   (homepage cards, grouping, stats, prev/next pager) updates
   itself automatically.
   ============================================================ */

(function () {
  "use strict";

  // Are we inside /episodes/ or at site root? Determines relative data path.
  var inEpisodesDir = /\/episodes\//.test(window.location.pathname);
  var dataPrefix = inEpisodesDir ? "../data/" : "data/";
  var episodesLinkPrefix = inEpisodesDir ? "" : "episodes/";

  function fetchJSON(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error("Failed to load " + path);
      return res.json();
    });
  }

  function esc(s) {
    var div = document.createElement("div");
    div.textContent = s == null ? "" : String(s);
    return div.innerHTML;
  }

  function parseDurationMinutes(d) {
    var m = /(\d+)/.exec(d || "");
    return m ? parseInt(m[1], 10) : 0;
  }

  /* ---------------- Homepage rendering ---------------- */

  function renderHome() {
    var container = document.getElementById("episodes-container");
    if (!container) return;

    fetchJSON(dataPrefix + "episodes.json").then(function (episodes) {
      episodes.sort(function (a, b) { return a.num - b.num; });

      // Stats
      var statEpisodes = document.getElementById("stat-episodes");
      var statHours = document.getElementById("stat-hours");
      var statTerms = document.getElementById("stat-terms");
      if (statEpisodes) statEpisodes.textContent = episodes.length;
      if (statHours) {
        var totalMin = episodes.reduce(function (sum, e) { return sum + parseDurationMinutes(e.duration); }, 0);
        statHours.textContent = "~" + Math.round(totalMin / 60);
      }
      if (statTerms) {
        fetchJSON(dataPrefix + "glossary.json").then(function (terms) {
          statTerms.textContent = terms.length + "+";
        }).catch(function () { statTerms.textContent = ""; });
      }

      // Group episodes in order of first appearance
      var groups = [];
      var groupMap = {};
      episodes.forEach(function (e) {
        var key = e.group || "ಇತರೆ ಸಂಚಿಕೆಗಳು";
        if (!groupMap[key]) {
          groupMap[key] = { title: key, sub: e.groupSub || "", items: [] };
          groups.push(groupMap[key]);
        }
        groupMap[key].items.push(e);
      });

      var html = "";
      groups.forEach(function (g) {
        html += '<div class="section-header"><h2>' + esc(g.title) + '</h2>' +
          (g.sub ? '<span class="section-sub">' + esc(g.sub) + '</span>' : '') + '</div>';
        html += '<div class="ep-grid">';
        g.items.forEach(function (e) {
          html += '<a class="ep-card" href="' + episodesLinkPrefix + esc(e.file) + '">' +
            '<span class="ep-num">' + e.num + '</span>' +
            '<h3 class="ep-card-title">' + esc(e.title) + '</h3>' +
            '<p class="ep-card-teaser">' + esc(e.teaser) + '</p>' +
            '<div class="ep-card-foot"><span>' + esc(e.duration) + '</span><span class="read-more">ಓದಿ &rarr;</span></div>' +
            '</a>';
        });
        html += '</div>';
      });

      container.innerHTML = html;
    }).catch(function (err) {
      container.innerHTML = '<p style="color:#b23a3a;">ಸಂಚಿಕೆಗಳ ಪಟ್ಟಿ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. (' + esc(err.message) + ')</p>';
    });
  }

  /* ---------------- Glossary rendering + search ---------------- */

  function renderGlossary() {
    var tbody = document.getElementById("glossaryBody");
    if (!tbody) return;

    fetchJSON(dataPrefix + "glossary.json").then(function (terms) {
      var countEl = document.getElementById("glossaryCount");
      var total = terms.length;
      if (countEl) countEl.textContent = total + " ಪದಗಳು ತೋರಿಸಲಾಗುತ್ತಿದೆ";

      var rowsHtml = terms.map(function (r) {
        var blob = ((r.kannada || "") + " " + (r.translit || "") + " " + (r.meaning || "")).toLowerCase();
        var badges = (r.epNums || []).map(function (n) {
          return '<a class="glossary-ep-badge" href="' + episodesLinkPrefix + 'ep' + String(n).padStart(2, "0") + '-';
        });
        // badge hrefs need the real filename; resolve via episodes.json
        return { blob: esc(blob), kannada: r.kannada, translit: r.translit, meaning: r.meaning, epNums: r.epNums || [] };
      });

      // Need episode filenames for badge links
      fetchJSON(dataPrefix + "episodes.json").then(function (episodes) {
        var fileByNum = {};
        episodes.forEach(function (e) { fileByNum[e.num] = e.file; });

        var html = rowsHtml.map(function (r) {
          var badges = r.epNums.map(function (n) {
            var file = fileByNum[n];
            var label = "EP" + n;
            return file
              ? '<a class="glossary-ep-badge" href="' + episodesLinkPrefix + esc(file) + '">' + label + '</a>'
              : '<span class="glossary-ep-badge">' + label + '</span>';
          }).join(" ");
          return '<tr data-search="' + r.blob + '">' +
            '<td><strong>' + esc(r.kannada) + '</strong></td>' +
            '<td>' + esc(r.translit) + '</td>' +
            '<td>' + esc(r.meaning) + '</td>' +
            '<td>' + badges + '</td>' +
            '</tr>';
        }).join("");

        tbody.innerHTML = html;

        var input = document.getElementById("glossarySearch");
        if (input) {
          var rowEls = tbody.querySelectorAll("tr");
          input.addEventListener("input", function () {
            var q = input.value.trim().toLowerCase();
            var shown = 0;
            rowEls.forEach(function (row) {
              var blob = row.getAttribute("data-search");
              if (!q || blob.indexOf(q) !== -1) {
                row.classList.remove("glossary-row-hidden");
                shown++;
              } else {
                row.classList.add("glossary-row-hidden");
              }
            });
            if (countEl) countEl.textContent = shown + " / " + total + " ಪದಗಳು ತೋರಿಸಲಾಗುತ್ತಿದೆ";
          });
        }
      });
    }).catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="4" style="color:#b23a3a;">ಪದಕೋಶ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. (' + esc(err.message) + ')</td></tr>';
    });
  }

  /* ---------------- Episode pager rendering ---------------- */

  function currentEpisodeNumFromFilename() {
    var m = /ep0*(\d+)-/.exec(window.location.pathname.split("/").pop() || "");
    return m ? parseInt(m[1], 10) : null;
  }

  function renderPager() {
    var container = document.getElementById("pager-container");
    if (!container) return;

    var currentNum = currentEpisodeNumFromFilename();

    fetchJSON(dataPrefix + "episodes.json").then(function (episodes) {
      episodes.sort(function (a, b) { return a.num - b.num; });
      var idx = episodes.findIndex(function (e) { return e.num === currentNum; });
      if (idx === -1) { container.innerHTML = ""; return; }

      var prevE = idx > 0 ? episodes[idx - 1] : null;
      var nextE = idx < episodes.length - 1 ? episodes[idx + 1] : null;

      var prevHtml = prevE
        ? '<a class="pager-link prev" href="' + esc(prevE.file) + '"><div class="dir">&larr; ಹಿಂದಿನ ಸಂಚಿಕೆ</div>' +
          '<div class="ep-title">ಸಂಚಿಕೆ ' + prevE.num + ': ' + esc(prevE.title) + '</div></a>'
        : '<span class="pager-link placeholder"></span>';

      var nextHtml = nextE
        ? '<a class="pager-link next" href="' + esc(nextE.file) + '"><div class="dir">ಮುಂದಿನ ಸಂಚಿಕೆ &rarr;</div>' +
          '<div class="ep-title">ಸಂಚಿಕೆ ' + nextE.num + ': ' + esc(nextE.title) + '</div></a>'
        : '<span class="pager-link placeholder"></span>';

      container.innerHTML =
        '<div class="pager-links">' + prevHtml + nextHtml + '</div>' +
        '<div class="pager-meta">ಸಂಚಿಕೆ ' + episodes[idx].num + ' / ' + episodes.length + '</div>' +
        '<div class="pager-bottom-links"><a href="../index.html#episodes">ಎಲ್ಲಾ ಸಂಚಿಕೆಗಳು</a><a href="../glossary.html">ಪದಕೋಶ</a></div>';
    }).catch(function (err) {
      container.innerHTML = '<p style="color:#b23a3a;">ಪೇಜರ್ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.</p>';
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHome();
    renderGlossary();
    renderPager();
  });
})();
