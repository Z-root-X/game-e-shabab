// =================================================================
//                 GAME-E-SHABAB - SEASON 3
//        FINAL POST-EVENT SUMMARY SCRIPT (No Dashboard)
// =================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbzozQN1ULev_Bsq4rTLUc3C1kcHmkbKd2hvjzPvIYChQOIWYiCm11986SR4K4LMsTj0Rg/exec"; 

document.addEventListener('DOMContentLoaded', fetchAndRenderAllData);
// Refresh data less frequently as it's a static summary
setInterval(fetchAndRenderAllData, 60000); // Refresh once per minute

function enterApp() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    // Default to the fixtures page, which is now the first page
    showPage('fixtures');
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.href.includes('#' + pageId)) {
            link.classList.add('active');
        }
    });
}

async function fetchAndRenderAllData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.error) {
            console.error("API Error from Google Script:", data.error);
            return;
        }

        renderLandingPage(data.landingPageData);
        renderFixtures(data.fixturesData);
        renderTeams(data.teamsData);
        renderPlayers(data.playersData);
        
        document.getElementById('loader').classList.add('hidden');

    } catch (error) {
        console.error("Failed to fetch or render data:", error);
    }
}

// --- RENDER FUNCTIONS ---

function renderLandingPage({ topBuys }) {
    const topBuysContainer = document.getElementById('top-buys-container');
    if (!topBuysContainer) return;

    topBuysContainer.innerHTML = '';
    if (topBuys && topBuys.length > 0) {
        topBuys.forEach((player, index) => {
            topBuysContainer.innerHTML += `
                <div class="top-buy-card">
                    <div class="top-buy-info">
                        <div class="top-buy-rank">#${index + 1}</div>
                        <div class="top-buy-details">
                           <div class="top-buy-name">${player.name}</div>
                           <div class="top-buy-category">${player.category}</div>
                        </div>
                    </div>
                    <div class="top-buy-price">${player.winningPrice}</div>
                </div>
            `;
        });
    } else {
        topBuysContainer.innerHTML = '<p>Auction results are being finalized.</p>';
    }
}

function renderFixtures(fixtures) {
    // This function can be simplified as we no longer need brackets
    const container = document.getElementById('fixtures-container');
    if (!container) return;

    const tournaments = {};
    if (fixtures && Array.isArray(fixtures)) {
        fixtures.forEach(fixture => {
            if (!tournaments[fixture.tournament]) tournaments[fixture.tournament] = [];
            tournaments[fixture.tournament].push(fixture);
        });
    }

    container.innerHTML = '';
    for (const tournamentName in tournaments) {
        const tableRows = tournaments[tournamentName].map(match => {
            const teamsHtml = match.team2 ? 
                `${match.team1} <span style="color:#7f8c8d;font-weight:normal;">vs</span> ${match.team2}` :
                match.team1;
            const winnerHtml = match.winner ? `<i class="fas fa-trophy"></i> ${match.winner}` : 'TBD';
            return `<tr><td>${match.matchNum}</td><td>${teamsHtml}</td><td>${match.timeVenue}</td><td class="winner-col">${winnerHtml}</td></tr>`;
        }).join('');
        
        container.innerHTML += `
            <div class="fixture-tournament">
                <h3 class="fixture-tournament-title">${tournamentName}</h3>
                <table class="fixture-table">
                    <thead><tr><th>Match</th><th>Teams / Event</th><th>Time & Venue</th><th>Winner</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>`;
    }
}

function renderTeams(teams) {
    const container = document.getElementById('teams-container');
    if (!container) return;
    container.innerHTML = '';
    teams.forEach(team => {
        const rosterHtml = team.roster.map(player => `
            <div class="player-row">
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-category">${player.category}</div>
                </div>
                <div class="player-price">${player.price}</div>
            </div>
        `).join('');

        container.innerHTML += `
          <div class="team-roster-card">
            <div class="team-roster-header">
                <div class="team-roster-name">${team.name}</div>
                <div class="team-roster-stats">
                    <p>Players: ${team.playersBoughtCount}</p>
                    <p>Budget Left: ${team.budgetRemaining}</p>
                </div>
            </div>
            <div class="team-roster-body">
                ${rosterHtml || '<div class="player-row"><p>No players were bought by this team.</p></div>'}
            </div>
          </div>`;
    });
}

function renderPlayers(players) {
    const tbody = document.getElementById('player-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    players.forEach(player => {
        const statusBadge = player.status ? `<span class="status-badge status-${player.status.toLowerCase()}">${player.status}</span>` : 'N/A';
        tbody.innerHTML += `
          <tr>
            <td>${player.name}</td>
            <td>${player.category}</td>
            <td>${player.basePrice}</td>
            <td>${statusBadge}</td>
            <td>${player.winningPrice || 'N/A'}</td>
            <td>${player.winningTeam || 'N/A'}</td>
          </tr>`;
    });
}