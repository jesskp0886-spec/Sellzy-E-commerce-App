/* ==========================================================================
   Sellzy Products
   A tiny localStorage-backed "database" of products that powers:
     - Add Product  (add-product.html, also handles Edit)
     - View Product (view-product.html grid, with Search / Filter / Sort)
     - Single Product View (single-product.html, loaded by ?id=)
     - Delete Product (from the View Product grid)
   ========================================================================== */
(function () {
  "use strict";

  var PRODUCTS_KEY = "sellzy_products";

  /* ------------------------------ seed data -------------------------------- */

  var SEED_PRODUCTS = [
    { name: "Fresh Watermelon", category: "grocery", sku: "GRO-1001", price: 6.99, oldPrice: 8.99, stock: 42, description: "Juicy, hand-picked seedless watermelon, perfect for hot days and fruit salads.", image: "assets/images/watermelon.png" },
    { name: "Organic Avocado", category: "grocery", sku: "GRO-1002", price: 2.49, oldPrice: 2.99, stock: 65, description: "Creamy, ripe avocados grown without pesticides. Great for toast, salads, or guacamole.", image: "assets/images/avocado.png" },
    { name: "Pomegranate Pack", category: "grocery", sku: "GRO-1003", price: 4.29, oldPrice: null, stock: 30, description: "Sweet and tangy pomegranates, rich in antioxidants and ready to eat.", image: "assets/images/pomegranate.png" },
    { name: "Strawberry Snack Pack", category: "grocery", sku: "GRO-1004", price: 3.99, oldPrice: 4.99, stock: 50, description: "Bite-sized dried strawberry snacks with no added sugar, perfect for lunchboxes.", image: "assets/images/strawberry-snacks.png" },
    { name: "Vitamin C Immunity Tablets", category: "medical", sku: "MED-2001", price: 12.99, oldPrice: 15.99, stock: 80, description: "Daily Vitamin C supplement to support your immune system, 60 tablets per bottle.", image: "assets/images/vitamin-c.png" },
    { name: "Vitamin B12 Supplement", category: "medical", sku: "MED-2002", price: 14.49, oldPrice: null, stock: 55, description: "High-potency Vitamin B12 to help maintain energy levels and nervous system health.", image: "assets/images/vitamin-b12.png" },
    { name: "Hand Sanitizer 250ml", category: "medical", sku: "MED-2003", price: 3.49, oldPrice: 4.49, stock: 120, description: "Fast-acting, alcohol-based hand sanitizer that kills 99.9% of germs.", image: "assets/images/hand-sanitizer-1.png" },
    { name: "VitaLife Omega-3 Softgels", category: "medical", sku: "MED-2004", price: 27.49, oldPrice: 29.99, stock: 38, description: "Heart-support Omega-3 fish oil softgels, max strength formula.", image: "assets/images/product-image-14.png" },
    { name: "Glow Radiance Face Serum", category: "beauty", sku: "BTY-3001", price: 19.99, oldPrice: 24.99, stock: 45, description: "Lightweight vitamin-enriched face serum for a brighter, more even skin tone.", image: "assets/images/product-image-2.png" },
    { name: "Hydrating Face Moisturizer", category: "beauty", sku: "BTY-3002", price: 16.49, oldPrice: null, stock: 60, description: "24-hour hydration cream suitable for all skin types, non-greasy formula.", image: "assets/images/product-image-5.png" },
    { name: "Matte Finish Lipstick", category: "beauty", sku: "BTY-3003", price: 8.99, oldPrice: 10.99, stock: 90, description: "Long-lasting, smudge-proof matte lipstick available in rich pigmented shades.", image: "assets/images/product-image-7.png" },
    { name: "Whole Wheat Sandwich Bread", category: "bakery", sku: "BAK-4001", price: 3.29, oldPrice: null, stock: 34, description: "Freshly baked whole wheat bread, soft texture with no preservatives.", image: "assets/images/product-image-9.png" },
    { name: "Chocolate Chip Cookies", category: "bakery", sku: "BAK-4002", price: 4.99, oldPrice: 5.99, stock: 48, description: "Classic chocolate chip cookies baked fresh daily, pack of 12.", image: "assets/images/product-image-11.png" },
    { name: "Farm Fresh Milk 1L", category: "dairy", sku: "DRY-5001", price: 2.79, oldPrice: null, stock: 70, description: "Pasteurized full-cream milk sourced from local farms, rich and creamy.", image: "assets/images/product-image-13.png" },
    { name: "Greek Yogurt 500g", category: "dairy", sku: "DRY-5002", price: 4.49, oldPrice: 5.49, stock: 40, description: "Thick and creamy Greek yogurt, high in protein and naturally low in sugar.", image: "assets/images/product-image-16.png" },
    { name: "Wireless Bluetooth Earbuds", category: "electronics", sku: "ELE-6001", price: 34.99, oldPrice: 44.99, stock: 25, description: "Compact true-wireless earbuds with noise isolation and 20-hour battery life.", image: "assets/images/product-image-18.png" },
    { name: "Smart Fitness Band", category: "electronics", sku: "ELE-6002", price: 29.99, oldPrice: null, stock: 33, description: "Track steps, heart rate, and sleep with this lightweight smart fitness band.", image: "assets/images/product-image-20.png" }
  ];

  /* ------------------------------ storage helpers --------------------------- */

  function uid() {
    return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function loadRaw() {
    try {
      var raw = localStorage.getItem(PRODUCTS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveProducts(list) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
  }

  function ensureSeeded() {
    var list = loadRaw();
    if (!list || !list.length) {
      list = SEED_PRODUCTS.map(function (p) {
        return Object.assign({ id: uid(), rating: 4, reviews: Math.floor(Math.random() * 300) + 10 }, p);
      });
      saveProducts(list);
    }
    return list;
  }

  function getProducts() {
    return ensureSeeded();
  }

  function getProduct(id) {
    var list = getProducts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function addProduct(data) {
    var list = getProducts();
    var product = Object.assign({ id: uid(), rating: 4, reviews: 0 }, data);
    list.unshift(product);
    saveProducts(list);
    return product;
  }

  function updateProduct(id, data) {
    var list = getProducts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i] = Object.assign({}, list[i], data, { id: id });
        saveProducts(list);
        return list[i];
      }
    }
    return null;
  }

  function deleteProduct(id) {
    var list = getProducts().filter(function (p) { return p.id !== id; });
    saveProducts(list);
  }

  /* --------------------------- search/filter/sort ---------------------------- */

  function queryProducts(opts) {
    opts = opts || {};
    var list = getProducts();
    var q = (opts.query || "").trim().toLowerCase();
    var category = opts.category || "";

    if (q) {
      list = list.filter(function (p) {
        return (p.name || "").toLowerCase().indexOf(q) !== -1 ||
               (p.category || "").toLowerCase().indexOf(q) !== -1 ||
               (p.sku || "").toLowerCase().indexOf(q) !== -1;
      });
    }
    if (category) {
      list = list.filter(function (p) { return p.category === category; });
    }

    switch (opts.sort) {
      case "name-asc":
        list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
        break;
      case "name-desc":
        list = list.slice().sort(function (a, b) { return b.name.localeCompare(a.name); });
        break;
      case "price-asc":
        list = list.slice().sort(function (a, b) { return a.price - b.price; });
        break;
      case "price-desc":
        list = list.slice().sort(function (a, b) { return b.price - a.price; });
        break;
      case "stock-desc":
        list = list.slice().sort(function (a, b) { return (b.stock || 0) - (a.stock || 0); });
        break;
      default:
        break;
    }
    return list;
  }

  function formatMoney(n) {
    return "$" + (Math.round(n * 100) / 100).toFixed(2);
  }

  /* ------------------------------ grid rendering ------------------------------ */

  function buildProductCard(p) {
    var card = document.createElement("div");
    card.className = "border border-gray-300 rounded-2xl product-card-1 p-4 group";
    card.setAttribute("data-product-id", p.id);

    var oldPriceHtml = p.oldPrice
      ? '<span class="old-price text-xl leading-[30px] font-urbanist font-medium text-light-disabled-text line-through">' + formatMoney(p.oldPrice) + "</span>"
      : "";
    var discountHtml = "";
    if (p.oldPrice && p.oldPrice > p.price) {
      var pct = Math.round((1 - p.price / p.oldPrice) * 100);
      discountHtml = '<span class="discount-percentage text-xl leading-[30px] font-urbanist font-medium text-error">' + pct + "% OFF</span>";
    }
    var stockHtml = (p.stock !== undefined && p.stock !== null)
      ? '<span class="text-sm leading-[22px] font-normal inline-block ml-1">(' + p.stock + ' in stock)</span>'
      : "";

    card.innerHTML =
      '<div class="product-image-container relative">' +
        '<div class="product-image rounded-xl bg-[#FFEFF6] mb-4 overflow-hidden">' +
          '<a href="single-product.html?id=' + encodeURIComponent(p.id) + '">' +
            '<img alt="' + p.name + '" class="group-hover:scale-110 transition-all transform group-hover:-rotate-3 ease-in-out duration-300 w-full h-[200px] object-cover" src="' + p.image + '"/>' +
          "</a>" +
        "</div>" +
        '<div class="product-btn-actions absolute bottom-0 right-0 left-0 flex justify-center z-9 transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 group-hover:bottom-3">' +
          '<ul class="flex items-center gap-x-px">' +
            '<li><a aria-label="Edit" class="product-edit-btn product-btn-action-item relative size-11 bg-white inline-flex items-center justify-center rounded-tl-sm rounded-bl-sm" href="add-product.html?edit=' + encodeURIComponent(p.id) + '"><i class="hgi hgi-stroke hgi-edit-02 text-2xl leading-6 text-light-primary-text"></i></a></li>' +
            '<li><button aria-label="Delete" type="button" class="product-delete-btn product-btn-action-item relative size-11 bg-white inline-flex items-center justify-center cursor-pointer"><i class="hgi hgi-stroke hgi-delete-01 text-2xl leading-6 text-light-primary-text"></i></button></li>' +
            '<li><a aria-label="View" class="product-btn-action-item relative size-11 bg-white inline-flex items-center justify-center rounded-tr-sm rounded-br-sm" href="single-product.html?id=' + encodeURIComponent(p.id) + '"><i class="hgi hgi-stroke hgi-view text-2xl leading-6 text-light-primary-text"></i></a></li>' +
          "</ul>" +
        "</div>" +
      "</div>" +
      '<div class="product-content">' +
        '<h6 class="text-[18px] leading-7 font-bold font-urbanist mb-2 text-light-primary-text line-clamp-1"><a class="hover:text-primary" href="single-product.html?id=' + encodeURIComponent(p.id) + '">' + p.name + "</a></h6>" +
        '<p class="text-sm leading-[22px] text-light-secondary-text capitalize mb-2">' + p.category + stockHtml + "</p>" +
        '<div class="price-section flex items-center gap-x-3 mb-2">' +
          '<span class="current-price text-xl leading-[30px] font-urbanist font-bold text-light-primary-text">' + formatMoney(p.price) + "</span>" +
          oldPriceHtml + discountHtml +
        "</div>" +
        '<div class="btn-section flex items-center gap-x-4">' +
          '<a class="size-11 flex flex-none items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300" href="wishlist.html"><i class="hgi hgi-stroke hgi-favourite text-xl text-light-secondary-text"></i></a>' +
          '<a class="btn btn-primary rounded-full font-semibold text-sm leading-6 px-6.5 py-2 flex-1" href="#" data-product-id="' + p.id + '"><i class="hgi hgi-stroke hgi-shopping-cart-02 text-xl text-white"></i><span>Add to Cart</span></a>' +
        "</div>" +
      "</div>";
    return card;
  }

  function renderGrid() {
    var grid = document.getElementById("product-grid");
    if (!grid) return;

    var searchInput = document.getElementById("product-search-input");
    var categorySelect = document.getElementById("product-filter-category");
    var sortSelect = document.getElementById("product-sort-select");
    var countEl = document.getElementById("product-results-count");
    var emptyEl = document.getElementById("product-empty-state");

    var list = queryProducts({
      query: searchInput ? searchInput.value : "",
      category: categorySelect ? categorySelect.value : "",
      sort: sortSelect ? sortSelect.value : "default"
    });

    grid.innerHTML = "";
    list.forEach(function (p) { grid.appendChild(buildProductCard(p)); });

    if (countEl) countEl.textContent = list.length + (list.length === 1 ? " product found" : " products found");
    if (emptyEl) emptyEl.classList.toggle("hidden", list.length !== 0);
    grid.classList.toggle("hidden", list.length === 0);
  }

  function initGridPage() {
    var grid = document.getElementById("product-grid");
    if (!grid) return;

    renderGrid();

    var searchInput = document.getElementById("product-search-input");
    var categorySelect = document.getElementById("product-filter-category");
    var sortSelect = document.getElementById("product-sort-select");
    var debounceTimer = null;

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(renderGrid, 200);
      });
    }
    if (categorySelect) categorySelect.addEventListener("change", renderGrid);
    if (sortSelect) sortSelect.addEventListener("change", renderGrid);

    grid.addEventListener("click", function (e) {
      var delBtn = e.target.closest ? e.target.closest(".product-delete-btn") : null;
      if (delBtn) {
        e.preventDefault();
        var card = delBtn.closest("[data-product-id]");
        var id = card ? card.getAttribute("data-product-id") : null;
        if (id && window.confirm("Delete this product?")) {
          deleteProduct(id);
          renderGrid();
        }
      }
    });
  }

  /* ------------------------- customer shop grid (shop.html) ------------------- */

  function buildShopProductCard(p) {
    var card = document.createElement("div");
    card.className = "border border-gray-300 rounded-2xl product-card-1 p-4 group";
    card.setAttribute("data-product-id", p.id);

    var oldPriceHtml = p.oldPrice
      ? '<span class="old-price text-xl leading-[30px] font-urbanist font-medium text-light-disabled-text line-through">' + formatMoney(p.oldPrice) + "</span>"
      : "";
    var discountHtml = "";
    if (p.oldPrice && p.oldPrice > p.price) {
      var pct = Math.round((1 - p.price / p.oldPrice) * 100);
      discountHtml = '<span class="discount-percentage text-xl leading-[30px] font-urbanist font-medium text-error">' + pct + "% OFF</span>";
    }
    var detailHref = "single-product.html?id=" + encodeURIComponent(p.id);
    var ratingWidth = Math.max(0, Math.min(100, Math.round(((p.rating || 4) / 5) * 100)));

    card.innerHTML =
      '<div class="product-image-container relative">' +
        '<div class="product-image rounded-xl bg-[#FFEFF6] mb-4 overflow-hidden">' +
          '<a href="' + detailHref + '">' +
            '<img alt="' + p.name + '" class="group-hover:scale-110 transition-all transform group-hover:-rotate-3 ease-in-out duration-300 w-full h-[200px] object-cover" src="' + p.image + '"/>' +
          "</a>" +
        "</div>" +
        '<div class="product-btn-actions absolute bottom-0 right-0 left-0 flex justify-center z-9 transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 group-hover:bottom-3">' +
          '<ul class="flex items-center gap-x-px">' +
            '<li><a aria-label="Add to Wishlist" class="product-btn-action-item relative size-11 bg-white inline-flex items-center justify-center rounded-tl-sm rounded-bl-sm" href="wishlist.html"><i class="hgi hgi-stroke hgi-favourite text-2xl leading-6 text-light-secondary-text"></i></a></li>' +
            '<li><a aria-label="View" class="product-btn-action-item relative size-11 bg-white inline-flex items-center justify-center rounded-tr-sm rounded-br-sm" href="' + detailHref + '"><i class="hgi hgi-stroke hgi-view text-2xl leading-6 text-light-primary-text"></i></a></li>' +
          "</ul>" +
        "</div>" +
      "</div>" +
      '<div class="product-content">' +
        '<h6 class="text-[18px] leading-7 font-bold font-urbanist mb-4 text-light-primary-text line-clamp-1"><a class="hover:text-primary" href="' + detailHref + '">' + p.name + "</a></h6>" +
        '<div class="rating-section flex items-center mb-4">' +
          '<div class="bg-[url(\'../images/star-icon.png\')] w-[90px] h-4.5 bg-repeat-x overflow-hidden bg-position-[0_0]">' +
            '<div class="bg-[url(\'../images/star-icon.png\')] h-4.5 bg-repeat-x bg-position-[0_-18px]" style="width: ' + ratingWidth + '%"></div>' +
          "</div>" +
          '<span class="text-sm leading-[22px] font-normal inline-block ml-1">(' + (p.reviews || 0) + ")</span>" +
        "</div>" +
        '<div class="price-section flex items-center gap-x-3 mb-2">' +
          '<span class="current-price text-xl leading-[30px] font-urbanist font-bold text-light-primary-text">' + formatMoney(p.price) + "</span>" +
          oldPriceHtml + discountHtml +
        "</div>" +
        '<div class="btn-section flex items-center gap-x-4">' +
          '<a class="size-11 flex flex-none items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300" href="wishlist.html"><i class="hgi hgi-stroke hgi-favourite text-xl text-light-secondary-text"></i></a>' +
          '<a class="btn btn-primary rounded-full font-semibold text-sm leading-6 px-6.5 py-2 flex-1" href="#" data-product-id="' + p.id + '"><i class="hgi hgi-stroke hgi-shopping-cart-02 text-xl text-white"></i><span>Add to Cart</span></a>' +
        "</div>" +
      "</div>";
    return card;
  }

  function initShopPage() {
    var grid = document.getElementById("shop-product-grid");
    if (!grid) return;

    var emptyEl = document.getElementById("shop-product-empty-state");
    var filterWrap = document.getElementById("shop-category-filter");
    var activeCategory = "";

    function render() {
      var list = queryProducts({ category: activeCategory });
      grid.innerHTML = "";
      list.forEach(function (p) { grid.appendChild(buildShopProductCard(p)); });
      if (emptyEl) emptyEl.classList.toggle("hidden", list.length !== 0);
      grid.classList.toggle("hidden", list.length === 0);
    }

    if (filterWrap) {
      filterWrap.addEventListener("click", function (e) {
        var btn = e.target.closest ? e.target.closest("button[data-category]") : null;
        if (!btn) return;
        activeCategory = btn.getAttribute("data-category") || "";

        var buttons = filterWrap.querySelectorAll("button[data-category]");
        buttons.forEach(function (b) { b.classList.add("shadow-none"); });
        btn.classList.remove("shadow-none");

        render();
      });
    }

    render();
  }

  /* --------------------------- single product page --------------------------- */

  function initSingleProductPage() {
    var wrapper = document.querySelector(".single-product-page-wrapper");
    if (!wrapper) return;

    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    var product = id ? getProduct(id) : null;

    if (!product) {
      var all = getProducts();
      product = all.length ? all[0] : null;
    }
    if (!product) return;

    wrapper.setAttribute("data-product-id", product.id);

    var nameEl = wrapper.querySelector("h4");
    if (nameEl) nameEl.textContent = product.name;

    document.title = "Sellzy - " + product.name;

    var priceSection = wrapper.querySelector(".price-section");
    if (priceSection) {
      var current = priceSection.querySelector(".current-price");
      var old = priceSection.querySelector(".old-price");
      if (current) current.textContent = formatMoney(product.price);
      if (old) {
        if (product.oldPrice) {
          old.textContent = formatMoney(product.oldPrice);
          old.style.display = "";
        } else {
          old.style.display = "none";
        }
      }
    }

    var images = wrapper.querySelectorAll(".product-images-wrapper img");
    images.forEach(function (img) { img.setAttribute("src", product.image); img.setAttribute("alt", product.name); });

    var descAccordionBody = wrapper.querySelector("#product-details-accordion .accordion-item .accordion-body");
    if (descAccordionBody) {
      descAccordionBody.innerHTML = '<p class="mb-6">' + product.description + "</p>";
    }

    var addToCartBtn = wrapper.querySelector(".product-add-to-cart-btn-section a.btn-primary");
    if (addToCartBtn) addToCartBtn.setAttribute("data-product-id", product.id);
  }

  /* ------------------------------ add/edit form ------------------------------- */

  function initAddProductForm() {
    var form = document.querySelector(".add-product-form-wrapper");
    if (!form) return;

    var nameInput = document.getElementById("product-name");
    var categorySelect = document.getElementById("product-category");
    var skuInput = document.getElementById("product-sku");
    var priceInput = document.getElementById("product-price");
    var stockInput = document.getElementById("product-stock");
    var descTextarea = document.getElementById("product-description");
    var fileInput = form.querySelector('input[type="file"]');
    var previewImg = form.querySelector(".upload-preview img");
    var submitBtn = form.querySelector('button[type="submit"]');

    var params = new URLSearchParams(window.location.search);
    var editId = params.get("edit");
    var editingProduct = editId ? getProduct(editId) : null;
    var currentImageData = "";

    if (editingProduct) {
      nameInput.value = editingProduct.name || "";
      categorySelect.value = editingProduct.category || "";
      skuInput.value = editingProduct.sku || "";
      priceInput.value = editingProduct.price != null ? editingProduct.price : "";
      stockInput.value = editingProduct.stock != null ? editingProduct.stock : "";
      descTextarea.value = editingProduct.description || "";
      currentImageData = editingProduct.image || "";
      if (previewImg && currentImageData) previewImg.setAttribute("src", currentImageData);
      if (submitBtn) submitBtn.textContent = "Update Product";
      var heading = document.querySelector(".add-product-page-title, .page-title-wrapper h2");
      if (heading) heading.textContent = "Edit Product";
    }

    // Resize + compress the uploaded image on a canvas before it becomes a
    // base64 string. Raw phone-camera photos (3-8MB) would otherwise bloat
    // localStorage very quickly since every product stores its image inline.
    var MAX_DIMENSION = 800;
    var JPEG_QUALITY = 0.8;

    function compressImage(file, callback) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var w = img.width;
          var h = img.height;
          if (w > h && w > MAX_DIMENSION) {
            h = Math.round(h * (MAX_DIMENSION / w));
            w = MAX_DIMENSION;
          } else if (h > MAX_DIMENSION) {
            w = Math.round(w * (MAX_DIMENSION / h));
            h = MAX_DIMENSION;
          }
          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          try {
            callback(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
          } catch (err) {
            callback(e.target.result); // fallback: original data URL
          }
        };
        img.onerror = function () { callback(e.target.result); };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    if (fileInput) {
      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        compressImage(file, function (dataUrl) {
          currentImageData = dataUrl;
          if (previewImg) previewImg.setAttribute("src", currentImageData);
        });
      });
    }

    function setFieldError(fieldId, show) {
      var msg = form.querySelector('.field-error[data-error-for="' + fieldId + '"]');
      var input = document.getElementById(fieldId);
      if (msg) msg.classList.toggle("hidden", !show);
      if (input) input.classList.toggle("border-error", !!show);
    }

    function clearAllErrors() {
      var msgs = form.querySelectorAll(".field-error");
      for (var i = 0; i < msgs.length; i++) msgs[i].classList.add("hidden");
      var inputs = form.querySelectorAll(".border-error");
      for (var j = 0; j < inputs.length; j++) inputs[j].classList.remove("border-error");
      var summary = form.querySelector(".form-error-summary");
      if (summary) summary.classList.add("hidden");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearAllErrors();

      var name = nameInput.value.trim();
      var category = categorySelect.value;
      var sku = skuInput.value.trim();
      var price = parseFloat(priceInput.value);
      var stock = parseInt(stockInput.value, 10);
      var description = descTextarea.value.trim();

      var firstInvalid = null;
      var hasError = false;

      function fail(fieldId, input) {
        setFieldError(fieldId, true);
        hasError = true;
        if (!firstInvalid) firstInvalid = input;
      }

      if (!name) fail("product-name", nameInput);
      if (!category) fail("product-category", categorySelect);
      if (!sku) fail("product-sku", skuInput);
      if (isNaN(price) || price < 0) fail("product-price", priceInput);
      if (isNaN(stock) || stock < 0) fail("product-stock", stockInput);
      if (!description) fail("product-description", descTextarea);

      if (hasError) {
        var summary = form.querySelector(".form-error-summary");
        if (summary) {
          summary.textContent = "Please fix the highlighted fields before saving.";
          summary.classList.remove("hidden");
        }
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      var data = {
        name: name,
        category: category,
        sku: sku,
        price: price,
        stock: stock,
        description: description,
        image: currentImageData || "assets/images/product-image-1.png"
      };

      if (editingProduct) {
        updateProduct(editingProduct.id, data);
      } else {
        addProduct(data);
      }

      window.location.href = "view-product.html";
    });
  }

  /* ------------------- bind static/template product cards -------------------- */
  /* Pages like index.html use hardcoded template product cards that were never
     linked to real product IDs (their links just point to "single-product.html"
     with no ?id=). That made clicking them show the wrong / no product detail.
     This finds any .product-card-1 that ISN'T already wired up by
     buildProductCard/buildShopProductCard (those already carry data-product-id)
     and binds it to a real product: syncs image/name/price and fixes the link. */

  function bindStaticProductCards() {
    var products = getProducts();
    if (!products.length) return;

    var cards = document.querySelectorAll(".product-card-1:not([data-product-id])");
    cards.forEach(function (card, i) {
      var product = products[i % products.length];
      card.setAttribute("data-product-id", product.id);
      var detailHref = "single-product.html?id=" + encodeURIComponent(product.id);

      // Fix the image link and title link so they point to the real product
      var imageLink = card.querySelector(".product-image a, .product-image-container > a");
      if (imageLink) imageLink.setAttribute("href", detailHref);

      var titleLink = card.querySelector(".product-content h6 a, .product-content h5 a, .product-content h4 a");
      if (titleLink) {
        titleLink.setAttribute("href", detailHref);
        titleLink.textContent = product.name;
      }

      // Sync the image + price shown on the card so it matches the product
      var img = card.querySelector(".product-image img, .product-image-container img");
      if (img) {
        img.setAttribute("src", product.image);
        img.setAttribute("alt", product.name);
      }
      var priceEl = card.querySelector(".price-section .current-price");
      if (priceEl) priceEl.textContent = formatMoney(product.price);

      // Wire up "Add to Cart" buttons on the card too
      card.querySelectorAll("a, button").forEach(function (el) {
        if (el.textContent.trim().toLowerCase().indexOf("add to cart") !== -1) {
          el.setAttribute("data-product-id", product.id);
        }
      });
    });
  }

  /* ---------------------------------- init ------------------------------------ */

  document.addEventListener("DOMContentLoaded", function () {
    ensureSeeded();
    initGridPage();
    initShopPage();
    initSingleProductPage();
    initAddProductForm();
    bindStaticProductCards();
  });

  window.SellzyProducts = {
    getProducts: getProducts,
    getProduct: getProduct,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    queryProducts: queryProducts
  };
})();
