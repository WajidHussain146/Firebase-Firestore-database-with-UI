// ═══════════════════════════════════════════════════
//  script.js  —  Final fixed version
// ═══════════════════════════════════════════════════

window.addEventListener("load", function () {

  // ── Safety check ──
  if (typeof firebase === "undefined") {
    console.error("Firebase not loaded.");
    return;
  }

  const auth = firebase.auth();
  const db   = firebase.database();

  let cart        = JSON.parse(localStorage.getItem("asaCart") || "[]");
  let currentUser = null;

  // ══════════════════════════════════════
  //  HAMBURGER
  // ══════════════════════════════════════
  const hamburger = document.querySelector(".hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      document.querySelector(".nav-links").classList.toggle("active");
    });
  }

  // ══════════════════════════════════════
  //  CART ICON
  // ══════════════════════════════════════
  updateCartIcon();
  document.getElementById("cartIconBtn")?.addEventListener("click", openCartDrawer);

  // ══════════════════════════════════════
  //  ADD TO CART — EVENT DELEGATION
  //  Listens on the whole document so it
  //  works for BOTH static AND firebase
  //  cards, regardless of load timing.
  // ══════════════════════════════════════
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;

    // Static cards use data attributes
    const dataName  = btn.getAttribute("data-name");
    const dataPrice = btn.getAttribute("data-price");
    const dataImg   = btn.getAttribute("data-img");

    if (dataName) {
      // Static card
      addToCart(dataName, parseFloat(dataPrice) || 0, dataImg || "");
    }
    // Firebase card buttons are handled via closure in loadFirebaseProducts()
    // so they call addToCart directly — this delegation handles static ones only
  });

  // ══════════════════════════════════════
  //  AUTH STATE
  // ══════════════════════════════════════
  auth.onAuthStateChanged((user) => {
    currentUser = user;

    const loginLink     = document.getElementById("loginLink");
    const signupLink    = document.getElementById("signupLink");
    const logoutBtn     = document.getElementById("logoutBtn");
    const dashboardLink = document.getElementById("dashboardLink");

    if (user) {
      if (loginLink)     loginLink.style.display     = "none";
      if (signupLink)    signupLink.style.display    = "none";
      if (logoutBtn)     logoutBtn.style.display     = "inline-block";
      if (dashboardLink) dashboardLink.style.display = "inline-block";
    } else {
      if (loginLink)     loginLink.style.display     = "inline-block";
      if (signupLink)    signupLink.style.display    = "inline-block";
      if (logoutBtn)     logoutBtn.style.display     = "none";
      if (dashboardLink) dashboardLink.style.display = "none";
    }
  });

  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    auth.signOut().then(() => window.location.reload());
  });

  // ══════════════════════════════════════
  //  FIREBASE PRODUCTS
  //  Uses .on() for real-time updates.
  //  Firebase cards appended after static 6.
  // ══════════════════════════════════════
  const productList = document.getElementById("productList");

  function loadFirebaseProducts() {
    db.ref("products").on("value", (snapshot) => {

      // Remove old firebase cards first
      document.querySelectorAll(".firebase-card").forEach(el => el.remove());

      if (!snapshot.exists()) return;

      const all = [];
      snapshot.forEach((userSnap) => {
        userSnap.forEach((prodSnap) => {
          all.push({
            key: prodSnap.key,
            uid: userSnap.key,
            ...prodSnap.val()
          });
        });
      });

      if (all.length === 0) return;

      // Newest first
      all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      all.forEach((p) => {
        const isOwner = currentUser && currentUser.uid === p.uid;

        const li = document.createElement("li");
        li.className = "product-card firebase-card";

        // Build card HTML — image src set separately (Base64 safe)
        li.innerHTML = `
          <div class="product-image">
            <img alt="${esc(p.name)}"
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
          </div>
          <h3 class="product-name">${esc(p.name)}</h3>
          <p class="product-desc">PKR ${Number(p.price || 0).toLocaleString()}</p>
          <div class="card-actions">
            <button class="firebase-cart-btn" type="button">
              <i class="fa fa-cart-plus"></i> Add to Cart
            </button>
            ${isOwner
              ? `<button class="firebase-delete-btn delete-product-btn" type="button">
                   <i class="fa fa-trash"></i> Remove
                 </button>`
              : ""
            }
          </div>`;

        // Set image src directly — never put Base64 inside innerHTML
        li.querySelector("img").src = p.imageURL || "";

        // Cart button — direct closure, no data attributes needed
        li.querySelector(".firebase-cart-btn").addEventListener("click", () => {
          addToCart(p.name, parseFloat(p.price) || 0, p.imageURL || "");
        });

        // Delete button
        const delBtn = li.querySelector(".firebase-delete-btn");
        if (delBtn) {
          delBtn.addEventListener("click", () => {
            if (confirm('Remove "' + p.name + '" from the store?')) {
              db.ref("products/" + p.uid + "/" + p.key)
                .remove()
                .catch(() => alert("Failed to delete. Try again."));
            }
          });
        }

        productList.appendChild(li);
      });

    }, (err) => {
      console.error("Firebase read error:", err.code, err.message);
    });
  }

  // Start loading Firebase products
  loadFirebaseProducts();

  // ══════════════════════════════════════
  //  ADD TO CART
  // ══════════════════════════════════════
  function addToCart(name, price, img) {
    if (!name) return;
    const existing = cart.find((i) => i.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, price, img, qty: 1 });
    }
    saveCart();
    showCartPopup(name, price);
  }

  function saveCart() {
    localStorage.setItem("asaCart", JSON.stringify(cart));
    updateCartIcon();
  }

  function updateCartIcon() {
    const badge = document.getElementById("cartBadge");
    if (!badge) return;
    const total = cart.reduce((s, i) => s + i.qty, 0);
    badge.innerText = total > 0 ? total : "";
  }

  // ══════════════════════════════════════
  //  CART POPUP
  // ══════════════════════════════════════
  function showCartPopup(name, price) {
    document.getElementById("cartPopup")?.remove();

    const popup = document.createElement("div");
    popup.id = "cartPopup";
    popup.innerHTML = `
      <div class="cart-popup-inner">
        <div class="cart-popup-header">
          <span><i class="fa fa-check-circle" style="color:#22c55e;margin-right:6px;"></i>Added to Cart!</span>
          <button class="popup-close-btn" id="popupCloseBtn">&times;</button>
        </div>
        <p class="cart-popup-item"><strong>${esc(name)}</strong></p>
        ${price > 0 ? `<p class="cart-popup-price">PKR ${Number(price).toLocaleString()} / item</p>` : ""}
        <hr style="border:none;border-top:1px solid #f3f4f6;margin:10px 0;">
        <div id="popupCartItems"></div>
        <div class="cart-popup-total" id="popupTotal"></div>
        <div class="cart-popup-btns">
          <button class="popup-btn-continue" id="popupContinueBtn">Continue Shopping</button>
          <button class="popup-btn-cart" id="popupViewCartBtn">
            <i class="fa fa-shopping-cart"></i> View Cart
          </button>
        </div>
      </div>`;
    document.body.appendChild(popup);

    document.getElementById("popupCloseBtn").onclick    = closeCartPopup;
    document.getElementById("popupContinueBtn").onclick = closeCartPopup;
    document.getElementById("popupViewCartBtn").onclick = () => {
      closeCartPopup();
      openCartDrawer();
    };

    renderPopupItems();
    setTimeout(closeCartPopup, 7000);
  }

  function renderPopupItems() {
    const container = document.getElementById("popupCartItems");
    const totalEl   = document.getElementById("popupTotal");
    if (!container || !totalEl) return;

    container.innerHTML = cart.map((item) => `
      <div class="popup-item-row">
        <span class="popup-item-name">${esc(item.name)}</span>
        <div class="popup-qty-controls">
          <button class="qty-btn" onclick="window._pQty('${esc(item.name)}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="window._pQty('${esc(item.name)}',1)">+</button>
        </div>
        <span class="popup-item-total">
          ${item.price > 0 ? "PKR " + Number(item.price * item.qty).toLocaleString() : "—"}
        </span>
        <button class="popup-remove-btn" onclick="window._pRemove('${esc(item.name)}')">
          <i class="fa fa-times"></i>
        </button>
      </div>`).join("");

    const grand = cart.reduce((s, i) => s + i.price * i.qty, 0);
    totalEl.innerHTML = grand > 0
      ? `<strong>Total: PKR ${Number(grand).toLocaleString()}</strong>`
      : `<strong>${cart.reduce((s, i) => s + i.qty, 0)} item(s) in cart</strong>`;
  }

  window._pQty = (name, delta) => {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.name !== name);
    saveCart();
    if (cart.length === 0) { closeCartPopup(); return; }
    renderPopupItems();
  };

  window._pRemove = (name) => {
    cart = cart.filter(i => i.name !== name);
    saveCart();
    if (cart.length === 0) { closeCartPopup(); return; }
    renderPopupItems();
  };

  function closeCartPopup() {
    document.getElementById("cartPopup")?.remove();
  }

  // ══════════════════════════════════════
  //  CART DRAWER
  // ══════════════════════════════════════
  function openCartDrawer() {
    document.getElementById("cartDrawer")?.remove();

    const drawer = document.createElement("div");
    drawer.id = "cartDrawer";
    drawer.innerHTML = `
      <div class="drawer-overlay" id="drawerOverlay"></div>
      <div class="drawer-panel">
        <div class="drawer-header">
          <h3><i class="fa fa-shopping-cart"></i> Your Cart</h3>
          <button class="drawer-close" id="drawerCloseBtn">&times;</button>
        </div>
        <div class="drawer-body" id="drawerBody"></div>
        <div class="drawer-footer" id="drawerFooter"></div>
      </div>`;
    document.body.appendChild(drawer);

    document.getElementById("drawerCloseBtn").onclick = closeCartDrawer;
    document.getElementById("drawerOverlay").onclick  = closeCartDrawer;
    renderDrawer();
  }

  function renderDrawer() {
    const body   = document.getElementById("drawerBody");
    const footer = document.getElementById("drawerFooter");
    if (!body) return;

    if (cart.length === 0) {
      body.innerHTML   = `<div class="drawer-empty"><i class="fa fa-shopping-cart"></i><p>Your cart is empty.</p></div>`;
      footer.innerHTML = "";
      return;
    }

    body.innerHTML = "";

    cart.forEach((item) => {
      const div = document.createElement("div");
      div.className = "drawer-item";

      // Image — set src directly for Base64 safety
      const img = document.createElement("img");
      img.alt     = item.name;
      img.onerror = () => { img.src = "https://via.placeholder.com/60x60?text=?"; };
      img.src     = item.img || "";

      const info = document.createElement("div");
      info.className = "drawer-item-info";
      info.innerHTML = `
        <div class="drawer-item-name">${esc(item.name)}</div>
        <div class="drawer-item-price">
          ${item.price > 0 ? "PKR " + Number(item.price).toLocaleString() + " / item" : "Price TBD"}
        </div>
        <div class="drawer-qty-row">
          <button class="qty-btn" onclick="window._dQty('${esc(item.name)}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="window._dQty('${esc(item.name)}',1)">+</button>
          <button class="drawer-remove-btn" onclick="window._dRemove('${esc(item.name)}')">
            <i class="fa fa-trash"></i> Remove
          </button>
        </div>`;

      const subtotal = document.createElement("div");
      subtotal.className   = "drawer-item-subtotal";
      subtotal.textContent = item.price > 0
        ? "PKR " + Number(item.price * item.qty).toLocaleString()
        : "×" + item.qty;

      div.appendChild(img);
      div.appendChild(info);
      div.appendChild(subtotal);
      body.appendChild(div);
    });

    const grand    = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);

    footer.innerHTML = `
      <div class="drawer-summary">
        <div class="drawer-summary-row">
          <span>Total Items</span><span>${totalQty}</span>
        </div>
        ${grand > 0
          ? `<div class="drawer-summary-row total-row">
               <span>Grand Total</span>
               <span>PKR ${Number(grand).toLocaleString()}</span>
             </div>`
          : ""}
      </div>
      <button class="drawer-checkout-btn" onclick="alert('Checkout coming soon! 🚀')">
        <i class="fa fa-lock"></i> Proceed to Checkout
      </button>
      <button class="drawer-clear-btn" onclick="window._clearCart()">Clear Cart</button>`;
  }

  window._dQty = (name, delta) => {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.name !== name);
    saveCart();
    renderDrawer();
  };
  window._dRemove = (name) => {
    cart = cart.filter(i => i.name !== name);
    saveCart();
    renderDrawer();
  };
  window._clearCart = () => {
    if (confirm("Clear all items from cart?")) {
      cart = [];
      saveCart();
      renderDrawer();
    }
  };

  function closeCartDrawer() {
    document.getElementById("cartDrawer")?.remove();
  }

  // ══════════════════════════════════════
  //  HELPER — text only, never images
  // ══════════════════════════════════════
  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

}); // end window.onload