/* ==========================================================================
   Sellzy Cart
   Simple localStorage-backed shopping cart shared across every page.
   - Add to Cart buttons (product grid cards + single product page) add items
   - Any ".cart-products-content" block on the page (header mini-cart AND the
     main Cart page) is rendered from the same cart data, so items added on
     view-product / single-product show up immediately in "View Cart".
   ========================================================================== */
(function () {
  "use strict";

  var CART_KEY = "sellzy_cart";

  /* ---------------------------- storage helpers ---------------------------- */

  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var cart = raw ? JSON.parse(raw) : [];
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderAllCartUIs();
  }

  function slugify(str) {
    return (str || "product")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "product";
  }

  function parsePrice(str) {
    var n = parseFloat((str || "").toString().replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  function formatMoney(n) {
    return "$" + (Math.round(n * 100) / 100).toFixed(2);
  }

  /* ------------------------------ cart CRUD -------------------------------- */

  function addToCart(product, qty) {
    qty = qty && qty > 0 ? qty : 1;
    var cart = getCart();
    var existing = cart.filter(function (i) { return i.id === product.id; })[0];
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: qty
      });
    }
    saveCart(cart);
  }

  function updateQty(id, qty) {
    var cart = getCart();
    var item = cart.filter(function (i) { return i.id === id; })[0];
    if (item) {
      item.qty = Math.max(1, qty);
      saveCart(cart);
    }
  }

  function removeFromCart(id) {
    saveCart(getCart().filter(function (i) { return i.id !== id; }));
  }

  function cartTotals() {
    var cart = getCart();
    var subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var count = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    return { subtotal: subtotal, count: count };
  }

  /* -------------------------------- render ---------------------------------- */

  function buildCartItemEl(item) {
    var wrap = document.createElement("div");
    wrap.className = "cart-product-item flex flex-col sm:flex-row items-center sm:gap-x-4 gap-y-2 sm:gap-y-0 p-4 border border-gray-300 rounded-2xl";
    wrap.setAttribute("data-cart-id", item.id);
    var productHref = "single-product.html?id=" + encodeURIComponent(item.id);
    wrap.innerHTML =
      '<a class="cart-product-item-image sm:w-[102px] sm:h-[102px] rounded-xl bg-[#F4F3F5] overflow-hidden relative" href="' + productHref + '">' +
        '<img alt="' + item.name + '" class="w-full h-full object-cover rounded-xl" src="' + item.image + '"/>' +
      "</a>" +
      '<div class="cart-product-item-content flex flex-col gap-y-2 flex-1 w-full">' +
        '<div class="flex items-center justify-between gap-x-2">' +
          '<h6 class="text-base font-semibold"><a href="' + productHref + '">' + item.name + "</a></h6>" +
          '<div class="cart-edit-remove flex items-center gap-x-3">' +
            '<a class="cart-edit-btn cursor-pointer" href="' + productHref + '" aria-label="View / edit product"><i class="hgi hgi-stroke hgi-edit-02 text-xl text-light-primary-text"></i></a>' +
            '<button type="button" class="cart-remove-btn cursor-pointer" aria-label="Remove product"><i class="hgi hgi-stroke hgi-delete-01 text-xl text-light-primary-text"></i></button>' +
          "</div>" +
        "</div>" +
        '<div class="flex items-center justify-between">' +
          '<div class="price-section flex items-center gap-x-3">' +
            '<span class="current-price text-base font-semibold text-light-primary-text">' + formatMoney(item.price) + "</span>" +
          "</div>" +
          '<div class="border border-gray-300 inline-flex items-center justify-center rounded-[80px] max-w-[108px] py-2.5 px-4">' +
            '<button type="button" class="cart-qty-decrease cursor-pointer inline-flex items-center justify-center hover:text-primary" aria-label="Decrease quantity"><i class="hgi hgi-stroke hgi-remove-circle text-2xl leading-6"></i></button>' +
            '<input class="cart-qty-input border-0 w-full grow text-center focus:outline-none font-semibold" readonly type="text" value="' + item.qty + '"/>' +
            '<button type="button" class="cart-qty-increase cursor-pointer inline-flex items-center justify-center hover:text-primary" aria-label="Increase quantity"><i class="hgi hgi-stroke hgi-add-circle text-2xl leading-6"></i></button>' +
          "</div>" +
        "</div>" +
      "</div>";
    return wrap;
  }

  function renderAllCartUIs() {
    var cart = getCart();
    var totals = cartTotals();

    var contents = document.querySelectorAll(".cart-products-content");
    for (var c = 0; c < contents.length; c++) {
      var content = contents[c];
      content.innerHTML = "";
      if (cart.length === 0) {
        var empty = document.createElement("p");
        empty.className = "text-center text-light-secondary-text py-6";
        empty.textContent = "Your cart is empty.";
        content.appendChild(empty);
      } else {
        for (var i = 0; i < cart.length; i++) {
          content.appendChild(buildCartItemEl(cart[i]));
        }
      }
    }

    var headerLines = document.querySelectorAll(".cart-products-header p");
    for (var h = 0; h < headerLines.length; h++) {
      headerLines[h].textContent = totals.count + (totals.count === 1 ? " Item in Cart" : " Items in Cart");
    }

    var subtotalRows = document.querySelectorAll(".cart-subtotal");
    for (var s = 0; s < subtotalRows.length; s++) {
      var valueEl = subtotalRows[s].querySelectorAll("h5")[1];
      if (valueEl) valueEl.textContent = formatMoney(totals.subtotal);
    }
  }

  /* --------------------------- product extraction --------------------------- */

  function extractGridCardProduct(card, clickedEl) {
    var nameEl = card.querySelector(".product-content h6 a") || card.querySelector(".product-content h6");
    var priceEl = card.querySelector(".product-content .current-price");
    var imgEl = card.querySelector(".product-image img") || card.querySelector("img");
    var name = nameEl ? nameEl.textContent.trim() : "Product";
    var price = parsePrice(priceEl ? priceEl.textContent : "0");
    var image = imgEl ? imgEl.getAttribute("src") : "";
    var realId = (clickedEl && clickedEl.getAttribute("data-product-id")) || card.getAttribute("data-product-id");
    return { id: realId || slugify(name), name: name, price: price, image: image };
  }

  function extractSingleProductInfo(root, clickedEl) {
    var nameEl = root.querySelector("h4");
    var priceEl = root.querySelector(".price-section .current-price");
    var imgEl = root.querySelector(".product-images-wrapper img");
    var name = nameEl ? nameEl.textContent.trim() : "Product";
    var price = parsePrice(priceEl ? priceEl.textContent : "0");
    var image = imgEl ? imgEl.getAttribute("src") : "";
    var realId = (clickedEl && clickedEl.getAttribute("data-product-id")) || root.getAttribute("data-product-id");
    return { id: realId || slugify(name), name: name, price: price, image: image };
  }

  function goToCart() {
    var onCartPage = /(^|\/)cart\.html$/.test(window.location.pathname);
    if (!onCartPage) {
      window.location.href = "cart.html";
    }
  }

  /* --------------------------------- events ---------------------------------- */

  document.addEventListener("click", function (e) {
    var target = e.target.closest ? e.target.closest("a, button") : null;
    if (!target) return;

    var text = target.textContent.trim().toLowerCase();

    // "Add to Cart" from a product grid card or the single product page
    if (text.indexOf("add to cart") !== -1) {
      var card = target.closest('[class*="product-card-"]');
      var singleWrapper = target.closest(".single-product-page-wrapper");

      if (card) {
        e.preventDefault();
        addToCart(extractGridCardProduct(card, target), 1);
        goToCart();
      } else if (singleWrapper) {
        e.preventDefault();
        var qtyInput = singleWrapper.querySelector(".quantity-input");
        var qty = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;
        addToCart(extractSingleProductInfo(singleWrapper, target), qty);
        goToCart();
      }
      return;
    }

    // Quantity / remove controls inside a rendered cart item
    var cartItem = target.closest(".cart-product-item");
    if (cartItem) {
      var id = cartItem.getAttribute("data-cart-id");
      var cart = getCart();
      var found = cart.filter(function (i) { return i.id === id; })[0];

      if (target.classList.contains("cart-qty-increase") && found) {
        e.preventDefault();
        updateQty(id, found.qty + 1);
      } else if (target.classList.contains("cart-qty-decrease") && found) {
        e.preventDefault();
        if (found.qty <= 1) removeFromCart(id);
        else updateQty(id, found.qty - 1);
      } else if (target.classList.contains("cart-remove-btn")) {
        e.preventDefault();
        removeFromCart(id);
      }
      return;
    }

    // Generic quantity stepper used on single-product / add-product pages
    var stepBtn = target.closest(".quantity-btn");
    if (stepBtn) {
      var qWrap = stepBtn.closest(".quantity-section");
      if (!qWrap) return;
      var input = qWrap.querySelector(".quantity-input");
      if (!input) return;
      var val = parseInt(input.value, 10) || 1;
      var isIncrease = stepBtn.querySelector(".hgi-plus-sign");
      val = isIncrease ? val + 1 : Math.max(1, val - 1);
      input.value = val;
    }
  });

  document.addEventListener("DOMContentLoaded", renderAllCartUIs);

  window.SellzyCart = {
    getCart: getCart,
    addToCart: addToCart,
    updateQty: updateQty,
    removeFromCart: removeFromCart,
    cartTotals: cartTotals,
    render: renderAllCartUIs
  };
})();
