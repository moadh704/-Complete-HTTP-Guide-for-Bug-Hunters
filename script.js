// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const themeIcon = themeToggle.querySelector('i');

// Check for saved theme preference or default to dark
const currentTheme = localStorage.getItem('theme') || 'dark';
body.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
    } else {
        themeIcon.className = 'fas fa-moon';
    }
}

// Network animation for header
function createNetworkAnimation() {
    const container = document.getElementById('networkAnimation');
    const nodeCount = 15;
    const nodes = [];
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        const node = document.createElement('div');
        node.className = 'node';
        node.style.left = `${Math.random() * 100}%`;
        node.style.top = `${Math.random() * 100}%`;
        container.appendChild(node);
        nodes.push({
            element: node,
            x: parseFloat(node.style.left),
            y: parseFloat(node.style.top),
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2
        });
    }
    
    // Animation loop
    function animate() {
        nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;
            
            // Bounce off edges
            if (node.x < 0 || node.x > 100) node.vx *= -1;
            if (node.y < 0 || node.y > 100) node.vy *= -1;
            
            // Keep within bounds
            node.x = Math.max(0, Math.min(100, node.x));
            node.y = Math.max(0, Math.min(100, node.y));
            
            node.element.style.left = `${node.x}%`;
            node.element.style.top = `${node.y}%`;
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Tab functionality
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Show/hide request body based on method
const httpMethod = document.getElementById('http-method');

function toggleRequestBody() {
    const requestBodyContainer = document.getElementById('request-body-container');
    if (httpMethod.value === 'POST' || httpMethod.value === 'PUT' || httpMethod.value === 'PATCH') {
        requestBodyContainer.style.display = 'block';
    } else {
        requestBodyContainer.style.display = 'none';
    }
}

httpMethod.addEventListener('change', toggleRequestBody);

// Interactive demo
document.getElementById('send-request').addEventListener('click', async () => {
    const method = document.getElementById('http-method').value;
    const url = document.getElementById('request-url').value;
    const headersText = document.getElementById('request-headers').value;
    const bodyText = document.getElementById('request-body').value;
    const progressBar = document.getElementById('request-progress');
    
    // Validate URL
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    try {
        // Display request
        let requestDisplay = `${method} ${new URL(url).pathname} HTTP/1.1\nHost: ${new URL(url).host}\n`;
        
        let headers = {};
        if (headersText) {
            try {
                headers = JSON.parse(headersText);
                for (const [key, value] of Object.entries(headers)) {
                    requestDisplay += `${key}: ${value}\n`;
                }
            } catch (e) {
                document.getElementById('response-view').textContent = 'Error: Invalid headers JSON';
                return;
            }
        }
        
        if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && bodyText) {
            requestDisplay += `Content-Length: ${bodyText.length}\n`;
            requestDisplay += `\n${bodyText}`;
        }
        
        document.getElementById('request-view').textContent = requestDisplay;
        
        // Animate progress bar
        progressBar.style.width = '30%';
        
        // Send request and display response
        const options = {
            method: method,
            headers: headers
        };
        
        if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && bodyText) {
            options.body = bodyText;
        }
        
        progressBar.style.width = '60%';
        
        const response = await fetch(url, options);
        const responseText = await response.text();
        
        progressBar.style.width = '90%';
        
        let responseDisplay = `HTTP/1.1 ${response.status} ${response.statusText}\n`;
        
        response.headers.forEach((value, key) => {
            responseDisplay += `${key}: ${value}\n`;
        });
        
        responseDisplay += `\n${responseText}`;
        
        document.getElementById('response-view').textContent = responseDisplay;
        
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 1000);
        
        // Update request counter
        updateRequestCounter();
    } catch (error) {
        document.getElementById('response-view').textContent = `Error: ${error.message}`;
        progressBar.style.width = '0%';
    }
});

// Reset demo
document.getElementById('reset-demo').addEventListener('click', () => {
    document.getElementById('http-method').value = 'GET';
    document.getElementById('request-url').value = 'https://jsonplaceholder.typicode.com/posts/1';
    document.getElementById('request-headers').value = '';
    document.getElementById('request-body').value = '';
    document.getElementById('request-view').textContent = '';
    document.getElementById('response-view').textContent = '';
    document.getElementById('request-progress').style.width = '0%';
    toggleRequestBody();
});

// Copy code blocks
document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', () => {
        const codeBlock = button.parentElement.parentElement;
        const text = codeBlock.innerText.replace('Copy', '').trim();
        
        navigator.clipboard.writeText(text).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
});

// Vulnerability search
document.getElementById('search-btn').addEventListener('click', () => {
    const searchTerm = document.getElementById('vulnerability-search').value.toLowerCase();
    const items = document.querySelectorAll('.vulnerability-item');
    
    items.forEach(item => {
        const title = item.querySelector('.vulnerability-title').textContent.toLowerCase();
        const content = item.textContent.toLowerCase();
        
        if (title.includes(searchTerm) || content.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
});

// Enter key for search
document.getElementById('vulnerability-search').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('search-btn').click();
    }
});

// Quiz functionality
document.getElementById('check-quiz').addEventListener('click', () => {
    let score = 0;
    const totalQuestions = 3;
    
    // Check each question
    for (let i = 1; i <= totalQuestions; i++) {
        const options = document.querySelectorAll(`input[name="q${i}"]`);
        let selectedOption = null;
        
        options.forEach(option => {
            if (option.checked) {
                selectedOption = option.parentElement;
            }
        });
        
        const resultElement = document.getElementById(`q${i}-result`);
        
        if (selectedOption) {
            if (selectedOption.getAttribute('data-correct') === 'true') {
                selectedOption.classList.add('correct');
                resultElement.textContent = 'Correct!';
                resultElement.className = 'quiz-result correct';
                score++;
            } else {
                selectedOption.classList.add('incorrect');
                resultElement.textContent = 'Incorrect. Try again.';
                resultElement.className = 'quiz-result incorrect';
                
                // Highlight correct answer
                options.forEach(option => {
                    if (option.parentElement.getAttribute('data-correct') === 'true') {
                        option.parentElement.classList.add('correct');
                    }
                });
            }
        } else {
            resultElement.textContent = 'Please select an answer.';
            resultElement.className = 'quiz-result incorrect';
        }
    }
    
    // Show final score
    if (score === totalQuestions) {
        alert(`Perfect! You scored ${score}/${totalQuestions}. Great job!`);
    } else {
        alert(`You scored ${score}/${totalQuestions}. Keep learning!`);
    }
});

document.getElementById('reset-quiz').addEventListener('click', () => {
    // Reset all inputs and styles
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = false;
    });
    
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.classList.remove('correct', 'incorrect');
    });
    
    document.querySelectorAll('.quiz-result').forEach(result => {
        result.textContent = '';
        result.className = 'quiz-result';
    });
});

// Section navigation
document.querySelectorAll('.section-nav-item a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all items
        document.querySelectorAll('.section-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked item
        link.parentElement.classList.add('active');
        
        // Scroll to section
        const targetId = link.getAttribute('href').substring(1);
        document.getElementById(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Collapsible sections
document.querySelectorAll('.collapsible').forEach(collapsible => {
    collapsible.addEventListener('click', function() {
        this.classList.toggle('active-collapsible');
        const content = this.nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
});

// Request counter
let requestCount = 0;
function updateRequestCounter() {
    requestCount++;
    document.getElementById('requestsCount').textContent = requestCount;
}

// Initialize stats
function initializeStats() {
    document.getElementById('vulnerabilitiesCount').textContent = '12';
    document.getElementById('toolsCount').textContent = '15+';
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    createNetworkAnimation();
    toggleRequestBody();
    initializeStats();
    
    // Open first collapsible by default
    const firstCollapsible = document.querySelector('.collapsible');
    if (firstCollapsible) {
        firstCollapsible.classList.add('active-collapsible');
        const content = firstCollapsible.nextElementSibling;
        content.style.maxHeight = content.scrollHeight + "px";
    }
});

// Add intersection observer for section navigation highlighting
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.section-nav-item');

const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -80% 0px',
    threshold: 0
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.querySelector('a').getAttribute('href') === `#${id}`) {
                    item.classList.add('active');
                }
            });
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});
