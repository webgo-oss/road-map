const apiKey = "AIzaSyCIbIQBSz4Jz5A3YRghMuSLG4rCOUozfLY";

let currentTopics = [];
let loadedCount = 0;
let totalTopics = 0;
let pdfSaved = false;

const colors = ['#00ffa2', '#00d1ff', '#8a6bff', '#ff45c6', '#00ffea'];



async function loadTopics() {
  const container = document.getElementById("cardContainer");

  try {
    const res = await fetch("http://127.0.0.1:5000/roadmap");
    const topics = await res.json();

    currentTopics = topics;
    totalTopics = topics.length;

    if (!topics || topics.length === 0) {
      container.innerHTML =
        "<p style='padding:40px;color:#666'>⚠️ No topics found in roadmap.</p>";
      return;
    }

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const card = document.createElement("div");
      card.className = "sub-cards";

      const randomColor =
        colors[Math.floor(Math.random() * colors.length)];

      card.innerHTML = `
        <span>${String(i + 1).padStart(2, '0')}</span>
        <div>
          <h2>${topic}</h2>
          <div class="line"></div>

          <div class="video-links" id="links-${i}">
            Loading educational videos...
          </div>

          <div class="learn-more-btn"
               onclick="openLearnMore('${topic}')">
            Learn more
          </div>

          <div class="color-boxs"
               style="background:${randomColor}">
          </div>
        </div>
      `;

      container.appendChild(card);
      fetchEducationalVideos(topic, `links-${i}`);
    }
  } catch (error) {
    console.error("Failed to load topics:", error);
    container.innerHTML =
      "<p style='padding:40px;color:#666'>⚠️ Could not load topics.</p>";
  }
}

async function fetchEducationalVideos(topic, elementId) {
  const eduKeywords = [
    "edu", "learn", "academy", "tutorial", "study",
    "science", "ai", "machine learning", "coding",
    "programming", "lecture", "lesson"
  ];

  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(topic)}&maxResults=5&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const target = document.getElementById(elementId);

    if (!data.items) {
      target.innerHTML = "❌ No videos found.";
    } else {
      const eduVideos = data.items
        .filter(item => {
          const title = item.snippet.title.toLowerCase();
          const channel = item.snippet.channelTitle.toLowerCase();
          return eduKeywords.some(k =>
            title.includes(k) || channel.includes(k)
          );
        })
        .slice(0, 2);

      target.innerHTML = eduVideos.length
        ? eduVideos.map(v =>
            `<a href="https://www.youtube.com/watch?v=${v.id.videoId}"
               target="_blank">${v.snippet.title}</a>`
          ).join("")
        : "⚠️ No educational videos found.";
    }
  } catch (err) {
    console.error("YouTube fetch failed:", err);
    document.getElementById(elementId).innerHTML =
      "⚠️ Error loading videos.";
  } finally {
    loadedCount++;

    if (loadedCount === totalTopics && !pdfSaved) {
      pdfSaved = true;
      setTimeout(generateAndUploadPDF, 800);
    }
  }
}

async function generateAndUploadPDF() {
  const status = document.getElementById("statusMsg");
  if (status) status.innerText = "Generating roadmap PDF...";

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("AI Learning Roadmap", 20, 20);

  let y = 40;

  for (let i = 0; i < currentTopics.length; i++) {
    if (y > 270) { doc.addPage(); y = 20; }

    const topic = currentTopics[i];
    doc.setFontSize(14);
    doc.text(`${i + 1}. ${topic}`, 20, y);
    y += 8;

    const linksContainer = document.getElementById(`links-${i}`);
    if (linksContainer) {
      const links = [...linksContainer.querySelectorAll("a")];
      doc.setFontSize(10);

      links.forEach(a => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.textWithLink(a.href, 25, y, { url: a.href });
        y += 6;
      });
    }
    y += 6;
  }

  const pdfBase64 = doc.output("datauristring");

  try {
    const res = await fetch("/save-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfData: pdfBase64 })
    });

    const result = await res.json();
    if (status)
      status.innerText = result.success
        ? "✅ Roadmap saved successfully!"
        : "❌ Save failed";
  } catch (err) {
    console.error(err);
    if (status) status.innerText = "❌ Upload error";
  }
}
loadTopics();

function openLearnMore(topic) {
  window.location.href =
    "/learn-more?topic=" + encodeURIComponent(topic);
}