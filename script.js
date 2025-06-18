console.log("Script loaded");
let transactions = [];

function addTransaction() {
    const input = document.getElementById('transaction');
    const category = document.getElementById('category').value;
    if (input.value.trim()) {
        transactions.push({ description: input.value.trim(), category: category });
        input.value = '';
        updateSummary();
        // Uncomment the next line if you want a chart
        // updateChart();
    }
}

function updateSummary() {
    const summaryDiv = document.getElementById('summary');
    if (transactions.length > 0) {
        const byCategory = {};
        transactions.forEach(t => {
            byCategory[t.category] = (byCategory[t.category] || 0) + 1;
        });
        summaryDiv.innerHTML = `<p>Transactions by category: ${Object.entries(byCategory).map(([cat, count]) => `${cat}: ${count}`).join(', ')}</p>`;
    } else {
        summaryDiv.innerHTML = '<p>No transactions yet.</p>';
    }
}

function updateChart() {
    // This function will be implemented if you confirm you want a chart
    const categoryCounts = {};
    transactions.forEach(t => {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });
    // Placeholder for chart code
    console.log("Chart data:", categoryCounts);
}

// Initial update
updateSummary();