console.log("Script loaded");

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let categoryBudgets = JSON.parse(localStorage.getItem('categoryBudgets')) || {};

let categoryChart; // Chart.js instance

function saveToStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('categoryBudgets', JSON.stringify(categoryBudgets));
}

function addTransaction(description, amount, category) {
  const transaction = {
    id: Date.now(),
    description,
    amount,
    category,
    timestamp: new Date().toLocaleString()
  };

  transactions.push(transaction);
  saveToStorage();
  updateUI();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage();
  updateUI();
}

function setCategoryBudget(category, value) {
  const amount = parseFloat(value);
  if (!isNaN(amount) && amount >= 0) {
    categoryBudgets[category] = amount;
    saveToStorage();
    updateUI();
  }
}

function renderCategoryBudgetInputs() {
  const categories = [...new Set(transactions.map(t => t.category))];
  const container = document.getElementById('category-budget-list');
  container.innerHTML = '';

  if (categories.length === 0) {
    container.innerHTML = '<p>No category budgets set yet.</p>';
    return;
  }

  categories.forEach(category => {
    if (category === 'Income') return; // Skip Income category

    const currentBudget = categoryBudgets[category] || 0;
    const spent = -transactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = currentBudget - spent;

    const wrapper = document.createElement('div');
    wrapper.className = 'category-budget-item';
    wrapper.innerHTML = `
      <label for="budget-${category}">${category} Budget (R):</label>
      <input
        id="budget-${category}"
        type="number"
        min="0"
        step="0.01"
        value="${currentBudget}"
        aria-label="Set budget for ${category}"
      />
      <div>
        <small>Spent: R${spent.toFixed(2)} | Remaining: R${remaining.toFixed(2)}</small>
      </div>
      <div class="budget-progress" aria-hidden="true">
        <div class="budget-progress-bar progress-green" style="width: 0;"></div>
      </div>
    `;
    container.appendChild(wrapper);

    const input = wrapper.querySelector('input');
    input.addEventListener('change', () => {
      let val = parseFloat(input.value);
      if (val < 0 || isNaN(val)) val = 0;
      input.value = val.toFixed(2);
      setCategoryBudget(category, val);
    });
  });
}

function updateCategoryChart() {
  const categoryTotals = {};

  transactions.forEach(t => {
    if (t.amount < 0) {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    }
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  const ctx = document.getElementById('categoryChart').getContext('2d');

  if (categoryChart) {
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.update();
  } else {
    categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Expenses by Category (R)',
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R' + value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'R' + context.parsed.y.toLocaleString();
              }
            }
          }
        }
      }
    });
  }
}

function updateUI() {
  const summaryDiv = document.getElementById('summary');
  const list = document.getElementById('transaction-list');

  list.innerHTML = '';

  if (transactions.length === 0) {
    summaryDiv.innerHTML = '<p>No transactions yet.</p>';
    renderCategoryBudgetInputs();
    updateCategoryChart();
    return;
  }

  let income = 0, expense = 0;
  const categoryCounts = {};
  const categorySums = {};

  transactions.forEach(t => {
    if (t.amount > 0) income += t.amount;
    else expense += t.amount;

    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    categorySums[t.category] = (categorySums[t.category] || 0) + t.amount;

    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.className = t.amount >= 0 ? 'income' : 'expense';

    li.innerHTML = `
      <div>
        <strong>${t.description}</strong> (${t.category})<br/>
        <small>${t.timestamp}</small><br/>
        Amount: ${t.amount.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}
      </div>
      <button class="delete-btn" type="button" aria-label="Delete transaction">Delete</button>
    `;

    list.appendChild(li);
  });

  const balance = income + expense;

  summaryDiv.innerHTML = `
    <p><strong>Balance:</strong> ${balance.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}</p>
    <p><strong>Income:</strong> ${income.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })} | <strong>Expenses:</strong> ${Math.abs(expense).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}</p>
    <p><strong>By Category:</strong> ${Object.entries(categoryCounts).map(([cat, count]) => `${cat}: ${count}`).join(', ')}</p>
  `;

  renderCategoryBudgetInputs();

  // Update progress bars & texts
  const categoryBudgetItems = document.querySelectorAll('#category-budget-list .category-budget-item');

  categoryBudgetItems.forEach(div => {
    const label = div.querySelector('label');
    const bar = div.querySelector('.budget-progress-bar');
    const statusText = div.querySelector('small');

    const category = label.textContent.replace(' Budget (R):', '').trim();

    const budget = categoryBudgets[category] || 0;
    const spent = - (categorySums[category] || 0);

    if (budget > 0) {
      const percent = Math.min((spent / budget) * 100, 100);
      bar.style.width = `${percent}%`;

      let barClass = 'progress-green';
      if (spent / budget > 0.7 && spent / budget <= 1) barClass = 'progress-yellow';
      else if (spent / budget > 1) barClass = 'progress-red';

      bar.className = `budget-progress-bar ${barClass}`;

      const remaining = budget - spent;
      if (remaining >= 0) {
        statusText.className = 'budget-ok';
        statusText.textContent = `Spent: R${spent.toFixed(2)} | Remaining: R${remaining.toFixed(2)}`;
      } else {
        statusText.className = 'budget-over';
        statusText.textContent = `Spent: R${spent.toFixed(2)} | Over budget by R${Math.abs(remaining).toFixed(2)}`;
      }
    } else {
      bar.style.width = '0';
      bar.className = 'budget-progress-bar progress-green';
      statusText.textContent = '';
    }
  });

  updateCategoryChart();
}

// Event Listeners
document.getElementById('transaction-list').addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const li = e.target.closest('li');
    const id = Number(li.dataset.id);

    if (confirm('Delete this transaction?')) {
      deleteTransaction(id);
    }
  }
});

document.getElementById('transaction-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const descInput = document.getElementById('description');
  const amountInput = document.getElementById('amount');
  const categorySelect = document.getElementById('category');

  const description = descInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (!description || isNaN(amount)) {
    alert("Please enter a valid description and amount.");
    return;
  }

  addTransaction(description, amount, category);

  descInput.value = '';
  amountInput.value = '';
  descInput.focus();
});

// Initial UI update on page load
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
});
