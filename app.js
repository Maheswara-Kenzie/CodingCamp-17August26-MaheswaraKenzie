// Data State
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budgetLimit = parseFloat(localStorage.getItem('budgetLimit')) || 0;
let chartInstance = null;

// DOM Elements
const form = document.getElementById('transaction-form');
const itemNameInput = document.getElementById('item-name');
const itemAmountInput = document.getElementById('item-amount');
const itemCategoryInput = document.getElementById('item-category');

const totalBalanceEl = document.getElementById('total-balance');
const transactionListEl = document.getElementById('transaction-list');
const budgetLimitInput = document.getElementById('budget-limit');

const sortSelect = document.getElementById('sort-select');
const monthFilterInput = document.getElementById('month-filter');
const monthlyTotalEl = document.getElementById('monthly-total');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  budgetLimitInput.value = budgetLimit || '';
  
  // Set default filter bulan ke bulan saat ini
  const today = new Date();
  const currentYearMonth = today.toISOString().slice(0, 7);
  monthFilterInput.value = currentYearMonth;

  initChart();
  updateUI();
});

// Helper: Format Rupiah
function formatRupiah(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// LocalStorage Persistence
function saveData() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('budgetLimit', budgetLimit);
}

// Form Submit Handler
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = itemNameInput.value.trim();
  const amount = parseFloat(itemAmountInput.value);
  const category = itemCategoryInput.value;

  // Validation
  if (!name || isNaN(amount) || amount <= 0 || !category) {
    alert('Harap isi semua bidang dengan benar!');
    return;
  }

  const newTransaction = {
    id: Date.now(),
    name,
    amount,
    category,
    date: new Date().toISOString()
  }; 

  transactions.push(newTransaction);
  saveData();
  updateUI();

  // Reset Form
  form.reset();
});

// Delete Transaction
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  updateUI();
}

// Update Budget Limit Input
budgetLimitInput.addEventListener('input', (e) => {
  budgetLimit = parseFloat(e.target.value) || 0;
  saveData();
  renderTransactions();
});

// Sort Event Listener
sortSelect.addEventListener('change', renderTransactions);

// Month Filter Listener
monthFilterInput.addEventListener('change', updateMonthlySummary);

// Calculation Helpers
function calculateTotalBalance() {
  return transactions.reduce((acc, item) => acc + item.amount, 0);
}

function getSortedTransactions() {
  const sorted = [...transactions];
  const sortValue = sortSelect.value;

  if (sortValue === 'amount-high') {
    sorted.sort((a, b) => b.amount - a.amount);
  } else if (sortValue === 'amount-low') {
    sorted.sort((a, b) => a.amount - b.amount);
  } else if (sortValue === 'category') {
    sorted.sort((a, b) => a.category.localeCompare(b.category));
  } else {
    // date-desc
    sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  return sorted;
}

// Render Transaction List
function renderTransactions() {
  transactionListEl.innerHTML = '';

  const sortedList = getSortedTransactions();

  if (sortedList.length === 0) {
    transactionListEl.innerHTML = '<li style="text-align: center; color: #888; padding: 12px;">Belum ada transaksi.</li>';
    return;
  }

  sortedList.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'transaction-item';

    // Highlight spending over set limit
    if (budgetLimit > 0 && item.amount > budgetLimit) {
      li.classList.add('over-limit');
    }

    const formattedDate = new Date(item.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });

    li.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-meta">${item.category} • ${formattedDate}</span>
      </div>
      <div class="item-right">
        <span class="item-amount">${formatRupiah(item.amount)}</span>
        <button class="btn-delete" onclick="deleteTransaction(${item.id})">&times;</button>
      </div>
    `;

    transactionListEl.appendChild(li);
  });
}

// Update Monthly Summary
function updateMonthlySummary() {
  const selectedMonth = monthFilterInput.value; // YYYY-MM
  if (!selectedMonth) return;

  const monthlyTotal = transactions
    .filter(t => t.date.startsWith(selectedMonth))
    .reduce((acc, item) => acc + item.amount, 0);

  monthlyTotalEl.textContent = formatRupiah(monthlyTotal);
}

// Chart Initialization & Update
function initChart() {

  const ctx = document.getElementById('spending-chart').getContext('2d');
  console.log('canvas:', ctx);
  console.log('Chart:', typeof Chart);
  console.log(ctx.width);
  console.log(ctx.height);

  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Makanan', 'Transportasi', 'Hiburan', 'Kultur', 'Kecantikan', 'Hadiah', 'Kesehatan', 'Pendidikan'],
      datasets: [{
        data: [0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function updateChart() {
  const categories = { Makanan: 0, Transportasi: 0, Hiburan: 0 , Kultur: 0, Kecantikan: 0, Hadiah: 0, Kesehatan: 0, Pendidikan: 0 };

  transactions.forEach(t => {
    if (categories[t.category] !== undefined) {
      categories[t.category] += t.amount;
    }
  });

  chartInstance.data.datasets[0].data = [
    categories.Makanan,
    categories.Transportasi,
    categories.Hiburan,
    categories.Kultur,
    categories.Kecantikan,
    categories.Hadiah,
    categories.Kesehatan,
    categories.Pendidikan


  ];
  chartInstance.update();
}

// General UI Update
function updateUI() {
  totalBalanceEl.textContent = formatRupiah(calculateTotalBalance());
  renderTransactions();
  updateChart();
  updateMonthlySummary();
}