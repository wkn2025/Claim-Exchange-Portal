// ===== PENDING APPROVALS PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', function() {
    // Keep top menu open a bit more reliably on hover
    const navLogo = document.querySelector('.nav-logo');
    const menuTrigger = document.querySelector('.app-menu-trigger');
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
            }, 180); // small delay to allow moving into dropdown
        });
    }
    
    // ===== MODAL ELEMENTS =====
    const partialCoverageModal = document.getElementById('partial-coverage-modal');
    const denialReasonModal = document.getElementById('denial-reason-modal');
    const patientRespModal = document.getElementById('patient-resp-modal');
    const coverageSummaryModal = document.getElementById('coverage-summary-modal');
    const modalCloses = document.querySelectorAll('.modal-close');
    const confirmPartialBtn = document.getElementById('confirm-partial');
    const confirmDenialBtn = document.getElementById('confirm-denial');
    const confirmPatientRespBtn = document.getElementById('confirm-patient-resp');
    const patientRespInput = document.getElementById('patient-resp-input');
    const coverageSummaryContent = document.getElementById('coverage-summary-content');
    const confirmCoverageSummaryBtn = document.getElementById('confirm-coverage-summary');
    let currentSelectElement = null;
    let coverageInProgressSelect = null;
    let coverageConfirmed = false;
    let selectedLines = [];
    
    // ===== COVERAGE DECISION FUNCTIONALITY =====
    const coverageSelects = document.querySelectorAll('.coverage-select');
    
    coverageSelects.forEach(select => {
        select.addEventListener('change', function() {
            if (!this.value) return;
            if (this.value === 'partial') {
                currentSelectElement = this;
                openPartialCoverageModal();
            } else {
                showCoverageSummary(this);
            }
        });
    });

    function applyCoverageTag(selectEl, text, type) {
        const cell = selectEl.closest('.coverage-decision');
        const tag = cell.querySelector('.coverage-tag');
        tag.textContent = text;
        tag.hidden = false;
        showNotification(`Coverage set: ${text}`, type === 'success' ? 'success' : (type === 'error' ? 'error' : 'info'));
    }
    
    // ===== PARTIAL COVERAGE MODAL =====
    function openPartialCoverageModal() {
        partialCoverageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Reset previously selected lines for a fresh partial selection flow
        selectedLines = [];
        
        // Build denial options from the selected row's breakdown: "CPT: Description - US$ Allowed"
        const linesContainer = partialCoverageModal.querySelector('.payment-lines');
        if (linesContainer) {
            linesContainer.innerHTML = '';
            const rowId = currentSelectElement ? currentSelectElement.getAttribute('data-row') : null;
            const breakdownTable = rowId ? document.querySelector(`.details-row[data-for="${rowId}"] .breakdown-table`) : null;
            if (breakdownTable) {
                const cells = Array.from(breakdownTable.querySelectorAll('.breakdown-cell'));
                let optionIndex = 0;
                for (let i = 0; i < cells.length; i += 5) {
                    const cptCell = cells[i];
                    const descCell = cells[i + 1];
                    const priceCell = cells[i + 2];
                    const savingsCell = cells[i + 3];
                    const allowedCell = cells[i + 4];
                    // Stop at totals row (empty CPT and desc "TOTAL")
                    const isTotals = (!cptCell || !cptCell.textContent.trim()) && descCell && descCell.textContent.trim().toUpperCase() === 'TOTAL';
                    if (isTotals) break;
                    if (!cptCell || !descCell || !allowedCell) continue;
                    const cpt = cptCell.textContent.trim();
                    const desc = descCell.textContent.trim();
                    const allowedText = allowedCell.textContent.trim();
                    const inputId = `line-${rowId}-${++optionIndex}`;
                    const lineDiv = document.createElement('div');
                    lineDiv.className = 'payment-line';
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.className = 'line-checkbox';
                    input.id = inputId;
                    const label = document.createElement('label');
                    label.setAttribute('for', inputId);
                    label.textContent = `${cpt}: ${desc} - ${allowedText}`;
                    lineDiv.appendChild(input);
                    lineDiv.appendChild(label);
                    linesContainer.appendChild(lineDiv);
                }
            }
            // Attach change listeners to newly added checkboxes and reset state
            linesContainer.querySelectorAll('.line-checkbox').forEach(cb => {
                cb.checked = false;
                cb.addEventListener('change', updateConfirmButton);
            });
        }
        
        // Disable confirm until at least one line is selected
        updateConfirmButton();
    }
    
    function closePartialCoverageModal() {
        partialCoverageModal.classList.remove('active');
        document.body.style.overflow = '';
        // Do NOT reset currentSelectElement here; closing after confirm would wipe the value
    }
    
    function updateConfirmButton() {
        const checkedBoxes = document.querySelectorAll('.line-checkbox:checked');
        confirmPartialBtn.disabled = checkedBoxes.length === 0;
    }
    
    // ===== DENIAL REASON MODAL =====
    function openDenialReasonModal() {
        denialReasonModal.classList.add('active');
        
        // Reset radio buttons
        const radios = document.querySelectorAll('input[name="denial-reason"]');
        radios.forEach(radio => {
            radio.checked = false;
        });
        
        updateDenialConfirmButton();
    }
    
    function closeDenialReasonModal() {
        denialReasonModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function updateDenialConfirmButton() {
        const checkedRadio = document.querySelector('input[name="denial-reason"]:checked');
        confirmDenialBtn.disabled = !checkedRadio;
    }
    
    // ===== EVENT LISTENERS =====
    
    // Checkbox change listeners
    document.querySelectorAll('.line-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateConfirmButton);
    });
    
    // Radio button change listeners
    document.querySelectorAll('input[name="denial-reason"]').forEach(radio => {
        radio.addEventListener('change', updateDenialConfirmButton);
    });
    
    // Confirm partial coverage
    confirmPartialBtn.addEventListener('click', function() {
        const checkedBoxes = document.querySelectorAll('.line-checkbox:checked');
        selectedLines = Array.from(checkedBoxes).map(cb => cb.nextElementSibling.textContent);
        // Persist a stable denied amount sum on the row, so it survives the modal hop
        let deniedSum = 0;
        selectedLines.forEach(label => {
            const parsed = parseMoney(String(label).match(/(?:US?/$)?/s?[0-9][0-9/.,]*$/)?.[0] || '0');
            console.debug('[PR DEBUG] confirmSelection: label ->', label, 'parsed ->', parsed);
            deniedSum += parsed;
        });
        console.debug('[PR DEBUG] confirmSelection: deniedSum ->', deniedSum, 'selectedLines ->', selectedLines);
        if (currentSelectElement) {
            const row = currentSelectElement.closest('.table-row');
            if (row) {
                row.dataset.deniedAmount = String(deniedSum || 0);
                console.debug('[PR DEBUG] confirmSelection: persisted row.dataset.deniedAmount =', row.dataset.deniedAmount);
            }
        }
        
        closePartialCoverageModal();
        openDenialReasonModal();
    });
    
    // Confirm denial reason
    confirmDenialBtn.addEventListener('click', function() {
        // Gather selected denial lines from dynamically built list
        const checkedBoxes = Array.from(document.querySelectorAll('.payment-lines .line-checkbox:checked'));
        selectedLines = checkedBoxes.map(cb => cb.nextElementSibling.textContent);
        const selectedReason = document.querySelector('input[name="denial-reason"]:checked');
        if (selectedReason) {
            const reasonText = selectedReason.nextElementSibling.textContent;
            // no popup here per requirements
            // Update the row to show partial coverage applied
            if (currentSelectElement) {
                const row = currentSelectElement.closest('.table-row');
                row.style.background = '#fef3c7';
                
                // Add visual indicator
                const uhapId = row.querySelector('.uhap-id').textContent;
                console.log(`Partial coverage applied to claim ${uhapId}:`, {
                    deniedLines: selectedLines,
                    reason: reasonText
                });
            }
            
            closeDenialReasonModal();
            // After partial denial reason, show coverage summary
            if (currentSelectElement) {
                showCoverageSummary(currentSelectElement);
            }
        }
    });
    
    // Close modal listeners
    modalCloses.forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal === partialCoverageModal) {
                closePartialCoverageModal();
            } else if (modal === denialReasonModal) {
                closeDenialReasonModal();
            } else if (modal === patientRespModal) {
                closePatientRespModal();
            } else if (modal === coverageSummaryModal) {
                closeCoverageSummaryModal();
            }
        });
    });
    
    // Close modal on overlay click
    [partialCoverageModal, denialReasonModal].forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                if (this === partialCoverageModal) {
                    closePartialCoverageModal();
                } else {
                    closeDenialReasonModal();
                }
            }
        });
    });
    
    // ===== REDUCTION (legacy inline) removed in favor of coverage summary modal =====

    function openPatientRespModal() {
        patientRespModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        confirmPatientRespBtn.disabled = true;
    }
    function closePatientRespModal() {
        patientRespModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    patientRespInput.addEventListener('input', function() {
        const val = parseFloat(this.value);
        confirmPatientRespBtn.disabled = !(val >= 0);
    });

    confirmPatientRespBtn.addEventListener('click', function() {
        const val = parseFloat(patientRespInput.value || '');
        if (!(val >= 0) || !currentSelectElement) {
            showNotification('Enter a valid amount.', 'error');
            return;
        }
        const cell = currentSelectElement.closest('.reductions');
        const tag = cell.querySelector('.reduction-tag');
        const labelMap = { copay: 'Co-pay', deductible: 'Deductible', maximum: 'Maximum reached' };
        const label = labelMap[currentSelectElement.value] || 'Reduction';
        tag.textContent = `${label}: US$ ${val.toFixed(2)}`;
        tag.hidden = false;
        closePatientRespModal();
        showNotification(`Reduction applied: ${label} - US$ ${val.toFixed(2)}`, 'success');
    });

    // ===== COVERAGE SUMMARY =====
    function openCoverageSummaryModal() {
        coverageSummaryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeCoverageSummaryModal() {
        coverageSummaryModal.classList.remove('active');
        document.body.style.overflow = '';
        // Revert select to placeholder if user cancels
        if (coverageInProgressSelect && !coverageConfirmed) {
            coverageInProgressSelect.value = '';
        }
        coverageInProgressSelect = null;
        coverageConfirmed = false;
    }

    function parseMoney(text) {
        // Normalize currency text like "US$ 1.329,72" or "$1,329.72"
        let normalized = String(text).replace(/[^0-9,/.]/g, '');
        if (normalized.includes(',') && normalized.includes('.')) {
            normalized = normalized.replace(//./g, '').replace(',', '.');
        } else if (normalized.includes(',')) {
            normalized = normalized.replace(',', '.');
        }
        return parseFloat(normalized) || 0;
    }

    function formatUSD(num) {
        return `US$ ${Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Ensure two-decimal truncation display when required
    function truncate2(num) {
        const n = Number(num);
        if (!isFinite(n)) return 0;
        return Math.floor(n * 100) / 100;
    }
    function formatUSDTrunc(num) {
        const v = truncate2(num);
        return `US$ ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function showCoverageSummary(selectEl) {
        const row = selectEl.closest('.table-row');
        console.debug('[PR DEBUG] summary: start for rowId=', selectEl.getAttribute('data-row'), 'coverage value=', selectEl.value);
        // Reset reduction inputs every time a new row's summary is opened to avoid carryover
        const resetRedType = document.getElementById('summary-reduction-type');
        const resetRedAmount = document.getElementById('summary-reduction-amount');
        if (resetRedType) resetRedType.value = '';
        if (resetRedAmount) resetRedAmount.value = '';
        // Ensure breakdown is open for accurate, up-to-date totals
        const rowId = selectEl.getAttribute('data-row');
        if (rowId) {
            const details = document.querySelector(`.details-row[data-for="${rowId}"]`);
            if (details && details.hasAttribute('hidden')) {
                details.removeAttribute('hidden');
                const btn = document.querySelector(`.btn-expand[data-breakdown="${rowId}"]`);
                if (btn) btn.textContent = '–';
            }
            if (typeof recalcFromBreakdown === 'function') {
                recalcFromBreakdown(rowId);
            }
        }
        // If breakdown is present, use its totals for accurate Savings and Allowed
        let allowed = 0, savings = 0;
        const breakdown = document.querySelector(`.details-row[data-for="${selectEl.getAttribute('data-row')}"] .breakdown-table`);
        if (breakdown) {
            const rightCells = Array.from(breakdown.querySelectorAll('.breakdown-cell.right'));
            if (rightCells.length >= 3) {
                savings = parseMoney(rightCells[rightCells.length - 2].textContent);
                allowed = parseMoney(rightCells[rightCells.length - 1].textContent);
            }
        }
        // Fallback: derive from current row if breakdown not visible
        if (!(allowed > 0 || savings > 0)) {
            const payableText = row.querySelector('.payable-amount').textContent;
            const parts = payableText.match(/([0-9][0-9/.,]+)/g) || [];
            allowed = parts[0] ? parseMoney(parts[0]) : 0;
            const fees = parts[1] ? parseMoney(parts[1]) : 0;
            savings = fees > 0 ? (fees / 0.165) : 0;
        }
        const tpaFees = Math.floor(savings * 16.5) / 100; // two decimals truncation
        const invoiceTotal = allowed + savings;

        // Compute denied amount for partially denied scenario
        // Prefer a stable value persisted on the row at "Confirm Selection"
        let deniedFromSelected = 0;
        // Treat partial by either the select value or persisted dataset presence
        const persistedCandidate = row?.dataset?.deniedAmount;
        const treatAsPartial = (selectEl.value === 'partial') || (persistedCandidate && !isNaN(Number(persistedCandidate)));
        if (treatAsPartial) {
            const persisted = persistedCandidate;
            console.debug('[PR DEBUG] summary: read dataset.deniedAmount =', persisted, 'typeof=', typeof persisted);
            if (persisted && !isNaN(Number(persisted))) {
                deniedFromSelected = Number(persisted);
                console.debug('[PR DEBUG] summary: using persisted deniedFromSelected =', deniedFromSelected);
            } else if (Array.isArray(selectedLines) && selectedLines.length) {
                deniedFromSelected = selectedLines.reduce((sum, label) => {
                    const lastToken = String(label).match(/(?:US?/$)?/s?[0-9][0-9/.,]*$/)?.[0] || '0';
                    const val = parseMoney(lastToken);
                    console.debug('[PR DEBUG] summary: fallback parse label ->', label, 'val ->', val);
                    return sum + val;
                }, 0);
                console.debug('[PR DEBUG] summary: using fallback deniedFromSelected =', deniedFromSelected);
            } else {
                console.debug('[PR DEBUG] summary: no persisted or fallback selection found; deniedFromSelected=0');
            }
        }

        function computeTotalWithFees(patientResp) {
            return Math.max(allowed + tpaFees - (patientResp || 0), 0);
        }

        // Live/bindable summary rendering
        const redType = document.getElementById('summary-reduction-type');
        const redAmount = document.getElementById('summary-reduction-amount');
        const redInline = document.getElementById('summary-reduction-inline');
        const denialReason = document.getElementById('summary-denial-reason');

        // Adjust summary Savings to exclude denied line(s) savings in partial flow
        let savingsForSummary = savings;
        if (treatAsPartial && breakdown) {
            try {
                const cells = Array.from(breakdown.querySelectorAll('.breakdown-cell'));
                // Build set of denied CPTs from selectedLines labels: "CPT: Description - US$ Allowed"
                const deniedCpts = new Set();
                if (Array.isArray(selectedLines) && selectedLines.length) {
                    selectedLines.forEach(lbl => {
                        const match = String(lbl).match(/^/s*(/d+)/);
                        if (match) deniedCpts.add(match[1]);
                    });
                }
                let deniedSavingsSum = 0;
                for (let i = 0; i < cells.length; i += 5) {
                    const cptCell = cells[i];
                    const descCell = cells[i + 1];
                    const savingsCell = cells[i + 3];
                    // Stop at totals row
                    const cptEmpty = !cptCell || !cptCell.textContent.trim();
                    const isTotalLabel = descCell && descCell.textContent.trim().toUpperCase() === 'TOTAL';
                    if (cptEmpty && isTotalLabel) break;
                    const cptVal = cptCell?.textContent?.trim();
                    if (cptVal && deniedCpts.has(cptVal)) {
                        deniedSavingsSum += parseMoney(savingsCell?.textContent || '0');
                    }
                }
                const adjusted = truncate2(savings - deniedSavingsSum);
                savingsForSummary = adjusted >= 0 ? adjusted : 0;
                console.debug('[PR DEBUG] savings adjust: base=', savings, 'deniedSavingsSum=', deniedSavingsSum, 'adjusted=', savingsForSummary);
            } catch (e) {
                console.debug('[PR DEBUG] savings adjust: error computing denied savings', e);
            }
        }

        function renderSummary() {
            const reductionAmt = parseFloat(redAmount.value || '');
            const hasReduction = reductionAmt > 0;
            const isPartial = treatAsPartial;
            const patientRespCalc = isPartial ? (deniedFromSelected + (hasReduction ? reductionAmt : 0)) : (hasReduction ? reductionAmt : 0);
            console.debug('[PR DEBUG] renderSummary: allowed=', allowed, 'savings=', savings, 'tpaFees=', tpaFees, 'isPartial=', isPartial, 'deniedFromSelected=', deniedFromSelected, 'reductionAmt=', reductionAmt, 'patientRespCalc=', patientRespCalc);
            if (selectEl.value === 'none') {
                // Not covered: Patient’s Responsibility equals breakdown Allowed amount + reason dropdown
                if (redInline) redInline.style.display = 'none';
                coverageSummaryContent.innerHTML = `
                    <div class="label">Patient’s Responsibility</div><div class="value">${formatUSDTrunc(allowed)}</div>
                    <div class="label">Reason</div>
                    <div class="value">
                        <select id="summary-denial-reason" class="reduction-select" style="width: 220px;">
                            <option value="">Select a reason</option>
                            <option value="not_covered">Not a covered service</option>
                            <option value="exceed_benefit">Exceed maximum benefit</option>
                            <option value="pre_existing">Pre-existing</option>
                        </select>
                    </div>
                `;
                // disable confirm until reason selected
                const reasonSel = document.getElementById('summary-denial-reason');
                confirmCoverageSummaryBtn.disabled = true;
                reasonSel.addEventListener('change', () => {
                    confirmCoverageSummaryBtn.disabled = !reasonSel.value;
                });
            } else {
                if (redInline) redInline.style.display = '';
                const shouldShowPR = isPartial ? (deniedFromSelected > 0 || hasReduction) : hasReduction;
                if (!shouldShowPR && isPartial) {
                    console.debug('[PR DEBUG] renderSummary: PR row hidden because computed amount <= 0 in partial flow');
                }
                const prLine = shouldShowPR ? `
                    <div class="label">Patient’s Responsibility</div>
                    <div class="value">${formatUSDTrunc(patientRespCalc)}</div>
                    ${(isPartial && hasReduction) ? `<div class="subnote">${formatUSDTrunc(deniedFromSelected)} denied + ${formatUSDTrunc(reductionAmt)} reduction</div>` : ''}
                ` : '';
                coverageSummaryContent.innerHTML = `
                    <div class="label">Invoice total</div><div class="value">${formatUSD(invoiceTotal)}</div>
                    <div class="label">Savings</div><div class="value">${formatUSDTrunc(isPartial ? savingsForSummary : savings)}</div>
                    <div class="label">Allowed amount</div><div class="value">${formatUSDTrunc(allowed)}</div>
                    <div class="label">TPA fees</div><div class="value">${formatUSDTrunc(tpaFees)}</div>
                    ${prLine}
                    <div class="label">Total</div><div class="value">${formatUSDTrunc(computeTotalWithFees(patientRespCalc))}</div>
                `;
                console.debug('[PR DEBUG] renderSummary: total=', computeTotalWithFees(patientRespCalc));
                // Enable Confirm when coverage selected; for reduction amount entered, require type as well
                let enable = true;
                if (redType && redAmount) {
                    const amountEntered = redAmount.value !== '';
                    if (amountEntered && !redType.value) enable = false;
                }
                confirmCoverageSummaryBtn.disabled = !enable;
            }
        }

        // Ensure inputs start blank for each new selection
        if (redType) redType.value = '';
        if (redAmount) redAmount.value = '';
        renderSummary();
        if (redAmount) redAmount.addEventListener('input', renderSummary);
        if (redType) redType.addEventListener('change', renderSummary);
        coverageInProgressSelect = selectEl;
        coverageConfirmed = false;

        // Bind confirmation to set coverage tag
        confirmCoverageSummaryBtn.onclick = () => {
            const coverageValue = selectEl.value;
            if (coverageValue === 'full') {
                applyCoverageTag(selectEl, 'Covered', 'success');
            } else if (coverageValue === 'none') {
                applyCoverageTag(selectEl, 'Not Covered', 'error');
            } else if (coverageValue === 'partial') {
                applyCoverageTag(selectEl, 'Partially Denied', 'info');
            }
            // Apply optional reduction if provided
            if (coverageValue !== 'none' && redType && redType.value) {
                const amt = parseFloat(redAmount.value || '');
                if (amt >= 0) {
                    const coverageCell = row.querySelector('.coverage-decision');
                    const tag = coverageCell.querySelector('.reduction-tag');
                    const labelMap = { copay: 'Co-pay', deductible: 'Deductible', maximum: 'Maximum reached' };
                    const label = labelMap[redType.value] || 'Reduction';
                    tag.textContent = `${label}: US$ ${amt.toFixed(2)}`;
                    tag.hidden = false;
                }
            }
            // For no coverage: ensure a reason was chosen (enforced above), and set PR tag as invoice total
            if (coverageValue === 'none') {
                const reasonSel = document.getElementById('summary-denial-reason');
                const coverageCell = row.querySelector('.coverage-decision');
                const tag = coverageCell.querySelector('.reduction-tag');
                if (reasonSel && reasonSel.value) {
                    // Show reason text alongside
                    const reasonMap = { not_covered: 'Not a covered service', exceed_benefit: 'Exceed maximum benefit', pre_existing: 'Pre-existing' };
                    tag.textContent = `Patient's responsibility: ${formatUSD(invoiceTotal)} • ${reasonMap[reasonSel.value]}`;
                    tag.hidden = false;
                }
            }
            coverageConfirmed = true;
            closeCoverageSummaryModal();
            // Toast and remove row from pending
            const toast = document.getElementById('coverage-toast');
            if (toast) {
                toast.innerHTML = `<div class="title">Coverage decision saved</div><div class="desc">${selectEl.options[selectEl.selectedIndex].text}</div>`;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2500);
            }
            // Also collapse and remove matching breakdown row if present
            const rowId = selectEl.getAttribute('data-row');
            const detailsRow = rowId ? document.querySelector(`.details-row[data-for="${rowId}"]`) : null;
            if (detailsRow) {
                if (!detailsRow.hasAttribute('hidden')) {
                    const h = detailsRow.scrollHeight;
                    detailsRow.style.overflow = 'hidden';
                    detailsRow.style.maxHeight = h + 'px';
                    detailsRow.style.opacity = '1';
                    detailsRow.style.transition = 'max-height 0.35s ease, opacity 0.35s ease';
                    // Force reflow
                    void detailsRow.offsetHeight;
                    detailsRow.style.maxHeight = '0px';
                    detailsRow.style.opacity = '0';
                    setTimeout(() => detailsRow.remove(), 380);
                } else {
                    detailsRow.remove();
                }
            }
            // Animate out the main row and tween headbar counters in sync
            // Pre-compute target metrics excluding this row
            const rowIdForTween = selectEl.getAttribute('data-row');
            const { pendingLines: curPL, totalAmount: curTA, urgentCount: curUC } = computeSummaryMetrics(null);
            const { pendingLines: nextPL, totalAmount: nextTA, urgentCount: nextUC } = computeSummaryMetrics(rowIdForTween);
            const summaryCards = document.querySelectorAll('.summary-card');
            const pendingEl = summaryCards[0]?.querySelector('.card-number');
            const totalEl = summaryCards[1]?.querySelector('.card-number');
            const urgentEl = summaryCards[2]?.querySelector('.card-number');
            if (pendingEl) tweenNumber(pendingEl, curPL, nextPL, 420);
            if (totalEl) tweenNumber(totalEl, curTA, nextTA, 420, v => `US$ ${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            if (urgentEl) tweenNumber(urgentEl, curUC, nextUC, 420);

            row.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
            row.style.transform = 'translateX(-40px)';
            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();
                // Nudge remaining invoice rows up for a smooth reflow effect
                document.querySelectorAll('.table-row').forEach(r => {
                    r.classList.add('row-slide-up');
                    setTimeout(() => r.classList.remove('row-slide-up'), 260);
                });
                // Ensure final values are exact after removal
                updateSummaryCards();
            }, 380);
        };

        openCoverageSummaryModal();
    }
    
    // ===== SEARCH FUNCTIONALITY =====
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const rows = document.querySelectorAll('.table-row');
        
        rows.forEach(row => {
            const uhapId = row.querySelector('.uhap-id').textContent.toLowerCase();
            const caseNumber = row.querySelector('.case-number').textContent.toLowerCase();
            const patientName = row.querySelector('.patient-name').textContent.toLowerCase();
            const clientId = row.querySelector('.client-id').textContent.toLowerCase();
            
            if (uhapId.includes(searchTerm) || 
                caseNumber.includes(searchTerm) || 
                patientName.includes(searchTerm) || 
                clientId.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        if (searchTerm) {
            showNotification(`Searching for: "${searchTerm}"`, 'info');
        }
        
        updateSummaryCards();
    }
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // ===== FILTER FUNCTIONALITY REMOVED (dropdowns deleted) =====
    
    // ===== SUMMARY HELPERS & UPDATE =====
    function countBreakdownLines(detailsRow) {
        if (!detailsRow) return 0;
        const table = detailsRow.querySelector('.breakdown-table');
        if (!table) return 0;
        const cells = Array.from(table.querySelectorAll('.breakdown-cell'));
        let lines = 0;
        for (let i = 0; i < cells.length; i += 5) {
            const cptCell = cells[i];
            const descCell = cells[i + 1];
            const cptEmpty = !cptCell || !cptCell.textContent.trim();
            const isTotalLabel = descCell && descCell.textContent.trim().toUpperCase() === 'TOTAL';
            if (cptEmpty && isTotalLabel) break;
            lines += 1;
        }
        return lines;
    }

    function computeSummaryMetrics(excludeRowId) {
        const visibleRows = document.querySelectorAll('.table-row:not([style*="display: none"])');
        let pendingLines = 0;
        let totalAmount = 0;
        let urgentCount = 0;
        visibleRows.forEach(row => {
            const sel = row.querySelector('.coverage-select');
            const rowId = sel ? sel.getAttribute('data-row') : null;
            if (excludeRowId && rowId === String(excludeRowId)) return;
            // Ensure row totals are freshly recalculated before reading
            if (rowId && typeof recalcFromBreakdown === 'function') {
                recalcFromBreakdown(rowId);
            }
            // Sum row total
            const totalCell = row.querySelector('.total-amount');
            if (totalCell) {
                totalAmount += parseMoney(totalCell.textContent);
            }
            // Count one per visible invoice to avoid triplication from breakdown DOM
            pendingLines += 1;
            // Urgent: days > 15
            const daysCount = parseInt(row.querySelector('.days-count').textContent) || 0;
            if (daysCount > 30) urgentCount++;
        });
        return { pendingLines, totalAmount, urgentCount };
    }

    function updateSummaryCards() {
        const { pendingLines, totalAmount, urgentCount } = computeSummaryMetrics(null);
        const summaryCards = document.querySelectorAll('.summary-card');
        if (summaryCards[0]) {
            summaryCards[0].querySelector('.card-number').textContent = String(pendingLines);
        }
        if (summaryCards[1]) {
            summaryCards[1].querySelector('.card-number').textContent = formatUSDTrunc(totalAmount);
        }
        if (summaryCards[2]) {
            summaryCards[2].querySelector('.card-number').textContent = String(urgentCount);
        }
    }

    function tweenNumber(el, fromVal, toVal, durationMs, formatter) {
        const start = performance.now();
        function frame(now) {
            const t = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - t, 3);
            const cur = fromVal + (toVal - fromVal) * eased;
            el.textContent = formatter ? formatter(cur) : String(Math.round(cur));
            if (t < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }
    
    // ===== KEYBOARD SHORTCUTS =====
    document.addEventListener('keydown', function(e) {
        // Ctrl+F to focus search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Escape to close modals or clear search
        if (e.key === 'Escape') {
            if (partialCoverageModal.classList.contains('active')) {
                closePartialCoverageModal();
            } else if (denialReasonModal.classList.contains('active')) {
                closeDenialReasonModal();
            } else if (patientRespModal.classList.contains('active')) {
                closePatientRespModal();
            } else if (coverageSummaryModal.classList.contains('active')) {
                closeCoverageSummaryModal();
            } else {
                searchInput.value = '';
                performSearch();
                searchInput.blur();
            }
        }
    });
    
    // Initialize summary cards on load
    updateSummaryCards();

    // ===== BREAKDOWN TOGGLE =====
    document.querySelectorAll('.btn-expand').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-breakdown');
            const row = document.querySelector(`.details-row[data-for="${id}"]`);
            if (!row) return;
            const isHidden = row.hasAttribute('hidden');
            if (isHidden) {
                row.removeAttribute('hidden');
                this.textContent = '–';
                // Recalculate values from the visible breakdown
                recalcFromBreakdown(id);
            } else {
                row.setAttribute('hidden', '');
                this.textContent = '+';
            }
        });
    });

    // On load: for each row that has a breakdown, pre-calc the Payable/Fee from totals so they’re correct from the beginning
    document.querySelectorAll('.details-row').forEach(dr => {
        const id = dr.getAttribute('data-for');
        if (!id) return;
        // Temporarily unhide to read totals correctly if needed
        const wasHidden = dr.hasAttribute('hidden');
        if (wasHidden) dr.removeAttribute('hidden');
        recalcFromBreakdown(id);
        if (wasHidden) {
            dr.setAttribute('hidden', '');
            // Ensure the toggle button shows plus when collapsed
            const btn = document.querySelector(`.btn-expand[data-breakdown="${id}"]`);
            if (btn) btn.textContent = '+';
        }
    });

    function recalcFromBreakdown(id) {
        const detailsRow = document.querySelector(`.details-row[data-for="${id}"]`);
        if (!detailsRow) return;
        const table = detailsRow.querySelector('.breakdown-table');
        if (!table) return;
        const cells = Array.from(table.querySelectorAll('.breakdown-cell'));
        // Columns per row: CPT(0), Desc(1), Price(2), Savings(3), Allowed(4)
        let allowedSum = 0;
        let savingsSum = 0;
        for (let i = 0; i < cells.length; i += 5) {
            const cptCell = cells[i];
            const descCell = cells[i + 1];
            const savingsCell = cells[i + 3];
            const allowedCell = cells[i + 4];
            // Stop before totals row: totals row has empty CPT and desc 'TOTAL'
            const cptEmpty = !cptCell || !cptCell.textContent.trim();
            const isTotalLabel = descCell && descCell.textContent.trim().toUpperCase() === 'TOTAL';
            if (cptEmpty && isTotalLabel) {
                break;
            }
            if (savingsCell) savingsSum += parseMoney(savingsCell.textContent);
            if (allowedCell) allowedSum += parseMoney(allowedCell.textContent);
        }
        const fees = truncate2(savingsSum * 0.165);
        const allowedStr = formatUSDTrunc(allowedSum);
        const feesStr = formatUSDTrunc(fees);
        const totalStr = formatUSDTrunc(allowedSum + fees);

        // Update Payable / Fees cell
        const expandBtn = document.querySelector(`.btn-expand[data-breakdown="${id}"]`);
        if (!expandBtn) return;
        const payableCell = expandBtn.closest('.payable-amount');
        if (payableCell) {
            const isHidden = detailsRow.hasAttribute('hidden');
            const symbol = isHidden ? '+' : '–';
            payableCell.innerHTML = `${allowedStr}<br/>/ ${feesStr}
                <div class=/"payable-actions/"><button class=/"btn-expand/" aria-label=/"Show cost breakdown/" data-breakdown=/"${id}/">${symbol}</button></div>`;
            // rebind toggle for the newly injected button
            const newBtn = payableCell.querySelector('.btn-expand');
            newBtn.addEventListener('click', function() {
                const dr = document.querySelector(`.details-row[data-for="${id}"]`);
                if (!dr) return;
                const hidden = dr.hasAttribute('hidden');
                if (hidden) {
                    dr.removeAttribute('hidden');
                    this.textContent = '–';
                    recalcFromBreakdown(id);
                } else {
                    dr.setAttribute('hidden', '');
                    this.textContent = '+';
                }
            });
        }
        // Update Total cell in the row
        const totalCell = payableCell.parentElement.querySelector('.total-amount');
        if (totalCell) totalCell.textContent = totalStr;
    }
    
    console.log('🚀 Pending Approvals page loaded successfully!');
});