document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('.search-input');
    const btn = document.querySelector('.search-btn');
    const rows = Array.from(document.querySelectorAll('.table-row'));

    function performSearch() {
        const q = (input.value || '').toLowerCase().trim();
        rows.forEach(r => {
            const text = r.textContent.toLowerCase();
            r.style.display = text.includes(q) ? '' : 'none';
        });
    }

    btn?.addEventListener('click', performSearch);
    input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Keep dropdown menu hover stable (reuse logic)
    const navLogo = document.querySelector('.nav-logo');
    let hoverTimer;
    if (navLogo) {
        navLogo.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimer);
            navLogo.classList.add('menu-open');
        });
        navLogo.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimer);
            hoverTimer = setTimeout(() => {
                navLogo.classList.remove('menu-open');
            }, 180);
        });
    }

    // Edit coverage: open a coverage summary modal using logic similar to pending approvals
    const coverageModal = document.getElementById('coverage-summary-modal');
    const modalClose = coverageModal?.querySelector('.modal-close');
    const decisionSelect = document.getElementById('edit-coverage-select');
    const summaryContent = document.getElementById('coverage-summary-content');
    const confirmBtn = document.getElementById('confirm-coverage-summary');
    const redType = document.getElementById('summary-reduction-type');
    const redAmount = document.getElementById('summary-reduction-amount');
    const partialModal = document.getElementById('partial-coverage-modal');
    const denialModal = document.getElementById('ma-denial-reason-modal');
    const maConfirmPartial = document.getElementById('ma-confirm-partial');
    const maConfirmDenial = document.getElementById('ma-confirm-denial');

    let deniedFromSelected = 0;

    function openModal() {
        if (!coverageModal) return;
        coverageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (redType) redType.value = '';
        if (redAmount) redAmount.value = '';
        renderSummary();
    }
    function closeModal() {
        if (!coverageModal) return;
        coverageModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    modalClose?.addEventListener('click', closeModal);
    coverageModal?.addEventListener('click', (e) => { if (e.target === coverageModal) closeModal(); });

    function formatUSD(num){ return `US$ ${Number(num).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
    function truncate2(n){ const x=Number(n); return Math.floor(x*100)/100; }
    function parseMoney(text){ let normalized=String(text).replace(/[^0-9,\.]/g,''); if(normalized.includes(',')&&normalized.includes('.')){normalized=normalized.replace(/\./g,'').replace(',', '.');} else if(normalized.includes(',')){normalized=normalized.replace(',', '.');} return parseFloat(normalized)||0; }
    function parseLastMoneyToken(label){
        const tokens = String(label).match(/(?:US?\$)?\s?[0-9][0-9\.,]*/g);
        if (!tokens || tokens.length === 0) return 0;
        return parseMoney(tokens[tokens.length - 1]);
    }

    let currentRow = null;
    function renderSummary(){
        if (!summaryContent) return;
        // For this minimal integration, derive basic values from the row
        const totalCell = currentRow?.querySelector('.total-amount');
        const totalVal = totalCell ? parseMoney(totalCell.textContent) : 0;
        const savingsAttr = currentRow?.getAttribute('data-savings');
        const savings = savingsAttr ? parseFloat(savingsAttr) : 0;
        const tpaFees = truncate2(savings * 0.165);
        const allowed = truncate2(Math.max(totalVal - tpaFees, 0));
        const invoiceTotal = truncate2(allowed + savings);
        const reduction = parseFloat(redAmount?.value || '');
        const isPartial = decisionSelect?.value === 'partial';
        const isCovered = decisionSelect?.value === 'full';
        const isNotCovered = decisionSelect?.value === 'none';
        const showReduction = !isNotCovered; // show reductions for Covered and Partially Denied
        if (document.getElementById('summary-reduction-inline')) {
            document.getElementById('summary-reduction-inline').style.display = showReduction ? '' : 'none';
        }
        // If partial and user hasn't selected lines yet, try preset from Notes cell
        if (isPartial && (!deniedFromSelected || deniedFromSelected <= 0)) {
            const notesCell = currentRow?.querySelector('.notes');
            const preset = notesCell ? parseLastMoneyToken(notesCell.textContent) : 0;
            if (preset > 0) deniedFromSelected = preset;
        }

        const patientResp = isPartial
            ? truncate2((deniedFromSelected||0) + (reduction>0?reduction:0))
            : (isNotCovered ? invoiceTotal : (reduction>0 ? reduction : 0));
        const total = truncate2(allowed + tpaFees - (patientResp||0));
        const prLine = patientResp>0?`<div class="label">Patient’s Responsibility</div><div class="value">${formatUSD(patientResp)}</div>${(isPartial && reduction>0)?`<div class="subnote">${formatUSD(deniedFromSelected)} denied + ${formatUSD(reduction)} reduction</div>`:''}`:'';
        if (isNotCovered) {
            // Show only Patient's Responsibility for Not Covered
            summaryContent.innerHTML = `
                <div class="label">Patient’s Responsibility</div><div class="value">${formatUSD(totalVal)}</div>
            `;
        } else {
            summaryContent.innerHTML = `
                <div class="label">Invoice total</div><div class="value">${formatUSD(invoiceTotal)}</div>
                <div class="label">Savings</div><div class="value">${formatUSD(savings)}</div>
                <div class="label">Allowed amount</div><div class="value">${formatUSD(allowed)}</div>
                <div class="label">TPA fees</div><div class="value">${formatUSD(tpaFees)}</div>
                ${prLine}
                <div class="label">Total</div><div class="value">${formatUSD(total)}</div>
            `;
        }
        // Enable/disable confirm: if partial and reduction entered, require type
        if (confirmBtn && decisionSelect) {
            let enable = true;
            const amountEntered = redAmount && redAmount.value !== '';
            if ((decisionSelect.value === 'partial' || decisionSelect.value === 'full') && amountEntered && redType && !redType.value) enable = false;
            confirmBtn.disabled = !enable;
        }
    }

    decisionSelect?.addEventListener('change', () => {
        if (decisionSelect.value === 'partial') {
            // open partial lines modal
            if (partialModal) {
                partialModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        } else {
            renderSummary();
        }
    });
    redAmount?.addEventListener('input', renderSummary);
    redType?.addEventListener('change', renderSummary);
    confirmBtn?.addEventListener('click', () => {
        // Guard: if partial and reduction amount entered, require type selected
        if (decisionSelect && decisionSelect.value === 'partial') {
            const amountEntered = redAmount && redAmount.value !== '' && !isNaN(parseFloat(redAmount.value));
            if (amountEntered && redType && !redType.value) {
                // keep modal open and block confirm
                confirmBtn.disabled = true;
                return;
            }
        }
        // Minimal UX: reflect change in Decision cell and close
        const statusCell = currentRow?.querySelector('.status .status-badge');
        if (statusCell && decisionSelect) {
            if (decisionSelect.value === 'full') { statusCell.textContent = 'Covered'; statusCell.className = 'status-badge low'; }
            if (decisionSelect.value === 'partial') { statusCell.textContent = 'Partially Denied'; statusCell.className = 'status-badge medium'; }
            if (decisionSelect.value === 'none') { statusCell.textContent = 'Not Covered'; statusCell.className = 'status-badge high'; }
        }
        closeModal();
    });

    // Partial flow handlers
    function closePartial() { partialModal?.classList.remove('active'); document.body.style.overflow=''; }
    function closeDenial() { denialModal?.classList.remove('active'); document.body.style.overflow=''; }
    partialModal?.querySelector('.modal-close')?.addEventListener('click', closePartial);
    denialModal?.querySelector('.modal-close')?.addEventListener('click', closeDenial);

    maConfirmPartial?.addEventListener('click', () => {
        // Compute denied sum from selected checkboxes
        const boxes = partialModal?.querySelectorAll('.line-checkbox:checked') || [];
        deniedFromSelected = 0;
        boxes.forEach(cb => {
            const lbl = cb.nextElementSibling ? cb.nextElementSibling.textContent : '';
            deniedFromSelected += parseLastMoneyToken(lbl);
        });
        closePartial();
        if (denialModal) {
            denialModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    maConfirmDenial?.addEventListener('click', () => {
        // After denial reason, update summary to show partial logic
        closeDenial();
        renderSummary();
        openModal();
    });

    document.querySelectorAll('.btn-edit-coverage').forEach(btn => {
        btn.addEventListener('click', function(){
            currentRow = this.closest('.table-row');
            // Preselect current decision in dropdown
            const badge = currentRow?.querySelector('.status .status-badge');
            if (badge && decisionSelect) {
                const txt = badge.textContent.trim().toLowerCase();
                if (txt.includes('covered') && !txt.includes('not')) decisionSelect.value = 'full';
                else if (txt.includes('partially')) decisionSelect.value = 'partial';
                else if (txt.includes('not')) decisionSelect.value = 'none';
            }
            deniedFromSelected = 0;
            openModal();
        });
    });
});


