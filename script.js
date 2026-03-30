// ═══════════════════════════════════════════════════
//  script.js  —  index.html
// ═══════════════════════════════════════════════════

window.addEventListener("load", function () {

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
  //  CART ICON BUTTON
  // ══════════════════════════════════════
  updateCartIcon();
  document.getElementById("cartIconBtn")?.addEventListener("click", openCartDrawer);

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

    // Re-render Firebase products so delete buttons update
    loadFirebaseProducts();
  });

  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    auth.signOut().then(() => window.location.reload());
  });

  // ══════════════════════════════════════
  //  STATIC CARD — Add to Cart buttons
  //  (the original 6 hardcoded products)
  // ══════════════════════════════════════
  attachCartButtons(document.querySelectorAll(".static-card .add-to-cart"));

  // ══════════════════════════════════════
  //  FIREBASE PRODUCTS — append after 6 cards
  // ══════════════════════════════════════
  // Remove any old firebase cards before re-rendering
  let firebaseProductsLoaded = false;

  function loadFirebaseProducts() {
    // Remove previously injected firebase cards
    document.querySelectorAll(".firebase-card").forEach(el => el.remove());
    document.getElementById("firebase-loading")?.remove();
    document.getElementById("firebase-empty")?.remove();

    const productList = document.getElementById("productList");
    if (!productList) return;

    // Show loading placeholder
    const loadingLi = document.createElement("li");
    loadingLi.id = "firebase-loading";
    loadingLi.className = "skeleton-card product-card";
    loadingLi.innerHTML = `<div class="skeleton-img"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div>`;
    productList.appendChild(loadingLi);

    db.ref("products").once("value", (snapshot) => {
      // Remove loading
      document.getElementById("firebase-loading")?.remove();

      if (!snapshot.exists()) return; // no firebase products — just show the 6 static ones

      const all = [];
      snapshot.forEach((userSnap) => {
        userSnap.forEach((prodSnap) => {
          all.push({ key: prodSnap.key, uid: userSnap.key, ...prodSnap.val() });
        });
      });

      if (all.length === 0) return;

      // Sort newest first
      all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      all.forEach((p) => {
        const isOwner = currentUser && currentUser.uid === p.uid;
        const deleteBtn = isOwner
          ? `<button class="delete-product-btn" data-uid="${p.uid}" data-key="${p.key}">
               <i class="fa fa-trash"></i> Remove
             </button>`
          : "";

        const li = document.createElement("li");
        li.className = "product-card firebase-card";
        li.innerHTML = `
          <div class="product-image">
            <img src="${esc(p.imageURL || "")}" alt="${esc(p.name)}"
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
          </div>
          <h3 class="product-name">${esc(p.name)}</h3>
          <p class="product-desc">PKR ${Number(p.price || 0).toLocaleString()}</p>
          <div class="card-actions">
            <button class="add-to-cart"
              data-name="${esc(p.name)}"
              data-price="${p.price || 0}"
              data-img="${esc(p.imageURL || "")}">
              <i class="fa fa-cart-plus"></i> Add to Cart
            </button>
            ${deleteBtn}
          </div>`;
        productList.appendChild(li);
      });

      // Attach cart buttons on new firebase cards
      attachCartButtons(document.querySelectorAll(".firebase-card .add-to-cart"));

      // Attach delete buttons
      document.querySelectorAll(".firebase-card .delete-product-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const name = btn.closest("li").querySelector(".product-name").innerText;
          if (confirm('Remove "' + name + '" from the store?')) {
            db.ref("products/" + btn.dataset.uid + "/" + btn.dataset.key)
              .remove()
              .then(() => loadFirebaseProducts())  // refresh after delete
              .catch(() => alert("Failed to delete."));
          }
        });
      });

    }, (err) => {
      document.getElementById("firebase-loading")?.remove();
      console.warn("Firebase DB read error:", err.message);
    });
  }

  // ══════════════════════════════════════
  //  ATTACH CART BUTTONS (reusable)
  // ══════════════════════════════════════
  function attachCartButtons(buttons) {
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        addToCart(btn.dataset.name, parseFloat(btn.dataset.price) || 0, btn.dataset.img || "");
      });
    });
  }

  // ══════════════════════════════════════
  //  ADD TO CART
  // ══════════════════════════════════════
  function addToCart(name, price, img) {
    const existing = cart.find((i) => i.name === name);
    if (existing) { existing.qty += 1; }
    else { cart.push({ name, price, img, qty: 1 }); }
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
    document.getElementById("popupViewCartBtn").onclick = () => { closeCartPopup(); openCartDrawer(); };

    renderPopupItems();
    setTimeout(closeCartPopup, 7000);
  }

  function renderPopupItems() {
    const container = document.getElementById("popupCartItems");
    const totalEl   = document.getElementById("popupTotal");
    if (!container) return;

    container.innerHTML = cart.map((item) => `
      <div class="popup-item-row">
        <span class="popup-item-name">${esc(item.name)}</span>
        <div class="popup-qty-controls">
          <button class="qty-btn" onclick="window._pQty('${esc(item.name)}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="window._pQty('${esc(item.name)}',1)">+</button>
        </div>
        <span class="popup-item-total">${item.price > 0 ? "PKR " + Number(item.price * item.qty).toLocaleString() : "—"}</span>
        <button class="popup-remove-btn" onclick="window._pRemove('${esc(item.name)}')">
          <i class="fa fa-times"></i>
        </button>
      </div>`).join("");

    const grand = cart.reduce((s, i) => s + i.price * i.qty, 0);
    totalEl.innerHTML = grand > 0
      ? `<strong>Total: PKR ${Number(grand).toLocaleString()}</strong>`
      : `<strong>${cart.reduce((s,i)=>s+i.qty,0)} item(s) in cart</strong>`;
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

  function closeCartPopup() { document.getElementById("cartPopup")?.remove(); }

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
        <div class="drawer-body"  id="drawerBody"></div>
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

    body.innerHTML = cart.map((item) => `
      <div class="drawer-item">
        <img src="${esc(item.img || "")}" alt="${esc(item.name)}"
             onerror="this.src='https://via.placeholder.com/60x60?text=?'" />
        <div class="drawer-item-info">
          <div class="drawer-item-name">${esc(item.name)}</div>
          <div class="drawer-item-price">${item.price > 0 ? "PKR " + Number(item.price).toLocaleString() + " / item" : "Price TBD"}</div>
          <div class="drawer-qty-row">
            <button class="qty-btn" onclick="window._dQty('${esc(item.name)}',-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="window._dQty('${esc(item.name)}',1)">+</button>
            <button class="drawer-remove-btn" onclick="window._dRemove('${esc(item.name)}')">
              <i class="fa fa-trash"></i> Remove
            </button>
          </div>
        </div>
        <div class="drawer-item-subtotal">${item.price > 0 ? "PKR " + Number(item.price * item.qty).toLocaleString() : "×" + item.qty}</div>
      </div>`).join("");

    const grand    = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    footer.innerHTML = `
      <div class="drawer-summary">
        <div class="drawer-summary-row"><span>Total Items</span><span>${totalQty}</span></div>
        ${grand > 0 ? `<div class="drawer-summary-row total-row"><span>Grand Total</span><span>PKR ${Number(grand).toLocaleString()}</span></div>` : ""}
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
    saveCart(); renderDrawer();
  };
  window._dRemove = (name) => {
    cart = cart.filter(i => i.name !== name);
    saveCart(); renderDrawer();
  };
  window._clearCart = () => {
    if (confirm("Clear all items from cart?")) { cart = []; saveCart(); renderDrawer(); }
  };
  function closeCartDrawer() { document.getElementById("cartDrawer")?.remove(); }

  // ══════════════════════════════════════
  //  HELPER
  // ══════════════════════════════════════
  function esc(str) {
    return String(str || "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

}); // end window.onload