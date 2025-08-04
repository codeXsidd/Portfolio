
document.addEventListener('DOMContentLoaded', function() {
    
    // Navigation functionality
    function showSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update navbar active state
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Animate skill bars when skills section is shown
        if (sectionId === 'skills') {
            setTimeout(() => {
                const skillBars = document.querySelectorAll('.skill-progress');
                skillBars.forEach(bar => {
                    bar.style.width = '0%';
                    setTimeout(() => {
                        const percentMatch = bar.textContent.match(/\d+/);
                        if (percentMatch) {
                            bar.style.width = percentMatch[0] + '%';
                        }
                    }, 100);
                });
            }, 200);
        }
    }

    // Make showSection globally accessible
    window.showSection = showSection;

    // Typing animation
    const typingText = document.getElementById('typing-text');
    if (typingText) {
        const texts = ['Front End Developer', 'Problem Solver', 'Creative Thinker'];
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function typeWriter() {
            const currentText = texts[textIndex];
            
            if (isDeleting) {
                typingText.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typingText.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
            }
            
            if (!isDeleting && charIndex === currentText.length) {
                setTimeout(() => {
                    isDeleting = true;
                }, 2000);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
            }
            
            const typingSpeed = isDeleting ? 100 : 150;
            setTimeout(typeWriter, typingSpeed);
        }

        // Start typing animation
        typeWriter();
    }

    // Create floating particles
    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        
        if (particlesContainer) {
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 6 + 's';
                particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
                particlesContainer.appendChild(particle);
            }
        }
    }

    // Download resume function
    function downloadResume() {
        try {
            const link = document.createElement('a');
            link.href = '/asset/siddharth_resume.pdf'; // You would put actual PDF data here
            link.download = 'Siddharth_Resume.pdf';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            // Fallback for demonstration
            console.error('Resume download error:', error);
            alert('Resume download would start here. In a real implementation, you would link to an actual PDF file.');
        }
    }
    // Make downloadResume globally accessible
    window.downloadResume = downloadResume;

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initialize particles when page loads
    createParticles();

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(0, 0, 0, 0.9)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.1)';
            }
        }
    });

    //project section
     const projects = {
        todo: {
            title: "Responsive-ToDo-List",
            description: "A collaborative app with persist their daily tasks with a clean user interface and local storage support.",
            demoUrl: " https://responsive-to-do-list.vercel.app", 
            githubUrl: "https://github.com/codeXsidd/responsive-to-do-list",
            features: [
                "Add, edit, complete, and delete to-do items easily",
                "Real-time item feedback with alert messages",
                "Persistent data using localStorage support",
                "Clean and responsive Bootstrap-based UI",
                "Escape key cancels item editing instantly",
                "No signup or login — just open and make the Todo List"
                ]
        },
        quiz: {
            title: "Share-Quiz",
            description: "Share Quiz is a dynamic web app that lets users easily create, customize, and share interactive quizzes through a single link.",
            demoUrl: "https://share-quiz.vercel.app", 
            githubUrl: "https://github.com/codeXsidd/share-quiz",
            features: [
                "Create custom quizzes with multiple questions and answers",
                "Switch seamlessly between quiz editor and quiz taker modes",
                "Save and manage your quiz questions interactively",
                "Generate a unique shareable link to distribute your quiz",
                "Allow others to take your quiz directly from the shared link",
                "Instant scoring and personalized feedback after quiz completion",
                "Modern, responsive UI built with HTML, CSS, and JavaScript",
                "No signup or login — just open and use it"
            ]
        }, 
        notes: {
            title: "Notes Nests",
            description: "Effortless note-taking meets elegant design in your browser.",
            demoUrl: "https://notes-nests.vercel.app", 
            githubUrl: "https://github.com/codeXsidd/notes-nests",
            features: [
                "Instantly create unlimited sticky notes with one click",
                "Edit and save markdown-styled notes dynamically",
                "Easily switch between view and edit modes with a smart toggle",
                "All notes are stored in browser localStorage for persistence",
                "Responsive, clean UI built with HTML, CSS, and JavaScript",
                "Minimalistic, user-friendly design with markdown rendering support",
                "No signup or login — just open and start writing"
            ]
        }
    };

    function showDemo(projectKey) {
        const project = projects[projectKey];
        if (!project) return;

        // Populate modal content
        document.getElementById('demoModalTitle').textContent = project.title;
        const demoContent = document.getElementById('demoContent');
        demoContent.innerHTML = `
            <p class="text-center mb-4">${project.description}</p>
            <h6>Key Features:</h6>
            <ul class="list-unstyled">
                ${project.features.map(f => `<li><i class="fas fa-check-circle text-success me-2"></i>${f}</li>`).join('')}
            </ul>`;

        // Set the 'Visit Project' button link
        document.getElementById('visitProjectBtn').onclick = () => window.open(project.demoUrl, '_blank');

        // Show the modal
        const demoModal = new bootstrap.Modal(document.getElementById('demoModal'));
        demoModal.show();
    }
    window.showDemo = showDemo;

    function openGitHub(projectKey) {
        const project = projects[projectKey];
        if (project && project.githubUrl) {
            window.open(project.githubUrl, '_blank');
        }
    }
    window.openGitHub = openGitHub;



   // Form submission success message
    /*const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission
            
            // This would normally be handled by Web3Forms
            setTimeout(() => {
                alert('Thank you for your message! I will get back to you soon.');
            }, 1000);
        });
    }*/
});