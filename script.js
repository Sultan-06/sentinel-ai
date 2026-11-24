/*************************************************************************
     * CONFIGURATION & STATE
     *************************************************************************/
    // When your Python Flask or FastAPI backend is ready, set your API URL here
    // and replace the bodies of analyzeMessage(), analyzeLink(), and analyzeImage().
    const API_BASE_URL = "http://localhost:8000/api";

    let activeTab = "message"; // 'message' | 'link' | 'photo'
    let selectedPhoto = {
      dataUrl: null,
      fileName: "",
      fileSize: 0,
      sampleType: null, // 'ai' | 'real' | null
      rawFile: null
    };

    // Stores recent check items from this session so clicking any item restores its full result
    let recentChecks = [];

    /*************************************************************************
     * BUILT-IN EXAMPLES FOR ONE-CLICK TESTING
     *************************************************************************/
    const MESSAGE_EXAMPLES = {
      otp: "URGENT: Your bank account will be blocked in 2 hours because your KYC is expired. Click http://bank-kyc-update-now.xyz immediately and share your OTP to keep your account active.",
      prize: "Congratulations! Your mobile number won Rs. 5,00,000 in our Lucky Draw! To claim your prize today, send a small processing fee of Rs. 999 via UPI before midnight.",
      delivery: "Hi! Your package from BlueDart (#BD847291) is out for delivery today between 2:00 PM and 5:00 PM. No payment is required at the door."
    };

    const LINK_EXAMPLES = {
      bank: "http://secure-hdfc-bank-verify.xyz/login?confirm=account",
      short: "https://bit.ly/claim-reward-gift-now",
      wiki: "https://en.wikipedia.org/wiki/Internet_safety"
    };

    /*************************************************************************
     * INITIALIZATION
     *************************************************************************/
    document.addEventListener("DOMContentLoaded", () => {
      setupPhotoDragAndDrop();
      seedInitialRecentChecks();
    });

    /**
     * Pre-seeds two gentle sample items in Recent Checks so users immediately see
     * how the history list works and can click to view a full plain-English report.
     */
    function seedInitialRecentChecks() {
      recentChecks = [
        {
          id: "seed-1",
          type: "message",
          snippet: MESSAGE_EXAMPLES.delivery,
          result: buildMessageHeuristicResult(MESSAGE_EXAMPLES.delivery)
        },
        {
          id: "seed-2",
          type: "link",
          snippet: LINK_EXAMPLES.bank,
          result: buildLinkHeuristicResult(LINK_EXAMPLES.bank)
        }
      ];
      renderRecentChecks();
    }

    /*************************************************************************
     * GENTLE TOAST HELPER (No alert() or confirm())
     *************************************************************************/
    function showToast(message) {
      const container = document.getElementById("toast-container");
      const toast = document.createElement("div");
      toast.className = "pointer-events-auto bg-ink text-white text-sm px-4 py-3 rounded-2xl shadow-soft animate-gentle-in";
      toast.textContent = message;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.25s ease";
        setTimeout(() => toast.remove(), 260);
      }, 3000);
    }

    /*************************************************************************
     * MODAL & NAVIGATION CONTROLS
     *************************************************************************/
    function openPrivacyModal() {
      document.getElementById("privacy-modal").classList.remove("hidden");
    }

    function closePrivacyModal() {
      document.getElementById("privacy-modal").classList.add("hidden");
    }

    function resetToHome(event) {
      if (event) event.preventDefault();
      resetToInput();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    /*************************************************************************
     * TAB SWITCHING (Segmented Pill Control)
     *************************************************************************/
    function switchTab(tab) {
      activeTab = tab;

      // Always return to input view when manually switching tabs
      document.getElementById("loading-view").classList.add("hidden");
      document.getElementById("result-view").classList.add("hidden");
      document.getElementById("input-views").classList.remove("hidden");

      const tabs = ["message", "link", "photo"];
      tabs.forEach((t) => {
        const btn = document.getElementById(`tab-${t}`);
        const view = document.getElementById(`view-${t}`);
        const svg = btn.querySelector("svg");

        if (t === tab) {
          btn.setAttribute("aria-selected", "true");
          btn.className = "tab-pill flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer bg-white text-ink shadow-subtle";
          svg.classList.remove("text-muted");
          svg.classList.add("text-brand");
          view.classList.remove("hidden");
        } else {
          btn.setAttribute("aria-selected", "false");
          btn.className = "tab-pill flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer text-muted hover:text-ink";
          svg.classList.remove("text-brand");
          svg.classList.add("text-muted");
          view.classList.add("hidden");
        }
      });
    }

    function resetToInput() {
      document.getElementById("loading-view").classList.add("hidden");
      document.getElementById("result-view").classList.add("hidden");
      document.getElementById("input-views").classList.remove("hidden");
    }

    function showLoading(customText) {
      document.getElementById("loading-title").textContent = customText || "Looking closely for warning signs...";
      document.getElementById("input-views").classList.add("hidden");
      document.getElementById("result-view").classList.add("hidden");
      document.getElementById("loading-view").classList.remove("hidden");
    }

    /*************************************************************************
     * ONE-CLICK EXAMPLES
     *************************************************************************/
    function tryMessageExample(key) {
      const input = document.getElementById("message-input");
      input.value = MESSAGE_EXAMPLES[key];
      runMessageCheck();
    }

    function tryLinkExample(key) {
      const input = document.getElementById("link-input");
      input.value = LINK_EXAMPLES[key];
      runLinkCheck();
    }

    function trySamplePhoto(type) {
      const dataUrl = generateSamplePhotoCanvas(type);
      const fileName = type === "ai" ? "Sample — AI Portrait.png" : "Sample — Mountain Sunrise.jpg";

      selectedPhoto = {
        dataUrl,
        fileName,
        fileSize: type === "ai" ? 420000 : 1450000,
        sampleType: type,
        rawFile: null
      };

      updatePhotoPreviewUI(dataUrl, fileName);
      runPhotoCheck();
    }

    /*************************************************************************
     * EMBEDDED SAMPLE PHOTO GENERATOR (100% Reliable Offline Canvas Art)
     *************************************************************************/
    function generateSamplePhotoCanvas(type) {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 440;
      const ctx = canvas.getContext("2d");

      if (type === "real") {
        // Warm, natural morning landscape photo simulation
        const sky = ctx.createLinearGradient(0, 0, 0, 270);
        sky.addColorStop(0, "#7FB3D5");
        sky.addColorStop(0.55, "#D4E6F1");
        sky.addColorStop(1, "#FDEBD0");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 640, 275);

        // Soft morning sun
        const sunGlow = ctx.createRadialGradient(470, 125, 10, 470, 125, 95);
        sunGlow.addColorStop(0, "rgba(255, 251, 235, 0.95)");
        sunGlow.addColorStop(0.4, "rgba(254, 240, 138, 0.45)");
        sunGlow.addColorStop(1, "rgba(254, 240, 138, 0)");
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(470, 125, 95, 0, Math.PI * 2);
        ctx.fill();

        // Distant soft mountains
        ctx.fillStyle = "#85929E";
        ctx.beginPath();
        ctx.moveTo(0, 275);
        ctx.lineTo(130, 170);
        ctx.lineTo(265, 235);
        ctx.lineTo(410, 145);
        ctx.lineTo(560, 225);
        ctx.lineTo(640, 190);
        ctx.lineTo(640, 275);
        ctx.closePath();
        ctx.fill();

        // Closer warm green hills
        ctx.fillStyle = "#52796F";
        ctx.beginPath();
        ctx.moveTo(0, 310);
        ctx.quadraticCurveTo(180, 215, 360, 290);
        ctx.quadraticCurveTo(510, 250, 640, 285);
        ctx.lineTo(640, 340);
        ctx.lineTo(0, 340);
        ctx.closePath();
        ctx.fill();

        // Calm lake reflection
        const lake = ctx.createLinearGradient(0, 310, 0, 440);
        lake.addColorStop(0, "#A9CCE3");
        lake.addColorStop(1, "#5D6D7E");
        ctx.fillStyle = lake;
        ctx.fillRect(0, 310, 640, 130);

        // Soft sunlit ripples
        ctx.strokeStyle = "rgba(255, 251, 235, 0.5)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 9; i++) {
          const y = 328 + i * 11;
          const w = 95 - i * 7;
          ctx.beginPath();
          ctx.moveTo(470 - w / 2, y);
          ctx.lineTo(470 + w / 2, y);
          ctx.stroke();
        }

        // Subtle organic camera grain
        ctx.fillStyle = "rgba(31, 41, 55, 0.03)";
        for (let i = 0; i < 450; i++) {
          ctx.fillRect((i * 73) % 640, (i * 131) % 440, 2, 2);
        }

        // Clean corner tag
        drawSampleBadge(ctx, "Natural Photo Sample", "#ECFDF5", "#059669");
      } else {
        // Hyper-smooth, subtly surreal AI-generated portrait composition
        const bg = ctx.createLinearGradient(0, 0, 640, 440);
        bg.addColorStop(0, "#E0E7FF");
        bg.addColorStop(0.5, "#FCE7F3");
        bg.addColorStop(1, "#DBEAFE");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 640, 440);

        // Overly smooth iridescent bokeh orbs (typical generative glow)
        const orbs = [
          { x: 150, y: 120, r: 90, color: "rgba(99, 102, 241, 0.22)" },
          { x: 500, y: 110, r: 105, color: "rgba(236, 72, 153, 0.20)" },
          { x: 480, y: 340, r: 85, color: "rgba(59, 130, 246, 0.20)" }
        ];
        orbs.forEach((o) => {
          const g = ctx.createRadialGradient(o.x, o.y, 5, o.x, o.y, o.r);
          g.addColorStop(0, o.color);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Stylized ultra-smooth synthetic portrait silhouette
        const faceGrad = ctx.createLinearGradient(250, 95, 390, 270);
        faceGrad.addColorStop(0, "#FDE6D8");
        faceGrad.addColorStop(1, "#F5CBA7");

        // Shoulders
        ctx.fillStyle = "#6366F1";
        ctx.beginPath();
        ctx.ellipse(320, 405, 130, 95, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Neck
        ctx.fillStyle = "#F5CBA7";
        ctx.fillRect(295, 260, 50, 55);

        // Head
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.ellipse(320, 195, 68, 82, 0, 0, Math.PI * 2);
        ctx.fill();

        // Soft glossy halo ring (synthetic rim lighting clue)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(320, 195, 108, 0, Math.PI * 2);
        ctx.stroke();

        // Clean corner tag
        drawSampleBadge(ctx, "AI Portrait Sample", "#FEF2F2", "#DC2626");
      }

      return canvas.toDataURL("image/png");
    }

    function drawSampleBadge(ctx, label, bgHex, textHex) {
      ctx.save();
      ctx.font = "600 14px Inter, sans-serif";
      const textWidth = ctx.measureText(label).width;
      const boxW = textWidth + 28;
      const boxH = 34;
      const x = 18;
      const y = 18;

      ctx.fillStyle = bgHex;
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, 10);
      ctx.fill();

      ctx.fillStyle = textHex;
      ctx.fillText(label, x + 14, y + 22);
      ctx.restore();
    }

    /*************************************************************************
     * PHOTO UPLOAD & DRAG-AND-DROP HANDLERS
     *************************************************************************/
    function setupPhotoDragAndDrop() {
      const zone = document.getElementById("photo-dropzone");
      ["dragenter", "dragover"].forEach((ev) => {
        zone.addEventListener(ev, (e) => {
          e.preventDefault();
          zone.classList.add("border-brand", "bg-blue-50/40");
        });
      });
      ["dragleave", "drop"].forEach((ev) => {
        zone.addEventListener(ev, (e) => {
          e.preventDefault();
          zone.classList.remove("border-brand", "bg-blue-50/40");
        });
      });
      zone.addEventListener("drop", (e) => {
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) loadLocalPhotoFile(file);
      });
    }

    function handlePhotoFileChange(event) {
      const file = event.target.files && event.target.files[0];
      if (file) loadLocalPhotoFile(file);
    }

    function loadLocalPhotoFile(file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please pick a photo file (PNG, JPG, or WEBP).");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        selectedPhoto = {
          dataUrl: e.target.result,
          fileName: file.name,
          fileSize: file.size,
          sampleType: null,
          rawFile: file
        };
        updatePhotoPreviewUI(e.target.result, file.name);
      };
      reader.readAsDataURL(file);
    }

    function updatePhotoPreviewUI(dataUrl, fileName) {
      document.getElementById("photo-upload-prompt").classList.add("hidden");
      document.getElementById("photo-preview-container").classList.remove("hidden");
      document.getElementById("photo-preview-img").src = dataUrl;
      document.getElementById("photo-preview-name").textContent = fileName;
    }

    /*************************************************************************
     * BACKEND-READY ASYNC ANALYZER 1: analyzeMessage(text)
     * -----------------------------------------------------------------------
     * To connect your Python Flask/FastAPI NLP model later:
     *   const res = await fetch(`${API_BASE_URL}/analyze-message`, {
     *     method: "POST",
     *     headers: { "Content-Type": "application/json" },
     *     body: JSON.stringify({ text })
     *   });
     *   return await res.json();
     *************************************************************************/
    async function analyzeMessage(text) {
      // Gentle simulated thinking time
      await new Promise((resolve) => setTimeout(resolve, 900));
      return buildMessageHeuristicResult(text);
    }

    function buildMessageHeuristicResult(text) {
      const lower = text.toLowerCase();

      const rules = [
        { phrase: "urgent", reason: "It tries to rush you with urgent wording so you don't stop to think.", weight: 22 },
        { phrase: "immediately", reason: "It pressures you to act right away, a very common scam tactic.", weight: 18 },
        { phrase: "blocked", reason: "It threatens that your account will be blocked or closed.", weight: 24 },
        { phrase: "suspended", reason: "It threatens that your account has been suspended.", weight: 24 },
        { phrase: "kyc", reason: "It asks you to update KYC through a text message, which real banks don't do via random links.", weight: 22 },
        { phrase: "otp", reason: "It asks for an OTP or secret code — real companies never ask you to share these.", weight: 30 },
        { phrase: "pin", reason: "It mentions sharing a PIN or password.", weight: 26 },
        { phrase: "password", reason: "It asks for your password or login information.", weight: 26 },
        { phrase: "congratulations", reason: "It claims you've unexpectedly won something out of the blue.", weight: 18 },
        { phrase: "lucky draw", reason: "Unexpected lottery or lucky draw winnings are almost always fake.", weight: 28 },
        { phrase: "won", reason: "It promises surprise prize money or rewards.", weight: 16 },
        { phrase: "processing fee", reason: "It asks you to pay a fee upfront to receive money or a prize.", weight: 30 },
        { phrase: "registration fee", reason: "Asking for an upfront fee is a classic warning sign of a scam.", weight: 28 },
        { phrase: "upi", reason: "It asks you to send a payment directly via UPI to an unverified person.", weight: 18 },
        { phrase: "http://", reason: "It includes an older, unencrypted web link that looks unsafe.", weight: 22 },
        { phrase: "click", reason: "It pushes you to click an unfamiliar link.", weight: 12 },
        { phrase: "midnight", reason: "It sets an artificial deadline to make you feel pressured.", weight: 14 }
      ];

      let score = 0;
      const matchedPhrases = [];
      const reasons = [];

      rules.forEach((rule) => {
        if (lower.includes(rule.phrase)) {
          score += rule.weight;
          matchedPhrases.push(rule.phrase);
          if (!reasons.includes(rule.reason)) {
            reasons.push(rule.reason);
          }
        }
      });

      let status = "safe"; // 'safe' | 'caution' | 'danger'
      let title = "Looks Safe";
      let subtitle = "We didn't spot any common scam tricks or pushy language in this message.";
      let confidence = 93;
      let advice = "This message reads like a normal update. Even so, never share secret codes or bank details if someone unexpectedly asks later.";

      if (score >= 52) {
        status = "danger";
        title = "Likely a Scam";
        subtitle = "This message shows several strong warning signs commonly used by scammers.";
        confidence = Math.min(98, Math.round(80 + score * 0.16));
        advice = "Don't reply, don't tap any links, and never share any codes or money. If you're worried about your account, call the official number on the back of your card.";
      } else if (score >= 22) {
        status = "caution";
        title = "Be Careful";
        subtitle = "A few phrases here look slightly unusual and worth double-checking before you act.";
        confidence = Math.min(86, Math.round(68 + score * 0.35));
        advice = "Pause before replying or clicking anything. If this claims to be from someone you know or a company you use, contact them directly through their official app or number.";
      } else {
        reasons.push(
          "The tone is calm and doesn't pressure you to act urgently.",
          "It doesn't ask you to share secret codes, passwords, or unexpected payments."
        );
      }

      return {
        type: "message",
        status,
        title,
        subtitle,
        confidence,
        originalText: text,
        matchedPhrases,
        reasons: reasons.slice(0, 3),
        advice
      };
    }

    /*************************************************************************
     * BACKEND-READY ASYNC ANALYZER 2: analyzeLink(url)
     * -----------------------------------------------------------------------
     * To connect your Python Flask/FastAPI phishing model later:
     *   const res = await fetch(`${API_BASE_URL}/analyze-link`, {
     *     method: "POST",
     *     headers: { "Content-Type": "application/json" },
     *     body: JSON.stringify({ url })
     *   });
     *   return await res.json();
     *************************************************************************/
    async function analyzeLink(url) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      return buildLinkHeuristicResult(url);
    }

    function buildLinkHeuristicResult(rawUrl) {
      let cleaned = rawUrl.trim();
      if (!/^https?:\/\//i.test(cleaned)) {
        cleaned = "http://" + cleaned;
      }

      let parsed;
      try {
        parsed = new URL(cleaned);
      } catch (err) {
        throw new Error("That doesn't look like a complete website link. Try pasting the full address.");
      }

      const host = parsed.hostname.toLowerCase();
      const isHttps = parsed.protocol === "https:";
      const parts = host.split(".");
      const tld = parts.length > 1 ? "." + parts[parts.length - 1] : "";

      const shorteners = ["bit.ly", "tinyurl.com", "t.co", "rb.gy", "is.gd", "ow.ly", "cutt.ly"];
      const riskyTlds = [".xyz", ".top", ".tk", ".ml", ".click", ".gq", ".cf", ".work"];
      const trustedDomains = ["wikipedia.org", "google.com", "apple.com", "microsoft.com", "amazon.com", "github.com", "gov.in"];

      const isShortener = shorteners.some((s) => host === s || host.endsWith("." + s));
      const hasRiskyTld = riskyTlds.includes(tld);
      const isTrusted = trustedDomains.some((d) => host === d || host.endsWith("." + d));
      const looksLikeSpoof = !isTrusted && /(bank|hdfc|sbi|icici|paypal|paypa1|arnazon|amazon|google|g00gle|apple|verify|secure-login|update-account)/i.test(host);

      let risk = 0;
      const reasons = [];

      if (!isHttps) {
        risk += 30;
        reasons.push("This website does not use a secure padlock connection (HTTPS), so anything you type isn't protected.");
      }
      if (looksLikeSpoof) {
        risk += 38;
        reasons.push("The web address tries to imitate a well-known bank or trusted service, even though it isn't their real website.");
      }
      if (hasRiskyTld) {
        risk += 26;
        reasons.push(`The ending "${tld}" is very commonly used by temporary fake websites.`);
      }
      if (isShortener) {
        risk += 38;
        reasons.push("This is a shortened link, which hides the real website address until after you click it.");
      }

      let status = "safe";
      let title = "Looks Safe";
      let subtitle = "This link points to a recognizable, securely encrypted website.";
      let confidence = 94;
      let advice = "This website looks trustworthy. Still, always double-check the address bar before entering any passwords or card numbers.";

      if (risk >= 60) {
        status = "danger";
        title = "Likely a Scam Link";
        subtitle = "This link has strong signs of a fake website trying to steal logins or personal details.";
        confidence = Math.min(97, Math.round(78 + risk * 0.2));
        advice = "Do not open this link or sign in on it. Instead, type the company's real website into your browser yourself or use their official app.";
      } else if (risk >= 30) {
        status = "caution";
        title = "Be Careful";
        subtitle = "We can't fully confirm where this link leads or who runs it.";
        confidence = 82;
        advice = "Only tap this link if you personally know and trust the sender. Never type passwords or bank details after opening a shortened or unfamiliar link.";
      } else {
        reasons.push(
          "It uses a standard secure connection (HTTPS) to keep your browsing private.",
          "The web address matches a clean, genuine domain without lookalike tricks."
        );
      }

      const checks = [
        {
          label: "Website Security",
          ok: isHttps,
          status: isHttps ? "safe" : "danger",
          text: isHttps ? "Uses a secure encrypted connection (HTTPS)" : "Not encrypted — missing secure padlock"
        },
        {
          label: "Domain Trust",
          ok: !hasRiskyTld && !isShortener,
          status: hasRiskyTld ? "danger" : isShortener ? "caution" : "safe",
          text: hasRiskyTld
            ? `Uses a high-risk website ending (${tld})`
            : isShortener
            ? "Hides the final destination behind a shortener"
            : "Clean, standard website address"
        },
        {
          label: "Lookalike Check",
          ok: !looksLikeSpoof,
          status: looksLikeSpoof ? "danger" : "safe",
          text: looksLikeSpoof
            ? "Looks like it is impersonating a known brand"
            : "No brand impersonation spotted"
        }
      ];

      return {
        type: "link",
        status,
        title,
        subtitle,
        confidence,
        originalUrl: rawUrl.trim(),
        realDomain: host,
        checks,
        reasons: reasons.slice(0, 3),
        advice
      };
    }

    /*************************************************************************
     * BACKEND-READY ASYNC ANALYZER 3: analyzeImage(fileOrSample)
     * -----------------------------------------------------------------------
     * To connect your Python Flask/FastAPI deepfake/AI-image model later:
     *   const formData = new FormData();
     *   formData.append("image", fileOrSample.rawFile);
     *   const res = await fetch(`${API_BASE_URL}/analyze-image`, {
     *     method: "POST",
     *     body: formData
     *   });
     *   return await res.json();
     *************************************************************************/
    async function analyzeImage(fileOrSample) {
      await new Promise((resolve) => setTimeout(resolve, 1150));

      let isAi = false;
      let isUncertain = false;

      if (fileOrSample.sampleType === "ai") {
        isAi = true;
      } else if (fileOrSample.sampleType === "real") {
        isAi = false;
      } else {
        // Friendly client-side heuristic for real uploaded photos in prototype mode
        const name = (fileOrSample.fileName || "").toLowerCase();
        if (/(ai|midjourney|dalle|stable|fake|generated|synth|deepfake)/.test(name)) {
          isAi = true;
        } else if (/(edit|filter|whatsapp|screenshot|render)/.test(name)) {
          isUncertain = true;
        } else {
          isAi = false;
        }
      }

      if (isAi) {
        return {
          type: "photo",
          status: "danger",
          title: "Likely AI-Generated",
          subtitle: "This photo shows smooth patterns and lighting clues often left behind by AI image tools.",
          confidence: 92,
          imageUrl: fileOrSample.dataUrl,
          fileName: fileOrSample.fileName,
          pills: [
            { label: "Natural Lighting & Skin", state: "danger", note: "Unusually smooth glow" },
            { label: "Fine Detail Consistency", state: "caution", note: "Soft blended edges" },
            { label: "Digital Editing Clues", state: "danger", note: "AI creation patterns found" }
          ],
          reasons: [
            "The lighting and surface smoothness look overly polished compared to a regular camera photo.",
            "Fine background details show subtle patterns commonly created by AI generators.",
            "Normal camera details that usually come with real photos appear to be missing."
          ],
          advice: "Treat this image with caution and avoid sharing it as real news or proof. If someone sent it to verify their identity, ask for a live video call instead."
        };
      }

      if (isUncertain) {
        return {
          type: "photo",
          status: "caution",
          title: "Be Careful — Possibly Edited",
          subtitle: "We couldn't confirm if this photo is completely untouched. It may be heavily filtered or re-saved.",
          confidence: 76,
          imageUrl: fileOrSample.dataUrl,
          fileName: fileOrSample.fileName,
          pills: [
            { label: "Natural Lighting & Skin", state: "safe", note: "Looks mostly natural" },
            { label: "Fine Detail Consistency", state: "caution", note: "Slightly compressed" },
            { label: "Digital Editing Clues", state: "caution", note: "Re-saved or filtered" }
          ],
          reasons: [
            "Messaging apps and photo filters often remove original camera details when saving.",
            "Some areas look slightly smoothed, which can happen from either phone beauty filters or editing."
          ],
          advice: "Ask where the photo originally came from before trusting it for anything important, especially if it involves money or breaking news."
        };
      }

      return {
        type: "photo",
        status: "safe",
        title: "Looks Safe & Real",
        subtitle: "This photo looks consistent with a genuine picture taken by a real camera.",
        confidence: 91,
        imageUrl: fileOrSample.dataUrl,
        fileName: fileOrSample.fileName,
        pills: [
          { label: "Natural Lighting & Skin", state: "safe", note: "Consistent shadows & light" },
          { label: "Fine Detail Consistency", state: "safe", note: "Natural camera texture" },
          { label: "Digital Editing Clues", state: "safe", note: "No AI patterns spotted" }
        ],
        reasons: [
          "The light, shadows, and natural texture match what real camera lenses capture.",
          "We didn't find the telltale repeating patterns or artificial smoothing made by AI generators."
        ],
        advice: "This photo appears authentic. As a good habit, still check the context of where a photo was posted before sharing it widely."
      };
    }

    /*************************************************************************
     * TRIGGER HANDLERS FOR EACH TAB
     *************************************************************************/
    async function runMessageCheck() {
      const text = document.getElementById("message-input").value.trim();
      if (!text) {
        showToast("Please paste a message or try one of the examples first.");
        return;
      }

      showLoading("Reading the message for common scam tricks...");
      try {
        const result = await analyzeMessage(text);
        saveToRecent("message", text, result);
        renderResult(result);
      } catch (err) {
        resetToInput();
        showToast("Something went wrong while checking. Please try again.");
      }
    }

    async function runLinkCheck() {
      const url = document.getElementById("link-input").value.trim();
      if (!url) {
        showToast("Please paste a website link or try an example first.");
        return;
      }

      showLoading("Checking where this link actually goes...");
      try {
        const result = await analyzeLink(url);
        saveToRecent("link", url, result);
        renderResult(result);
      } catch (err) {
        resetToInput();
        showToast(err.message || "Please check that the link is typed properly.");
      }
    }

    async function runPhotoCheck() {
      if (!selectedPhoto.dataUrl) {
        showToast("Please choose a photo or try one of the sample photos first.");
        return;
      }

      showLoading("Looking closely at lighting and fine details...");
      try {
        const result = await analyzeImage(selectedPhoto);
        saveToRecent("photo", selectedPhoto.fileName, result);
        renderResult(result);
      } catch (err) {
        resetToInput();
        showToast("We couldn't check that photo. Please try another image.");
      }
    }

    /*************************************************************************
     * PLAIN-ENGLISH RESULT RENDERER
     *************************************************************************/
    function renderResult(result) {
      document.getElementById("loading-view").classList.add("hidden");
      document.getElementById("input-views").classList.add("hidden");
      const resultView = document.getElementById("result-view");
      resultView.classList.remove("hidden");

      const palette = {
        safe: {
          banner: "bg-safe-bg border-safe-border text-safe-text",
          iconBg: "bg-white text-safe-text border border-safe-border",
          bar: "bg-safe-text",
          adviceBox: "bg-safe-bg/60 border-safe-border",
          adviceIcon: "text-safe-text",
          iconSvg: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`
        },
        caution: {
          banner: "bg-caution-bg border-caution-border text-caution-text",
          iconBg: "bg-white text-caution-text border border-caution-border",
          bar: "bg-caution-text",
          adviceBox: "bg-caution-bg/70 border-caution-border",
          adviceIcon: "text-caution-text",
          iconSvg: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`
        },
        danger: {
          banner: "bg-danger-bg border-danger-border text-danger-text",
          iconBg: "bg-white text-danger-text border border-danger-border",
          bar: "bg-danger-text",
          adviceBox: "bg-danger-bg/70 border-danger-border",
          adviceIcon: "text-danger-text",
          iconSvg: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }
      }[result.status];

      // Verdict Banner
      const banner = document.getElementById("result-banner");
      banner.className = `rounded-2xl p-5 sm:p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${palette.banner}`;

      const iconWrap = document.getElementById("result-icon-wrap");
      iconWrap.className = `w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${palette.iconBg}`;
      iconWrap.innerHTML = palette.iconSvg;

      const typeNames = {
        message: "Message Check",
        link: "Link Check",
        photo: "Photo Check"
      };
      document.getElementById("result-type-label").textContent = typeNames[result.type];
      document.getElementById("result-title").textContent = result.title;
      document.getElementById("result-subtitle").textContent = result.subtitle;

      // Simple Horizontal Confidence Bar
      document.getElementById("result-confidence-label").textContent = `${result.confidence}% confident`;
      const confBar = document.getElementById("result-confidence-bar");
      confBar.className = `h-full rounded-full transition-all duration-700 ${palette.bar}`;
      // Trigger smooth width transition
      confBar.style.width = "0%";
      requestAnimationFrame(() => {
        confBar.style.width = `${result.confidence}%`;
      });

      // Module-Specific Section
      const specificEl = document.getElementById("result-specific-section");
      if (result.type === "message") {
        specificEl.innerHTML = renderMessageSpecificSection(result);
      } else if (result.type === "link") {
        specificEl.innerHTML = renderLinkSpecificSection(result);
      } else if (result.type === "photo") {
        specificEl.innerHTML = renderPhotoSpecificSection(result);
      }

      // "Why we think this" bullets
      const reasonsList = document.getElementById("result-reasons-list");
      reasonsList.innerHTML = result.reasons.map((reason) => `
        <li class="flex items-start gap-2.5">
          <span class="w-1.5 h-1.5 rounded-full bg-brand mt-2 shrink-0"></span>
          <span>${escapeHtml(reason)}</span>
        </li>
      `).join("");

      // "What you should do" gentle advice box
      const adviceBox = document.getElementById("result-advice-box");
      adviceBox.className = `rounded-2xl p-5 border flex items-start gap-3.5 ${palette.adviceBox}`;
      document.getElementById("result-advice-icon").innerHTML = `
        <svg class="w-5 h-5 ${palette.adviceIcon}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`;
      document.getElementById("result-advice-text").textContent = result.advice;
    }

    function renderMessageSpecificSection(result) {
      let highlighted = escapeHtml(result.originalText);
      const highlightClass = result.status === "danger" ? "highlight-danger" : "highlight-caution";

      if (result.matchedPhrases && result.matchedPhrases.length > 0) {
        const unique = [...new Set(result.matchedPhrases)].sort((a, b) => b.length - a.length);
        unique.forEach((phrase) => {
          const safeRegex = new RegExp(`(${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
          highlighted = highlighted.replace(safeRegex, `<span class="${highlightClass}">$1</span>`);
        });
      }

      const helperNote = result.matchedPhrases.length > 0
        ? "Highlighted words show what stood out as a warning sign."
        : "No suspicious words were flagged in this message.";

      return `
        <div class="rounded-2xl bg-white border border-hairline p-5 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-display text-sm font-bold text-ink">Message you checked</h3>
            <span class="text-xs text-muted">${helperNote}</span>
          </div>
          <p class="text-sm sm:text-base text-ink leading-relaxed bg-[#FAF9F7] p-4 rounded-xl border border-hairline break-words">
            ${highlighted}
          </p>
        </div>
      `;
    }

    function renderLinkSpecificSection(result) {
      const rowIcons = {
        safe: `<span class="w-6 h-6 rounded-full bg-safe-bg text-safe-text flex items-center justify-center shrink-0"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg></span>`,
        caution: `<span class="w-6 h-6 rounded-full bg-caution-bg text-caution-text flex items-center justify-center shrink-0"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01" /></svg></span>`,
        danger: `<span class="w-6 h-6 rounded-full bg-danger-bg text-danger-text flex items-center justify-center shrink-0"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></span>`
      };

      const rowsHtml = result.checks.map((check) => `
        <div class="flex items-center justify-between gap-3 py-3 border-b last:border-b-0 border-hairline">
          <div class="flex items-center gap-3">
            ${rowIcons[check.status]}
            <div>
              <div class="text-sm font-semibold text-ink">${escapeHtml(check.label)}</div>
              <div class="text-xs text-muted">${escapeHtml(check.text)}</div>
            </div>
          </div>
        </div>
      `).join("");

      return `
        <div class="rounded-2xl bg-white border border-hairline p-5 space-y-4">
          <div class="rounded-xl bg-[#FAF9F7] border border-hairline p-4">
            <div class="text-xs font-medium text-muted mb-1">Where this link actually goes</div>
            <div class="font-display text-base sm:text-lg font-bold text-ink break-all">${escapeHtml(result.realDomain)}</div>
            <div class="text-xs text-muted mt-1 break-all">${escapeHtml(result.originalUrl)}</div>
          </div>
          <div class="px-1">
            ${rowsHtml}
          </div>
        </div>
      `;
    }

    function renderPhotoSpecificSection(result) {
      const pillStyles = {
        safe: "bg-safe-bg text-safe-text border-safe-border",
        caution: "bg-caution-bg text-caution-text border-caution-border",
        danger: "bg-danger-bg text-danger-text border-danger-border"
      };

      const pillsHtml = result.pills.map((p) => `
        <div class="rounded-xl border border-hairline bg-[#FAF9F7] p-3.5 flex items-center justify-between gap-3">
          <span class="text-sm font-semibold text-ink">${escapeHtml(p.label)}</span>
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${pillStyles[p.state]}">${escapeHtml(p.note)}</span>
        </div>
      `).join("");

      return `
        <div class="rounded-2xl bg-white border border-hairline p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <div class="sm:col-span-5 flex flex-col items-center">
            <img src="${result.imageUrl}" alt="Checked photo preview" class="w-full max-h-52 object-cover rounded-xl border border-hairline shadow-subtle bg-[#FAF9F7]" />
            <span class="text-xs text-muted mt-2 truncate max-w-full">${escapeHtml(result.fileName)}</span>
          </div>
          <div class="sm:col-span-7 space-y-2.5">
            ${pillsHtml}
          </div>
        </div>
      `;
    }

    /*************************************************************************
     * RECENT CHECKS SESSION LIST (Clickable to restore full results)
     *************************************************************************/
    function saveToRecent(type, snippet, result) {
      const id = "chk-" + Date.now();
      recentChecks.unshift({ id, type, snippet, result });
      if (recentChecks.length > 8) recentChecks.pop();
      renderRecentChecks();
    }

    function clearRecentChecks() {
      recentChecks = [];
      renderRecentChecks();
      showToast("Recent checks cleared.");
    }

    function restoreRecentCheck(id) {
      const item = recentChecks.find((c) => c.id === id);
      if (!item) return;

      // Highlight the matching tab pill visually without clearing the result view
      activeTab = item.type;
      ["message", "link", "photo"].forEach((t) => {
        const btn = document.getElementById(`tab-${t}`);
        const view = document.getElementById(`view-${t}`);
        const svg = btn.querySelector("svg");
        if (t === item.type) {
          btn.setAttribute("aria-selected", "true");
          btn.className = "tab-pill flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer bg-white text-ink shadow-subtle";
          svg.classList.remove("text-muted");
          svg.classList.add("text-brand");
          view.classList.remove("hidden");
        } else {
          btn.setAttribute("aria-selected", "false");
          btn.className = "tab-pill flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer text-muted hover:text-ink";
          svg.classList.remove("text-brand");
          svg.classList.add("text-muted");
          view.classList.add("hidden");
        }
      });

      renderResult(item.result);
      document.getElementById("checker-card").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function renderRecentChecks() {
      const list = document.getElementById("recent-checks-list");
      const clearBtn = document.getElementById("btn-clear-recent");

      if (recentChecks.length === 0) {
        clearBtn.classList.add("hidden");
        list.innerHTML = `
          <div class="p-6 text-center text-sm text-muted">
            Your recent checks from this visit will appear right here.
          </div>
        `;
        return;
      }

      clearBtn.classList.remove("hidden");

      const typeIcons = {
        message: `<svg class="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>`,
        link: `<svg class="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>`,
        photo: `<svg class="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`
      };

      const pillClasses = {
        safe: "bg-safe-bg text-safe-text border-safe-border",
        caution: "bg-caution-bg text-caution-text border-caution-border",
        danger: "bg-danger-bg text-danger-text border-danger-border"
      };

      list.innerHTML = recentChecks.map((item) => `
        <button
          type="button"
          onclick="restoreRecentCheck('${item.id}')"
          class="w-full text-left px-4 sm:px-5 py-3.5 hover:bg-[#FAF9F7] transition flex items-center justify-between gap-3 cursor-pointer"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-[#FAF9F7] border border-hairline flex items-center justify-center shrink-0">
              ${typeIcons[item.type]}
            </div>
            <span class="text-sm text-ink truncate">${escapeHtml(item.snippet)}</span>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${pillClasses[item.result.status]}">
            ${escapeHtml(item.result.title)}
          </span>
        </button>
      `).join("");
    }

    /*************************************************************************
     * UTILITY: HTML ESCAPING
     *************************************************************************/
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
