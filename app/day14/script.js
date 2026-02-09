document.addEventListener('DOMContentLoaded', () => {
    const birthdateInput = document.getElementById('birthdate');
    const calcBtn = document.getElementById('calcBtn');
    const resultContainer = document.getElementById('resultContainer');
    
    // Set max date to today
    const today = new Date();
    birthdateInput.max = today.toISOString().split('T')[0];

    // Defaults for demo
    // birthdateInput.value = "2000-01-01";

    calcBtn.addEventListener('click', calculate);

    function calculate() {
        const birthDateStr = birthdateInput.value;
        if (!birthDateStr) return;

        const birthDate = new Date(birthDateStr);
        const today = new Date();
        
        // Clear time portion for accurate day calculation
        birthDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (birthDate > today) {
            alert("未来の日付は選択できません");
            return;
        }

        // --- Age Calculation ---
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            // Get days in previous month
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += prevMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        // --- Total Days ---
        const diffTime = Math.abs(today - birthDate);
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // --- Next Birthday ---
        const currentYear = today.getFullYear();
        let nextBirthday = new Date(birthDate);
        nextBirthday.setFullYear(currentYear);

        if (nextBirthday < today) {
            nextBirthday.setFullYear(currentYear + 1);
        }

        const diffTimeBirthday = Math.abs(nextBirthday - today);
        const daysToBirthday = Math.ceil(diffTimeBirthday / (1000 * 60 * 60 * 24));

        // --- Milestone Calculation (e.g. next 10,000th day) ---
        // Find the next 10,000 multiplier
        const nextMilestoneDays = Math.ceil((totalDays + 1) / 10000) * 10000;
        const daysToMilestone = nextMilestoneDays - totalDays;
        
        const milestoneDate = new Date(today);
        milestoneDate.setDate(today.getDate() + daysToMilestone);


        // --- Update UI ---
        
        // Animate numbers
        animateValue("years", 0, years, 1000);
        animateValue("months", 0, months, 1000);
        animateValue("days", 0, days, 1000);
        animateValue("totalDays", 0, totalDays, 1500);
        
        document.getElementById('nextBirthdayDays').textContent = daysToBirthday;
        document.getElementById('nextBirthdayDate').textContent = formatDate(nextBirthday);

        document.getElementById('milestoneDaysTarget').textContent = nextMilestoneDays.toLocaleString();
        document.getElementById('milestoneDaysLeft').textContent = daysToMilestone.toLocaleString();
        document.getElementById('milestoneDate').textContent = formatDate(milestoneDate);

        // Show results
        resultContainer.classList.remove('hidden');
    }

    function animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        if (!obj) return;
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function formatDate(date) {
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate();
        const week = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        return `${y}年${m}月${d}日(${week})`;
    }
});
