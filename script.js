console.log("Script loaded");

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

function saveToStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function addTransaction() {
  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value.trim());
  const category = document.getElementById('category').value;

  if (!description || isNaN(amount)) {
    alert("Please enter a valid description and amount.");
    return;
  }

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

  document.getElementById('description').value = '';
  document.getElementById('amount').value = '';
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage();
  updateUI();
}

function updateUI() {
  const summaryDiv = document.getElementById('summary');
  const list = document.getElementById('transaction-list');
  list.innerHTML = '';

  if (transactions.length === 0) {
    summaryDiv.innerHTML = '<p>No transactions yet.</p>';
    return;
  }

  let income = 0, expense = 0;
  const categoryCounts = {};

  transactions.forEach(t => {
    if (t.amount > 0) income += t.amount;
    else expense += t.amount;

    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;

    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${t.description}</strong> (${t.category})<br/>
        <small>${t.timestamp}</small><br/>
        Amount: R${t.amount.toFixed(2)}
      </div>
      <button class="delete-btn" onclick="deleteTransaction(${t.id})">Delete</button>
    `;
    list.appendChild(li);
  });

  const balance = income + expense;

  summaryDiv.innerHTML = `
    <p><strong>Balance:</strong> R${balance.toFixed(2)}</p>
    <p><strong>Income:</strong> R${income.toFixed(2)} | <strong>Expenses:</strong> R${Math.abs(expense).toFixed(2)}</p>
    <p><strong>By Category:</strong> ${Object.entries(categoryCounts).map(([cat, count]) => `${cat}: ${count}`).join(', ')}</p>
  `;
}

updateUI();
