document.addEventListener('DOMContentLoaded', () => {
    const moviesContainer = document.getElementById('movies-container');
    
    // Fallback data in case backend is empty or failing
    const fallbackMovies = [
        {
            _id: "m1",
            title: "Dune: Part Two",
            descrition: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
            duration: 166,
            genre: ["Action", "Sci-Fi", "Drama"],
            language: "English",
            poster: "https://m.media-amazon.com/images/M/MV5BODdjMjM3ZGItMThiYS00MTExNDgwZjQtYjc2ZmRhNWFiMDM0XkEyXkFqcGdeQXVyMTA1NjE5MTAz._V1_FMjpg_UX1000_.jpg"
        },
        {
            _id: "m2",
            title: "Deadpool & Wolverine",
            descrition: "Wolverine is recovering from his injuries when he crosses paths with the loudmouth, Deadpool. They team up to defeat a common enemy.",
            duration: 127,
            genre: ["Action", "Comedy"],
            language: "English",
            poster: "https://m.media-amazon.com/images/M/MV5BZTU5NDgyYmQtZWFmZi00OWZiLTgwMzMtMzhjOTRlYmU3NWNhXkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_FMjpg_UX1000_.jpg"
        },
        {
            _id: "m3",
            title: "Inside Out 2",
            descrition: "Follow Riley, in her teenage years, encountering new emotions.",
            duration: 96,
            genre: ["Animation", "Comedy", "Family"],
            language: "English",
            poster: "https://m.media-amazon.com/images/M/MV5BYWNiMmNlNmQtZTI2MS00MzhlLWEzOTEtZGZkMWE0NDc4MTFiXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_FMjpg_UX1000_.jpg"
        },
        {
            _id: "m4",
            title: "The Fall Guy",
            descrition: "A down-and-out stuntman must find the missing star of his ex-girlfriend's blockbuster film.",
            duration: 126,
            genre: ["Action", "Comedy"],
            language: "English",
            poster: "https://m.media-amazon.com/images/M/MV5BMjA5ZjA3NjktN2EyYS00YjFlLTlkYTEtY2Y4NzI4NWUwMGU1XkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_FMjpg_UX1000_.jpg"
        }
    ];

    let allMovies = [];

    async function fetchMovies() {
        try {
            // Fetching from the GET /movies endpoint defined in movieRoutes.js
            const response = await fetch('/movies');
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            // Expected response format could be { data: [...] } or { movies: [...] } or just [...]
            let moviesList = [];
            if (Array.isArray(data)) {
                moviesList = data;
            } else if (data && data.data && Array.isArray(data.data)) {
                moviesList = data.data;
            } else if (data && data.movies && Array.isArray(data.movies)) {
                moviesList = data.movies;
            }
            
            if (moviesList.length > 0) {
                allMovies = moviesList;
            } else {
                allMovies = fallbackMovies;
            }
            renderMovies(allMovies);
        } catch (error) {
            console.error("Error fetching movies:", error);
            allMovies = fallbackMovies;
            renderMovies(allMovies);
        }
    }

    // Search functionality
    const searchInput = document.getElementById('movie-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allMovies.filter(m => 
                m.title.toLowerCase().includes(query) || 
                (m.descrition && m.descrition.toLowerCase().includes(query)) ||
                (m.description && m.description.toLowerCase().includes(query))
            );
            renderMovies(filtered);
        });
    }

    function renderMovies(movies) {
        moviesContainer.innerHTML = '';
        
        movies.forEach(movie => {
            let posterUrl = '';
            if (movie.poster && (movie.poster.startsWith('http') || movie.poster.startsWith('data:'))) {
                posterUrl = movie.poster;
            }
            
            const genresHTML = (movie.genre || []).map(g => `<span class="genre-tag">${g}</span>`).join('');
            const desc = movie.descrition || movie.description || 'Experience the magic of cinema with this amazing blockbuster.';
            
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';

            const initial = movie.title ? movie.title.charAt(0).toUpperCase() : '?';
            const phStyle = posterUrl
                ? 'display:none;'
                : 'display:flex;align-items:center;justify-content:center;font-size:4rem;font-weight:800;color:rgba(255,51,102,0.6);background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);';

            movieCard.innerHTML = `
                <div class="movie-poster-container">
                    ${posterUrl
                        ? `<img src="${posterUrl}" alt="${movie.title}" class="movie-poster" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';this.nextElementSibling.style.alignItems='center';this.nextElementSibling.style.justifyContent='center'">`
                        : ''}
                    <div class="movie-poster" id="ph-${movie._id}" style="${phStyle}">${initial}</div>
                    <div class="movie-overlay">
                        <button class="book-btn" onclick="bookMovie('${movie._id}')">
                            <i class="fa-solid fa-ticket"></i> Book Tickets
                        </button>
                    </div>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-meta">
                        <span><i class="fa-regular fa-clock"></i> ${movie.duration || '120'} min</span>
                        <span><i class="fa-solid fa-language"></i> ${movie.language || 'English'}</span>
                    </div>
                    <div class="movie-genres">
                        ${genresHTML || '<span class="genre-tag">Drama</span>'}
                    </div>
                    <p class="movie-desc">${desc}</p>
                </div>
            `;
            
            moviesContainer.appendChild(movieCard);

            // Auto-fetch poster from OMDB if missing
            if (!posterUrl && movie.title && !movie._id.startsWith('m')) {
                fetchPoster(movie._id, movie.title);
            }
        });
    }

    async function fetchPoster(movieId, title) {
        try {
            const res = await fetch(`/api/poster-search?title=${encodeURIComponent(title)}`);
            if (!res.ok) return;
            const data = await res.json();
            //console.log(data)
            if (data.poster) {
                const ph = document.getElementById('ph-' + movieId);
                if (ph) {
                    const img = document.createElement('img');
                    img.src = data.poster;
                    img.alt = title;
                    img.className = 'movie-poster';
                    img.onload = () => { ph.style.display = 'none'; ph.parentNode.insertBefore(img, ph); };
                }
                // Also update the movie in the DB so poster persists
                try {
                    await Auth.fetchWithAuth('/update-movie/' + movieId, {
                        method: 'PATCH', body: { poster: data.poster }
                    });
                } catch(e) { /* silent - non-admin users can't update */ }
            }
        } catch(e) { /* silent fail */ }
    }

    // Initialize fetching
    fetchMovies();
});

// Global function for the book button
window.bookMovie = function(movieId) {
    window.location.href = `/movie.html?id=${movieId}`;
}
