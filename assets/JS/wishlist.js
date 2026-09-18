/* ==========================================================================
   Sellzy Wishlist
   Simple localStorage-backed wishlist shared across every page.
   - Heart / "Add to Wishlist" buttons on product grid cards and the single
     product page add items and jump to wishlist.html
   - wishlist.html renders straight from this same storage, with working
     "Add to Cart" (hands off to SellzyCart) and "Remove" actions.
   ========================================================================== */
(function () {
  "use strict";

  var WISHLIST_KEY = "sellzy_wishlist";

  /* ---------------------------- storage helpers ---------------------------- */

  function getWishlist() {
    try {
      var raw = localStorage.getItem(WISHLIST_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    renderWishlistUIs();
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

  /* ----------------------------- wishlist CRUD ------------------------------ */

  function isInWishlist(id) {
    var list = getWishlist();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return true;
    }
    return false;
  }

  function addToWishlist(product) {
    var list = getWishlist();
    var exists = list.filter(function (i) { return i.id === product.id; })[0];
    if (!exists) {
      list.push(product);
      saveWishlist(list);
    }
    return list;
  }

  function removeFromWishlist(id) {
    saveWishlist(getWishlist().filter(function (i) { return i.id !== id; }));
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

  /* -------------------------------- render ---------------------------------- */

  function buildWishlistRow(item) {
    var tr = document.createElement("tr");
    tr.className = "border-b border-gray-300 last:border-b-0";
    tr.setAttribute("data-wishlist-id", item.id);
    tr.innerHTML =
      '<td data-title="Product" class="py-4">' +
        '<div class="flex items-center gap-x-4">' +
          '<a href="single-product.html" class="size-20 rounded-xl bg-[#F4F3F5] overflow-hidden flex-none">' +
            '<img src="' + item.image + '" alt="' + item.name + '" class="w-full h-full object-cover">' +
          "</a>" +
          '<h6 class="text-base font-semibold"><a href="single-product.html">' + item.name + "</a></h6>" +
        "</div>" +
      "</td>" +
      '<td data-title="Price" class="py-4">' +
        '<span class="current-price text-base font-semibold text-light-primary-text">' + formatMoney(item.price) + "</span>" +
      "</td>" +
      '<td data-title="Stock Status" class="py-4">' +
        '<span class="text-primary font-semibold">In Stock</span>' +
      "</td>" +
      '<td data-title="Action" class="py-4">' +
        '<div class="flex items-center gap-x-3">' +
          '<button type="button" class="wishlist-add-to-cart-btn btn btn-primary rounded-full font-semibold text-sm leading-6 px-5 py-2" data-wishlist-id="' + item.id + '">' +
            '<i class="hgi hgi-stroke hgi-shopping-cart-02 text-lg text-white"></i>' +
            "<span>Add to Cart</span>" +
          "</button>" +
          '<button type="button" aria-label="Remove" class="wishlist-remove-btn size-10 inline-flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300" data-wishlist-id="' + item.id + '">' +
            '<i class="hgi hgi-stroke hgi-delete-01 text-xl text-light-primary-text"></i>' +
          "</button>" +
        "</div>" +
      "</td>";
    return tr;
  }

  function renderWishlistUIs() {
    var bodies = document.querySelectorAll(".wishlist-table-body");
    if (!bodies.length) return;

    var list = getWishlist();

    for (var b = 0; b < bodies.length; b++) {
      var body = bodies[b];
      body.innerHTML = "";
      if (list.length === 0) {
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.setAttribute("colspan", "4");
        td.className = "text-center text-light-secondary-text py-10";
        td.textContent = "Your wishlist is empty. Tap the heart icon on any product to save it here.";
        tr.appendChild(td);
        body.appendChild(tr);
      } else {
        for (var i = 0; i < list.length; i++) {
          body.appendChild(buildWishlistRow(list[i]));
        }
      }
    }

    var countEls = document.querySelectorAll(".wishlist-count");
    for (var c = 0; c < countEls.length; c++) {
      countEls[c].textContent = list.length;
    }

    // Reflect saved state on every heart icon across the current page.
    var heartLinks = document.querySelectorAll('a[href="wishlist.html"]');
    for (var h = 0; h < heartLinks.length; h++) {
      var link = heartLinks[h];
      var icon = link.querySelector(".hgi-favourite");
      if (!icon) continue;
      var card = link.closest('[class*="product-card-"]') || link.closest("[data-product-id]");
      var singleWrapper = link.closest(".single-product-page-wrapper");
      var pid = null;
      if (card) pid = card.getAttribute("data-product-id") || slugify((card.querySelector(".product-content h6") || {}).textContent);
      else if (singleWrapper) pid = singleWrapper.getAttribute("data-product-id") || slugify((singleWrapper.querySelector("h4") || {}).textContent);
      if (pid && isInWishlist(pid)) {
        icon.classList.add("text-error");
        link.classList.add("is-wishlisted");
      } else {
        icon.classList.remove("text-error");
        link.classList.remove("is-wishlisted");
      }
    }
  }

  function goToWishlist() {
    var onWishlistPage = /(^|\/)wishlist\.html$/.test(window.location.pathname);
    if (!onWishlistPage) {
      window.location.href = "wishlist.html";
    }
  }

  /* --------------------------------- events ---------------------------------- */

  document.addEventListener("click", function (e) {
    var target = e.target.closest ? e.target.closest("a, button") : null;
    if (!target) return;

    // Wishlist page: remove item
    if (target.classList.contains("wishlist-remove-btn")) {
      e.preventDefault();
      var removeId = target.getAttribute("data-wishlist-id");
      if (removeId) removeFromWishlist(removeId);
      return;
    }

    // Wishlist page: add to cart
    if (target.classList.contains("wishlist-add-to-cart-btn")) {
      e.preventDefault();
      var addId = target.getAttribute("data-wishlist-id");
      var item = getWishlist().filter(function (i) { return i.id === addId; })[0];
      if (item && window.SellzyCart) {
        window.SellzyCart.addToCart({ id: item.id, name: item.name, price: item.price, image: item.image }, 1);
        window.location.href = "cart.html";
      }
      return;
    }

    // Heart / "Add to Wishlist" buttons anywhere else (product grid cards, single product page)
    if (target.tagName === "A") {
      var href = target.getAttribute("href") || "";
      if (/wishlist\.html(\?.*)?$/.test(href)) {
        var icon = target.querySelector(".hgi-favourite");
        if (icon) {
          var card = target.closest('[class*="product-card-"]') || target.closest("[data-product-id]");
          var singleWrapper = target.closest(".single-product-page-wrapper");
          var product = null;
          if (card) product = extractGridCardProduct(card, target);
          else if (singleWrapper) product = extractSingleProductInfo(singleWrapper, target);

          if (product) {
            e.preventDefault();
            addToWishlist(product);
            goToWishlist();
          }
          // else: plain "Wishlist" nav link with no product context -> let it navigate normally
        }
      }
    }
  });

  document.addEventListener("DOMContentLoaded", renderWishlistUIs);

  window.SellzyWishlist = {
    getWishlist: getWishlist,
    addToWishlist: addToWishlist,
    removeFromWishlist: removeFromWishlist,
    isInWishlist: isInWishlist,
    render: renderWishlistUIs
  };
})();
