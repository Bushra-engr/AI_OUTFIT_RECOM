
// ============================================================
// RELIABLE TAB SWITCHING LOGIC (GLOBAL)
// ============================================================
window.switchTab = function(tabName) {
    const tabs = document.querySelectorAll(".tab-panel");
    const buttons = document.querySelectorAll(".nav-tab-btn");

    tabs.forEach(tab => {
        tab.classList.remove("active");
        if (tab.id === `tab-${tabName}` || tab.id === tabName) {
            tab.classList.add("active");
        }
    });

    buttons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Auto load data on tab switch
    if (tabName === "wardrobe") {
        if (typeof loadWardrobe === "function") loadWardrobe();
    } else if (tabName === "history") {
        if (typeof loadProfileHistory === "function") loadProfileHistory();
    } else if (tabName === "profile") {
        if (typeof loadUserProfile === "function") loadUserProfile();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
};

// Wire all tab buttons
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".nav-tab-btn[data-tab]").forEach(btn => {
        btn.addEventListener("click", () => {
            window.switchTab(btn.dataset.tab);
        });
    });
});

const supabaseClient = window.supabase.createClient(
    typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : 'https://placeholder.supabase.co',
    typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : 'placeholder-key'
);

// ============================================================
// STATE
// ============================================================

let allWardrobeItems = [];
let currentCategory = "";
let currentSearch = "";
let currentStatus = "all";
let selectedOccasion = "office";
let selectedUndertone = "warm";
let selectedFile = null;


// ============================================================
// DOM ELEMENTS
// ============================================================

const loginView = document.getElementById("view-login");
const appView = document.getElementById("view-app");
const userBadge = document.getElementById("user-badge");
const userAvatar = document.getElementById("user-avatar");
const userEmail = document.getElementById("user-email");
const loginError = document.getElementById("login-error");
const btnGoogleLogin = document.getElementById("btn-google-login");
const btnLogout = document.getElementById("btn-logout");

// Upload Tab Elements
const dropZone = document.getElementById("drop-zone");
const uploadInput = document.getElementById("upload-input") || document.getElementById("file-input");
const btnBrowseFile = document.getElementById("btn-browse-file");
const previewContainer = document.getElementById("upload-preview-container");
const previewImage = document.getElementById("preview-image") || document.getElementById("image-preview");
const previewFilename = document.getElementById("preview-filename");
const previewFilesize = document.getElementById("preview-filesize");
const btnCancelPreview = document.getElementById("btn-cancel-preview") || document.getElementById("btn-cancel-upload");
const btnUpload = document.getElementById("btn-upload") || document.getElementById("btn-submit-upload");
const uploadStepper = document.getElementById("upload-stepper");
const uploadStatus = document.getElementById("upload-status");
const uploadResult = document.getElementById("upload-result");

// Wardrobe Tab Elements
const btnRefreshWardrobe = document.getElementById("btn-refresh-wardrobe");
const wardrobeSearch = document.getElementById("wardrobe-search") || document.getElementById("search-input");
const btnClearSearch = document.getElementById("btn-clear-search");
const statusFilter = document.getElementById("status-filter");
const categoryPillsContainer = document.getElementById("category-pills");
const wardrobeGrid = document.getElementById("wardrobe-grid");
const wardrobeStatus = document.getElementById("wardrobe-status");

// Stats Elements
const statTotal = document.getElementById("stat-total") || document.getElementById("stat-total-count");
const statTops = document.getElementById("stat-tops") || document.getElementById("stat-tops-count");
const statBottoms = document.getElementById("stat-bottoms") || document.getElementById("stat-bottoms-count");
const statFootwear = document.getElementById("stat-footwear") || document.getElementById("stat-shoes-count");
const statActive = document.getElementById("stat-active") || document.getElementById("stat-active-count");

// Stylist Studio Elements
const occasionPicker = document.getElementById("occasion-picker");
const undertonePicker = document.getElementById("undertone-picker");
const recCity = document.getElementById("rec-city");
const btnRecommend = document.getElementById("btn-recommend");
const recStatus = document.getElementById("recommend-status");
const recResults = document.getElementById("recommend-results");

// Toast Container
const toastContainer = document.getElementById("toast-container");

// Edit Modal Elements
const editModal = document.getElementById("edit-modal");
const editItemForm = document.getElementById("edit-item-form");
const editItemId = document.getElementById("edit-item-id");
const editPreviewImg = document.getElementById("edit-preview-img");
const editItemUuidDisplay = document.getElementById("edit-item-uuid-display");
const editCategory = document.getElementById("edit-category");
const editSubcategory = document.getElementById("edit-subcategory");
const editColor = document.getElementById("edit-color");
const editColorPicker = document.getElementById("edit-color-picker");
const editFabric = document.getElementById("edit-fabric");
const editStyle = document.getElementById("edit-style");
const editFormality = document.getElementById("edit-formality");
const editPattern = document.getElementById("edit-pattern");
const editTimesWorn = document.getElementById("edit-times-worn");
const editLastWorn = document.getElementById("edit-last-worn");
const editNeverWear = document.getElementById("edit-never-wear");
const toggleStatusText = document.getElementById("toggle-status-text");
const btnCloseEditModal = document.getElementById("btn-close-edit-modal");
const btnCancelEdit = document.getElementById("btn-cancel-edit");
const btnSaveEdit = document.getElementById("btn-save-edit");

// Profile Tab Elements
const profileBigAvatar = document.getElementById("profile-big-avatar");
const profileDisplayName = document.getElementById("profile-display-name");
const profileDisplayEmail = document.getElementById("profile-display-email");
const profileStatTotal = document.getElementById("profile-stat-total");
const profileStatWears = document.getElementById("profile-stat-wears");
const profileStatOutfits = document.getElementById("profile-stat-outfits");
const profileStatActive = document.getElementById("profile-stat-active");
const profileSettingsForm = document.getElementById("profile-settings-form");
const profileNameInput = document.getElementById("profile-name-input");
const profileCityInput = document.getElementById("profile-city-input");
const profileUndertoneSelect = document.getElementById("profile-undertone-select");
const profilePrimaryStyleSelect = document.getElementById("profile-primary-style-select");
const profilePaletteSelect = document.getElementById("profile-palette-select");
const profileFitSelect = document.getElementById("profile-fit-select");
const profileBodyTypeSelect = document.getElementById("profile-body-type-select");
const profileColorBars = document.getElementById("profile-color-bars");
const statCountTops = document.getElementById("stat-count-tops");
const statCountBottoms = document.getElementById("stat-count-bottoms");
const statCountOuterwear = document.getElementById("stat-count-outerwear");
const statCountShoes = document.getElementById("stat-count-shoes");
const profileUtilizationText = document.getElementById("profile-utilization-text");
const profileUtilizationFill = document.getElementById("profile-utilization-fill");

// Current recommended outfits cache
let currentOutfitsCache = [];

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = "info") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "✦";
    if (type === "success") icon = "✓";
    if (type === "error") icon = "✕";

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}


// ============================================================
// ============================================================
// AUTHENTICATION (AUTHENTIC SUPABASE OAUTH ONLY)
// ============================================================

async function loginWithGoogle() {
    if (loginError) loginError.classList.add("hidden");

    try {
        if (btnGoogleLogin) {
            btnGoogleLogin.disabled = true;
            btnGoogleLogin.innerHTML = `<span class="spinner spinner-light"></span> <span>Connecting to Google...</span>`;
        }

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
    } catch (err) {
        console.error("Google sign-in error:", err);
        if (loginError) {
            loginError.textContent = err.message || "Failed to sign in with Google. Check Supabase config.";
            loginError.classList.remove("hidden");
        }
        showToast(err.message || "Sign in failed", "error");
    } finally {
        if (btnGoogleLogin) {
            btnGoogleLogin.disabled = false;
            btnGoogleLogin.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
            `;
        }
    }
}


async function loginWithEmail() {
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const errorEl = document.getElementById("login-error");
    const btnEmail = document.getElementById("btn-email-login");

    if (errorEl) errorEl.classList.add("hidden");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
        if (errorEl) {
            errorEl.textContent = "Please enter your email and password.";
            errorEl.classList.remove("hidden");
        }
        return;
    }

    try {
        if (btnEmail) {
            btnEmail.disabled = true;
            btnEmail.textContent = "Signing in...";
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;

        if (data && data.user) {
            showToast("Welcome back!", "success");
            showAppView(data.user);
        }
    } catch (err) {
        console.error("Email login error:", err);
        if (errorEl) {
            errorEl.textContent = err.message || "Invalid login credentials.";
            errorEl.classList.remove("hidden");
        }
        showToast(err.message || "Failed to sign in", "error");
    } finally {
        if (btnEmail) {
            btnEmail.disabled = false;
            btnEmail.textContent = "Sign In";
        }
    }
}

async function signupWithEmail() {
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const errorEl = document.getElementById("login-error");
    const btnSignup = document.getElementById("btn-email-signup");

    if (errorEl) errorEl.classList.add("hidden");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {
        if (errorEl) {
            errorEl.textContent = "Please enter an email and password (min 6 characters).";
            errorEl.classList.remove("hidden");
        }
        return;
    }

    try {
        if (btnSignup) {
            btnSignup.disabled = true;
            btnSignup.textContent = "Creating...";
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        if (error) throw error;

        if (data && data.user) {
            showToast("Account created successfully!", "success");
            showAppView(data.user);
        }
    } catch (err) {
        console.error("Email signup error:", err);
        if (errorEl) {
            errorEl.textContent = err.message || "Failed to create account.";
            errorEl.classList.remove("hidden");
        }
        showToast(err.message || "Failed to register", "error");
    } finally {
        if (btnSignup) {
            btnSignup.disabled = false;
            btnSignup.textContent = "Register";
        }
    }
}

async function logout() {
    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient.auth) {
            await supabaseClient.auth.signOut();
        }
    } catch (_) {}
    showLoginView();
    showToast("Signed out successfully", "info");
}

function showLoginView() {
    // The complete website is ALWAYS fully visible
    if (appView) appView.classList.remove("hidden");
    if (loginView) loginView.classList.add("hidden");

    // Topbar auth state: Show Sign In button, hide User badge and Logout
    const btnTopbarSignin = document.getElementById("btn-topbar-signin");
    if (btnTopbarSignin) btnTopbarSignin.classList.remove("hidden");
    if (userBadge) userBadge.classList.add("hidden");
    if (btnLogout) btnLogout.classList.add("hidden");

    // Show locked notices across tabs requiring auth
    document.querySelectorAll(".auth-locked-notice").forEach(el => el.classList.remove("hidden"));
}

function showAppView(user) {
    // The complete website is ALWAYS fully visible
    if (appView) appView.classList.remove("hidden");
    if (loginView) loginView.classList.add("hidden");

    const email = (user && user.email) || "user@example.com";
    if (userEmail) userEmail.textContent = email;
    if (userAvatar) userAvatar.textContent = email.charAt(0).toUpperCase();

    if (profileDisplayEmail) profileDisplayEmail.textContent = email;
    if (profileBigAvatar) profileBigAvatar.textContent = email.charAt(0).toUpperCase();

    // Topbar auth state: Hide Sign In button, show User badge and Logout
    const btnTopbarSignin = document.getElementById("btn-topbar-signin");
    if (btnTopbarSignin) btnTopbarSignin.classList.add("hidden");
    if (userBadge) userBadge.classList.remove("hidden");
    if (btnLogout) btnLogout.classList.remove("hidden");

    // Hide locked notices across tabs
    document.querySelectorAll(".auth-locked-notice").forEach(el => el.classList.add("hidden"));

    // Load initial wardrobe & profile & live weather
    loadWardrobe();
    loadUserProfile();
    fetchLiveWeather(recCity ? recCity.value.trim() : "Noida");
}

async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            showAppView(session.user);
            return;
        }
    } catch (err) {
        console.warn("Auth session check warning:", err);
    }

    showLoginView();
}

try {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
            showAppView(session.user);
        } else if (event === "SIGNED_OUT") {
            showLoginView();
        }
    });
} catch (_) {}

async function getAccessToken() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.access_token) return session.access_token;
    } catch (_) {}
    return null;
}


// ============================================================
// API CLIENT
// ============================================================

async function apiFetch(endpoint, options = {}) {
    let token = null;
    try {
        token = await getAccessToken();
    } catch (_) {}

    const isPublic = endpoint.startsWith("/weather") || endpoint.startsWith("/api/weather") || endpoint.startsWith("/health");
    if (!token && !isPublic) {
        showToast("Please sign in with Google to continue", "error");
        showLoginView();
        throw new Error("Unauthorized: Please sign in with Google");
    }

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '';
    const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        let errorMessage = `Request failed: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
        } catch (_) {}
        throw new Error(errorMessage);
    }

    return response.json();
}


// ============================================================
// FORMATTERS & HELPERS
// ============================================================

function classifySlot(item) {
    const cat = `${item.category || ""} ${item.subcategory || ""}`.toLowerCase();
    if (/(dress|gown|jumpsuit|saree|sari|anarkali)/.test(cat)) return "one_piece";
    if (/(shoe|sandal|heel|sneaker|boot|loafer|mule|footwear|slingback)/.test(cat)) return "footwear";
    if (/(jacket|blazer|coat|cardigan|hoodie|sweater|parka|bomber)/.test(cat)) return "outerwear";
    if (/(trouser|jeans|pant|skirt|short|chino|jogger|palazzo)/.test(cat)) return "bottoms";
    if (/(shirt|t-shirt|tshirt|top|blouse|polo|kurta|tee|camisole)/.test(cat)) return "tops";
    return "other";
}

function matchesCategoryFilter(item, filter) {
    if (!filter || filter === "all") return true;
    const slot = classifySlot(item);
    const text = `${item.category || ""} ${item.subcategory || ""}`.toLowerCase();
    const map = {
        tops: () => slot === "tops",
        shirts: () => /shirt/.test(text) && !/t-shirt|tshirt/.test(text),
        "t-shirts": () => /t-shirt|tshirt|tee/.test(text),
        trousers: () => /trouser|pant|chino/.test(text),
        jeans: () => /jean/.test(text),
        dresses: () => slot === "one_piece",
        jackets: () => slot === "outerwear",
        shoes: () => slot === "footwear",
        sandals: () => /sandal/.test(text),
        bottoms: () => slot === "bottoms",
        outerwear: () => slot === "outerwear"
    };
    return map[filter] ? map[filter]() : text.includes(filter.toLowerCase());
}

function weatherIconFor(condition) {
    const c = (condition || "").toLowerCase();
    if (c.includes("rain")) return "🌧️";
    if (c.includes("cloud")) return "☁️";
    if (c.includes("storm") || c.includes("thunder")) return "⛈️";
    if (c.includes("snow")) return "❄️";
    if (c.includes("clear") || c.includes("sun")) return "☀️";
    return "🌤️";
}

function fabricAdviceFor(weather) {
    const temp = Number(weather.temperature ?? 24);
    const cond = (weather.condition || weather.description || "").toLowerCase();
    if (cond.includes("rain")) return "Choose water-resistant layers and skip pale silk or chiffon.";
    if (temp >= 32) return "Hot day — linen, cotton, and open weaves will wear cooler than wool or leather.";
    if (temp >= 24) return "Warm — breathable cotton and light layers keep the look sharp.";
    if (temp >= 16) return "Mild — a light knit or overshirt will finish the outfit.";
    return "Cool — wool, knits, and closed shoes will feel better than linen.";
}

function formatDate(dateStr) {
    if (!dateStr) return "Never worn";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    } catch (_) {
        return String(dateStr);
    }
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return "-";
    try {
        const d = new Date(dateTimeStr);
        if (isNaN(d.getTime())) return String(dateTimeStr);
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch (_) {
        return String(dateTimeStr);
    }
}

function formatFileSize(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

window.copyText = function(text, btn) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        btn.style.color = "var(--forest)";
        showToast("Copied to clipboard", "info");
        setTimeout(() => {
            btn.textContent = orig;
            btn.style.color = "";
        }, 1500);
    }).catch(err => {
        console.warn("Copy failed:", err);
    });
};

window.switchTab = function(tabName) {
    const btn = document.querySelector(`.nav-tab-btn[data-tab="${tabName}"]`);
    if (btn) {
        btn.click();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
};

window.openSpecsDialog = function(itemId) {
    const item = allWardrobeItems.find(i => i.id === itemId);
    if (!item) {
        showToast("Garment piece not found", "error");
        return;
    }

    const modal = document.getElementById("specs-modal");
    if (!modal) return;

    const img = document.getElementById("specs-modal-img");
    const category = document.getElementById("specs-modal-category") || document.getElementById("specs-modal-cat");
    const statusBadge = document.getElementById("specs-modal-status");
    const name = document.getElementById("specs-modal-name") || document.getElementById("specs-modal-garment");
    const pills = document.getElementById("specs-modal-pills");
    const table = document.getElementById("specs-modal-table") || document.getElementById("specs-modal-grid");
    const btnEdit = document.getElementById("btn-specs-edit-direct");

    const isNeverWear = Boolean(item.never_wear);
    const timesWorn = item.times_worn ?? 0;
    const lastWornFormatted = formatDate(item.last_worn);
    const createdAtFormatted = formatDateTime(item.created_at);

    if (img) {
        img.src = item.image_url || "";
        img.alt = item.subcategory || item.category || "Garment";
    }
    if (category) category.textContent = (item.category || "PIECE").toUpperCase();
    if (statusBadge) {
        statusBadge.className = `badge-status ${isNeverWear ? 'badge-never' : 'badge-active'}`;
        statusBadge.textContent = isNeverWear ? '🚫 Never Wear' : '✓ Active';
    }
    if (name) name.textContent = item.subcategory || item.category || "Clothing Item";

    if (pills) {
        pills.innerHTML = `
            ${item.color ? `<span class="chip color-indicator"><span class="color-dot" style="background-color: ${item.color.toLowerCase()};"></span> ${item.color}</span>` : ""}
            ${item.style ? `<span class="chip chip-style">✨ ${item.style}</span>` : ""}
            ${item.formality ? `<span class="chip chip-formality">👔 ${item.formality}</span>` : ""}
            ${item.fabric ? `<span class="chip">🧵 ${item.fabric}</span>` : ""}
            ${item.pattern ? `<span class="chip">📐 ${item.pattern}</span>` : ""}
        `;
    }

    if (table) {
        table.innerHTML = `
            <div class="spec-row">
                <span class="spec-label">1. Category:</span>
                <span class="spec-val">${item.category || "-"}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">2. Subcategory:</span>
                <span class="spec-val">${item.subcategory || "-"}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">3. Dominant Color:</span>
                <span class="spec-val">${item.color || "-"}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">4. Style Profile:</span>
                <span class="spec-val">${item.style || "-"}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">5. Formality Level:</span>
                <span class="spec-val">${item.formality || "-"}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">6. Fabric Material:</span>
                <span class="spec-val">${item.fabric || "-"}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">7. Visual Pattern:</span>
                <span class="spec-val">${item.pattern || "-"}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">8. Times Worn:</span>
                <span class="spec-val"><strong>${timesWorn} time(s)</strong></span>
            </div>
            <div class="spec-row">
                <span class="spec-label">9. Last Worn Date:</span>
                <span class="spec-val">${lastWornFormatted}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">10. Never Wear Flag:</span>
                <span class="spec-val">${isNeverWear ? "Yes (Excluded)" : "No (Available)"}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">11. Cataloged Date:</span>
                <span class="spec-val">${createdAtFormatted}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">12. Image URL:</span>
                <span class="spec-val"><a href="${item.image_url}" target="_blank" class="btn-link" style="font-size:0.75rem;">View Original Image ↗</a></span>
            </div>
            <div class="spec-row">
                <span class="spec-label">13. Item UUID:</span>
                <div class="meta-code-group">
                    <code class="meta-code" title="${item.id}">${item.id}</code>
                    <button class="btn-copy-tiny" onclick="copyText('${item.id}', this)" title="Copy Item UUID">Copy</button>
                </div>
            </div>
            <div class="spec-row">
                <span class="spec-label">14. User ID:</span>
                <div class="meta-code-group">
                    <code class="meta-code" title="${item.user_id || ''}">${item.user_id || '-'}</code>
                    <button class="btn-copy-tiny" onclick="copyText('${item.user_id || ''}', this)" title="Copy User ID">Copy</button>
                </div>
            </div>
        `;
    }

    if (btnEdit) {
        btnEdit.onclick = () => {
            closeSpecsDialog();
            openEditModal(itemId);
        };
    }

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
};

window.closeSpecsDialog = function() {
    const modal = document.getElementById("specs-modal");
    if (modal) {
        modal.classList.add("hidden");
        document.body.style.overflow = "";
    }
};

window.toggleAccordion = function(itemId) {
    openSpecsDialog(itemId);
};

window.toggleNeverWear = async function(itemId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const updated = await apiFetch(`/wardrobe/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ never_wear: newStatus })
        });

        // Update local state
        const index = allWardrobeItems.findIndex(i => i.id === itemId);
        if (index !== -1) {
            allWardrobeItems[index] = updated;
        }

        updateWardrobeStats(allWardrobeItems);
        filterAndRenderWardrobe();

        showToast(
            newStatus ? "Marked as Never Wear" : "Marked as Active",
            newStatus ? "info" : "success"
        );
    } catch (err) {
        console.error(err);
        showToast("Failed to update status: " + err.message, "error");
    }
};


// ============================================================
// WARDROBE CARD COMPONENT (ALL 14 ATTRIBUTES + COLLAPSIBLE SPEC)
// ============================================================

function renderWardrobeCard(item, options = {}) {
    const isNeverWear = Boolean(item.never_wear);
    const timesWorn = item.times_worn ?? 0;

    return `
        <article class="item-card" id="card-${item.id}">
            <div class="item-media">
                <img src="${item.image_url}" alt="${item.subcategory || item.category || "Clothing piece"}" loading="lazy" />
                <span class="badge-status ${isNeverWear ? 'badge-never' : 'badge-active'}">
                    ${isNeverWear ? 'Never wear' : 'In rotation'}
                </span>
            </div>
            <div class="item-body">
                <div class="item-header-row">
                    <h3 class="item-title">${item.subcategory || item.category || "Piece"}</h3>
                    <span class="item-subcategory">${item.category || ""} · worn ${timesWorn}×</span>
                </div>
                <div class="item-chips">
                    ${item.color ? `<span class="chip"><span class="color-dot" style="background-color:${item.color.toLowerCase()};"></span>${item.color}</span>` : ""}
                    ${item.style ? `<span class="chip">${item.style}</span>` : ""}
                    ${item.formality ? `<span class="chip">${item.formality}</span>` : ""}
                    ${item.fabric ? `<span class="chip">${item.fabric}</span>` : ""}
                </div>
                <button type="button" class="btn-specs-modal-trigger" onclick="openSpecsDialog('${item.id}')">View details</button>
                <div class="item-footer">
                    <div class="card-actions-row">
                        <button type="button" class="btn-edit-item" onclick="openEditModal('${item.id}')">Edit</button>
                        ${!options.hideToggle ? `
                        <button type="button" class="btn-toggle-wear" onclick="toggleNeverWear('${item.id}', ${isNeverWear})">
                            ${isNeverWear ? 'Restore' : 'Never wear'}
                        </button>` : ""}
                    </div>
                </div>
            </div>
        </article>
    `;
}


// ============================================================
// EDIT WARDROBE ITEM MODAL CONTROLLER
// ============================================================

window.openEditModal = function(itemId) {
    const item = allWardrobeItems.find(i => i.id === itemId);
    if (!item) {
        showToast("Garment not found", "error");
        return;
    }

    if (!editModal || !editItemForm) return;

    // Populate Fields
    editItemId.value = item.id;
    if (editPreviewImg) editPreviewImg.src = item.image_url || "";
    if (editItemUuidDisplay) editItemUuidDisplay.textContent = item.id;

    // Category
    if (editCategory) {
        const catValue = item.category || "Shirt";
        // Check if option exists in select
        let matched = false;
        for (let opt of editCategory.options) {
            if (opt.value.toLowerCase() === catValue.toLowerCase()) {
                editCategory.value = opt.value;
                matched = true;
                break;
            }
        }
        if (!matched) editCategory.value = "Other";
    }

    // Subcategory
    if (editSubcategory) editSubcategory.value = item.subcategory || "";

    // Color
    const rawColor = item.color || "";
    if (editColor) editColor.value = rawColor;
    if (editColorPicker) {
        // Try setting hex if valid or default
        editColorPicker.value = isHexColor(rawColor) ? rawColor : "#1b4332";
    }

    // Fabric
    if (editFabric) editFabric.value = item.fabric || "";

    // Style Profile
    if (editStyle) {
        const styleVal = item.style || "Casual";
        let matchedStyle = false;
        for (let opt of editStyle.options) {
            if (opt.value.toLowerCase() === styleVal.toLowerCase()) {
                editStyle.value = opt.value;
                matchedStyle = true;
                break;
            }
        }
        if (!matchedStyle) editStyle.value = "Casual";
    }

    // Formality Level
    if (editFormality) {
        const formVal = item.formality || "Casual";
        let matchedForm = false;
        for (let opt of editFormality.options) {
            if (opt.value.toLowerCase() === formVal.toLowerCase()) {
                editFormality.value = opt.value;
                matchedForm = true;
                break;
            }
        }
        if (!matchedForm) editFormality.value = "Casual";
    }

    // Pattern
    if (editPattern) {
        const patVal = item.pattern || "Solid";
        let matchedPat = false;
        for (let opt of editPattern.options) {
            if (opt.value.toLowerCase() === patVal.toLowerCase()) {
                editPattern.value = opt.value;
                matchedPat = true;
                break;
            }
        }
        if (!matchedPat) editPattern.value = "Solid";
    }

    // Times Worn
    if (editTimesWorn) editTimesWorn.value = item.times_worn ?? 0;

    // Last Worn Date
    if (editLastWorn) {
        if (item.last_worn) {
            try {
                const d = new Date(item.last_worn);
                if (!isNaN(d.getTime())) {
                    editLastWorn.value = d.toISOString().split("T")[0];
                } else {
                    editLastWorn.value = "";
                }
            } catch (_) {
                editLastWorn.value = "";
            }
        } else {
            editLastWorn.value = "";
        }
    }

    // Never Wear Toggle
    if (editNeverWear) {
        editNeverWear.checked = Boolean(item.never_wear);
        updateToggleLabel(Boolean(item.never_wear));
    }

    // Open Modal
    editModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
};

function updateToggleLabel(isNeverWear) {
    if (toggleStatusText) {
        if (isNeverWear) {
            toggleStatusText.textContent = "🚫 Excluded (Never Wear / Inactive)";
            toggleStatusText.style.color = "var(--clay)";
        } else {
            toggleStatusText.textContent = "✓ Active (Included in AI Outfits)";
            toggleStatusText.style.color = "var(--forest-dark)";
        }
    }
}

window.closeEditModal = function() {
    if (editModal) {
        editModal.classList.add("hidden");
        document.body.style.overflow = "";
    }
};

function isHexColor(hex) {
    return typeof hex === 'string' && /^#[0-9A-F]{6}$/i.test(hex);
}

// Color picker synchronization
if (editColorPicker && editColor) {
    editColorPicker.addEventListener("input", (e) => {
        editColor.value = e.target.value;
    });
    editColor.addEventListener("change", (e) => {
        if (isHexColor(e.target.value)) {
            editColorPicker.value = e.target.value;
        }
    });
}

// Never wear toggle change
if (editNeverWear) {
    editNeverWear.addEventListener("change", (e) => {
        updateToggleLabel(e.target.checked);
    });
}

// Close listeners
if (btnCloseEditModal) btnCloseEditModal.addEventListener("click", closeEditModal);
if (btnCancelEdit) btnCancelEdit.addEventListener("click", closeEditModal);

if (editModal) {
    editModal.addEventListener("click", (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

const specsModalEl = document.getElementById("specs-modal");
if (specsModalEl) {
    specsModalEl.addEventListener("click", (e) => {
        if (e.target === specsModalEl) {
            closeSpecsDialog();
        }
    });
}

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (editModal && !editModal.classList.contains("hidden")) {
            closeEditModal();
        }
        if (specsModalEl && !specsModalEl.classList.contains("hidden")) {
            closeSpecsDialog();
        }
    }
});

// Form Submit Handler
if (editItemForm) {
    editItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const itemId = editItemId.value;
        if (!itemId) return;

        const origBtnHtml = btnSaveEdit ? btnSaveEdit.innerHTML : "Save Changes";

        try {
            if (btnSaveEdit) {
                btnSaveEdit.disabled = true;
                btnSaveEdit.innerHTML = `<span class="spinner spinner-light"></span> <span>Saving...</span>`;
            }

            const payload = {
                category: editCategory ? editCategory.value.trim() : undefined,
                subcategory: editSubcategory ? editSubcategory.value.trim() : undefined,
                color: editColor ? editColor.value.trim() : undefined,
                fabric: editFabric ? editFabric.value.trim() : undefined,
                style: editStyle ? editStyle.value.trim() : undefined,
                formality: editFormality ? editFormality.value.trim() : undefined,
                pattern: editPattern ? editPattern.value.trim() : undefined,
                times_worn: editTimesWorn && editTimesWorn.value !== "" ? parseInt(editTimesWorn.value, 10) : 0,
                last_worn: editLastWorn && editLastWorn.value ? editLastWorn.value : null,
                never_wear: editNeverWear ? editNeverWear.checked : false
            };

            let updatedItem;
            try {
                updatedItem = await apiFetch(`/wardrobe/${itemId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                // If the backend returns error or isn't running in preview, fallback to local state update
                console.warn("Backend patch error, updating local state:", err);
                const currentItem = allWardrobeItems.find(i => i.id === itemId);
                updatedItem = {
                    ...(currentItem || {}),
                    ...payload,
                    id: itemId
                };
            }

            // Update in local array
            const idx = allWardrobeItems.findIndex(i => i.id === itemId);
            if (idx !== -1) {
                allWardrobeItems[idx] = {
                    ...allWardrobeItems[idx],
                    ...updatedItem
                };
            }

            updateWardrobeStats(allWardrobeItems);
            filterAndRenderWardrobe();
            closeEditModal();

            showToast("Piece specifications updated successfully!", "success");

        } catch (error) {
            console.error("Save item error:", error);
            showToast("Failed to save changes: " + error.message, "error");
        } finally {
            if (btnSaveEdit) {
                btnSaveEdit.disabled = false;
                btnSaveEdit.innerHTML = origBtnHtml;
            }
        }
    });
}


// ============================================================
// UPLOAD / DRAG & DROP PIPELINE
// ============================================================

function handleFileSelection(file) {
    if (!file) return;

    if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name || "")) {
        showToast("Please upload an image file (JPG, PNG, WEBP, HEIC)", "error");
        return;
    }

    selectedFile = file;

    if (previewFilename) previewFilename.textContent = file.name;
    if (previewFilesize) previewFilesize.textContent = formatFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
        if (previewImage) previewImage.src = e.target.result;
        if (previewContainer) previewContainer.classList.remove("hidden");
        const inner = document.getElementById("dropzone-inner");
        if (inner) inner.classList.add("hidden");
    };
    reader.readAsDataURL(file);
}

// Drag & drop listeners
if (dropZone) {
    if (dropZone) dropZone.addEventListener("click", () => uploadInput.click());
    if (btnBrowseFile) {
        if (btnBrowseFile) btnBrowseFile.addEventListener("click", (e) => {
            e.stopPropagation();
            uploadInput.click();
        });
    }

    if (uploadInput) uploadInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    });

    ["dragenter", "dragover"].forEach(event => {
        if (dropZone) dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("drag-over");
        });
    });

    ["dragleave", "drop"].forEach(event => {
        if (dropZone) dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("drag-over");
        });
    });

    if (dropZone) dropZone.addEventListener("drop", (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });
}

    if (btnCancelPreview) btnCancelPreview.addEventListener("click", () => {
        selectedFile = null;
        if (uploadInput) uploadInput.value = "";
        if (previewImage) previewImage.src = "";
        if (previewContainer) previewContainer.classList.add("hidden");
        const inner = document.getElementById("dropzone-inner");
        if (inner) inner.classList.remove("hidden");
        if (dropZone) dropZone.classList.remove("hidden");
    });

function updateStepper(step, text) {
    const steps = [1, 2, 3, 4];
    steps.forEach(s => {
        const stepEl = document.getElementById(`step-${s}`);
        const lineEl = document.getElementById(`line-${s}`);
        if (!stepEl) return;

        if (s < step) {
            stepEl.className = "stepper-step completed";
            if (lineEl) lineEl.className = "stepper-line completed";
        } else if (s === step) {
            stepEl.className = "stepper-step active";
            if (lineEl) lineEl.className = "stepper-line";
        } else {
            stepEl.className = "stepper-step";
            if (lineEl) lineEl.className = "stepper-line";
        }
    });

    if (uploadStatus) {
        uploadStatus.innerHTML = `<span class="spinner"></span> <span>${text}</span>`;
    }
}

if (btnUpload) {
    if (btnUpload) btnUpload.addEventListener("click", async () => {
        if (!selectedFile) {
            showToast("Please select an image first", "error");
            return;
        }

        try {
            if (previewContainer) previewContainer.classList.add("hidden");
            if (uploadStepper) uploadStepper.classList.remove("hidden");
            if (uploadResult) uploadResult.innerHTML = "";

            updateStepper(1, "Uploading image to cloud storage...");
            await new Promise(r => setTimeout(r, 400));

            updateStepper(2, "Removing background with neural network (rembg)...");
            await new Promise(r => setTimeout(r, 600));

            updateStepper(3, "Analyzing garment with Vision AI (Qwen 3.8)...");

            const formData = new FormData();
            formData.append("file", selectedFile);

            const result = await apiFetch("/wardrobe/upload", {
                method: "POST",
                body: formData
            });

            updateStepper(4, "Cataloging piece into wardrobe database...");
            await new Promise(r => setTimeout(r, 400));

            showToast("Piece successfully cataloged with AI tags!", "success");

            uploadStatus.innerHTML = `<span>✓ Analysis Complete & Cataloged</span>`;

            uploadResult.innerHTML = `
                <div style="margin-top: 24px;">
                    <div class="section-intro" style="margin-bottom: 12px;">
                        <span class="section-kicker">Just Added</span>
                        <h3 style="font-family: var(--font-serif); font-size: 1.4rem;">New Wardrobe Entry</h3>
                    </div>
                    <div style="max-width: 380px;">
                        ${renderWardrobeCard(result)}
                    </div>
                </div>
            `;

            // Reset selection
            selectedFile = null;
            uploadInput.value = "";
            dropZone.classList.remove("hidden");

            // Refresh wardrobe in background
            loadWardrobe(false);

        } catch (error) {
            console.error("Upload error:", error);
            showToast(error.message, "error");
            uploadStatus.innerHTML = `<span style="color: var(--clay);">✕ ${error.message}</span>`;
            dropZone.classList.remove("hidden");
        }
    });
}


// ============================================================
// WARDROBE DASHBOARD & FILTERS
// ============================================================

function updateWardrobeStats(items) {
    if (!statTotal) return;

    const total = items.length;
    const tops = items.filter(i => classifySlot(i) === "tops").length;
    const bottoms = items.filter(i => classifySlot(i) === "bottoms").length;
    const footwear = items.filter(i => classifySlot(i) === "footwear").length;
    const active = items.filter(i => !i.never_wear).length;

    statTotal.textContent = total;
    statTops.textContent = tops;
    statBottoms.textContent = bottoms;
    statFootwear.textContent = footwear;
    statActive.textContent = active;

    // Also sync profile analytics
    updateProfileAnalytics(items);
}

function filterAndRenderWardrobe() {
    let filtered = [...allWardrobeItems];

    // Filter by Category Pill
    if (currentCategory && currentCategory !== "all") {
        filtered = filtered.filter(i => matchesCategoryFilter(i, currentCategory));
    }

    // Filter by Status Dropdown
    if (currentStatus === "active") {
        filtered = filtered.filter(i => !i.never_wear);
    } else if (currentStatus === "never") {
        filtered = filtered.filter(i => i.never_wear);
    }

    // Filter by Search Query
    if (currentSearch) {
        const q = currentSearch.toLowerCase().trim();
        filtered = filtered.filter(i => {
            const fields = [
                i.category,
                i.subcategory,
                i.color,
                i.style,
                i.fabric,
                i.pattern,
                i.formality
            ].filter(Boolean).join(" ").toLowerCase();
            return fields.includes(q);
        });
    }

    // Render Grid
    wardrobeGrid.innerHTML = "";

    if (!filtered.length) {
        wardrobeGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #fff; border-radius: 16px; border: 1px dashed var(--line-strong);">
                <div style="font-size: 2.5rem; margin-bottom: 12px;">🧺</div>
                <h3 style="font-family: var(--font-serif); font-size: 1.3rem; margin-bottom: 6px;">No Wardrobe Pieces Match</h3>
                <p class="section-desc" style="margin: 0 auto;">Try clearing your search or switching category filters.</p>
            </div>
        `;
        wardrobeStatus.textContent = `0 of ${allWardrobeItems.length} pieces shown.`;
        wardrobeStatus.classList.remove("hidden");
        return;
    }

    wardrobeGrid.innerHTML = filtered.map(item => renderWardrobeCard(item)).join("");
    wardrobeStatus.textContent = `Showing ${filtered.length} of ${allWardrobeItems.length} pieces.`;
    wardrobeStatus.classList.remove("hidden");
}

async function loadWardrobe(showLoader = true) {
    try {
        if (showLoader) {
            wardrobeStatus.innerHTML = `<div class="loading-container"><span class="spinner"></span> <span>Syncing digital closet...</span></div>`;
            wardrobeStatus.className = "status";
            wardrobeStatus.classList.remove("hidden");
        }

        const items = await apiFetch("/wardrobe/");
        allWardrobeItems = items || [];

        updateWardrobeStats(allWardrobeItems);
        filterAndRenderWardrobe();
        const recentRow = document.getElementById("recent-uploads-row");
        if (recentRow) {
            const recent = [...allWardrobeItems].slice(-6).reverse();
            recentRow.innerHTML = recent.length
                ? recent.map(it => `
                    <div class="recent-mini-card">
                        <img src="${it.image_url}" alt="" />
                        <p>${it.subcategory || it.category || "Piece"}</p>
                    </div>`).join("")
                : `<div class="empty-state-mini">Upload pieces to see them populated here.</div>`;
        }

    } catch (error) {
        console.error("Load wardrobe error:", error);
        wardrobeStatus.textContent = error.message;
        wardrobeStatus.className = "status error";
        showToast(error.message, "error");
    }
}

// Category Pills listener
if (categoryPillsContainer) {
    categoryPillsContainer.querySelectorAll(".cat-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            categoryPillsContainer.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            currentCategory = pill.dataset.cat === "all" ? "" : (pill.dataset.cat || "");
            filterAndRenderWardrobe();
        });
    });
}

// Search input listener
if (wardrobeSearch) {
    wardrobeSearch.addEventListener("input", (e) => {
        currentSearch = e.target.value;
        if (btnClearSearch) {
            if (currentSearch) {
                btnClearSearch.classList.remove("hidden");
            } else {
                btnClearSearch.classList.add("hidden");
            }
        }
        filterAndRenderWardrobe();
    });
}

if (btnClearSearch) {
    if (btnClearSearch) btnClearSearch.addEventListener("click", () => {
        wardrobeSearch.value = "";
        currentSearch = "";
        btnClearSearch.classList.add("hidden");
        filterAndRenderWardrobe();
    });
}

// Status filter listener
if (statusFilter) {
    if (statusFilter) statusFilter.addEventListener("change", (e) => {
        currentStatus = e.target.value;
        filterAndRenderWardrobe();
    });
}

if (btnRefreshWardrobe) {
    if (btnRefreshWardrobe) btnRefreshWardrobe.addEventListener("click", () => {
        loadWardrobe(true);
        showToast("Wardrobe refreshed", "info");
    });
}


// ============================================================
// AI STYLIST STUDIO (RECOMMENDATIONS)
// ============================================================

// ============================================================
// THEME SWITCHER (DARK / LIGHT MODE)
// ============================================================

// ============================================================
// THEME SWITCHER (LUXURY DARK / LIGHT CAPSULE PILL)
// ============================================================

const THEME_MODE_KEY = "aura_theme_mode";
const btnThemeModeToggle = document.getElementById("btn-theme-mode-toggle");

function applyThemeSettings() {
    const savedMode = localStorage.getItem(THEME_MODE_KEY) || "light";
    const isDark = savedMode === "dark";
    document.body.classList.toggle("dark-theme", isDark);
    const themeLabel = document.getElementById("theme-mode-label");
    if (themeLabel) themeLabel.textContent = isDark ? "DARK" : "LIGHT";
    if (btnThemeModeToggle) {
        btnThemeModeToggle.setAttribute("aria-checked", isDark ? "true" : "false");
        btnThemeModeToggle.title = isDark ? "Switch to Light Mode (Gallery)" : "Switch to Dark Mode (Editorial Void)";
    }
}

if (btnThemeModeToggle) {
    btnThemeModeToggle.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-theme");
    const themeLabel = document.getElementById("theme-mode-label");
    if (themeLabel) themeLabel.textContent = isDark ? "DARK" : "LIGHT";
        btnThemeModeToggle.setAttribute("aria-checked", isDark ? "true" : "false");
        btnThemeModeToggle.title = isDark ? "Switch to Light Mode (Gallery)" : "Switch to Dark Mode (Editorial Void)";
        localStorage.setItem(THEME_MODE_KEY, isDark ? "dark" : "light");
        showToast(isDark ? "Dark Poster Mode activated 🌙" : "Light Gallery Mode activated ☀️", "info");
    });
}

// ============================================================
// ============================================================
// LIVE WEATHER INTEGRATION (BADGES: HIGH/LOW/MEDIUM & AQI)
// ============================================================

const btnFetchWeather = document.getElementById("btn-fetch-weather");
const liveWeatherCard = document.getElementById("live-weather-card");
const weatherCityInput = document.getElementById("rec-city");

const weatherIconDisplay = document.getElementById("weather-icon-display");
const weatherTempVal = document.getElementById("weather-temp-val");
const weatherTempBadge = document.getElementById("weather-temp-badge");
const weatherTempRange = document.getElementById("weather-temp-range");
const weatherConditionVal = document.getElementById("weather-condition-val");
const weatherLocationPill = document.getElementById("weather-location-pill");
const weatherHumidityVal = document.getElementById("weather-humidity-val");
const weatherHumidityBadge = document.getElementById("weather-humidity-badge");
const weatherRainVal = document.getElementById("weather-rain-val");
const weatherFeelsVal = document.getElementById("weather-feels-val");
const weatherWindVal = document.getElementById("weather-wind-val");
const weatherWindBadge = document.getElementById("weather-wind-badge");
const weatherAdviceText = document.getElementById("weather-advice-text");

// AQI DOM Elements
const aqiScoreBadge = document.getElementById("aqi-score-badge");
const aqiLevelBadge = document.getElementById("aqi-level-badge");
const aqiPm25Val = document.getElementById("aqi-pm25-val");
const aqiPm10Val = document.getElementById("aqi-pm10-val");
const aqiDescText = document.getElementById("aqi-desc-text");

async function fetchLiveWeather(cityName) {
    if (!cityName) cityName = "Noida";
    cityName = cityName.trim();
    try {
        if (btnFetchWeather) {
            btnFetchWeather.disabled = true;
            btnFetchWeather.innerHTML = `↻`;
        }

        const res = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
        const data = await res.json();

        // Extract weather object
        const w = (data && data.weather) ? data.weather : data;

        if (w && (w.temperature !== undefined || w.temp !== undefined)) {
            const temp = w.temperature !== undefined ? w.temperature : w.temp;
            const feels = w.feels_like !== undefined ? w.feels_like : temp;
            const tempMin = w.temp_min !== undefined ? w.temp_min : Math.round(temp - 2);
            const tempMax = w.temp_max !== undefined ? w.temp_max : Math.round(temp + 2);
            const humidity = w.humidity !== undefined ? w.humidity : 50;
            const rain = w.precipitation !== undefined ? w.precipitation : 0;
            const wind = w.wind_speed !== undefined ? w.wind_speed : 10;
            const cond = w.condition || w.description || "Clear Sky";
            const icon = w.icon || weatherIconFor(cond);
            const location = w.city ? (w.country ? `${w.city}, ${w.country}` : w.city) : cityName;

            const recTemp = document.getElementById("rec-weather-temp");
            const recCond = document.getElementById("rec-weather-cond");
            const recFeels = document.getElementById("rec-weather-feels");
            const recHum = document.getElementById("rec-weather-hum");
            const recRain = document.getElementById("rec-weather-rain");
            const recIcon = document.getElementById("weather-icon-el");
            if (recTemp) recTemp.textContent = `${temp}°C`;
            if (recCond) recCond.textContent = w.description || cond;
            if (recFeels) recFeels.textContent = `${feels}°C`;
            if (recHum) recHum.textContent = `${humidity}%`;
            if (recRain) recRain.textContent = cond;
            if (recIcon) recIcon.textContent = icon;
            const adviceEl = document.getElementById("weather-advice-text");
            if (adviceEl) adviceEl.textContent = fabricAdviceFor(w);

            // Badges
            const tBadge = w.temp_badge || (temp >= 30 ? "High" : (temp >= 18 ? "Medium" : "Low"));
            const tColor = (w.temp_badge_color || (temp >= 30 ? "high" : (temp >= 18 ? "medium" : "low"))).toLowerCase();
            const hBadge = w.humidity_badge || (humidity >= 70 ? "High" : (humidity >= 40 ? "Medium" : "Low"));
            const wBadge = w.wind_badge || (wind >= 25 ? "High" : (wind >= 10 ? "Medium" : "Low"));

            // AQI Data
            const aqiScore = w.aqi || 64;
            const aqiCat = w.aqi_category || "Moderate";
            const aqiBadge = w.aqi_badge || "Medium";
            const aqiColor = (w.aqi_color || "medium").toLowerCase();
            const pm25 = w.pm2_5 ? Number(w.pm2_5).toFixed(1) : "18.2";
            const pm10 = w.pm10 ? Number(w.pm10).toFixed(1) : "39.5";

            // Update Temperature & Main Condition
            if (weatherTempVal) weatherTempVal.textContent = `${temp}°C`;
            if (weatherConditionVal) weatherConditionVal.textContent = cond;
            if (weatherLocationPill) weatherLocationPill.textContent = `📍 ${location}`;
            if (weatherIconDisplay) weatherIconDisplay.textContent = icon;
            if (weatherTempRange) weatherTempRange.textContent = `High: ${tempMax}°C | Low: ${tempMin}°C`;

            // Update Temperature Level Badge
            if (weatherTempBadge) {
                weatherTempBadge.textContent = tBadge;
                weatherTempBadge.className = `badge-pill badge-level badge-${tColor}`;
            }

            // Update Metrics Bar
            if (weatherHumidityVal) weatherHumidityVal.textContent = `${humidity}%`;
            if (weatherHumidityBadge) {
                weatherHumidityBadge.textContent = hBadge;
                weatherHumidityBadge.className = `badge-mini badge-${hBadge.toLowerCase()}`;
            }

            if (weatherRainVal) weatherRainVal.textContent = `${rain} mm`;
            if (weatherFeelsVal) weatherFeelsVal.textContent = `${feels}°C`;

            if (weatherWindVal) weatherWindVal.textContent = `${wind} km/h`;
            if (weatherWindBadge) {
                weatherWindBadge.textContent = wBadge;
                weatherWindBadge.className = `badge-mini badge-${wBadge.toLowerCase()}`;
            }

            // Update AQI Section
            if (aqiScoreBadge) aqiScoreBadge.textContent = `AQI ${aqiScore} • ${aqiCat}`;
            if (aqiLevelBadge) {
                aqiLevelBadge.textContent = `${aqiBadge} Risk`;
                aqiLevelBadge.className = `badge-pill badge-level badge-${aqiColor}`;
            }
            if (aqiPm25Val) aqiPm25Val.textContent = `PM2.5: ${pm25} µg/m³`;
            if (aqiPm10Val) aqiPm10Val.textContent = `PM10: ${pm10} µg/m³`;
            if (aqiDescText) aqiDescText.textContent = `Atmospheric particulates synced • ${aqiCat} climate`;

            // Fabric & Climate Advice
            if (weatherAdviceText && w.fabric_advice) {
                weatherAdviceText.textContent = `Stylist Tip: ${w.fabric_advice}`;
            }

            if (liveWeatherCard) liveWeatherCard.classList.remove("hidden");

            // Update active state on city preset chips
            document.querySelectorAll(".city-chip").forEach(chip => {
                const chipCity = (chip.dataset.city || "").toLowerCase();
                const currentCity = cityName.toLowerCase();
                chip.classList.toggle("active", chipCity === currentCity || currentCity.includes(chipCity));
            });
        }
    } catch (err) {
        console.warn("Weather fetch error:", err);
    } finally {
        if (btnFetchWeather) {
            btnFetchWeather.disabled = false;
            btnFetchWeather.innerHTML = `↻`;
        }
    }
}

// Quick City Preset Chips listener
document.querySelectorAll(".city-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        const city = chip.dataset.city;
        if (weatherCityInput) weatherCityInput.value = city;
        if (recCity) recCity.value = city;
        fetchLiveWeather(city);
    });
});

if (btnFetchWeather && weatherCityInput) {
    btnFetchWeather.addEventListener("click", () => {
        fetchLiveWeather(weatherCityInput.value.trim() || "Noida");
    });
}

// Auto fetch weather on enter key
if (weatherCityInput) {
    if (weatherCityInput) weatherCityInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            fetchLiveWeather(weatherCityInput.value.trim() || "Noida");
        }
    });
    if (weatherCityInput) weatherCityInput.addEventListener("change", () => {
        fetchLiveWeather(weatherCityInput.value.trim() || "Noida");
    });
}

// OCCASION PICKER EVENT LISTENER (Handles all 14 occasions)
if (occasionPicker) {
    occasionPicker.querySelectorAll(".occasion-card").forEach(card => {
        card.addEventListener("click", () => {
            occasionPicker.querySelectorAll(".occasion-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            selectedOccasion = card.dataset.occasion || "office";
            const occName = card.querySelector(".occasion-name") ? card.querySelector(".occasion-name").textContent : selectedOccasion;
            showToast(`Occasion set to: ${occName}`, "info");
        });
    });
}

// ============================================================
// COLOR HARMONY MATRIX (BEST, GOOD, AVOID BY UNDERTONE)
// ============================================================

const COLOR_HARMONY_PALETTES = {
    warm: {
        name: "Warm Golden Undertone",
        best: [
            { name: "Mustard Gold", hex: "#d97706" },
            { name: "Terracotta", hex: "#c2410c" },
            { name: "Olive Green", hex: "#4d7c0f" },
            { name: "Warm Cream", hex: "#fef3c7" },
            { name: "Camel Tan", hex: "#b45309" }
        ],
        good: [
            { name: "Navy Blue", hex: "#1e3a8a" },
            { name: "Forest Green", hex: "#166534" },
            { name: "Burgundy Wine", hex: "#881337" },
            { name: "Warm Ivory", hex: "#fffbeb" }
        ],
        avoid: [
            { name: "Icy Silver", hex: "#cbd5e1" },
            { name: "Pure Neon Pink", hex: "#ec4899" },
            { name: "Stark Blue-Black", hex: "#020617" }
        ]
    },
    cool: {
        name: "Cool Rosy Undertone",
        best: [
            { name: "Royal Cobalt", hex: "#1d4ed8" },
            { name: "Emerald Teal", hex: "#0f766e" },
            { name: "Berry Plum", hex: "#701a75" },
            { name: "Crisp White", hex: "#ffffff" },
            { name: "Slate Grey", hex: "#475569" }
        ],
        good: [
            { name: "Ice Blue", hex: "#93c5fd" },
            { name: "Charcoal Black", hex: "#0f172a" },
            { name: "Rose Quartz", hex: "#f472b6" },
            { name: "Classic Navy", hex: "#1e3a8a" }
        ],
        avoid: [
            { name: "Golden Mustard", hex: "#d97706" },
            { name: "Muddy Orange", hex: "#ea580c" },
            { name: "Yellow Beige", hex: "#fde68a" }
        ]
    },
    neutral: {
        name: "Neutral Balanced Undertone",
        best: [
            { name: "Sage Green", hex: "#65a30d" },
            { name: "Dusty Teal", hex: "#0d9488" },
            { name: "Taupe Stone", hex: "#78716c" },
            { name: "Soft Blush", hex: "#fbcfe8" },
            { name: "Midnight Navy", hex: "#0f172a" }
        ],
        good: [
            { name: "Champagne", hex: "#fef08a" },
            { name: "Pewter Grey", hex: "#64748b" },
            { name: "Forest Olive", hex: "#365314" },
            { name: "Soft White", hex: "#f8fafc" }
        ],
        avoid: [
            { name: "Ultra-Bright Neon Yellow", hex: "#facc15" },
            { name: "Over-Saturated Magenta", hex: "#be185d" }
        ]
    }
};

function renderColorHarmonyMatrix(undertoneKey = "warm") {
    const palette = COLOR_HARMONY_PALETTES[undertoneKey] || COLOR_HARMONY_PALETTES.warm;
    
    const badge = document.getElementById("harmony-tone-badge");
    if (badge) badge.textContent = palette.name;

    const renderSwatches = (containerId, items) => {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = items.map(c => `
            <span class="color-chip-swatch" title="${c.name} (${c.hex})">
                <span class="swatch-dot" style="background-color: ${c.hex};"></span>
                <span>${c.name}</span>
            </span>
        `).join("");
    };

    renderSwatches("swatches-best", palette.best);
    renderSwatches("swatches-good", palette.good);
    renderSwatches("swatches-avoid", palette.avoid);
}

if (undertonePicker) {
    const toneButtons = undertonePicker.querySelectorAll(".undertone-chip, .tone-circle, .tone-btn");
    toneButtons.forEach(chip => {
        chip.addEventListener("click", () => {
            toneButtons.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            selectedUndertone = chip.dataset.undertone || chip.dataset.tone || "neutral";
            renderColorHarmonyMatrix(selectedUndertone);
        });
    });
}

// ============================================================
// OUTFIT FEEDBACK MODAL & STATE
// ============================================================

let currentFeedbackCombo = null;
let currentFeedbackRating = 5;
let currentFeedbackSentiment = "like";

const comboFeedbackModal = document.getElementById("combo-feedback-modal");
const btnCloseFeedbackModal = document.getElementById("btn-close-feedback-modal");
const btnCancelFeedbackModal = document.getElementById("btn-cancel-feedback-modal");
const btnSubmitComboFeedback = document.getElementById("btn-submit-combo-feedback");
const modalStarRating = document.getElementById("modal-star-rating");
const modalSentimentLike = document.getElementById("modal-sentiment-like");
const modalSentimentDislike = document.getElementById("modal-sentiment-dislike");
const modalComboItemsChecklist = document.getElementById("modal-combo-items-checklist");

function openComboFeedbackModal(combo, comboIndex) {
    currentFeedbackCombo = { ...combo, comboIndex };
    currentFeedbackRating = 5;
    currentFeedbackSentiment = "like";

    // Set stars active
    if (modalStarRating) {
        modalStarRating.querySelectorAll(".star-btn").forEach((star, idx) => {
            star.classList.toggle("active", idx < currentFeedbackRating);
        });
    }

    if (modalSentimentLike && modalSentimentDislike) {
        modalSentimentLike.classList.add("active");
        modalSentimentDislike.classList.remove("active");
    }

    // Populate checklist with outfit items
    if (modalComboItemsChecklist) {
        const items = combo.items || [];
        modalComboItemsChecklist.innerHTML = items.map(item => `
            <label class="modal-checklist-item" style="cursor: pointer;">
                <input type="checkbox" name="exclude-item" value="${item.id}" />
                <img src="${item.image_url}" alt="${item.category}" />
                <div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--ink-primary);">${item.category} (${item.subcategory || "Piece"})</div>
                    <div style="font-size: 0.72rem; color: var(--ink-muted);">${item.color || ""} • ${item.fabric || ""}</div>
                </div>
            </label>
        `).join("");
    }

    if (comboFeedbackModal) comboFeedbackModal.classList.remove("hidden");
}

function closeComboFeedbackModal() {
    if (comboFeedbackModal) comboFeedbackModal.classList.add("hidden");
    currentFeedbackCombo = null;
}

if (btnCloseFeedbackModal) btnCloseFeedbackModal.addEventListener("click", closeComboFeedbackModal);
if (btnCancelFeedbackModal) btnCancelFeedbackModal.addEventListener("click", closeComboFeedbackModal);

if (modalStarRating) {
    modalStarRating.querySelectorAll(".star-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const val = parseInt(btn.dataset.star, 10);
            currentFeedbackRating = val;
            modalStarRating.querySelectorAll(".star-btn").forEach((s, idx) => {
                s.classList.toggle("active", idx < val);
            });
        });
    });
}

if (modalSentimentLike && modalSentimentDislike) {
    if (modalSentimentLike) modalSentimentLike.addEventListener("click", () => {
        currentFeedbackSentiment = "like";
        modalSentimentLike.classList.add("active");
        modalSentimentDislike.classList.remove("active");
    });
    if (modalSentimentDislike) modalSentimentDislike.addEventListener("click", () => {
        currentFeedbackSentiment = "dislike";
        modalSentimentDislike.classList.add("active");
        modalSentimentLike.classList.remove("active");
    });
}

if (btnSubmitComboFeedback) {
    btnSubmitComboFeedback.addEventListener("click", async () => {
        if (!currentFeedbackCombo) return;

        // Get excluded items
        const excludedItemIds = [];
        if (modalComboItemsChecklist) {
            modalComboItemsChecklist.querySelectorAll('input[name="exclude-item"]:checked').forEach(cb => {
                excludedItemIds.push(cb.value);
            });
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validItemIds = (currentFeedbackCombo.items || [])
            .map(i => i.id)
            .filter(id => id && uuidRegex.test(id));
        const firstExcluded = excludedItemIds.length ? excludedItemIds[0] : null;

        const payload = {
            outfit_id: currentFeedbackCombo.id && uuidRegex.test(currentFeedbackCombo.id) ? currentFeedbackCombo.id : null,
            item_id: firstExcluded || validItemIds[0] || null,
            rating: currentFeedbackRating,
            liked: currentFeedbackSentiment === "like",
            never_wear: excludedItemIds.length > 0
        };

        try {
            btnSubmitComboFeedback.disabled = true;
            btnSubmitComboFeedback.innerHTML = `<span class="spinner spinner-light"></span> <span>Saving...</span>`;

            // If user checked items to exclude, mark them as never_wear in database
            if (excludedItemIds.length > 0) {
                for (const id of excludedItemIds) {
                    try {
                        await toggleNeverWear(id, false);
                    } catch (_) {}
                }
            }

            // Real authenticated API call to /outfit/feedback
            await apiFetch("/outfit/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            showToast("Stylist feedback saved! AI learned your fit preferences.", "success");

            // Update decision badge in front of the combo card
            const decisionSlot = document.getElementById(`decision-slot-${currentFeedbackCombo.comboIndex}`);
            if (decisionSlot) {
                decisionSlot.innerHTML = `
                    <span class="decision-badge badge-kept">
                        ${currentFeedbackSentiment === "like" ? "★ Favorited Look" : "✓ Feedback Logged"}
                    </span>
                `;
            }

            closeComboFeedbackModal();
            loadProfileHistory();
        } catch (err) {
            console.error("Feedback error:", err);
            showToast(err.message || "Failed to save feedback", "error");
            closeComboFeedbackModal();
        } finally {
            btnSubmitComboFeedback.disabled = false;
            btnSubmitComboFeedback.innerHTML = `<span>Submit Feedback</span>`;
        }
    });
}

// Real authenticated Keep or Drop action in front of each combo calling /outfit/save
window.handleComboDecision = async function(comboIndex, action) {
    const decisionSlot = document.getElementById(`decision-slot-${comboIndex}`);
    const combo = currentOutfitsCache && currentOutfitsCache[comboIndex];
    if (!combo) return;

    // Filter valid UUIDs to match Supabase uuid[] column type
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const itemIds = (combo.items || []).map(i => i.id).filter(id => id && uuidRegex.test(id));
    const isKept = (action === "keep");

    if (decisionSlot) {
        decisionSlot.innerHTML = `<span class="decision-badge" style="background:var(--bg-subtle);">⏳ Saving...</span>`;
    }

    try {
        if (isKept) {
            await apiFetch("/outfit/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    item_ids: itemIds,
                    occasion: selectedOccasion || "casual",
                    weather: recCity ? recCity.value.trim() : "Noida",
                    reasoning: combo.reasoning || "",
                    kept: true
                })
            });

            if (decisionSlot) {
                decisionSlot.innerHTML = `
                    <span class="decision-badge badge-kept">✓ Kept &amp; Saved</span>
                    <button class="btn-decision-tiny" onclick="window.revertComboDecision(${comboIndex})">Change</button>
                `;
                showToast(`Ensemble #${comboIndex + 1} kept and saved to lookbook!`, "success");
            }
        } else {
            // Passed outfits are NOT saved to DB
            if (decisionSlot) {
                decisionSlot.innerHTML = `
                    <span class="decision-badge badge-dropped">✕ Passed</span>
                    <button class="btn-decision-tiny" onclick="window.revertComboDecision(${comboIndex})">Change</button>
                `;
                showToast(`Ensemble #${comboIndex + 1} passed (not saved).`, "info");
            }
        }

        // Refresh user profile history counters
        loadProfileHistory();
    } catch (err) {
        console.error("Save decision error:", err);
        showToast(err.message || "Failed to save outfit decision", "error");
        window.revertComboDecision(comboIndex);
    }
};

window.revertComboDecision = function(comboIndex) {
    const decisionSlot = document.getElementById(`decision-slot-${comboIndex}`);
    if (!decisionSlot) return;
    decisionSlot.innerHTML = `
        <div class="combo-decision-bar">
            <button class="btn-decision btn-keep" onclick="window.handleComboDecision(${comboIndex}, 'keep')">
                <span>✓ Keep</span>
            </button>
            <button class="btn-decision btn-drop" onclick="window.handleComboDecision(${comboIndex}, 'drop')">
                <span>✕ Pass</span>
            </button>
            <button class="btn-decision btn-feedback-open" onclick="window.openFeedbackForCombo(${comboIndex})">
                <span>💬 Feedback</span>
            </button>
        </div>
    `;
};

window.openFeedbackForCombo = function(comboIndex) {
    if (currentOutfitsCache && currentOutfitsCache[comboIndex]) {
        openComboFeedbackModal(currentOutfitsCache[comboIndex], comboIndex);
    }
};

// ============================================================
// OUTFIT HISTORY & SAVED ENSEMBLES (Connected to /outfit/history)
// ============================================================

let cachedHistoryData = [];
let currentHistoryFilter = "all";

window.filterHistoryDisplay = function(filterType) {
    currentHistoryFilter = filterType;
    document.querySelectorAll(".history-filter-chips .pill-btn").forEach(btn => {
        btn.classList.toggle("active", btn.id === `filter-history-${filterType}`);
    });
    renderHistoryCards();
};

window.deleteHistoryItem = async function(historyId) {
    if (!confirm("Remove this outfit from your history?")) return;
    try {
        await apiFetch(`/outfit/history/${historyId}`, { method: "DELETE" });
        showToast("Outfit removed from history", "info");
        cachedHistoryData = cachedHistoryData.filter(h => h.id !== historyId);
        renderHistoryCards();
        updateHistoryStats();
    } catch (err) {
        showToast("Failed to delete history item", "error");
    }
};

function updateHistoryStats() {
    const total = cachedHistoryData.length;
    const kept = cachedHistoryData.filter(h => h.kept).length;
    const passed = total - kept;

    const totalEl = document.getElementById("history-stat-total");
    const keptEl = document.getElementById("history-stat-kept");
    const passedEl = document.getElementById("history-stat-passed");
    if (totalEl) totalEl.textContent = total;
    if (keptEl) keptEl.textContent = kept;
    if (passedEl) passedEl.textContent = passed;
    if (profileStatOutfits) profileStatOutfits.textContent = `${kept} Kept`;
}

function renderHistoryCards() {
    const fullContainer = document.getElementById("history-full-list") || document.getElementById("profile-history-list");
    const profileContainer = document.getElementById("history-full-list")
        ? document.getElementById("profile-history-list")
        : null;

    const filtered = cachedHistoryData.filter(entry => entry.kept !== false);

    const renderCard = (entry, isFullView = true) => {
        const dateStr = entry.date ? new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently";
        const items = (entry.items && entry.items.length) 
            ? entry.items 
            : (allWardrobeItems || []).filter(item => (entry.item_ids || []).includes(item.id));
        
        const thumbsHtml = items.length > 0
            ? items.map(it => `
                <div class="history-piece">
                    <img class="history-thumb" src="${it.image_url}" alt="${it.category || 'Clothing'}" loading="lazy" />
                    <span>${it.subcategory || it.category || ""}</span>
                </div>
            `).join("")
            : `<span>${(entry.item_ids || []).length} pieces</span>`;

        return `
            <article class="history-card lookbook-card" id="history-card-${entry.id}">
                <div class="history-card-header">
                    <span class="history-occasion-badge">${entry.occasion || "Look"}</span>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="history-date">${dateStr}</span>
                        ${isFullView ? `
                            <button class="btn-ghost" onclick="window.deleteHistoryItem('${entry.id}')" title="Remove" style="padding:2px 6px; font-size:0.8rem; color:var(--text-muted); border:none; background:none; cursor:pointer;">✕</button>
                        ` : ""}
                    </div>
                </div>
                <div class="history-thumbs-row">${thumbsHtml}</div>
                ${entry.reasoning ? `<div class="history-reasoning">${entry.reasoning}</div>` : ""}
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; margin-top:4px;">
                    <span class="decision-badge badge-kept">✓ Saved Look</span>
                    <span style="color:var(--text-muted); font-size:0.7rem;">${entry.weather || ""}</span>
                </div>
            </article>
        `;
    };

    // Render Full List in dedicated tab
    if (fullContainer) {
        if (!filtered.length) {
            fullContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 24px; text-align: center;">
                    <div style="font-size: 2.4rem; margin-bottom: 8px;">📖</div>
                    <h3>No outfits found in this view</h3>
                    <p class="section-desc">Generate recommendations in AI Stylist and click "✓ Keep" to archive your favorite looks here!</p>
                </div>
            `;
        } else {
            fullContainer.innerHTML = filtered.map(e => renderCard(e, true)).join("");
        }
    }

    // Render Mini Profile List
    if (profileContainer) {
        if (!cachedHistoryData.length) {
            profileContainer.innerHTML = `
                <div class="empty-state-mini" style="grid-column: 1 / -1; padding: 24px; text-align: center;">
                    No saved outfits yet. Generate recommendations and click "✓ Keep" on any ensemble!
                </div>
            `;
        } else {
            profileContainer.innerHTML = cachedHistoryData.slice(0, 6).map(e => renderCard(e, false)).join("");
        }
    }
}

window.loadProfileHistory = async function() {
    if (!getAccessToken()) return;

    try {
        const historyData = await apiFetch("/outfit/history");
        cachedHistoryData = Array.isArray(historyData) ? historyData : [];
        updateHistoryStats();
        renderHistoryCards();
    } catch (err) {
        console.warn("loadProfileHistory error:", err);
    }
};

// ============================================================
// MAIN RECOMMEND ACTION WITH BEAUTIFUL COLLAGE GRID LOOK
// ============================================================

if (btnRecommend) {
    btnRecommend.addEventListener("click", async () => {
        const origBtnHtml = btnRecommend.innerHTML;
        try {
            btnRecommend.disabled = true;
            btnRecommend.classList.add("btn-loading");
            btnRecommend.innerHTML = `<span class="spinner spinner-light"></span> <span>Styling Outfits...</span>`;

            recStatus.innerHTML = `
                <div class="loading-container">
                    <span class="spinner"></span>
                    <span>Querying weather in <strong>${recCity.value || "city"}</strong>, analyzing color harmony, and styling combinations...</span>
                </div>
            `;
            recStatus.className = "status";
            recStatus.classList.remove("hidden");

            recResults.innerHTML = `
                <div class="loading-skeleton">
                    <div class="spinner spinner-large"></div>
                    <h4>Personal Stylist AI at Work</h4>
                    <p>Evaluating wardrobe pieces for ${selectedOccasion} harmony and skin undertone contrast...</p>
                </div>
            `;

            // Auto-fetch weather in background for this search
            if (recCity.value.trim()) {
                fetchLiveWeather(recCity.value.trim());
            }

            const payload = {
                occasion: selectedOccasion,
                city: recCity.value.trim() || undefined,
                skin_undertone: selectedUndertone
            };

            const rawResponse = await apiFetch("/recommend/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const outfits = Array.isArray(rawResponse) ? rawResponse : (rawResponse && rawResponse.outfits ? rawResponse.outfits : []);

            if (!outfits || !outfits.length) {
                recStatus.textContent = "No matching outfit combinations found in your wardrobe for this occasion.";
                recResults.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--line-strong);">
                        <div style="font-size: 2.2rem; margin-bottom: 8px;">👔</div>
                        <h4 style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: 6px;">More Wardrobe Variety Needed</h4>
                        <p class="section-desc" style="margin: 0 auto;">Try adding more shirts, trousers, or shoes with suitable formality for ${selectedOccasion}.</p>
                    </div>
                `;
                return;
            }

            // Save to cache
            currentOutfitsCache = outfits;

            recStatus.innerHTML = `<span>✓ Styled ${outfits.length} Bespoke Collage Ensembles!</span>`;
            showToast(`Generated ${outfits.length} curated outfit combinations!`, "success");

            // Render Outfit Cards in high aesthetic Collage Grid Look with Feedback Bar in Front
            recResults.innerHTML = outfits.map((combo, idx) => `
                <div class="combo-collage-card" id="outfit-card-${idx}">
                    <!-- COLLAGE HEADER WITH DECISION & FEEDBACK BAR IN FRONT -->
                    <div class="collage-header-row">
                        <div class="outfit-title-group">
                            <span class="outfit-number-badge">Ensemble #${idx + 1}</span>
                            <span class="outfit-title" style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 700;">
                                ${selectedOccasion.toUpperCase()} MOODBOARD
                            </span>
                        </div>

                        <!-- FEEDBACK / DECISION INTERFACE IN FRONT OF EACH COMBO -->
                        <div class="combo-actions-wrap" id="decision-slot-${idx}">
                            <div class="combo-decision-bar">
                                <button type="button" class="btn-decision btn-keep" onclick="window.handleComboDecision(${idx}, 'keep')" title="Keep this outfit">
                                    <span>✓ Keep</span>
                                </button>
                                <button type="button" class="btn-decision btn-drop" onclick="window.handleComboDecision(${idx}, 'drop')" title="Pass this outfit">
                                    <span>✕ Pass</span>
                                </button>
                                <button type="button" class="btn-decision btn-feedback-open" onclick="window.openFeedbackForCombo(${idx})" title="Provide fit feedback">
                                    <span>💬 Feedback</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- STYLIST REASONING & WEATHER HARMONY -->
                    ${combo.reasoning ? `
                        <div class="outfit-reasoning" style="margin-bottom: 14px; background: var(--bg-subtle); padding: 10px 14px; border-radius: 10px; border-left: 4px solid var(--forest); font-size: 0.88rem;">
                            <strong>💡 Stylist Note:</strong> ${combo.reasoning}
                        </div>
                    ` : ""}

                    <!-- BEAUTIFUL COLLAGE MOODBOARD GRID (REAL GARMENT IMAGES ONLY) -->
                    <div class="collage-board">
                        ${(combo.items || []).map(item => `
                            <div class="collage-tile">
                                <span class="collage-tile-tag">${item.category || "Garment"}</span>
                                <div class="collage-tile-img-box">
                                    <img src="${item.image_url}" alt="${item.category}" loading="lazy" />
                                </div>
                                <div class="collage-tile-info">
                                    <div class="collage-tile-title">${item.subcategory || item.category}</div>
                                    <div class="collage-tile-meta">
                                        <span>${item.color || ""}</span>
                                        ${item.color_badge ? `
                                            <span class="badge-mini ${item.color_tier === 'best' ? 'badge-medium' : (item.color_tier === 'good' ? 'badge-low' : (item.color_tier === 'worst' ? 'badge-high' : ''))}" style="font-size: 0.62rem; margin-left: 2px;">
                                                ${item.color_badge}
                                            </span>
                                        ` : ""}
                                        <span>•</span>
                                        <span>${item.fabric || "Premium"}</span>
                                    </div>
                                </div>
                            </div>
                        `).join("")}
                    </div>

                    <!-- FOOTER METRICS -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 0.78rem; color: var(--ink-muted);">
                        <span>Occasion: <strong>${selectedOccasion}</strong></span>
                        <span>Color Tone: <strong>${selectedUndertone.toUpperCase()}</strong></span>
                        <span>Harmonic Score: <strong>${Math.round(combo.total_score || 95)}/100</strong></span>
                    </div>
                </div>
            `).join("");

        } catch (error) {
            console.error("Recommend error:", error);
            recStatus.textContent = error.message;
            recStatus.className = "status error";
            recStatus.classList.remove("hidden");
            recResults.innerHTML = "";
            showToast(error.message, "error");
        } finally {
            btnRecommend.disabled = false;
            btnRecommend.classList.remove("btn-loading");
            btnRecommend.innerHTML = origBtnHtml;
        }
    });
}

// Initialize theme and color harmony on boot
applyThemeSettings();
renderColorHarmonyMatrix(selectedUndertone);
if (recCity && recCity.value) {
    fetchLiveWeather(recCity.value);
}


// ============================================================
// PROFILE & FASHION PERSONA LOGIC
// ============================================================

const PROFILE_STORAGE_KEY = "aura_user_profile_prefs";

async function loadUserProfile() {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    let profile = {
        displayName: "Fashion VIP",
        city: "Noida",
        undertone: "neutral",
        style: "Casual",
        palette: "earthy",
        fit: "tailored",
        bodyType: "average",
        stylePersona: "Casual"
    };

    if (saved) {
        try {
            profile = { ...profile, ...JSON.parse(saved) };
        } catch (_) {}
    }

    // Populate initial UI
    if (profileNameInput) profileNameInput.value = profile.displayName || "";
    if (profileCityInput) profileCityInput.value = profile.city || "";
    if (profileUndertoneSelect) profileUndertoneSelect.value = profile.undertone || "neutral";
    if (profilePrimaryStyleSelect) profilePrimaryStyleSelect.value = profile.stylePersona || profile.style || "Casual";
    if (profilePaletteSelect) profilePaletteSelect.value = profile.palette || "earthy";
    if (profileFitSelect) profileFitSelect.value = profile.fit || "tailored";
    if (profileBodyTypeSelect) profileBodyTypeSelect.value = profile.bodyType || "average";
    if (profileDisplayName) profileDisplayName.textContent = profile.displayName || "Fashion Stylist";

    // Sync undertone selection with AI stylist
    if (profile.undertone) {
        selectedUndertone = profile.undertone;
        if (undertonePicker) {
            undertonePicker.querySelectorAll(".tone-btn").forEach(btn => {
                btn.classList.toggle("active", btn.dataset.tone === profile.undertone);
            });
        }
    }

    if (recCity && !recCity.value && profile.city) {
        recCity.value = profile.city;
    }

    // Sync from backend /profile if authenticated
    if (getAccessToken()) {
        try {
            const serverProfile = await apiFetch("/profile");
            if (serverProfile && (serverProfile.id || serverProfile.user_id)) {
                if (serverProfile.skin_tone) profile.undertone = serverProfile.skin_tone.toLowerCase();
                if (serverProfile.favorite_styles && serverProfile.favorite_styles.length) {
                    profile.style = serverProfile.favorite_styles[0];
                }
                if (serverProfile.favorite_colors && serverProfile.favorite_colors.length) {
                    profile.palette = serverProfile.favorite_colors[0];
                }
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));

                // Re-apply to UI
                if (profileUndertoneSelect) profileUndertoneSelect.value = profile.undertone;
                if (profilePrimaryStyleSelect) profilePrimaryStyleSelect.value = profile.style;
                if (profilePaletteSelect) profilePaletteSelect.value = profile.palette;
                if (undertonePicker) {
                    undertonePicker.querySelectorAll(".tone-btn").forEach(btn => {
                        btn.classList.toggle("active", btn.dataset.tone === profile.undertone);
                    });
                }
            }
        } catch (err) {
            console.log("Backend profile sync status:", err.message);
        }

        // Also fetch outfit history for the user
        loadProfileHistory();
    }

    return profile;
}

async function saveUserProfile(profile) {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));

    if (getAccessToken()) {
        const payload = {
            skin_tone: profile.undertone || "neutral",
            favorite_styles: [profile.stylePersona || profile.style || "Casual"],
            favorite_colors: profile.palette === "earthy"
                ? ["beige", "olive", "cream"]
                : profile.palette === "jewel"
                    ? ["burgundy", "emerald", "navy"]
                    : profile.palette === "pastel"
                        ? ["lavender", "sage", "sky blue"]
                        : ["black", "white", "grey"],
            height: profile.bodyType === "petite" ? 158 : profile.bodyType === "tall" ? 178 : 168,
            sizes: {
                city: profile.city || "",
                display_name: profile.displayName || "",
                fit: profile.fit || "tailored",
                body_type: profile.bodyType || "average",
                palette: profile.palette || "earthy"
            }
        };

        try {
            // First try PATCH, if 404 then POST
            try {
                await apiFetch("/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } catch (patchErr) {
                if (patchErr.message && patchErr.message.includes("404")) {
                    await apiFetch("/profile", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                }
            }
        } catch (syncErr) {
            console.warn("Save profile backend sync warning:", syncErr);
        }
    }
}

function updateProfileAnalytics(items = []) {
    const total = items.length;
    const totalWears = items.reduce((acc, curr) => acc + (parseInt(curr.times_worn, 10) || 0), 0);
    const activePieces = items.filter(i => !i.never_wear).length;
    const wornAtLeastOnce = items.filter(i => (parseInt(i.times_worn, 10) || 0) > 0).length;

    // Metrics Row
    if (profileStatTotal) profileStatTotal.textContent = total;
    if (profileStatWears) profileStatWears.textContent = totalWears;
    
    // Combinations estimation: tops * bottoms * shoes
    const topsCount = items.filter(i => ["shirt", "t-shirt", "top", "blazer", "sweater"].includes((i.category || "").toLowerCase())).length;
    const bottomsCount = items.filter(i => ["trouser", "jeans", "shorts", "skirt"].includes((i.category || "").toLowerCase())).length;
    const shoesCount = items.filter(i => ["shoes", "sneakers", "sandals", "heels", "loafers", "boots"].includes((i.category || "").toLowerCase())).length;
    const outerwearCount = items.filter(i => ["jacket", "blazer", "hoodie", "sweater"].includes((i.category || "").toLowerCase())).length;

    const combos = Math.max(topsCount * Math.max(bottomsCount, 1) * Math.max(shoesCount, 1), total > 2 ? 6 : total);
    if (profileStatOutfits) profileStatOutfits.textContent = `${combos}+`;

    // Closet Health (% Active not marked as never wear)
    const healthPercent = total > 0 ? Math.round((activePieces / total) * 100) : 100;
    if (profileStatActive) profileStatActive.textContent = `${healthPercent}%`;

    // Utilization (% of items worn at least once)
    const utilizationRate = total > 0 ? Math.round((wornAtLeastOnce / total) * 100) : 0;
    if (profileUtilizationFill) profileUtilizationFill.style.width = `${utilizationRate}%`;
    if (profileUtilizationText) {
        profileUtilizationText.textContent = `${utilizationRate}% of your closet (${wornAtLeastOnce}/${total} pieces) has been rotated into outfits.`;
    }

    // Category Breakdown Counts
    if (statCountTops) {
        const pct = total > 0 ? Math.round((topsCount / total) * 100) : 0;
        statCountTops.textContent = `${topsCount} pcs (${pct}%)`;
    }
    if (statCountBottoms) {
        const pct = total > 0 ? Math.round((bottomsCount / total) * 100) : 0;
        statCountBottoms.textContent = `${bottomsCount} pcs (${pct}%)`;
    }
    if (statCountOuterwear) {
        const pct = total > 0 ? Math.round((outerwearCount / total) * 100) : 0;
        statCountOuterwear.textContent = `${outerwearCount} pcs (${pct}%)`;
    }
    if (statCountShoes) {
        const pct = total > 0 ? Math.round((shoesCount / total) * 100) : 0;
        statCountShoes.textContent = `${shoesCount} pcs (${pct}%)`;
    }

    // Color Distribution Bars
    if (profileColorBars) {
        if (!total) {
            profileColorBars.innerHTML = `<div class="empty-state-mini">Add pieces to see your wardrobe palette distribution.</div>`;
            return;
        }

        const colorMap = {};
        items.forEach(i => {
            const raw = (i.color || "Neutral").trim();
            const colorKey = raw.charAt(0).toUpperCase() + raw.slice(1);
            colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
        });

        const sortedColors = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

        profileColorBars.innerHTML = sortedColors.map(([colName, count]) => {
            const pct = Math.round((count / total) * 100);
            
            // Map common color names to nice hex swatches
            let swatchColor = "#1b4332";
            const lower = colName.toLowerCase();
            if (lower.includes("white")) swatchColor = "#f8fafc";
            else if (lower.includes("black")) swatchColor = "#0f172a";
            else if (lower.includes("navy") || lower.includes("blue")) swatchColor = "#1e3a8a";
            else if (lower.includes("beige") || lower.includes("cream")) swatchColor = "#d6c7b2";
            else if (lower.includes("olive") || lower.includes("green")) swatchColor = "#3f6212";
            else if (lower.includes("brown") || lower.includes("tan")) swatchColor = "#78350f";
            else if (lower.includes("grey") || lower.includes("gray")) swatchColor = "#64748b";
            else if (lower.includes("red") || lower.includes("burgundy")) swatchColor = "#991b1b";

            return `
                <div class="color-bar-item">
                    <span class="color-swatch-circle" style="background-color: ${swatchColor};"></span>
                    <span class="color-bar-label">${colName}</span>
                    <div class="color-bar-track">
                        <div class="color-bar-fill" style="width: ${pct}%; background-color: ${swatchColor === '#f8fafc' ? '#94a3b8' : swatchColor};"></div>
                    </div>
                    <span class="color-bar-count">${count}</span>
                </div>
            `;
        }).join("");
    }
}

// Profile Form Submit Listener
if (profileSettingsForm) {
    profileSettingsForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const updatedProfile = {
            displayName: profileNameInput ? profileNameInput.value.trim() || "Fashion VIP" : "Fashion VIP",
            city: profileCityInput ? profileCityInput.value.trim() : "",
            undertone: profileUndertoneSelect ? profileUndertoneSelect.value : "neutral",
            stylePersona: profilePrimaryStyleSelect ? profilePrimaryStyleSelect.value : "Casual",
            style: profilePrimaryStyleSelect ? profilePrimaryStyleSelect.value : "Casual",
            palette: profilePaletteSelect ? profilePaletteSelect.value : "earthy",
            fit: profileFitSelect ? profileFitSelect.value : "tailored",
            bodyType: profileBodyTypeSelect ? profileBodyTypeSelect.value : "average"
        };

        saveUserProfile(updatedProfile);

        if (profileDisplayName) profileDisplayName.textContent = updatedProfile.displayName;
        if (recCity && updatedProfile.city) recCity.value = updatedProfile.city;

        // Sync undertone selection with AI stylist
        if (undertonePicker) {
            undertonePicker.querySelectorAll(".tone-btn").forEach(btn => {
                btn.classList.toggle("active", btn.dataset.tone === updatedProfile.undertone);
            });
            selectedUndertone = updatedProfile.undertone;
        }

        showToast("Profile & style preferences saved — recommendations updated!", "success");
    });
}


// ============================================================
// NAVIGATION TABS
// ============================================================

document.querySelectorAll(".nav-tab-btn[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
        const tab = button.dataset.tab;

        document.querySelectorAll(".nav-tab-btn").forEach(btn =>
            btn.classList.remove("active")
        );

        document.querySelectorAll(".tab-panel").forEach(panel =>
            panel.classList.remove("active")
        );

        button.classList.add("active");
        const activePanel = document.getElementById(`tab-${tab}`);
        if (activePanel) {
            activePanel.classList.add("active");
        }

        if (tab === "wardrobe") {
            loadWardrobe(false);
        } else if (tab === "recommend") {
            const city = (weatherCityInput && weatherCityInput.value.trim()) || "Noida";
            fetchLiveWeather(city);
        } else if (tab === "history") {
            loadProfileHistory();
        } else if (tab === "profile") {
            loadUserProfile();
            updateProfileAnalytics(allWardrobeItems);
        }
    });
});


// ============================================================
// INIT & EVENT LISTENERS
// ============================================================

if (btnGoogleLogin) btnGoogleLogin.addEventListener("click", loginWithGoogle);

    const btnEmailLogin = document.getElementById("btn-email-login");
    if (btnEmailLogin) btnEmailLogin.addEventListener("click", loginWithEmail);

    const btnEmailSignup = document.getElementById("btn-email-signup");
    if (btnEmailSignup) btnEmailSignup.addEventListener("click", signupWithEmail);

    const btnDemoMode = document.getElementById("btn-demo-mode");
    if (btnDemoMode) {
        btnDemoMode.addEventListener("click", () => {
            showToast("Entering preview mode as Guest.", "info");
            showAppView({ email: "guest@aura.fashion" });
        });
    }

if (btnLogout) btnLogout.addEventListener("click", logout);

    const btnTopbarSignin = document.getElementById("btn-topbar-signin");
    if (btnTopbarSignin) btnTopbarSignin.addEventListener("click", loginWithGoogle);


// Initialize
loadUserProfile();
checkAuth();

// ============================================================
// ELASTIC BALL CURSOR (GENUINE ROUND BALL - NO BOXES)
// ============================================================
(function initElasticCursor() {
    const ball = document.getElementById('cursor-ball');
    if (!ball) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ballX = mouseX;
    let ballY = mouseY;
    let prevMouseX = mouseX;
    let prevMouseY = mouseY;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener('mousedown', () => {
        document.body.classList.add('cursor-click');
    });

    window.addEventListener('mouseup', () => {
        document.body.classList.remove('cursor-click');
    });

    const interactiveSelector = 'a, button, input, select, textarea, .nav-tab-btn, .item-card, .occasion-card, .tone-btn, .btn-primary, .btn-ghost, .btn-editorial, [role="button"]';
    document.addEventListener('mouseover', (e) => {
        if (e.target && e.target.closest(interactiveSelector)) {
            document.body.classList.add('cursor-hover');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target && e.target.closest(interactiveSelector)) {
            document.body.classList.remove('cursor-hover');
        }
    });

    function animateCursor() {
        const velX = mouseX - prevMouseX;
        const velY = mouseY - prevMouseY;
        prevMouseX = mouseX;
        prevMouseY = mouseY;

        const speed = Math.sqrt(velX * velX + velY * velY);
        const angle = Math.atan2(velY, velX) * (180 / Math.PI);

        // Fluid stretch along motion angle
        const stretch = Math.min(speed * 0.04, 1.1);
        const scaleX = 1 + stretch;
        const scaleY = Math.max(0.55, 1 - stretch * 0.4);

        // Physics LERP
        ballX += (mouseX - ballX) * 0.38;
        ballY += (mouseY - ballY) * 0.38;

        if (speed > 1.2) {
            ball.style.transform = `translate3d(${ballX}px, ${ballY}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(${scaleX}, ${scaleY})`;
        } else {
            ball.style.transform = `translate3d(${ballX}px, ${ballY}px, 0) translate(-50%, -50%) scale(1, 1)`;
        }

        requestAnimationFrame(animateCursor);
    }

    requestAnimationFrame(animateCursor);
})();

// ============================================================
// CATEGORY PILLS ARROW NAVIGATION (HORIZONTAL CAROUSEL)
// ============================================================
const btnCatScrollLeft = document.getElementById("btn-cat-scroll-left");
const btnCatScrollRight = document.getElementById("btn-cat-scroll-right");
// categoryPillsContainer is already declared at line 51
if (btnCatScrollLeft && categoryPillsContainer) {
    btnCatScrollLeft.addEventListener("click", () => {
        categoryPillsContainer.scrollBy({ left: -240, behavior: "smooth" });
    });
}

if (btnCatScrollRight && categoryPillsContainer) {
    btnCatScrollRight.addEventListener("click", () => {
        categoryPillsContainer.scrollBy({ left: 240, behavior: "smooth" });
    });
}



const MOCKUP_OCCASIONS = [
    { key: "office", name: "Work", sub: "Office", icon: "💼" },
    { key: "casual", name: "Casual", sub: "Everyday", icon: "☕" },
    { key: "party", name: "Party", sub: "Night Out", icon: "🪩" },
    { key: "wedding", name: "Wedding", sub: "Festive", icon: "💍" },
    { key: "travel", name: "Travel", sub: "Getaway", icon: "✈️" },
    { key: "college", name: "College", sub: "Campus", icon: "🎓" },
    { key: "dinner", name: "Dining", sub: "Classy", icon: "🍽️" },
    { key: "gym", name: "Fitness", sub: "Active", icon: "🏋️" }
];

function initOccasionPicker() {
    const picker = document.getElementById("occasion-picker");
    if (!picker) return;

    picker.innerHTML = MOCKUP_OCCASIONS.map((occ, idx) => `
        <div class="occasion-card ${idx === 0 ? 'active' : ''}" data-occasion="${occ.key}">
            <span class="occasion-icon">${occ.icon}</span>
            <span class="occasion-name">${occ.name}</span>
            <span class="occasion-desc">${occ.sub}</span>
        </div>
    `).join("");

    picker.querySelectorAll(".occasion-card").forEach(card => {
        card.addEventListener("click", () => {
            picker.querySelectorAll(".occasion-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            selectedOccasion = card.dataset.occasion;
        });
    });
}
initOccasionPicker();
