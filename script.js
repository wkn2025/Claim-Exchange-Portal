// Euro Center Invoice Management Portal - Main JavaScript

// DOM Elements
const navbar = document.querySelector('.navbar');
const menuTrigger = document.querySelector('.app-menu-trigger');
const navDropdown = document.querySelector('.nav-dropdown');

// Navigation functionality
if (menuTrigger && navDropdown) {
    menuTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        const isExpanded = menuTrigger.getAttribute('aria-expanded') === 'true';
        menuTrigger.setAttribute('aria-expanded', !isExpanded);
        navDropdown.style.display = isExpanded ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!menuTrigger.contains(e.target) && !navDropdown.contains(e.target)) {
            menuTrigger.setAttribute('aria-expanded', 'false');
            navDropdown.style.display = 'none';
        }
    });
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    }
});

// Search functionality
const searchBtn = document.querySelector('.search-btn');
const searchInput = document.querySelector('.search-input');

if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            console.log('Searching for:', query);
            // Add search functionality here
        }
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
}

// Table row interactions
const tableRows = document.querySelectorAll('.table-row');
tableRows.forEach(row => {
    row.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-1px)';
    });
    
    row.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Euro Center Portal loaded successfully');
    
    // Add loading animation completion
    document.body.classList.add('loaded');
});

// Utility function for formatting currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Utility function for date formatting
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}