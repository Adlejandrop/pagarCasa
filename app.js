// app.js - Main application logic

let isEditMode = false;

document.addEventListener('DOMContentLoaded', () => {
    // Set dynamic month in title and page header
    const monthName = formatCurrentMonthSpanish();
    document.title = `Cuentas Casita — ${monthName}`;
    const mainTitle = document.getElementById('main-title');
    if (mainTitle) mainTitle.textContent = `Cuentas Casita — ${monthName}`;

    const editBtn = document.getElementById('edit-btn');
    if (editBtn) editBtn.addEventListener('click', () => toggleEditMode());
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => cancelEdits());

    loadCurrentMonthView();
    loadPaymentsView();
});

async function loadCurrentMonthView() {
    const currentMonth = getCurrentMonth();
    const accounts = await fetchAccounts();
    const payments = await fetchPaymentsForMonth(currentMonth);

    const container = document.getElementById('current-month-container');
    container.innerHTML = '';

    accounts.forEach(account => {
        const payment = payments.find(p => p.account_id === account.id);
        const status = payment ? payment.status : 'POR PAGAR';
        const amount = payment?.amount ?? '';

        const row = document.createElement('tr');

        const linkCell = isEditMode
            ? `<input type="text" id="link-${account.id}" value="${account.payment_link || ''}" class="input-link" />`
            : `<a href="${account.payment_link || '#'}" target="_blank" class="link-pay">Pagar</a>`;

        const usernumCell = isEditMode
            ? `<input type="text" id="usernum-${account.id}" value="${account.client_number || ''}" class="input-usernum" />`
            : `${account.client_number || ''}`;

        row.innerHTML = `
            <td class="p-3 border border-gray-300">${account.service_name}</td>
            <td class="p-3 border border-gray-300">${linkCell}</td>
            <td class="p-3 border border-gray-300">${usernumCell}</td>
            <td class="p-3 border border-gray-300">${status}</td>
            <td class="p-3 border border-gray-300">
                <input 
                    type="number" 
                    id="amount-${account.id}" 
                    value="${amount}" 
                    placeholder="Monto"
                    class="input-amount"
                >
            </td>
            <td class="p-3 border border-gray-300">
                <button 
                    onclick="markAsPaid('${account.id}')" 
                    class="btn-paid"
                >
                    Marcar Pagado
                </button>
            </td>
        `;

        container.appendChild(row);
    });
}

async function loadPaymentsView() {
    const payments = await fetchAllPayments();

    const container = document.getElementById('payments-container');
    container.innerHTML = '';

    payments.forEach(payment => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td class="p-3 border border-gray-300">
                ${payment.accounts?.service_name || ''}
            </td>
            <td class="p-3 border border-gray-300">${payment.month}</td>
            <td class="p-3 border border-gray-300">${payment.status}</td>
            <td class="p-3 border border-gray-300">${payment.amount ?? ''}</td>
        `;

        container.appendChild(row);
    });
}

async function markAsPaid(accountId) {
    const currentMonth = getCurrentMonth();

    const amountInput = document.getElementById(`amount-${accountId}`);
    const amountValue = amountInput.value;

    const amount = amountValue ? parseFloat(amountValue) : null;

    const { error } = await supabaseClient
        .from('payments')
        .upsert(
            {
                account_id: accountId,
                month: currentMonth,
                status: 'PAGADO',
                amount: amount
            },
            {
                onConflict: 'account_id,month'
            }
        );

    if (error) {
        console.error('Error updating payment:', error);
        alert('Error al marcar como pagado');
        return;
    }

    alert('Marcado como pagado');

    await loadCurrentMonthView();
    await loadPaymentsView();
}

async function toggleEditMode() {
    const editBtn = document.getElementById('edit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    if (!isEditMode) {
        // enter edit mode
        isEditMode = true;
        if (editBtn) editBtn.textContent = 'Guardar';
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
        await loadCurrentMonthView();
        return;
    }

    // save edits
    if (editBtn) editBtn.disabled = true;
    try {
        await saveEdits();
    } catch (err) {
        console.error('Error saving edits', err);
        alert('Error al guardar cambios');
    }
    isEditMode = false;
    if (editBtn) editBtn.textContent = 'Editar';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (editBtn) editBtn.disabled = false;
    await loadCurrentMonthView();
}

async function saveEdits() {
    const accounts = await fetchAccounts();
    const updates = [];

    for (const account of accounts) {
        const usernumEl = document.getElementById(`usernum-${account.id}`);
        const linkEl = document.getElementById(`link-${account.id}`);

        const newNum = usernumEl ? usernumEl.value.trim() : account.client_number || '';
        const newLink = linkEl ? linkEl.value.trim() : account.payment_link || '';

        if (newNum !== (account.client_number || '') || newLink !== (account.payment_link || '')) {
            updates.push({ id: account.id, client_number: newNum, payment_link: newLink });
        }
    }

    if (updates.length === 0) return;

    // Run updates sequentially to simplify error handling
    for (const u of updates) {
        const { error } = await supabaseClient
            .from('accounts')
            .update({ client_number: u.client_number, payment_link: u.payment_link })
            .eq('id', u.id);
        if (error) throw error;
    }

    alert('Cambios guardados');
}

function cancelEdits() {
    if (!isEditMode) return;
    const confirmCancel = confirm('Descartar cambios y salir de modo edición?');
    if (!confirmCancel) return;
    isEditMode = false;
    const editBtn = document.getElementById('edit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    if (editBtn) editBtn.textContent = 'Editar';
    if (cancelBtn) cancelBtn.style.display = 'none';
    loadCurrentMonthView();
}

async function fetchAccounts() {
    const { data, error } = await supabaseClient
        .from('accounts')
        .select('*')
        .order('service_name');

    if (error) {
        console.error('Error fetching accounts:', error);
        return [];
    }

    return data || [];
}

async function fetchPaymentsForMonth(month) {
    const { data, error } = await supabaseClient
        .from('payments')
        .select('*')
        .eq('month', month);

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }

    return data || [];
}

async function fetchAllPayments() {
    const { data, error } = await supabaseClient
        .from('payments')
        .select(`
            id,
            month,
            status,
            amount,
            accounts (
                service_name
            )
        `)
        .order('month', { ascending: false });

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }

    return data || [];
}

function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function formatCurrentMonthSpanish() {
    const now = new Date();
    const opts = { month: 'long', year: 'numeric' };
    // e.g. "marzo de 2026" -> capitalize first letter
    const formatted = now.toLocaleDateString('es-ES', opts);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}