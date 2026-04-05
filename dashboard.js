// ═══════════════════════════════════════════════════
//  dashboard.js  —  Base64 image (no API key needed)
// ═══════════════════════════════════════════════════

window.addEventListener("load", function () {

  if (!firebase.apps.length) {
    showAlert("Firebase not initialized. Check firebase.js.", "error");
    return;
  }

  const auth = firebase.auth();
  const db   = firebase.database();

  // ── DOM refs ──
  const userEmailSpan  = document.getElementById("userEmail");
  const welcomeName    = document.getElementById("welcomeName");
  const welcomeEmail   = document.getElementById("welcomeEmail");
  const logoutBtn      = document.getElementById("logoutBtn");
  const addProductBtn  = document.getElementById("addProductBtn");
  const productNameEl  = document.getElementById("productName");
  const productPriceEl = document.getElementById("productPrice");
  const productImageEl = document.getElementById("productImage");
  const imagePreview   = document.getElementById("imagePreview");
  const changeImgBtn   = document.getElementById("changeImgBtn");
  const uploadArea     = document.getElementById("uploadArea");
  const uploadText     = document.getElementById("uploadText");
  const uploadHint     = document.getElementById("uploadHint");
  const productGrid    = document.getElementById("productGrid");
  const productAlert   = document.getElementById("productAlert");
  const productCount   = document.getElementById("productCount");
  const progressWrap   = document.getElementById("progressWrap");
  const progressFill   = document.getElementById("progressFill");
  const progressText   = document.getElementById("progressText");

  let currentUID   = null;
  let base64Image  = null;   // stores the base64 string of selected image

  // ══════════════════════════════════════
  //  AUTH GUARD
  // ══════════════════════════════════════
  auth.onAuthStateChanged((user) => {
    if (!user) { window.location.href = "login.html"; return; }
    currentUID = user.uid;
    userEmailSpan.innerText = user.email;
    if (welcomeEmail) welcomeEmail.innerText = user.email;
    const name = user.email.split("@")[0];
    if (welcomeName) welcomeName.innerText = name.charAt(0).toUpperCase() + name.slice(1);
    loadProducts(currentUID);
  });

  // ══════════════════════════════════════
  //  LOGOUT
  // ══════════════════════════════════════
  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => { window.location.href = "login.html"; });
  });

  // ══════════════════════════════════════
  //  IMAGE SELECTION — convert to Base64
  // ══════════════════════════════════════
  productImageEl.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert("Please select a valid image (JPG, PNG, WEBP).", "error");
      return;
    }

    // Limit to 1MB for Base64 (keeps database size reasonable)
    if (file.size > 1 * 1024 * 1024) {
      showAlert("Image too large for direct upload — please use an image under 1MB.", "error");
      productImageEl.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      base64Image = ev.target.result;   // full base64 data URL
      imagePreview.src            = base64Image;
      imagePreview.style.display  = "block";
      changeImgBtn.style.display  = "inline-block";
      uploadArea.style.borderColor = "#0f87c4";
      uploadArea.style.background  = "#f0f9ff";
      uploadText.innerText = "✅ " + file.name;
      uploadHint.innerText = (file.size / 1024).toFixed(0) + " KB — ready to upload";
    };
    reader.readAsDataURL(file);
  });

  // ══════════════════════════════════════
  //  ADD PRODUCT
  // ══════════════════════════════════════
  addProductBtn.addEventListener("click", async () => {
    const name  = productNameEl.value.trim();
    const price = productPriceEl.value.trim();

    if (!name)  { showAlert("Please enter a product name.", "error"); return; }
    if (!price || isNaN(price) || Number(price) < 0) {
      showAlert("Please enter a valid price.", "error"); return;
    }
    if (!base64Image) { showAlert("Please select a product image.", "error"); return; }
    if (!currentUID)  { showAlert("You must be logged in.", "error"); return; }

    // Lock UI
    addProductBtn.disabled     = true;
    addProductBtn.innerHTML    = '<i class="fa fa-spinner fa-spin"></i> Saving...';
    progressWrap.style.display = "block";
    progressFill.style.width   = "60%";
    progressText.innerText     = "Saving product...";

    try {
      // Save directly to Firebase Realtime Database as Base64
      await db.ref("products/" + currentUID).push({
        name:      name,
        price:     parseFloat(price),
        imageURL:  base64Image,   // base64 stored directly
        createdAt: Date.now()
      });

      progressFill.style.width = "100%";
      progressText.innerText   = "Done!";
      showAlert("✅ Product added successfully!", "success");
      resetForm();

    } catch (err) {
      console.error("Error:", err);
      showAlert("❌ Failed to save product: " + (err.message || "Please try again."), "error");
    } finally {
      addProductBtn.disabled     = false;
      addProductBtn.innerHTML    = '<i class="fa fa-plus"></i> Add Product';
      setTimeout(() => {
        progressWrap.style.display = "none";
        progressFill.style.width   = "0%";
      }, 1000);
    }
  });

  // ══════════════════════════════════════
  //  LOAD USER'S PRODUCTS
  // ══════════════════════════════════════
  function loadProducts(uid) {
    db.ref("products/" + uid).on("value", (snapshot) => {
      productGrid.innerHTML = "";

      if (!snapshot.exists()) {
        productCount.innerText = "0";
        productGrid.innerHTML  = `
          <div class="empty-note">
            <i class="fa fa-box-open" style="font-size:32px;color:#d1d5db;display:block;margin-bottom:10px;"></i>
            No products yet. Add your first one above!
          </div>`;
        return;
      }

      const entries = Object.entries(snapshot.val());
      productCount.innerText = entries.length;

      entries.reverse().forEach(([key, p]) => {
        const card = document.createElement("div");
        card.className = "db-product-card";
        card.innerHTML = `
          <img alt="${esc(p.name)}"
               onerror="this.src='https://via.placeholder.com/200x150?text=No+Image'" />
          <div class="db-product-info">
            <div class="db-product-name" title="${esc(p.name)}">${esc(p.name)}</div>
            <div class="db-product-price">PKR ${Number(p.price).toLocaleString()}</div>
            <button class="db-delete-btn" data-key="${key}">🗑 Delete</button>
          </div>`;
        // Set src directly — avoids Base64 being broken by innerHTML escaping
        card.querySelector("img").src = p.imageURL || "";
        productGrid.appendChild(card);
      });

      document.querySelectorAll(".db-delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (confirm("Delete this product?")) {
            db.ref("products/" + currentUID + "/" + btn.dataset.key).remove()
              .then(() => showAlert("Deleted.", "success"))
              .catch(() => showAlert("Delete failed.", "error"));
          }
        });
      });
    });
  }

  // ══════════════════════════════════════
  //  RESET FORM
  // ══════════════════════════════════════
  function resetForm() {
    productNameEl.value          = "";
    productPriceEl.value         = "";
    productImageEl.value         = "";
    base64Image                  = null;
    imagePreview.style.display   = "none";
    imagePreview.src             = "";
    changeImgBtn.style.display   = "none";
    uploadArea.style.borderColor = "";
    uploadArea.style.background  = "";
    uploadText.innerText = "Click here to select an image from your device";
    uploadHint.innerText = "Supports JPG, PNG, WEBP — max 1MB";
  }

  function showAlert(msg, type) {
    productAlert.innerHTML     = msg;
    productAlert.className     = "product-alert " + type;
    productAlert.style.display = "block";
    setTimeout(() => { productAlert.style.display = "none"; }, 5000);
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

}); // end window.onload