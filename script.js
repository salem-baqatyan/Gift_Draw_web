// Configuration: change these values to personalize the standalone website.
const AppConfig = {
  userName: "Ali",
  gender: "female",
  homeBackgroundImage: "assets/home_bg.svg",
};

// Translation system.
const translations = {
  en: {
    happyBirthday: "Happy Birthday",
    startDrawing: "Start Drawing",
    studioTitle: "{name}'s Studio",
    customColor: "Custom",
    eraser: "Eraser",
    clear: "Clear",
    cancel: "Cancel",
    clearTitle: "Clear Drawing?",
    clearMessage: "Are you sure you want to clear your drawing?",
    nothingToSave: "Nothing to save yet.",
    drawingDownloaded: "Drawing downloaded.",
    drawingShared: "Drawing shared.",
    shareCancelled: "Sharing cancelled.",
    shareUnavailable: "Sharing is not available in this browser.",
    exportFailed: "Could not export the drawing.",
    canvasCleared: "Canvas cleared.",
    nothingToClear: "Nothing to clear yet.",
    size: "Size {size}",
    back: "Back",
    download: "Download PNG",
    share: "Share PNG",
    undo: "Undo",
    redo: "Redo",
  },
  ar: {
    happyBirthday: "عيد ميلاد سعيد",
    startDrawing: "افتح لوحة الرسم",
    studioTitle: "استوديو {name}",
    customColor: "لون خاص",
    eraser: "الممحاة",
    clear: "مسح",
    cancel: "إلغاء",
    clearTitle: "مسح الرسم؟",
    clearMessage: "هل أنت متأكد من أنك تريد مسح الرسم؟",
    nothingToSave: "لا يوجد شيء لحفظه بعد.",
    drawingDownloaded: "تم تنزيل الرسم.",
    drawingShared: "تمت مشاركة الرسم.",
    shareCancelled: "تم إلغاء المشاركة.",
    shareUnavailable: "المشاركة غير متاحة في هذا المتصفح.",
    exportFailed: "تعذر تصدير الرسم.",
    canvasCleared: "تم مسح اللوحة.",
    nothingToClear: "لا يوجد شيء لمسحه بعد.",
    size: "الحجم {size}",
    back: "رجوع",
    download: "تنزيل PNG",
    share: "مشاركة PNG",
    undo: "تراجع",
    redo: "إعادة",
  },
};

const themes = {
  male: {
    primary: "#0077d9",
    accent: "#00bfef",
    deep: "#173b72",
    soft: "#d7ecff",
    surface: "#f8fbff",
  },
  female: {
    primary: "#d63384",
    accent: "#e85bb5",
    deep: "#8e3a6e",
    soft: "#ffd8e8",
    surface: "#fff8fb",
  },
};

const presetColors = [
  "#000000",
  "#ffffff",
  "#e53935",
  "#ff8f00",
  "#fdd835",
  "#43a047",
  "#1e88e5",
  "#7e57c2",
  "#d81b60",
];

const state = {
  language: localStorage.getItem("giftDrawLanguage") || "en",
  selectedColor: "#000000",
  brushSize: 8,
  isEraser: false,
  isDrawing: false,
  currentStroke: null,
  strokes: [],
  redoStack: [],
  hasDrawing: false,
  canvasCssWidth: 0,
  canvasCssHeight: 0,
};

const elements = {
  homeScreen: document.getElementById("homeScreen"),
  studioScreen: document.getElementById("studioScreen"),
  homeBackground: document.getElementById("homeBackground"),
  recipientName: document.getElementById("recipientName"),
  startButton: document.getElementById("startButton"),
  backButton: document.getElementById("backButton"),
  studioTitle: document.getElementById("studioTitle"),
  canvas: document.getElementById("drawingCanvas"),
  presetColors: document.getElementById("presetColors"),
  customColorInput: document.getElementById("customColorInput"),
  brushSizeInput: document.getElementById("brushSizeInput"),
  brushSizeLabel: document.getElementById("brushSizeLabel"),
  sizePreview: document.getElementById("sizePreview"),
  eraserButton: document.getElementById("eraserButton"),
  undoButton: document.getElementById("undoButton"),
  redoButton: document.getElementById("redoButton"),
  clearButton: document.getElementById("clearButton"),
  clearDialog: document.getElementById("clearDialog"),
  downloadButton: document.getElementById("downloadButton"),
  shareButton: document.getElementById("shareButton"),
  toast: document.getElementById("toast"),
};

const context = elements.canvas.getContext("2d");

function t(key, replacements = {}) {
  let text = translations[state.language][key] || translations.en[key] || key;
  for (const [name, value] of Object.entries(replacements)) {
    text = text.replace(`{${name}}`, value);
  }
  return text;
}

// Theme selection from AppConfig.gender.
function applyTheme() {
  const selectedTheme = themes[AppConfig.gender] || themes.male;
  const root = document.documentElement;

  root.style.setProperty("--primary", selectedTheme.primary);
  root.style.setProperty("--accent", selectedTheme.accent);
  root.style.setProperty("--deep", selectedTheme.deep);
  root.style.setProperty("--soft", selectedTheme.soft);
  root.style.setProperty("--surface", selectedTheme.surface);
  root.style.setProperty(
    "--home-bg",
    `url("${AppConfig.homeBackgroundImage}")`,
  );
}

function applyLanguage(language) {
  state.language = translations[language] ? language : "en";
  localStorage.setItem("giftDrawLanguage", state.language);

  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  });

  document.querySelectorAll(".language-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.language === state.language);
  });

  elements.studioTitle.textContent = t("studioTitle", {
    name: AppConfig.userName,
  });
  updateBrushSizeUI();
}

function showScreen(screenName) {
  const isStudio = screenName === "studio";
  elements.homeScreen.classList.toggle("active", !isStudio);
  elements.studioScreen.classList.toggle("active", isStudio);
  elements.studioScreen.setAttribute("aria-hidden", String(!isStudio));

  if (isStudio) {
    requestAnimationFrame(resizeCanvas);
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2200);
}

function buildColorControls() {
  elements.presetColors.innerHTML = "";

  presetColors.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-swatch";
    button.style.setProperty("--swatch", color);
    button.setAttribute("aria-label", color);
    button.addEventListener("click", () => {
      state.selectedColor = color;
      state.isEraser = false;
      elements.customColorInput.value = color;
      updateToolbar();
    });
    elements.presetColors.appendChild(button);
  });
}

function updateBrushSizeUI() {
  elements.brushSizeLabel.textContent = t("size", {
    size: Math.round(state.brushSize),
  });
  elements.sizePreview.style.setProperty(
    "--preview-size",
    `${Math.min(Math.max(state.brushSize, 4), 26)}px`,
  );
}

function updateToolbar() {
  document.querySelectorAll(".color-swatch").forEach((button) => {
    button.classList.toggle(
      "active",
      button.style.getPropertyValue("--swatch").trim() === state.selectedColor,
    );
  });

  elements.eraserButton.classList.toggle("active", state.isEraser);
  elements.undoButton.disabled = state.strokes.length === 0;
  elements.redoButton.disabled = state.redoStack.length === 0;
  updateBrushSizeUI();
}

function getCanvasPoint(event) {
  const rect = elements.canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function makeStroke(point) {
  return {
    color: state.selectedColor,
    width: state.brushSize,
    isEraser: state.isEraser,
    points: [point],
  };
}

function drawStroke(stroke) {
  if (stroke.points.length === 0) {
    return;
  }

  context.save();
  context.globalCompositeOperation = stroke.isEraser
    ? "destination-out"
    : "source-over";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineWidth = stroke.width;

  if (stroke.points.length === 1) {
    const point = stroke.points[0];
    context.beginPath();
    context.arc(point.x, point.y, stroke.width / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let index = 1; index < stroke.points.length; index += 1) {
    context.lineTo(stroke.points[index].x, stroke.points[index].y);
  }
  context.stroke();
  context.restore();
}

function redrawCanvas() {
  context.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
  context.save();
  context.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  state.strokes.forEach(drawStroke);
  if (state.currentStroke) {
    drawStroke(state.currentStroke);
  }
  context.restore();
}

// Drawing history: each completed gesture is one stroke and one undo action.
function beginDrawing(event) {
  event.preventDefault();
  elements.canvas.setPointerCapture(event.pointerId);
  state.isDrawing = true;
  state.currentStroke = makeStroke(getCanvasPoint(event));
  redrawCanvas();
}

function continueDrawing(event) {
  if (!state.isDrawing || !state.currentStroke) {
    return;
  }

  event.preventDefault();
  state.currentStroke.points.push(getCanvasPoint(event));
  redrawCanvas();
}

function finishDrawing(event) {
  if (!state.isDrawing || !state.currentStroke) {
    return;
  }

  event.preventDefault();
  state.strokes.push(state.currentStroke);
  state.currentStroke = null;
  state.redoStack = [];
  state.isDrawing = false;
  state.hasDrawing = state.strokes.length > 0;
  updateToolbar();
  redrawCanvas();
}

function cancelDrawing() {
  state.isDrawing = false;
  state.currentStroke = null;
  redrawCanvas();
}

function undo() {
  const stroke = state.strokes.pop();
  if (!stroke) {
    return;
  }
  state.redoStack.push(stroke);
  state.hasDrawing = state.strokes.length > 0;
  updateToolbar();
  redrawCanvas();
}

function redo() {
  const stroke = state.redoStack.pop();
  if (!stroke) {
    return;
  }
  state.strokes.push(stroke);
  state.hasDrawing = true;
  updateToolbar();
  redrawCanvas();
}

function clearDrawing() {
  if (!state.hasDrawing) {
    showToast(t("nothingToClear"));
    return;
  }

  elements.clearDialog.showModal();
}

function confirmClear(event) {
  event.preventDefault();
  const action = event.submitter?.value;
  elements.clearDialog.close();

  if (action !== "clear") {
    return;
  }

  state.strokes = [];
  state.redoStack = [];
  state.currentStroke = null;
  state.hasDrawing = false;
  updateToolbar();
  redrawCanvas();
  showToast(t("canvasCleared"));
}

function resizeCanvas() {
  const rect = elements.canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  state.canvasCssWidth = rect.width;
  state.canvasCssHeight = rect.height;
  const ratio = window.devicePixelRatio || 1;
  const nextWidth = Math.round(rect.width * ratio);
  const nextHeight = Math.round(rect.height * ratio);

  if (elements.canvas.width !== nextWidth || elements.canvas.height !== nextHeight) {
    elements.canvas.width = nextWidth;
    elements.canvas.height = nextHeight;
  }

  redrawCanvas();
}

// Export/share: transparent PNG from the canvas drawing only.
function canvasToBlob() {
  return new Promise((resolve) => {
    elements.canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

async function downloadDrawing() {
  if (!state.hasDrawing) {
    showToast(t("nothingToSave"));
    return;
  }

  const blob = await canvasToBlob();
  if (!blob) {
    showToast(t("exportFailed"));
    return;
  }

  const filename = `${AppConfig.userName}_GiftDraw.png`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(t("drawingDownloaded"));
}

async function shareDrawing() {
  if (!state.hasDrawing) {
    showToast(t("nothingToSave"));
    return;
  }

  const blob = await canvasToBlob();
  if (!blob) {
    showToast(t("exportFailed"));
    return;
  }

  const filename = `${AppConfig.userName}_GiftDraw.png`;
  const file = new File([blob], filename, { type: "image/png" });

  if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
    showToast(t("shareUnavailable"));
    return;
  }

  try {
    await navigator.share({
      files: [file],
      title: `${AppConfig.userName}'s GiftDraw`,
      text: "A drawing made in GiftDraw.",
    });
    showToast(t("drawingShared"));
  } catch (error) {
    showToast(t("shareCancelled"));
  }
}

function bindEvents() {
  document.querySelectorAll(".language-button").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.language));
  });

  elements.startButton.addEventListener("click", () => showScreen("studio"));
  elements.backButton.addEventListener("click", () => showScreen("home"));

  elements.customColorInput.addEventListener("input", (event) => {
    state.selectedColor = event.target.value;
    state.isEraser = false;
    updateToolbar();
  });

  elements.brushSizeInput.addEventListener("input", (event) => {
    state.brushSize = Number(event.target.value);
    updateBrushSizeUI();
  });

  elements.eraserButton.addEventListener("click", () => {
    state.isEraser = !state.isEraser;
    updateToolbar();
  });

  elements.undoButton.addEventListener("click", undo);
  elements.redoButton.addEventListener("click", redo);
  elements.clearButton.addEventListener("click", clearDrawing);
  elements.clearDialog.addEventListener("submit", confirmClear);
  elements.downloadButton.addEventListener("click", downloadDrawing);
  elements.shareButton.addEventListener("click", shareDrawing);

  elements.canvas.addEventListener("pointerdown", beginDrawing);
  elements.canvas.addEventListener("pointermove", continueDrawing);
  elements.canvas.addEventListener("pointerup", finishDrawing);
  elements.canvas.addEventListener("pointercancel", cancelDrawing);
  elements.canvas.addEventListener("pointerleave", finishDrawing);

  window.addEventListener("resize", () => {
    requestAnimationFrame(resizeCanvas);
  });
}

function initialize() {
  applyTheme();
  elements.recipientName.textContent = AppConfig.userName;
  buildColorControls();
  bindEvents();
  applyLanguage(state.language);
  updateToolbar();
  requestAnimationFrame(resizeCanvas);
}

initialize();
