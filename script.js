// =========================================================================
// !!! IMPORTANT !!! PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzozQN1ULev_Bsq4rTLUc3C1kcHmkbKd2hvjzPvIYChQOIWYiCm11986SR4K4LMsTj0Rg/exec"; 
// =========================================================================

// Global variable to hold chart instances so we can destroy them before redrawing
let chartInstances = {};

// --- INITIALIZATION ---
// When the page's HTML has loaded, start fetching data immediately.
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderAllData();
});
// Set a recurring timer to automatically refresh all data from the Google Sheet every 15 seconds.
setInterval(fetchAndRenderAllData, 15000);

// --- NAVIGATION ---
/**
 * Hides the landing page and shows the main multi-page app container.
 * This is triggered by the "Enter Live Dashboard" button.
 */
function enterApp() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
}

/**
 * Manages which detailed page (Dashboard, Fixtures, etc.) is visible.
 * @param {string} pageId The ID of the page to show.
 */
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    // Show the requested page
    document.getElementById(pageId).classList.add('active');
    
    // Update the 'active' style on the navigation bar links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.href.includes('#' + pageId)) {
            link.classList.add('active');
        }
    });
}

// --- CORE DATA HANDLING ---
/**
 * The main function that fetches the single JSON object from our Google Script API
 * and then calls the individual render functions for each part of the website.
 */
async function fetchAndRenderAllData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        // Check for any errors returned by the Google Script itself
        if (data.error) {
            console.error("API Error from Google Script:", data.error);
            return;
        }
        
        // Call all the functions to update the website with the new data
        renderLandingPage(data.landingPageData);
        renderDashboard(data.dashboardData);
        renderFixtures(data.fixturesData);
        renderTeams(data.teamsData);
        renderPlayers(data.playersData);
        
        // Hide the initial loading spinner once all data has been processed
        document.getElementById('loader').classList.add('hidden');

    } catch (error) {
        console.error("Failed to fetch or render data:", error);
    }
}

// --- RENDER FUNCTIONS ---

/**
 * Populates the dynamic sections of the initial landing page.
 * @param {object} landingPageData Contains the active player and top buys.
 */
function renderLandingPage({ activePlayer, topBuys }) {
    const onBlockCard = document.getElementById('on-the-block-card');
    if (activePlayer) {
        onBlockCard.innerHTML = `
            <h3><i class="fas fa-gavel"></i> On the Block</h3>
            <p class="on-block-name">${activePlayer.name}</p>
            <p>${activePlayer.category}</p>
            <p class="on-block-price">Base Price: ${activePlayer.basePrice}</p>
        `;
    } else {
        onBlockCard.innerHTML = `
            <h3><i class="fas fa-gavel"></i> On the Block</h3>
            <p class="on-block-name">Auction Paused</p>
            <p>Waiting for the next player...</p>
        `;
    }

    const topBuysContainer = document.getElementById('top-buys-container');
    topBuysContainer.innerHTML = '';
    if (topBuys && topBuys.length > 0) {
        topBuys.forEach(player => {
            topBuysContainer.innerHTML += `
                <div class="top-buy-card">
                    <span class="top-buy-name">${player.name}</span>
                    <span class="top-buy-price">${player.winningPrice}</span>
                </div>
            `;
        });
    } else {
        topBuysContainer.innerHTML = '<p>No players sold yet.</p>';
    }
}

/**
 * Populates the Dashboard page, including the top stat cards and the charts.
 * @param {object} dashboardData Contains data for stats and charts.
 */
function renderDashboard({ teamBudgets, playerStats, startingBudget }) {
    const statsContainer = document.querySelector('.dashboard-stats-grid');
    if (!statsContainer) return;
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-card-value">${playerStats.sold}</div>
            <div class="stat-card-label">Players Sold</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-value">${playerStats.unsold}</div>
            <div class="stat-card-label">Players Unsold</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-value">${playerStats.upcoming}</div>
            <div class="stat-card-label">Players Remaining</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-value">${teamBudgets.length}</div>
            <div class="stat-card-label">Total Teams</div>
        </div>
    `;
    renderBudgetChart(teamBudgets);
    renderStatusChart(playerStats);
}

/**
 * Renders the Team Budgets bar chart using Chart.js.
 * @param {Array} teamBudgets Array of team objects with name and remaining budget.
 */
function renderBudgetChart(teamBudgets) {
    const ctx = document.getElementById('budget-chart')?.getContext('2d');
    if (!ctx) return;
    if (chartInstances.budget) chartInstances.budget.destroy();
    chartInstances.budget = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: teamBudgets.map(t => t.name),
            datasets: [{ 
                label: 'Budget Remaining', 
                data: teamBudgets.map(t => t.remaining), 
                backgroundColor: '#136942', 
                borderRadius: 5,
            }]
        },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }
    });
}

/**
 * Renders the Auction Progress doughnut chart using Chart.js.
 * @param {object} playerStats Object with counts of sold, unsold, etc.
 */
function renderStatusChart(playerStats) {
    const ctx = document.getElementById('status-chart')?.getContext('2d');
    if (!ctx) return;
    if (chartInstances.status) chartInstances.status.destroy();
    chartInstances.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Sold', 'Unsold', 'Active', 'Upcoming'],
            datasets: [{ 
                data: [playerStats.sold, playerStats.unsold, playerStats.active, playerStats.upcoming], 
                backgroundColor: ['#88C03D', '#d9534f', '#E6912E', '#7f8c8d'],
                borderColor: '#FFFFFF', borderWidth: 4
            }]
        },
        options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
    });
}

/**
 * Renders the Fixtures page by grouping events by tournament.
 * @param {Array} fixtures Array of all fixture/event objects.
 */
function renderFixtures(fixtures) {
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
                `<td class="team-col">${match.team1}</td><td class="vs-col">vs</td><td class="team-col" style="text-align: left;">${match.team2}</td>` :
                `<td colspan="3" style="font-weight: 600;">${match.team1}</td>`;
            const winnerHtml = match.winner ? `<i class="fas fa-trophy"></i> ${match.winner}` : 'TBD';
            return `<tr><td>${match.matchNum}</td>${teamsHtml}<td>${match.timeVenue}</td><td class="winner-col">${winnerHtml}</td></tr>`;
        }).join('');
        
        container.innerHTML += `
            <div class="fixture-tournament">
                <h3 class="fixture-tournament-title">${tournamentName}</h3>
                <table class="fixture-table">
                    <thead><tr><th>Match</th><th colspan="3">Teams / Event</th><th>Time & Venue</th><th>Winner</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>`;
    }
}

/**
 * Renders the Teams page with a card for each team and their player roster.
 * @param {Array} teams Array of team objects.
 */
function renderTeams(teams) {
    const container = document.getElementById('teams-container');
    if (!container) return;
    container.innerHTML = '';
    teams.forEach(team => {
        const rosterHtml = team.roster.map(p => `<li><span>${p.name}</span><span>${p.price}</span></li>`).join('');
        container.innerHTML += `
          <div class="team-card">
            <div class="team-card-header">${team.name}</div>
            <div class="team-card-body">
              <p><strong>Budget Remaining:</strong> ${team.budgetRemaining}</p>
              <p><strong>Players Bought:</strong> ${team.playersBoughtCount}</p>
              <hr><h4>Roster</h4>
              <ul class="team-roster">${rosterHtml || '<li>No players bought yet.</li>'}</ul>
            </div>
          </div>`;
    });
}

/**
 * Renders the full player list in the table on the Players page.
 * @param {Array} players Array of all player objects.
 */
function renderPlayers(players) {
    const tbody = document.getElementById('player-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    players.forEach(player => {
        tbody.innerHTML += `
          <tr>
            <td>${player.name}</td><td>${player.category}</td><td>${player.basePrice}</td>
            <td>${player.status}</td><td>${player.winningPrice || 'N/A'}</td><td>${player.winningTeam || 'N/A'}</td>
          </tr>`;
    });
}