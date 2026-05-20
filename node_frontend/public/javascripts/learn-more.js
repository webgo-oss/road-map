
const CURRENT_TOPIC = "<%= topic %>";


const API_KEY = "AIzaSyDkTbopEaEsqNW2Crcpbiwy-bmbC0sq7Sg";
const CX = "473543ef0a49c46c2";

async function loadDiagram(topic) {
  const card = document.getElementById("card");
  card.innerHTML = "Loading educational diagram...";

  const url =
    "https://www.googleapis.com/customsearch/v1" +
    "?q=" + encodeURIComponent(topic) +
    "&cx=" + CX +
    "&key=" + API_KEY +
    "&searchType=image&num=1";

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items || !data.items.length) {
      card.innerHTML = "<p>No diagram found.</p>";
      return;
    }

    const img = data.items[0];
    card.innerHTML = `
      <img src="${img.link}">
      <p>${img.title}</p>
      <small>Source: ${img.displayLink}</small>
    `;
  } catch {
    card.innerHTML = "<p>Error loading diagram.</p>";
  }
}


const chart = echarts.init(document.getElementById("chart"));

async function generate() {
  const res = await fetch("http://localhost:5000/generate-topic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: CURRENT_TOPIC })
  });

  const data = await res.json();

  definition.innerText = data.definition;
  script.innerText = data.script;

 const neonColors = ['#00ffa2', '#00d1ff', '#8a6bff', '#ff45c6', '#00ffea'];

const glow = (color, blur = 28) => ({
  color: color,
  shadowBlur: blur,
  shadowColor: color
});

chart.setOption({
  backgroundColor: "transparent",
  animationDuration: 1200,
tooltip: {
  trigger: "item",
  backgroundColor: "rgba(0,0,0,0.85)",
  borderWidth: 0,
  textStyle: { color: "#eaffff" },
  formatter: (params) => {
    if (params.dataType === "node") {
      return `
        <b>${params.name}</b><br/>
        ${params.name === CURRENT_TOPIC
          ? "Core Concept"
          : "Connected Step"}
      `;
    }
    return "";
  }
},

  series: [{
    type: "graph",
    layout: "force",
    draggable: true,

    data: [
      {
        name: CURRENT_TOPIC,
        symbolSize: 76,
        itemStyle: glow(neonColors[4], 38)
      },
      ...data.nodes.map((n, i) => ({
        name: n.name,
        symbolSize: 58,
        itemStyle: glow(neonColors[i % neonColors.length])
      }))
    ],

    links: data.nodes.map(n => ({
      source: CURRENT_TOPIC,
      target: n.name
    })),

    force: {
      repulsion: 320,
      edgeLength: 170
    },

    label: {
      show: true,
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "bold"
    },

    lineStyle: {
      width: 3,
      color: "#9aa8ff",
      shadowBlur: 20,
      shadowColor: "#9aa8ff",
      opacity: 0.9
    }
  }]
});

const featureChart = echarts.init(document.getElementById("treeChart"));

featureChart.setOption({
  backgroundColor: "transparent",

  tooltip: {
    trigger: "item",
    formatter: "{b}"
  },

  animationDuration: 1600,
  animationEasing: "cubicOut",

  series: [{
    type: "sankey",
    emphasis: { focus: "adjacency" },

    nodeAlign: "left",
    nodeWidth: 20,
    nodeGap: 38,
    layoutIterations: 0,
    left: "6%",
    right: "45%",
    top: "28%",
    bottom: "14%",

    data: [
      {
        name: CURRENT_TOPIC,
        itemStyle: {
          color: "#ffffff",
          shadowBlur: 32,
          shadowColor: "#00eaff"
        }
      },
      ...data.features.map((f, i) => ({
        name: f,
        itemStyle: {
          color: neonColors[i % neonColors.length],
          shadowBlur: 18,
          shadowColor: neonColors[i % neonColors.length]
        }
      }))
    ],

    links: data.features.map((f, i) => ({
      source: CURRENT_TOPIC,
      target: f,
      value: 5 + (i % 3) 
    })),

    lineStyle: {
      color: "source",
      curveness: 0.42,
      opacity: 0.85,
      shadowBlur: 18,
      shadowColor: "#00ffff"
    },

    label: {
      color: "#eaffff",
      fontSize: 16,
      fontWeight: 600
    }
  }]
});

const chart3d =echarts.init(document.getElementById("timeChart"));

const barData = [
  {
    label: "Beginner",
    value: data.learning_time.beginner,
    color: "#ff4dff",
    selector: ".pink p"
  },
  {
    label: "Intermediate",
    value: data.learning_time.intermediate,
    color: "#4dffff",
    selector: ".cyan p"
  },
  {
    label: "Advanced",
    value: data.learning_time.advanced,
    color: "#ffcc4d",
    selector: ".yellow p"
  }
];

chart3d.setOption({
  tooltip: {
    backgroundColor: "rgba(0,0,0,0.85)",
    borderWidth: 0,
    textStyle: { color: "#bfefff" }
  },

  xAxis3D: {
    type: "category",
    data: barData.map(b => b.label),
    axisLine: { lineStyle: { color: "#00eaff", width: 1.5 } },
    axisLabel: {
      color: "#00f0ff",
      fontSize: 13,
      fontWeight: "600"
    }
  },

  yAxis3D: {
    type: "value",
    min: 0,
    max: 1,
    show: false
  },

  zAxis3D: {
    type: "value",
    min: 0,
    max: 100,
    axisLine: { lineStyle: { color: "#00eaff" } },
    axisLabel: { color: "#9aa8ff" }
  },

  grid3D: {
    boxWidth: 160,
    boxDepth: 18,
    viewControl: {
      alpha: 20,
      beta: 6,
      distance: 230,
      rotateSensitivity: 0,
      zoomSensitivity: 0,
      panSensitivity: 0
    },
    light: {
      main: { intensity: 1.0 },
      ambient: { intensity: 0.6 }
    }
  },

  series: [{
    type: "bar3D",
    barSize: 18,
    data: barData.map((b, i) => [i, 0.5, b.value]),
    itemStyle: {
      color: p => barData[p.dataIndex].color,
      borderColor: "#00eaff",
      borderWidth: 1
    }
  }]
});

barData.forEach(bar => {
  const p = document.querySelector(bar.selector);
  if (p) {
    p.textContent = `Estimated learning time: ${bar.value} hours`;
    p.style.color = bar.color;
    p.style.fontWeight = "600";
    p.style.fontSize = "14px";
  }
});

}

async function generateVideo(btn) {
  // 🔒 Disable immediately
  btn.disabled = true;
  btn.innerText = "Generating...";
  btn.style.opacity = "0.6";
  btn.style.cursor = "not-allowed";

  try {
    const res = await fetch("/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: CURRENT_TOPIC,
        script: script.innerText
      })
    });

    const data = await res.json();

    if (data.success) {
      result.innerHTML = `<video controls src="${data.video_url}"></video>`;
      btn.innerText = "Generated";

      btn.disabled = false;
      btn.innerText = "Generate Again";
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
    } else {
      btn.innerText = "Failed";
      btn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    btn.innerText = "Error";

    btn.disabled = false;
    btn.innerText = "Generate Again";
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
  }
}


window.addEventListener("resize", () => {
  chart.resize();
  featureChart.resize();
  chart3d.resize();
});

window.onload = () => {
  generate();
  loadDiagram(CURRENT_TOPIC);
};
