/* ==========================================================================
   Sellzy Auth
   A tiny localStorage-backed login / register system.

   Privacy note: the user's email address is NEVER written to localStorage
   in plain text. Only a one-way SHA-256 hash of the (lowercased) email is
   stored, together with a one-way hash of the password. The hash is used
   purely to recognise the same account on a later login - it cannot be
   turned back into the original email.
   ========================================================================== */
(function () {
  "use strict";

  var USERS_KEY = "sellzy_users";
  var SESSION_KEY = "sellzy_session";

  /* ------------------------------ hashing ----------------------------------- */
  /* SHA-256 via the browser's built-in Web Crypto API - no plaintext ever
     touches storage. Falls back to a simple non-reversible hash on very old
     browsers / non-secure contexts where crypto.subtle is unavailable. */

  function bufferToHex(buffer) {
    var bytes = new Uint8Array(buffer);
    var hex = "";
    for (var i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  }

  function fallbackHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return "f" + Math.abs(hash).toString(16);
  }

  function sha256Hex(str) {
    if (window.crypto && window.crypto.subtle && window.isSecureContext !== false) {
      try {
        var data = new TextEncoder().encode(str);
        return window.crypto.subtle.digest("SHA-256", data).then(bufferToHex);
      } catch (e) {
        return Promise.resolve(fallbackHash(str));
      }
    }
    return Promise.resolve(fallbackHash(str));
  }

  function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  /* ------------------------------ storage helpers ---------------------------- */

  function getUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(list) {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  }

  function uid() {
    return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* ------------------------------ public API ---------------------------------- */

  function registerUser(data) {
    var email = normalizeEmail(data.email);
    var password = data.password || "";
    var firstName = (data.firstName || "").trim();
    var lastName = (data.lastName || "").trim();

    if (!email || !password) {
      return Promise.reject(new Error("Email and password are required."));
    }

    return Promise.all([sha256Hex(email), sha256Hex(password)]).then(function (hashes) {
      var emailHash = hashes[0];
      var passwordHash = hashes[1];
      var users = getUsers();

      var exists = users.some(function (u) { return u.emailHash === emailHash; });
      if (exists) {
        throw new Error("An account with this email already exists.");
      }

      var user = {
        id: uid(),
        emailHash: emailHash,
        passwordHash: passwordHash,
        firstName: firstName,
        lastName: lastName
      };
      users.push(user);
      saveUsers(users);

      setSession(user);
      return user;
    });
  }

  function loginUser(email, password) {
    var normEmail = normalizeEmail(email);
    if (!normEmail || !password) {
      return Promise.reject(new Error("Email and password are required."));
    }

    return Promise.all([sha256Hex(normEmail), sha256Hex(password)]).then(function (hashes) {
      var emailHash = hashes[0];
      var passwordHash = hashes[1];
      var users = getUsers();
      var user = users.filter(function (u) { return u.emailHash === emailHash; })[0];

      if (!user || user.passwordHash !== passwordHash) {
        throw new Error("Incorrect email or password.");
      }

      setSession(user);
      return user;
    });
  }

  function setSession(user) {
    /* Only a non-identifying reference (id + hash + display name) is kept -
       never the raw email. */
    var session = {
      userId: user.id,
      emailHash: user.emailHash,
      firstName: user.firstName,
      lastName: user.lastName,
      loggedInAt: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  /* ------------------------------ form wiring --------------------------------- */

  function showFormError(form, message) {
    var errorEl = form.querySelector(".sellzy-auth-error");
    if (!errorEl) {
      errorEl = document.createElement("p");
      errorEl.className = "sellzy-auth-error text-error text-sm leading-[22px] font-medium";
      form.insertBefore(errorEl, form.firstChild);
    }
    errorEl.textContent = message;
  }

  function clearFormError(form) {
    var errorEl = form.querySelector(".sellzy-auth-error");
    if (errorEl) errorEl.remove();
  }

  function wireLoginForm(emailId, passwordId, submitSelector) {
    var emailInput = document.getElementById(emailId);
    var passwordInput = document.getElementById(passwordId);
    if (!emailInput || !passwordInput) return;

    var form = emailInput.closest("form");
    var submitBtn = form ? form.querySelector(submitSelector) : null;
    if (!form || !submitBtn) return;

    function handleSubmit(e) {
      if (e) e.preventDefault();
      clearFormError(form);
      var originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing In...";

      loginUser(emailInput.value, passwordInput.value)
        .then(function () {
          window.location.href = "my-account.html";
        })
        .catch(function (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          showFormError(form, err.message || "Unable to sign in.");
        });
    }

    submitBtn.addEventListener("click", handleSubmit);
    form.addEventListener("submit", handleSubmit);
  }

  function wireRegisterForm(opts) {
    var emailInput = document.getElementById(opts.emailId);
    var passwordInput = document.getElementById(opts.passwordId);
    var confirmInput = opts.confirmId ? document.getElementById(opts.confirmId) : null;
    var firstNameInput = opts.firstNameId ? document.getElementById(opts.firstNameId) : null;
    var lastNameInput = opts.lastNameId ? document.getElementById(opts.lastNameId) : null;
    if (!emailInput || !passwordInput) return;

    var form = emailInput.closest("form");
    var submitBtn = form ? form.querySelector(opts.submitSelector) : null;
    if (!form || !submitBtn) return;

    function handleSubmit(e) {
      if (e) e.preventDefault();
      clearFormError(form);

      if (confirmInput && passwordInput.value !== confirmInput.value) {
        showFormError(form, "Passwords do not match.");
        return;
      }

      var originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating Account...";

      registerUser({
        email: emailInput.value,
        password: passwordInput.value,
        firstName: firstNameInput ? firstNameInput.value : "",
        lastName: lastNameInput ? lastNameInput.value : ""
      })
        .then(function () {
          window.location.href = "my-account.html";
        })
        .catch(function (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          showFormError(form, err.message || "Unable to create account.");
        });
    }

    submitBtn.addEventListener("click", handleSubmit);
    form.addEventListener("submit", handleSubmit);
  }

  /* ------------------------------ my-account page ------------------------------ */

  function initMyAccountPage() {
    var nameEl = document.getElementById("account-user-name");
    var emailEl = document.getElementById("account-user-email");
    var logoutBtn = document.getElementById("account-logout-btn");
    if (!nameEl && !logoutBtn) return;

    var session = getSession();
    if (session && nameEl) {
      var fullName = (session.firstName + " " + session.lastName).trim();
      nameEl.textContent = fullName || "My Account";
      if (emailEl) emailEl.textContent = "Signed in";
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        logout();
        window.location.href = "login.html";
      });
    }
  }

  /* ---------------------------------- init ------------------------------------ */

  document.addEventListener("DOMContentLoaded", function () {
    initMyAccountPage();
    /* Login page tabs (login.html) */
    wireLoginForm("own-login-email", "own-login-password", "button.btn-primary");
    wireRegisterForm({
      emailId: "own-register-email",
      passwordId: "own-register-password",
      confirmId: "own-confirm-password",
      firstNameId: "own-first-name",
      lastNameId: "own-last-name",
      submitSelector: "button.btn-primary"
    });

    /* Header account sidebar (present on every page) */
    wireLoginForm("login-email", "login-password", "button.btn-primary");
    wireRegisterForm({
      emailId: "register-email",
      passwordId: "register-password",
      confirmId: "confirm-password",
      firstNameId: "first-name",
      lastNameId: "last-name",
      submitSelector: "button.btn-primary"
    });
  });

  window.SellzyAuth = {
    registerUser: registerUser,
    loginUser: loginUser,
    getSession: getSession,
    logout: logout
  };
})();
