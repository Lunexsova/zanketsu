document.addEventListener('DOMContentLoaded', () => {
    // Select inputs
    const activeMembersSlider = document.getElementById('activeMembers');
    const monthlyFeeSlider = document.getElementById('monthlyFee');
    const newMembersSlider = document.getElementById('newMembers');
    const churnedMembersSlider = document.getElementById('churnedMembers');
    const currencySelect = document.getElementById('currency');
    const simSlider = document.getElementById('simSlider');

    // Select output badges
    const activeMembersVal = document.getElementById('activeMembersVal');
    const monthlyFeeVal = document.getElementById('monthlyFeeVal');
    const newMembersVal = document.getElementById('newMembersVal');
    const churnedMembersVal = document.getElementById('churnedMembersVal');
    const simVal = document.getElementById('simVal');

    // Select results fields
    const prevChurnRate = document.getElementById('prevChurnRate');
    const prevLTV = document.getElementById('prevLTV');
    const prevMRR = document.getElementById('prevMRR');
    const prevAnnualRev = document.getElementById('prevAnnualRev');
    const prevAvgLifetime = document.getElementById('prevAvgLifetime');
    const prevNetGrowth = document.getElementById('prevNetGrowth');
    const prevSimSavings = document.getElementById('prevSimSavings');

    function calculate() {
        const activeMembers = parseInt(activeMembersSlider.value);
        const monthlyFee = parseFloat(monthlyFeeSlider.value);
        const newMembers = parseInt(newMembersSlider.value);
        const churnedMembers = parseInt(churnedMembersSlider.value);
        const currency = currencySelect.value;
        const simReduction = parseInt(simSlider.value);

        // Update badges
        activeMembersVal.textContent = activeMembers;
        monthlyFeeVal.textContent = `${monthlyFee} ${currency}`;
        newMembersVal.textContent = newMembers;
        churnedMembersVal.textContent = churnedMembers;
        simVal.textContent = `${simReduction}%`;

        // Churn Rate
        const churnRate = activeMembers > 0 ? (churnedMembers / activeMembers) * 100 : 0;
        prevChurnRate.textContent = `${churnRate.toFixed(2)}%`;

        // Color coding for Churn Rate
        if (churnRate > 8) {
            prevChurnRate.className = 'result-value result-value-crimson';
        } else if (churnRate > 4) {
            prevChurnRate.className = 'result-value result-value-gold';
        } else {
            prevChurnRate.className = 'result-value result-value-green';
        }

        // Average Lifetime in Months
        const avgLifetimeMonths = churnRate > 0 ? (100 / churnRate) : 0;
        prevAvgLifetime.textContent = avgLifetimeMonths > 0 ? `${avgLifetimeMonths.toFixed(1)} month` : '∞';

        // Member Lifetime Value (LTV)
        const ltv = avgLifetimeMonths * monthlyFee;
        prevLTV.textContent = `${ltv.toFixed(2)} ${currency}`;

        // Monthly Recurring Revenue (MRR)
        const mrr = activeMembers * monthlyFee;
        prevMRR.textContent = `${mrr.toFixed(0)} ${currency}`;

        // Annual Revenue
        const annualRev = mrr * 12;
        prevAnnualRev.textContent = `${annualRev.toFixed(0)} ${currency}`;

        // Net Growth
        const netGrowth = newMembers - churnedMembers;
        if (netGrowth > 0) {
            prevNetGrowth.textContent = `+${netGrowth} Member/month`;
            prevNetGrowth.className = 'result-value result-value-green';
        } else if (netGrowth < 0) {
            prevNetGrowth.textContent = `${netGrowth} Member/month`;
            prevNetGrowth.className = 'result-value result-value-crimson';
        } else {
            prevNetGrowth.textContent = `0 (stable)`;
            prevNetGrowth.className = 'result-value';
        }

        // Churn Savings Simulation
        // Savings = Churned members saved per year * monthly fee
        const savedMembersCount = (churnedMembers * (simReduction / 100)) * 12;
        const annualSavings = savedMembersCount * monthlyFee;
        prevSimSavings.textContent = `${annualSavings.toFixed(0)} ${currency}`;
    }

    // Attach event listeners
    [activeMembersSlider, monthlyFeeSlider, newMembersSlider, churnedMembersSlider, currencySelect, simSlider].forEach(el => {
        el.addEventListener('input', calculate);
    });

    // Initialize
    calculate();
});
