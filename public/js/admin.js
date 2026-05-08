// Admin Dashboard Logic

// ---- POSTER AUTO-FETCH ----
async function fetchPosterForField(titleFieldId, posterFieldId, btn) {
    const title = document.getElementById(titleFieldId).value;
    if (!title) { showMsg('Enter a movie title first', 'error'); return; }
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
    btn.disabled = true;
    try {
        const res = await fetch('/api/poster-search?title=' + encodeURIComponent(title));
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Not found');
        if (data.poster) {
            document.getElementById(posterFieldId).value = data.poster;
            showMsg('Poster found for "' + data.title + '"!', 'success');
        } else { showMsg('No poster found for this title', 'error'); }
    } catch (e) { showMsg(e.message, 'error'); }
    btn.innerHTML = orig;
    btn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.getUser();
    if (!user || user.role !== 'admin') {
        document.body.innerHTML = '<h1 style="color:#fff;text-align:center;margin-top:20vh">403 Forbidden</h1>';
        setTimeout(() => window.location.href = 'index.html', 2000);
    } else {
        loadAnalytics();
    }
});

function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-nav button').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    btn.classList.add('active');
    if (tabId === 'dashboard') loadAnalytics();
    if (tabId === 'manage') loadAllMovies();
    if (tabId === 'theatres') loadTheatres();
    if (tabId === 'screens') loadScreens();
    if (tabId === 'shows') loadShows();
    if (tabId === 'bookings') loadAllBookings();
    if (tabId === 'approvals') loadPendingTheatres();
}

function showMsg(text, type) {
    const b = document.getElementById('msg-box');
    b.textContent = text; b.className = type; b.style.display = 'block';
    setTimeout(() => b.style.display = 'none', 5000);
}

// ==================== ANALYTICS ====================
async function loadAnalytics() {
    try {
        const res = await Auth.fetchWithAuth('/admin/analytics');
        if (!res.ok) return;
        const json = await res.json();
        const data = json.data;
        document.getElementById('stat-bookings').textContent = data.totalBookings || 0;
        document.getElementById('stat-revenue').textContent = data.totalRevenue ? `₹${data.totalRevenue}` : '₹0';
        document.getElementById('stat-users').textContent = data.totalUsers || 0;
        document.getElementById('stat-theatres').textContent = data.activeTheatres || 0;

        // Render Cancellation Chart
        const chart = document.getElementById('cancellation-chart');
        if (data.cancellationReasons && Object.keys(data.cancellationReasons).length > 0) {
            const total = Object.values(data.cancellationReasons).reduce((a, b) => a + b, 0);
            chart.innerHTML = Object.entries(data.cancellationReasons).map(([reason, count]) => {
                const perc = (count / total * 100).toFixed(0);
                return `
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem; font-size:0.85rem;">
                            <span>${reason}</span>
                            <span>${count} (${perc}%)</span>
                        </div>
                        <div style="height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;">
                            <div style="height:100%; width:${perc}%; background:var(--primary-color);"></div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            chart.innerHTML = '<p style="color:var(--text-muted)">No cancellation data available yet.</p>';
        }
    } catch (e) {
        console.error('Analytics load error:', e);
    }
}

// ==================== MOVIES ====================
document.getElementById('add-movie-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        title: document.getElementById('m-title').value,
        descrition: document.getElementById('m-desc').value,
        releaseDate: document.getElementById('m-date').value,
        duration: parseInt(document.getElementById('m-duration').value),
        language: document.getElementById('m-language').value,
        genre: document.getElementById('m-genre').value.split(',').map(s => s.trim()),
        poster: document.getElementById('m-poster').value
    };
    try {
        const res = await Auth.fetchWithAuth('/addmovie', { method: 'POST', body: payload });
        if (!res.ok) throw new Error('Failed to add movie');
        showMsg('Movie added successfully!', 'success');
        e.target.reset();
    } catch (err) { showMsg(err.message, 'error'); }
});

async function loadAllMovies() {
    const tbody = document.getElementById('movies-table-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    try {
        const res = await fetch('/movies');
        const data = await res.json();
        const movies = data.data || [];
        if (!movies.length) { tbody.innerHTML = '<tr><td colspan="5">No movies.</td></tr>'; return; }
        tbody.innerHTML = movies.map(m => {
            const p = m.poster && m.poster.startsWith('http') ? m.poster : '';
            return `<tr>
                <td>${p ? '<img src="'+p+'" style="width:40px;height:55px;object-fit:cover;border-radius:4px">' : '-'}</td>
                <td>${m.title}</td>
                <td>${m.language}</td>
                <td>${m.duration}m</td>
                <td>
                    <button class="btn-action" style="background:#ff9800" onclick='editMovie(${JSON.stringify(m).replace(/'/g, "&apos;")})'><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action" onclick="delMovie('${m._id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="5" style="color:#ff4d4d">Error</td></tr>'; }
}

function editMovie(movie) {
    document.getElementById('edit-id').value = movie._id;
    document.getElementById('edit-title').value = movie.title;
    document.getElementById('edit-desc').value = movie.descrition || '';
    document.getElementById('edit-duration').value = movie.duration;
    document.getElementById('edit-language').value = movie.language;
    document.getElementById('edit-genre').value = (movie.genre || []).join(', ');
    document.getElementById('edit-poster').value = movie.poster || '';
    document.getElementById('edit-modal').classList.add('open');
}

document.getElementById('edit-movie-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const payload = {
        title: document.getElementById('edit-title').value,
        descrition: document.getElementById('edit-desc').value,
        duration: parseInt(document.getElementById('edit-duration').value),
        language: document.getElementById('edit-language').value,
        genre: document.getElementById('edit-genre').value.split(',').map(s => s.trim()),
        poster: document.getElementById('edit-poster').value
    };
    try {
        const r = await Auth.fetchWithAuth('/update-movie/' + id, { method: 'PATCH', body: payload });
        if (!r.ok) throw new Error('Failed to update movie');
        showMsg('Movie updated!', 'success');
        closeModal('edit-modal');
        loadAllMovies();
    } catch (e) { showMsg(e.message, 'error'); }
});

window.delMovie = async function(id) {
    if (!confirm('Delete this movie?')) return;
    try {
        const r = await Auth.fetchWithAuth('/delete-movie/' + id, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed'); showMsg('Movie deleted!', 'success'); loadAllMovies();
    } catch (e) { showMsg(e.message, 'error'); }
};
window.closeModal = function(id) { document.getElementById(id).classList.remove('open'); };

// ==================== THEATRES ====================
document.getElementById('add-theatre-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById('t-name').value,
        city: document.getElementById('t-city').value,
        address: document.getElementById('t-address').value
    };
    try {
        const r = await Auth.fetchWithAuth('/theatre/add', { method: 'POST', body: payload });
        if (!r.ok) throw new Error('Failed'); showMsg('Theatre added!', 'success'); e.target.reset(); loadTheatres();
    } catch (e) { showMsg(e.message, 'error'); }
});

async function loadTheatres() {
    const tbody = document.getElementById('theatres-table-body');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    try {
        const r = await fetch('/theatre/all-theatre'); const d = await r.json();
        const list = d.data || d.Theatres || [];
        if (!list.length) { tbody.innerHTML = '<tr><td colspan="4">No theatres.</td></tr>'; return; }
        tbody.innerHTML = list.map(t => `<tr>
            <td>${t.name}</td><td>${t.location?.city||'-'}</td><td>${t.location?.address||'-'}</td>
            <td><button class="btn-icon btn-edit" onclick="editTheatre('${t._id}','${(t.name||'').replace(/'/g,"\\'")}','${(t.location?.city||'').replace(/'/g,"\\'")}','${(t.location?.address||'').replace(/'/g,"\\'")}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon btn-del" onclick="delTheatre('${t._id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
        // populate theatre dropdowns
        const sel1 = document.getElementById('sc-theatre'); const sel2 = document.getElementById('sh-theatre');
        const opts = '<option value="">Select Theatre</option>' + list.map(t => `<option value="${t._id}">${t.name}</option>`).join('');
        if (sel1) sel1.innerHTML = opts; if (sel2) sel2.innerHTML = opts;
    } catch (e) { tbody.innerHTML = '<tr><td colspan="4" style="color:#ff4d4d">Error</td></tr>'; }
}

window.delTheatre = async function(id) {
    if (!confirm('Delete this theatre?')) return;
    try {
        const r = await Auth.fetchWithAuth('/theatre/remove/' + id, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed'); showMsg('Theatre deleted!', 'success'); loadTheatres();
    } catch (e) { showMsg(e.message, 'error'); }
};

window.editTheatre = function(id, name, city, address) {
    document.getElementById('et-id').value = id;
    document.getElementById('et-name').value = name;
    document.getElementById('et-city').value = city;
    document.getElementById('et-address').value = address;
    document.getElementById('edit-theatre-modal').classList.add('open');
};

document.getElementById('edit-theatre-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('et-id').value;
    const payload = { name: document.getElementById('et-name').value, city: document.getElementById('et-city').value, address: document.getElementById('et-address').value };
    try {
        const r = await Auth.fetchWithAuth('/theatre/update/' + id, { method: 'PATCH', body: payload });
        if (!r.ok) throw new Error('Failed'); showMsg('Theatre updated!', 'success');
        closeModal('edit-theatre-modal'); loadTheatres();
    } catch (e) { showMsg(e.message, 'error'); }
});

// ==================== SCREENS ====================
document.getElementById('add-screen-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const theatreId = document.getElementById('sc-theatre').value;
    const name = document.getElementById('sc-name').value;
    const screenNumber = parseInt(document.getElementById('sc-number').value);
    const totalSeats = parseInt(document.getElementById('sc-seats').value);
    // Build seat layout from simple config
    const rows = document.getElementById('sc-rows').value.split(',').map(s=>s.trim());
    const seatsPerRow = parseInt(document.getElementById('sc-spr').value) || 10;
    const seatType = document.getElementById('sc-type').value || 'silver';
    const seatLayout = rows.map(row => ({
        row, seats: Array.from({length: seatsPerRow}, (_, i) => ({ number: i+1, type: seatType }))
    }));
    try {
        const r = await Auth.fetchWithAuth('/screen/add-screen', { method: 'POST', body: { theatreId, name, screenNumber, totalSeats, seatLayout } });
        if (!r.ok) { const d = await r.json(); throw new Error(d.message || 'Failed'); }
        showMsg('Screen added!', 'success'); e.target.reset(); loadScreens();
    } catch (e) { showMsg(e.message, 'error'); }
});

async function loadScreens() {
    const tbody = document.getElementById('screens-table-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    try {
        const r = await fetch('/screen/all-screen'); const d = await r.json();
        const list = d.Screens || [];
        if (!list.length) { tbody.innerHTML = '<tr><td colspan="5">No screens.</td></tr>'; return; }
        tbody.innerHTML = list.map(s => `<tr>
            <td>${s.name}</td><td>${s.screenNumber||'-'}</td><td>${s.totalSeats||'-'}</td>
            <td style="font-size:.85rem">${s.theatreId?._id || s.theatreId || '-'}</td>
            <td><button class="btn-icon btn-del" onclick="delScreen('${s._id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
        // populate screen dropdown for shows is now handled dynamically
    } catch (e) { tbody.innerHTML = '<tr><td colspan="5" style="color:#ff4d4d">Error</td></tr>'; }
}

document.getElementById('sh-theatre').addEventListener('change', async (e) => {
    const theatreId = e.target.value;
    const sel = document.getElementById('sh-screen');
    sel.innerHTML = '<option value="">Loading...</option>';
    if (!theatreId) {
        sel.innerHTML = '<option value="">Select Screen</option>';
        return;
    }
    try {
        const r = await fetch('/screen/screen-by-theatreId/' + theatreId);
        if (!r.ok) throw new Error();
        const d = await r.json();
        const list = d.Screen || d.Screens || d.screens || d.data || [];
        sel.innerHTML = '<option value="">Select Screen</option>' + list.map(s => `<option value="${s._id}">${s.name} (#${s.screenNumber})</option>`).join('');
    } catch (e) {
        sel.innerHTML = '<option value="">Error loading screens</option>';
    }
});

window.delScreen = async function(id) {
    if (!confirm('Delete this screen?')) return;
    try {
        const r = await Auth.fetchWithAuth('/screen/remove-screen/' + id, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed'); showMsg('Screen deleted!', 'success'); loadScreens();
    } catch (e) { showMsg(e.message, 'error'); }
};

// ==================== SHOWS ====================
document.getElementById('add-show-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        movieId: document.getElementById('sh-movie').value,
        theatreId: document.getElementById('sh-theatre').value,
        screenId: document.getElementById('sh-screen').value,
        startTime: document.getElementById('sh-time').value,
        price: {
            silver: parseInt(document.getElementById('sh-silver').value),
            gold: parseInt(document.getElementById('sh-gold').value),
            platinum: parseInt(document.getElementById('sh-platinum').value)
        }
    };
    try {
        const r = await Auth.fetchWithAuth('/show/add-show', { method: 'POST', body: payload });
        if (!r.ok) { const d = await r.json(); throw new Error(d.message || 'Failed'); }
        showMsg('Show added!', 'success'); e.target.reset(); loadShows();
    } catch (e) { showMsg(e.message, 'error'); }
});

async function loadShows() {
    const tbody = document.getElementById('shows-table-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    // also populate movie dropdown
    try {
        const mr = await fetch('/movies'); const md = await mr.json();
        const movies = md.data || [];
        const sel = document.getElementById('sh-movie');
        if (sel) sel.innerHTML = '<option value="">Select Movie</option>' + movies.map(m => `<option value="${m._id}">${m.title}</option>`).join('');
    } catch(e) {}
    // load theatres & screens for dropdowns
    loadTheatres(); loadScreens();
    try {
        const r = await fetch('/show/all-shows'); const d = await r.json();
        const list = d.Shows || [];
        if (!list.length) { tbody.innerHTML = '<tr><td colspan="5">No shows.</td></tr>'; return; }
        tbody.innerHTML = list.map(s => {
            const dt = new Date(s.startTime); const time = dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
            return `<tr>
                <td>${s.movieId?.title || s.movieId || '-'}</td>
                <td>${s.theatreId?.name || s.theatreId || '-'}</td>
                <td>${time}</td>
                <td>S:₹${s.price?.silver||0} G:₹${s.price?.gold||0} P:₹${s.price?.platinum||0}</td>
                <td><button class="btn-icon btn-edit" onclick="editShow('${s._id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon btn-del" onclick="delShow('${s._id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`;
        }).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="5" style="color:#ff4d4d">Error</td></tr>'; }
}

window.delShow = async function(id) {
    if (!confirm('Delete this show?')) return;
    try {
        const r = await Auth.fetchWithAuth('/show/remove-show/' + id, { method: 'DELETE' });
        if (!r.ok) throw new Error('Failed'); showMsg('Show deleted!', 'success'); loadShows();
    } catch (e) { showMsg(e.message, 'error'); }
};

window.editShow = async function(id) {
    try {
        const r = await fetch('/show/show-by-id/' + id); const d = await r.json();
        const s = d.Show || d.show || d;
        document.getElementById('es-id').value = s._id;
        
        // Populate dropdowns first
        document.getElementById('es-movie').innerHTML = document.getElementById('sh-movie').innerHTML;
        document.getElementById('es-theatre').innerHTML = document.getElementById('sh-theatre').innerHTML;
        document.getElementById('es-screen').innerHTML = document.getElementById('sh-screen').innerHTML;

        document.getElementById('es-movie').value = s.movieId?._id || s.movieId || '';
        document.getElementById('es-theatre').value = s.theatreId?._id || s.theatreId || '';
        document.getElementById('es-screen').value = s.screenId?._id || s.screenId || '';
        
        // Format datetime-local
        if (s.startTime) {
            const dt = new Date(s.startTime);
            const pad = (n) => n.toString().padStart(2, '0');
            document.getElementById('es-time').value = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        }
        
        document.getElementById('es-silver').value = s.price?.silver || '';
        document.getElementById('es-gold').value = s.price?.gold || '';
        document.getElementById('es-platinum').value = s.price?.platinum || '';
        
        document.getElementById('edit-show-modal').classList.add('open');
    } catch (e) { showMsg(e.message, 'error'); }
};

document.getElementById('edit-show-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('es-id').value;
    const payload = {
        movieId: document.getElementById('es-movie').value,
        theatreId: document.getElementById('es-theatre').value,
        screenId: document.getElementById('es-screen').value,
        startTime: document.getElementById('es-time').value,
        price: {
            silver: parseInt(document.getElementById('es-silver').value),
            gold: parseInt(document.getElementById('es-gold').value),
            platinum: parseInt(document.getElementById('es-platinum').value)
        }
    };
    try {
        const r = await Auth.fetchWithAuth('/show/update-show/' + id, { method: 'PATCH', body: payload });
        if (!r.ok) throw new Error('Failed'); showMsg('Show updated!', 'success');
        closeModal('edit-show-modal'); loadShows();
    } catch (e) { showMsg(e.message, 'error'); }
});

// ==================== BOOKINGS ====================
async function loadAllBookings() {
    const tbody = document.getElementById('all-bookings-body');
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    try {
        const r = await Auth.fetchWithAuth('/booking/all-bookings'); const d = await r.json();
        const list = d.data || [];
        if (!list.length) { tbody.innerHTML = '<tr><td colspan="4">No bookings.</td></tr>'; return; }
        tbody.innerHTML = list.map(b => `<tr>
            <td style="font-family:monospace;font-size:.85rem">${b._id}</td>
            <td style="font-family:monospace;font-size:.85rem">${b.show}</td>
            <td>₹${b.totalAmount||0}</td>
            <td><span class="status-badge">${b.bookingStatus||'pending'}</span></td></tr>`).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="4" style="color:#ff4d4d">Error</td></tr>'; }
}

// ==================== APPROVALS ====================
async function loadPendingTheatres() {
    try {
        const res = await Auth.fetchWithAuth('/theatre/get-pending');
        if (!res.ok) throw new Error('Failed to load pending theatres');
        const data = await res.json();
        const theatres = data.data || [];
        const tbody = document.getElementById('approvals-table-body');
        
        if (theatres.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No pending approvals</td></tr>';
            return;
        }

        tbody.innerHTML = theatres.map(t => `
            <tr>
                <td>${t.name}</td>
                <td>${t.location?.city || t.city || 'Unknown'}</td>
                <td>${t.owner?.email || 'Admin'}</td>
                <td>
                    <button class="btn-submit" style="padding:0.4rem 1rem;" onclick="approveTheatre('${t._id}')"><i class="fa-solid fa-check"></i> Approve</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        showMsg(e.message, 'error');
    }
}

async function approveTheatre(id) {
    if (!confirm('Are you sure you want to approve this theatre?')) return;
    try {
        const res = await Auth.fetchWithAuth(`/theatre/approve/${id}`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Failed to approve theatre');
        showMsg('Theatre approved successfully', 'success');
        loadPendingTheatres(); // Refresh the list
    } catch (e) {
        showMsg(e.message, 'error');
    }
}
