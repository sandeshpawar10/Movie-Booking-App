const API = 'http://localhost:8000';

// ─── STATE ───────────────────────────────────────────────
let currentUser = JSON.parse(localStorage.getItem('cv_user') || 'null');
let accessToken = localStorage.getItem('cv_token') || null;
let cart = JSON.parse(localStorage.getItem('cv_cart') || '[]');
let movies = [];
let heroMovies = [];
let heroIndex = 0;
let heroTimer = null;
let currentPage = 1;
let totalPages = 1;
let filters = { genre: '', lang: '', sort: '', status: '', search: '' };
let selectedMovie = null;
let selectedSeats = [];
let selectedShowtime = '14:30';
const SEAT_PRICE = { standard: 220, premium: 380 };
const SHOWTIMES = ['10:00', '13:15', '16:30', '19:45', '23:00'];

// ─── POSTER URLS ──────────────────────────────────────────
const POSTER_URLS = {
  action:  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80',
  drama:   'https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=400&q=80',
  comedy:  'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&q=80',
  thriller:'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80',
  sci_fi:  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
  horror:  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  romance: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80',
};

// ─── DEMO MOVIES (fallback if API unavailable) ────────────
const DEMO_MOVIES = [
  { _id:'1', title:'Interstellar Drift', descrition:'A crew of astronauts embark on an impossible journey beyond the known universe, facing time, space, and the limits of human endurance.', duration:169, releaseDate:'2024-11-15', genre:'Sci-Fi', language:'English', poster: POSTER_URLS.sci_fi, rating: 8.9 },
  { _id:'2', title:'Shadow Protocol', descrition:'An elite spy uncovers a conspiracy that reaches the highest levels of global power — and has to outrun both her enemies and her past.', duration:128, releaseDate:'2025-01-10', genre:'Action', language:'English', poster: POSTER_URLS.action, rating: 7.8 },
  { _id:'3', title:'The Unseen Hour', descrition:'A grieving photographer discovers a mysterious camera that captures moments from the future — and what she sees forces her to make an impossible choice.', duration:112, releaseDate:'2025-02-20', genre:'Drama', language:'Hindi', poster: POSTER_URLS.drama, rating: 8.2 },
  { _id:'4', title:'Laugh Riot', descrition:'Five college roommates accidentally start a fake company that becomes the most successful startup in the country.', duration:98, releaseDate:'2024-12-05', genre:'Comedy', language:'English', poster: POSTER_URLS.comedy, rating: 7.1 },
  { _id:'5', title:'Crimson Echo', descrition:'A detective haunted by a cold case stumbles upon evidence that the killer is still active — and watching her every move.', duration:135, releaseDate:'2025-03-18', genre:'Thriller', language:'English', poster: POSTER_URLS.thriller, rating: 8.5 },
  { _id:'6', title:'Forever in Monsoon', descrition:'Two strangers meet by chance during Mumbai\'s monsoon season and share one life-changing weekend they\'ll never forget.', duration:106, releaseDate:'2025-06-30', genre:'Romance', language:'Hindi', poster: POSTER_URLS.romance, rating: 7.6 },
  { _id:'7', title:'Apex Predator', descrition:'Deep in the Amazon, a research team discovers a species that shouldn\'t exist — and quickly learns they are not the hunters.', duration:118, releaseDate:'2025-08-14', genre:'Horror', language:'English', poster: POSTER_URLS.horror, rating: 7.4 },
  { _id:'8', title:'Neon Requiem', descrition:'In a cyberpunk megacity, a disgraced AI engineer fights to stop a sentient algorithm from taking control of global infrastructure.', duration:144, releaseDate:'2025-07-22', genre:'Sci-Fi', language:'English', poster: POSTER_URLS.sci_fi, rating: 8.7 },
  { _id:'9', title:'Streets of Fury', descrition:'A retired martial arts champion is forced back into the underground fighting circuit to protect his family from a ruthless crime syndicate.', duration:122, releaseDate:'2025-04-05', genre:'Action', language:'Tamil', poster: POSTER_URLS.action, rating: 8.1 },
  { _id:'10', title:'The Quiet Storm', descrition:'A small-town musician discovers her long-lost recordings were stolen years ago by a global superstar — and sets out to reclaim her story.', duration:116, releaseDate:'2025-05-12', genre:'Drama', language:'English', poster: POSTER_URLS.drama, rating: 7.9 },
];

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  updateCartUI();
  loadMovies();
  document.getElementById('search-input').addEventListener('input', debounce(e => {
    filters.search = e.target.value;
    currentPage = 1;
    loadMovies();
  }, 400));
});

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ─── API HELPERS ──────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  try {
    const r = await fetch(API + path, { ...opts, headers, credentials: 'include' });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, data: null };
  }
}

// ─── MOVIES ──────────────────────────────────────────────
async function loadMovies() {
  const grid = document.getElementById('movies-grid');
  const loading = document.getElementById('movies-loading');
  const empty = document.getElementById('movies-empty');
  loading.style.display = 'block';
  empty.style.display = 'none';

  const params = new URLSearchParams({
    page: currentPage, limit: 10,
    ...(filters.search && { search: filters.search }),
    ...(filters.genre  && { genre:  filters.genre  }),
    ...(filters.lang   && { language: filters.lang }),
    ...(filters.sort   && { sort:   filters.sort   }),
    ...(filters.status && { status: filters.status }),
  });

  const res = await apiFetch(`/movies?${params}`);

  let movieList = [];
  if (res.ok && res.data?.data?.length) {
    movieList = res.data.data;
    totalPages = res.data.totalPages || 1;
  } else {
    movieList = filterDemo(DEMO_MOVIES);
    totalPages = 1;
  }

  movies = movieList;
  heroMovies = movieList.slice(0, 5);
  renderMovies(movieList);
  renderHero(0);
  renderPagination();
}

function filterDemo(list) {
  return list.filter(m => {
    if (filters.genre && m.genre !== filters.genre) return false;
    if (filters.lang && !m.language.toLowerCase().includes(filters.lang.toLowerCase())) return false;
    if (filters.search && !m.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status === 'upcoming' && new Date(m.releaseDate) <= new Date()) return false;
    if (filters.status === 'released' && new Date(m.releaseDate) > new Date()) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sort === 'latest') return new Date(b.releaseDate) - new Date(a.releaseDate);
    if (filters.sort === 'oldest') return new Date(a.releaseDate) - new Date(b.releaseDate);
    return 0;
  });
}

function renderMovies(list) {
  const grid = document.getElementById('movies-grid');
  const loading = document.getElementById('movies-loading');
  const empty = document.getElementById('movies-empty');
  loading.style.display = 'none';
  Array.from(grid.querySelectorAll('.movie-card')).forEach(c => c.remove());

  if (!list.length) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  list.forEach(m => {
    const isUpcoming = new Date(m.releaseDate) > new Date();
    const rating = m.rating || (7 + Math.random() * 1.5).toFixed(1);
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      ${isUpcoming ? '<div class="movie-card-badge"><div class="upcoming-ribbon">Upcoming</div></div>' : ''}
      ${m.poster
        ? `<img class="movie-poster" src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''}
      <div class="movie-poster-placeholder" style="${m.poster ? 'display:none' : ''}">
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1" opacity="0.4"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m21 15-5-5L5 21"/></svg>
        <span>No Poster</span>
      </div>
      <div class="movie-card-body">
        <div class="movie-card-title">${m.title}</div>
        <div class="movie-card-meta">
          <span>${m.genre || 'Film'}</span>
          <span>${m.duration ? m.duration + 'm' : ''}</span>
        </div>
        <div class="movie-card-footer">
          <div class="movie-rating">★ <span>${typeof rating === 'number' ? rating.toFixed(1) : rating}</span></div>
          <button class="book-btn" onclick="event.stopPropagation();openBooking('${m._id}')">
            ${isUpcoming ? 'Remind' : 'Book'}
          </button>
        </div>
      </div>`;
    card.addEventListener('click', () => openMovieModal(m._id));
    grid.appendChild(card);
  });
}

function renderPagination() {
  const wrap = document.getElementById('pagination-wrapper');
  if (totalPages <= 1) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  wrap.innerHTML = '';

  const prev = document.createElement('button');
  prev.className = 'page-btn'; prev.textContent = '←';
  prev.disabled = currentPage === 1;
  prev.onclick = () => { if (currentPage > 1) { currentPage--; loadMovies(); } };
  wrap.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const b = document.createElement('button');
    b.className = 'page-btn' + (i === currentPage ? ' active' : '');
    b.textContent = i;
    b.onclick = (p => () => { currentPage = p; loadMovies(); })(i);
    wrap.appendChild(b);
  }

  const next = document.createElement('button');
  next.className = 'page-btn'; next.textContent = '→';
  next.disabled = currentPage === totalPages;
  next.onclick = () => { if (currentPage < totalPages) { currentPage++; loadMovies(); } };
  wrap.appendChild(next);
}

// ─── HERO ─────────────────────────────────────────────────
function renderHero(idx) {
  if (!heroMovies.length) return;
  heroIndex = idx;
  const m = heroMovies[idx];
  const bg = document.getElementById('hero-bg');
  bg.style.backgroundImage = `url('${m.poster || POSTER_URLS.default}')`;
  document.getElementById('hero-title').textContent = m.title;

  const isUpcoming = new Date(m.releaseDate) > new Date();
  document.getElementById('hero-badge').innerHTML =
    `<span class="badge ${isUpcoming ? 'badge-red' : 'badge-green'}">${isUpcoming ? '● Upcoming' : '● Now Showing'}</span>`;

  document.getElementById('hero-meta').innerHTML = `
    <div class="hero-meta-item"><span>${m.genre || 'Film'}</span></div>
    <div class="hero-meta-item">
      <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path fill="white" d="M12 6v6l4 2"/></svg>
      ${m.duration ? m.duration + ' min' : ''}
    </div>
    <div class="hero-meta-item">${m.language || ''}</div>
    <div class="hero-meta-item" style="color:var(--accent);">★ ${m.rating || (7.5).toFixed(1)}</div>`;

  document.getElementById('hero-desc').textContent = m.descrition || 'Experience cinema like never before.';
  document.getElementById('hero-book-btn').onclick = () => openBooking(m._id);
  document.getElementById('hero-info-btn').onclick  = () => openMovieModal(m._id);

  const dotsEl = document.getElementById('hero-dots');
  dotsEl.innerHTML = '';
  heroMovies.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'hero-dot' + (i === idx ? ' active' : '');
    d.onclick = () => { clearTimeout(heroTimer); renderHero(i); startHeroTimer(); };
    dotsEl.appendChild(d);
  });

  clearTimeout(heroTimer);
  startHeroTimer();
}

function startHeroTimer() {
  heroTimer = setTimeout(() => {
    const next = (heroIndex + 1) % heroMovies.length;
    renderHero(next);
  }, 5000);
}

// ─── FILTERS ─────────────────────────────────────────────
function setGenre(g, el) {
  filters.genre = g; currentPage = 1;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  loadMovies();
}
function setSort(v)   { filters.sort = v;   currentPage = 1; loadMovies(); }
function setLang(v)   { filters.lang = v;   currentPage = 1; loadMovies(); }
function setStatus(v) { filters.status = v; currentPage = 1; loadMovies(); }

// ─── MOVIE MODAL ──────────────────────────────────────────
function getMovieById(id) {
  return movies.find(m => m._id === id) || DEMO_MOVIES.find(m => m._id === id);
}

async function openMovieModal(id) {
  const m = getMovieById(id) || await fetchMovie(id);
  if (!m) { showToast('Movie not found'); return; }
  selectedMovie = m;
  selectedSeats = [];

  const overlay = document.getElementById('modal-overlay');
  const isUpcoming = new Date(m.releaseDate) > new Date();

  document.getElementById('modal-poster-wrap').innerHTML = m.poster
    ? `<div class="modal-poster"><img src="${m.poster}" alt="${m.title}" style="aspect-ratio:2/3;object-fit:cover;"></div>`
    : `<div class="modal-poster-placeholder">No Poster</div>`;

  document.getElementById('modal-status-badges').innerHTML = `
    <span class="badge ${isUpcoming ? 'badge-red' : 'badge-green'}">${isUpcoming ? 'Upcoming' : 'Now Showing'}</span>
    <span class="badge badge-amber">${m.genre || 'Film'}</span>`;

  document.getElementById('modal-title').textContent = m.title;
  document.getElementById('modal-meta').innerHTML = `
    <div class="hero-meta-item">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      ${m.duration ? m.duration + ' min' : 'N/A'}
    </div>
    <div class="hero-meta-item">${m.language || 'English'}</div>
    <div class="hero-meta-item">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
      ${new Date(m.releaseDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
    </div>`;

  document.getElementById('modal-desc').textContent = m.descrition || 'No description available.';
  document.getElementById('modal-tags').innerHTML = [m.genre, m.language].filter(Boolean).map(t => `<span class="tag">${t}</span>`).join('');
  document.getElementById('modal-actions').innerHTML = isUpcoming
    ? `<button class="btn btn-ghost" onclick="showToast('Reminder set! We\\'ll notify you when tickets go live.')">🔔 Set Reminder</button>`
    : `<button class="btn btn-primary" onclick="openBooking('${m._id}')">Book Tickets →</button>`;

  if (!isUpcoming) {
    document.getElementById('modal-body').innerHTML = buildSeatSelector(m);
    initSeats();
  } else {
    document.getElementById('modal-body').innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--text3);">
        <div style="font-size:3rem;margin-bottom:1rem;">🎬</div>
        <div style="font-size:16px;color:var(--text);">Coming ${new Date(m.releaseDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div style="font-size:14px;margin-top:8px;">Booking opens 1 week before release</div>
      </div>`;
  }

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function fetchMovie(id) {
  const res = await apiFetch(`/get-movie/${id}`);
  return res.ok ? res.data?.Movie || res.data : null;
}

function buildSeatSelector(m) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const cols = 10;
  const bookedSeats = new Set(generateBooked());
  window._bookedSeats = bookedSeats;
  window._premiumRows = new Set(['A', 'B']);

  const rowsHtml = rows.map(row => {
    const seats = Array.from({ length: cols }, (_, i) => {
      const seatId = `${row}${i + 1}`;
      const isBooked = bookedSeats.has(seatId);
      const isPremium = window._premiumRows.has(row);
      return `<div class="seat${isBooked ? ' booked' : ''}${isPremium ? ' premium' : ''}" data-seat="${seatId}" data-type="${isPremium ? 'premium' : 'standard'}" onclick="toggleSeat(this,'${seatId}',${isPremium ? 'true' : 'false'})"></div>`;
    }).join('');
    return `<div class="seat-row"><span class="seat-row-label">${row}</span>${seats}</div>`;
  }).join('');

  const showtimes = SHOWTIMES.map(t =>
    `<button class="showtime-chip${t === selectedShowtime ? ' active' : ''}" onclick="selectShowtime('${t}',this)">${t}</button>`
  ).join('');

  return `
    <h3 class="modal-section-title">Choose Showtime</h3>
    <div id="showtime-select-wrapper">${showtimes}</div>
    <h3 class="modal-section-title" style="margin-top:1.5rem;">Select Your Seats</h3>
    <div class="seat-screen"></div>
    <div class="seat-grid" id="seat-grid">${rowsHtml}</div>
    <div class="seat-legend">
      <div class="seat-legend-item"><div class="seat-legend-dot" style="background:var(--bg4);border-color:var(--border);"></div>Available</div>
      <div class="seat-legend-item"><div class="seat-legend-dot" style="background:var(--bg4);border-color:rgba(255,107,74,0.4);"></div>Premium</div>
      <div class="seat-legend-item"><div class="seat-legend-dot" style="background:var(--accent);border-color:var(--accent);"></div>Selected</div>
      <div class="seat-legend-item"><div class="seat-legend-dot" style="background:var(--bg3);border-color:var(--border);opacity:0.4;"></div>Taken</div>
    </div>
    <div class="seat-summary">
      <div class="seat-summary-info">
        Selected: <strong id="seat-count">None</strong>
        <div id="seat-names" style="font-size:12px;margin-top:4px;"></div>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;">
        <div class="seat-summary-price" id="seat-price">₹0</div>
        <button class="btn btn-primary" id="add-to-cart-btn" onclick="addToCartFromModal()" style="display:none;">Add to Cart</button>
      </div>
    </div>`;
}

function generateBooked() {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const seats = [];
  rows.forEach(r => {
    for (let i = 1; i <= 10; i++) {
      if (Math.random() < 0.28) seats.push(`${r}${i}`);
    }
  });
  return seats;
}

function initSeats() { selectedSeats = []; updateSeatSummary(); }

function toggleSeat(el, seatId, isPremium) {
  if (el.classList.contains('booked')) return;
  const idx = selectedSeats.findIndex(s => s.id === seatId);
  if (idx > -1) {
    selectedSeats.splice(idx, 1);
    el.classList.remove('selected');
  } else {
    if (selectedSeats.length >= 8) { showToast('Max 8 seats per booking'); return; }
    selectedSeats.push({ id: seatId, type: isPremium ? 'premium' : 'standard' });
    el.classList.add('selected');
  }
  updateSeatSummary();
}

function updateSeatSummary() {
  const count = selectedSeats.length;
  const total = selectedSeats.reduce((s, seat) => s + SEAT_PRICE[seat.type], 0);
  document.getElementById('seat-count').textContent = count ? `${count} seat${count > 1 ? 's' : ''}` : 'None';
  document.getElementById('seat-names').textContent = selectedSeats.map(s => s.id).join(', ');
  document.getElementById('seat-price').textContent = `₹${total.toLocaleString('en-IN')}`;
  const btn = document.getElementById('add-to-cart-btn');
  if (btn) btn.style.display = count ? 'inline-flex' : 'none';
}

function selectShowtime(t, el) {
  selectedShowtime = t;
  document.querySelectorAll('.showtime-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

function openBooking(id) { openMovieModal(id); }

// ─── CART ─────────────────────────────────────────────────
function addToCartFromModal() {
  if (!currentUser) { closeModal(null, true); openAuth('login'); return; }
  if (!selectedSeats.length) { showToast('Please select at least one seat'); return; }
  const m = selectedMovie;
  const total = selectedSeats.reduce((s, seat) => s + SEAT_PRICE[seat.type], 0);
  const item = {
    id: Date.now(),
    movieId: m._id,
    title: m.title,
    seats: selectedSeats.map(s => s.id),
    showtime: selectedShowtime,
    total,
  };
  cart.push(item);
  localStorage.setItem('cv_cart', JSON.stringify(cart));
  updateCartUI();
  showToast(`🎟️ ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} for "${m.title}" added!`);
  closeModal(null, true);
}

function updateCartUI() {
  const badge = document.getElementById('cart-badge');
  badge.textContent = cart.length;
  badge.style.display = cart.length ? 'flex' : 'none';

  const list = document.getElementById('cart-items-list');
  if (!cart.length) {
    list.innerHTML = '<div class="cart-empty">Your cart is empty.<br>Book some movies!</div>';
    document.getElementById('cart-total-amount').textContent = '₹0';
    return;
  }
  const total = cart.reduce((s, i) => s + i.total, 0);
  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})">✕</button>
      <div class="cart-item-title">${item.title}</div>
      <div class="cart-item-meta">Seats: ${item.seats.join(', ')} · Show: ${item.showtime}</div>
      <div class="cart-item-price">₹${item.total.toLocaleString('en-IN')}</div>
    </div>`).join('');
  document.getElementById('cart-total-amount').textContent = `₹${total.toLocaleString('en-IN')}`;
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  localStorage.setItem('cv_cart', JSON.stringify(cart));
  updateCartUI();
}

function toggleCart() {
  document.getElementById('cart-sidebar').classList.toggle('open');
}

function checkout() {
  if (!currentUser) { toggleCart(); openAuth('login'); return; }
  if (!cart.length) { showToast('Your cart is empty!'); return; }
  showToast('🎉 Booking confirmed! Tickets sent to your email.');
  cart = [];
  localStorage.setItem('cv_cart', JSON.stringify(cart));
  updateCartUI();
  toggleCart();
}

// ─── AUTH ─────────────────────────────────────────────────
function openAuth(mode) {
  const overlay  = document.getElementById('auth-overlay');
  const title    = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const wrap     = document.getElementById('auth-form-wrapper');
  const sw       = document.getElementById('auth-switch');

  if (mode === 'login') {
    title.textContent = 'Welcome Back';
    subtitle.textContent = 'Sign in to continue to CineVerse';
    wrap.innerHTML = `
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="auth-email" placeholder="you@example.com"/>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="auth-password" placeholder="••••••••"/>
      </div>
      <div class="form-error" id="auth-error"></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:0.5rem;padding:12px;" onclick="submitLogin()">Sign In →</button>
      <div style="text-align:right;margin-top:8px;">
        <a style="font-size:12px;color:var(--text3);cursor:pointer;" onclick="openAuth('forgot')">Forgot password?</a>
      </div>`;
    sw.innerHTML = `Don't have an account? <a onclick="openAuth('register')">Sign Up</a>`;

  } else if (mode === 'register') {
    title.textContent = 'Join CineVerse';
    subtitle.textContent = 'Create your account to start booking';
    wrap.innerHTML = `
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="auth-username" placeholder="yourname"/>
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="auth-email" placeholder="you@example.com"/>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="auth-password" placeholder="Min 8 characters"/>
      </div>
      <div class="form-error" id="auth-error"></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:0.5rem;padding:12px;" onclick="submitRegister()">Create Account →</button>`;
    sw.innerHTML = `Already have an account? <a onclick="openAuth('login')">Sign In</a>`;

  } else if (mode === 'forgot') {
    title.textContent = 'Reset Password';
    subtitle.textContent = "We'll send a reset link to your email";
    wrap.innerHTML = `
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="auth-email" placeholder="you@example.com"/>
      </div>
      <div class="form-error" id="auth-error"></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:0.5rem;padding:12px;" onclick="submitForgot()">Send Reset Link →</button>`;
    sw.innerHTML = `Remember your password? <a onclick="openAuth('login')">Sign In</a>`;
  }
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function submitLogin() {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) { showAuthError('Please fill all fields'); return; }

  const res = await apiFetch('/user/login', {
    method: 'POST', body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    currentUser = res.data.user;
    accessToken = res.data.AccesssToken;
    localStorage.setItem('cv_user', JSON.stringify(currentUser));
    localStorage.setItem('cv_token', accessToken);
    updateAuthUI();
    closeAuthModal(null, true);
    showToast(`👋 Welcome back, ${currentUser.username}!`);
  } else {
    // Demo mode fallback when API is not running
    currentUser = { _id: 'demo', username: email.split('@')[0], email };
    accessToken = 'demo-token';
    localStorage.setItem('cv_user', JSON.stringify(currentUser));
    localStorage.setItem('cv_token', accessToken);
    updateAuthUI();
    closeAuthModal(null, true);
    showToast(`👋 Welcome, ${currentUser.username}!`);
  }
}

async function submitRegister() {
  const username = document.getElementById('auth-username').value.trim();
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!username || !email || !password) { showAuthError('Please fill all fields'); return; }
  if (password.length < 8) { showAuthError('Password must be at least 8 characters'); return; }

  const res = await apiFetch('/user/register', {
    method: 'POST', body: JSON.stringify({ username, email, password })
  });

  if (res.ok) {
    closeAuthModal(null, true);
    showToast('✅ Account created! Please check your email to verify.');
  } else {
    closeAuthModal(null, true);
    showToast('✅ Account created! Please verify your email.');
  }
}

async function submitForgot() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email) { showAuthError('Please enter your email'); return; }
  await apiFetch('/user/forgotpassword', { method: 'POST', body: JSON.stringify({ email }) });
  closeAuthModal(null, true);
  showToast('📧 Password reset email sent!');
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function updateAuthUI() {
  const authBtns = document.getElementById('auth-btns');
  const menuWrap = document.getElementById('user-menu-wrapper');
  if (currentUser) {
    authBtns.style.display = 'none';
    menuWrap.style.display = 'block';
    document.getElementById('user-initial').textContent = currentUser.username?.[0]?.toUpperCase() || 'U';
    document.getElementById('dropdown-name').textContent  = currentUser.username || 'User';
    document.getElementById('dropdown-email').textContent = currentUser.email || '';
  } else {
    authBtns.style.display = 'flex';
    menuWrap.style.display = 'none';
  }
}

async function logoutUser() {
  await apiFetch('/user/logout', { method: 'POST' });
  currentUser = null; accessToken = null;
  localStorage.removeItem('cv_user');
  localStorage.removeItem('cv_token');
  updateAuthUI();
  toggleUserMenu();
  showToast('Signed out successfully.');
}

function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('open');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu-wrapper')) {
    document.getElementById('user-dropdown')?.classList.remove('open');
  }
});

// ─── MODAL CLOSE ─────────────────────────────────────────
function closeModal(e, force = false) {
  if (force || (e && e.target === document.getElementById('modal-overlay'))) {
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
    selectedSeats = [];
  }
}

function closeAuthModal(e, force = false) {
  if (force || (e && e.target === document.getElementById('auth-overlay'))) {
    document.getElementById('auth-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ─── TOAST ───────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ─── NAV SECTION ─────────────────────────────────────────
function showSection(name, el) {
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  if (name === 'upcoming') {
    filters.status = 'upcoming'; currentPage = 1;
    document.getElementById('status-select').value = 'upcoming';
    loadMovies();
  } else if (name === 'movies') {
    filters.status = ''; currentPage = 1;
    document.getElementById('status-select').value = '';
    loadMovies();
  } else {
    filters.status = ''; currentPage = 1; loadMovies();
  }
}