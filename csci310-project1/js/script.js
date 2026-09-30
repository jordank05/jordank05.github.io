document.addEventListener("DOMContentLoaded", () => {
    
    // =========================================================
    // EFFECT 1: Dynamic Greeting & Real-Time Clock
    // =========================================================
    const greetingElement = document.getElementById("time-greeting");
    
    function updateClock() {
        const now = new Date();
        const hour = now.getHours();
        let greeting = "Welcome";
        
        if (hour < 12) {
            greeting = "Good Morning";
        } else if (hour < 18) {
            greeting = "Good Afternoon";
        } else {
            greeting = "Good Evening";
        }
        
        greetingElement.textContent = `${greeting}! Current Time: ${now.toLocaleTimeString()}`;
    }
    
    updateClock();
    setInterval(updateClock, 1000); // Live update every second

    // =========================================================
    // EFFECT 2: Dark/Light Mode Theme Toggle
    // =========================================================
    const themeBtn = document.getElementById("theme-toggle-btn");
    
    themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");
        
        if (document.body.classList.contains("dark-theme")) {
            themeBtn.textContent = "Toggle Light Mode";
        } else {
            themeBtn.textContent = "Toggle Dark Mode";
        }
    });

    // =========================================================
    // EFFECT 3: Dynamic Project Card Count Calculator
    // =========================================================
    const cards = document.querySelectorAll(".project-card");
    const counterElement = document.getElementById("project-counter");
    
    counterElement.textContent = `Projects Loaded: ${cards.length}`;

    // =========================================================
    // EFFECT 4: Card Hover Scale & Border Highlight Effect
    // =========================================================
    cards.forEach(card => {
        card.addEventListener("mouseenter", () => {
            card.style.transform = "scale(1.03)";
            card.style.borderColor = "#2563eb";
        });
        
        card.addEventListener("mouseleave", () => {
            card.style.transform = "scale(1.0)";
            card.style.borderColor = "#cbd5e1";
        });
    });

    // =========================================================
    // EFFECT 5: Interactive Card Modal Popup Viewer
    // =========================================================
    const modal = document.getElementById("project-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalDesc = document.getElementById("modal-desc");
    const closeModalBtn = document.getElementById("close-modal-btn");

    cards.forEach(card => {
        card.addEventListener("click", (event) => {
            event.preventDefault(); // Prevent navigating immediately
            
            const title = card.getAttribute("data-title");
            const desc = card.getAttribute("data-desc");
            
            modalTitle.textContent = title;
            modalDesc.textContent = desc;
            modal.classList.remove("hidden");
        });
    });

    closeModalBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    // Close modal when clicking outside content box
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.classList.add("hidden");
        }
    });
});