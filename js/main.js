const studio = document.getElementById("studio");
const orderModal = document.getElementById("order-modal");
const priceStep = document.getElementById("price-step");
const resultImg = document.getElementById("result-image");
const resultTitle = document.getElementById("result-title");
const resultDesc = document.getElementById("result-desc");
const styleSelect = document.getElementById("order-style");
const formatInput = document.getElementById("order-format");
const priceInput = document.getElementById("order-price");
const formatName = document.getElementById("order-format-name");
const formatPrice = document.getElementById("order-format-price");
const orderForm = document.getElementById("order-form");
const orderSuccess = document.getElementById("order-success");
const orderNote = document.getElementById("order-note");
const styleChip = document.getElementById("order-style-chip");
const styleChipImg = document.getElementById("order-style-img");
const styleChipName = document.getElementById("order-style-name");
const orderPhotos = document.getElementById("photos-order");
const orderPreviews = document.querySelector("#order-modal [data-previews]");
const orderPhotoMsg = document.querySelector("#order-modal [data-photo-msg]");
const submitBtn = document.getElementById("order-submit");
const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

const styleCards = [...document.querySelectorAll(".style-card")];
const styles = styleCards.map((card) => JSON.parse(card.dataset.style));
let currentIndex = 0;
const orderFiles = [];
const PRICES = {
  "Художественная печать": "от 4 900 ₽",
  "Деревянный блок": "от 3 900 ₽",
  "Цифровой портрет": "1 490 ₽",
};

function fillStyleSelect() {
  if (!styleSelect) return;
  styleSelect.innerHTML = '<option value="Подберите за меня">Подберите за меня</option>';
  styles.forEach((style) => {
    const option = document.createElement("option");
    option.value = style.name;
    option.textContent = style.name;
    styleSelect.appendChild(option);
  });
}

function setModalOpen(el, open) {
  el.classList.toggle("open", open);
  el.setAttribute("aria-hidden", String(!open));
  const anyOpen = studio.classList.contains("open") || orderModal.classList.contains("open");
  document.body.classList.toggle("modal-open", anyOpen);
}

function showPortrait(index) {
  currentIndex = (index + styles.length) % styles.length;
  const style = styles[currentIndex];
  resultTitle.textContent = style.name;
  resultDesc.textContent = style.blurb;
  resultImg.alt = "Стиль " + style.name;
  resultImg.src = style.cover;
  setModalOpen(studio, true);
}

function renderOrderPhotos() {
  if (!orderPreviews) return;
  orderPreviews.innerHTML = "";
  orderFiles.forEach((file) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = "Загруженное фото";
    orderPreviews.appendChild(img);
  });
}

function addOrderFiles(list) {
  const room = 3 - orderFiles.length;
  if (room <= 0) {
    if (orderPhotoMsg) orderPhotoMsg.textContent = "Можно приложить не больше трёх фото.";
    return;
  }
  Array.from(list).slice(0, room).forEach((file) => {
    if (file.type.startsWith("image/")) orderFiles.push(file);
  });
  if (orderPhotoMsg) {
    orderPhotoMsg.textContent = orderFiles.length ? `Фото: ${orderFiles.length} из 3` : "";
  }
  renderOrderPhotos();
}

function setOrderStyle(name) {
  const pick = name || "Подберите за меня";
  styleSelect.value = pick;
  const style = styles.find((item) => item.name === pick);
  if (style) {
    styleChip.hidden = false;
    styleChipImg.src = style.cover;
    styleChipImg.alt = style.name;
    styleChipName.textContent = style.name;
  } else {
    styleChip.hidden = true;
  }
}

function setFormat(format, price) {
  formatInput.value = format;
  priceInput.value = price || PRICES[format] || "";
  formatName.textContent = format;
  formatPrice.textContent = priceInput.value;
}

function showPriceStep() {
  priceStep.hidden = false;
  orderForm.hidden = true;
  orderSuccess.hidden = true;
}

function showFormStep() {
  priceStep.hidden = true;
  orderForm.hidden = false;
  orderSuccess.hidden = true;
}

function openOrder({ styleName, format, skipPrices } = {}) {
  orderNote.textContent = "";
  setOrderStyle(styleName || "Подберите за меня");
  setModalOpen(orderModal, true);
  if (format && skipPrices) {
    setFormat(format, PRICES[format]);
    showFormStep();
    return;
  }
  showPriceStep();
  if (format) setFormat(format, PRICES[format]);
}

function closeStudio() {
  setModalOpen(studio, false);
}

function closeOrder() {
  setModalOpen(orderModal, false);
}

function compressPhoto(file, maxSide = 1000, quality = 0.55) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось прочитать фото"));
    };
    image.src = url;
  });
}

async function sendToEmail() {
  const key = window.ORDER_MAIL?.web3formsKey?.trim();
  if (!key) {
    throw new Error("Чтобы письма приходили на почту, вставьте ключ Web3Forms в файл js/config.js");
  }

  const photos = [];
  for (const file of orderFiles) {
    photos.push(await compressPhoto(file));
  }

  const formData = new FormData(orderForm);
  formData.append("access_key", key);
  formData.append("subject", "Заявка Любимец");
  formData.append("from_name", orderForm.name.value.trim() || "Любимец");
  formData.set("comment", orderForm.comment.value.trim() || "—");
  formData.append(
    "message",
    [
      "Новая заявка с сайта Любимец",
      "Имя: " + orderForm.name.value.trim(),
      "Связь: " + orderForm.contact.value.trim(),
      "Стиль: " + orderForm.style.value,
      "Формат: " + formatInput.value + " (" + priceInput.value + ")",
      "Комментарий: " + (orderForm.comment.value.trim() || "—"),
      "Фото: " + photos.length + " шт. (сжатые превью ниже, без Pro-вложений Web3Forms)",
    ].join("\n")
  );
  photos.forEach((dataUrl, index) => {
    formData.append("photo_" + (index + 1), dataUrl);
  });

  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Не удалось отправить заявку");
  }
}

fillStyleSelect();

styleCards.forEach((card, index) => {
  card.addEventListener("click", () => showPortrait(index));
});

document.getElementById("surprise")?.addEventListener("click", () => {
  showPortrait(Math.floor(Math.random() * styles.length));
});

document.getElementById("next-style")?.addEventListener("click", () => {
  showPortrait(currentIndex + 1);
});

document.getElementById("studio-order")?.addEventListener("click", () => {
  openOrder({ styleName: styles[currentIndex].name });
});

document.getElementById("close-studio")?.addEventListener("click", closeStudio);
document.getElementById("close-order")?.addEventListener("click", closeOrder);
document.getElementById("order-done")?.addEventListener("click", closeOrder);
document.getElementById("change-format")?.addEventListener("click", showPriceStep);

studio?.addEventListener("click", (event) => {
  if (event.target === studio) closeStudio();
});

orderModal?.addEventListener("click", (event) => {
  if (event.target === orderModal) closeOrder();
});

document.querySelectorAll(".price-pick").forEach((button) => {
  button.addEventListener("click", () => {
    setFormat(button.dataset.format, button.dataset.price);
    showFormStep();
  });
});

document.getElementById("open-order")?.addEventListener("click", () => openOrder());
document.getElementById("open-order-hero")?.addEventListener("click", () => openOrder());
document.getElementById("open-order-cta")?.addEventListener("click", () => openOrder());

document.querySelectorAll(".product-pick").forEach((button) => {
  button.addEventListener("click", () => {
    const format = button.closest(".product")?.dataset.format;
    openOrder({ format, skipPrices: true });
  });
});

document.querySelectorAll('a[href="#order"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openOrder();
  });
});

document.getElementById("order-add-photo")?.addEventListener("click", () => orderPhotos.click());
orderPhotos?.addEventListener("change", () => addOrderFiles(orderPhotos.files));

styleSelect?.addEventListener("change", () => setOrderStyle(styleSelect.value));

orderForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (orderForm.website?.value) return;
  if (!orderForm.reportValidity()) return;
  if (!orderFiles.length) {
    orderNote.textContent = "Добавьте хотя бы одно фото.";
    return;
  }

  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Отправляем…";
  submitBtn.disabled = true;
  orderNote.textContent = "";

  try {
    await sendToEmail();
    orderForm.reset();
    orderFiles.length = 0;
    renderOrderPhotos();
    orderForm.hidden = true;
    priceStep.hidden = true;
    orderSuccess.hidden = false;
  } catch (error) {
    orderNote.textContent = error.message || "Не получилось отправить. Попробуйте ещё раз.";
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (orderModal.classList.contains("open")) closeOrder();
  else if (studio.classList.contains("open")) closeStudio();
});

menuToggle?.addEventListener("click", () => {
  const open = mobileNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => mobileNav.classList.remove("open"));
});
