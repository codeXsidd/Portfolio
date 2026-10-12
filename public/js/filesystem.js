/**
 * filesystem.js — Virtual Filesystem for Siddharth's Portfolio
 *
 * EDIT THIS FILE to update your portfolio content.
 * All data is stored here. Structure: nested JS object.
 */

const FILESYSTEM = {
  type: 'dir',
  children: {

    /* ──────────────────── ABOUT ──────────────────── */
    about: {
      type: 'dir',
      children: {
        'profile.txt': {
          type: 'file',
          render: 'profile',
          content: {
            name: 'Siddharth S',
            avatar: '/assets/profile.webp',
            title: 'Developer  •  Student  •  Builder',
            bio: 'Currently learning, building, experimenting,\nand turning ideas into useful software.',
            location: 'Chennai, Tamil Nadu, India',
            email: 'siddharth291206@gmail.com',
            github: 'https://github.com/codeXsidd',
            linkedin: 'https://linkedin.com/in/siddharth2006',
            phone: '+91 9790350391',
            status: 'ONLINE'
          }
        },
        'education.txt': {
          type: 'file',
          render: 'plain',
          content: `EDUCATION
─────────

[PLACEHOLDER — Add your college/university here]

Degree    : B.Tech / BE / BSc — [Your Degree]
Major     : [Your Major, e.g. Computer Science]
Institute : [Your College Name]
Year      : [Expected Graduation Year]
CGPA      : [Your CGPA]

[PLACEHOLDER — Add your school here]

School    : [Your School Name]
Board     : [CBSE / State Board]
Year      : [Year of Completion]
Percentage: [Your %]

─────────────────────────────────────
Edit /about/education.txt to update.`
        },
        'goals.txt': {
          type: 'file',
          render: 'plain',
          content: `GOALS & INTERESTS
──────────────────

Short Term:
  → Build more full-stack projects
  → Contribute to open-source
  → Improve DSA & problem-solving skills

Long Term:
  → Build products that solve real-world problems
  → Work on scalable systems
  → Keep learning, keep shipping

Interests:
  → Web Development (Frontend + Backend)
  → Software Engineering
  → Problem Solving
  → Building developer tools

─────────────────────────────────────
Always building. Always learning.`
        }
      }
    },

    /* ──────────────────── SKILLS ──────────────────── */
    skills: {
      type: 'dir',
      children: {
        'programming.txt': {
          type: 'file',
          render: 'plain',
          content: `PROGRAMMING LANGUAGES
──────────────────────

  Python
  JavaScript (ES6+)
  Java
  C
  C++ (learning)
  SQL

─────────────────────────────────────
Comfortable with Python and JavaScript
for most day-to-day development tasks.`
        },
        'web-development.txt': {
          type: 'file',
          render: 'plain',
          content: `WEB DEVELOPMENT
─────────────────

Frontend:
  HTML5
  CSS3
  JavaScript (Vanilla)
  Bootstrap 5
  Responsive Design

Backend:
  Node.js
  Express.js

Databases:
  MySQL
  Supabase
  MongoDB

APIs & Protocols:
  REST APIs
  JSON
  HTTP / HTTPS`
        },
        'ai-datascience.txt': {
          type: 'file',
          render: 'plain',
          content: `AI & DATA SCIENCE
─────────────────

  Machine Learning
  Data Analysis
  NumPy
  Pandas
  Scikit-learn`
        },
        'hardware-iot.txt': {
          type: 'file',
          render: 'plain',
          content: `HARDWARE & IOT
──────────────

  ESP32
  Arduino
  Blynk IoT
  Sensor Integration`
        },
        'tools.txt': {
          type: 'file',
          render: 'plain',
          content: `TOOLS & CLOUD
─────────────

Version Control:
  Git
  GitHub

Cloud & Containers:
  Docker
  AWS

Development & Design:
  VS Code
  Postman
  Figma
  Node.js / npm

Platforms:
  Vercel
  GitHub Pages

Problem Solving & Profiles:
  GeeksforGeeks : 250+ problems solved
                  https://www.geeksforgeeks.org/user/siddharth2006
  SkillRack     : 1800+ problems solved
  LeetCode      : 200+ problems solved
                  https://leetcode.com/siddharth2912
  HackerRank    : 80+ problems solved
                  https://www.hackerrank.com/siddharth2006`
        },
        'coding-profiles.txt': {
          type: 'file',
          render: 'plain',
          content: `CODING PROFILES & PROBLEM SOLVING
─────────────────────────────────

• GeeksforGeeks : 250+ problems solved
  https://www.geeksforgeeks.org/user/siddharth2006

• SkillRack     : 1800+ problems solved

• LeetCode      : 200+ problems solved
  https://leetcode.com/siddharth2912

• HackerRank    : 80+ problems solved
  https://www.hackerrank.com/siddharth2006`
        },
        'learning.txt': {
          type: 'file',
          render: 'plain',
          content: `CURRENTLY LEARNING
───────────────────

  → Advanced JavaScript & ES2024
  → React.js
  → System Design basics
  → Data Structures & Algorithms
  → Cloud platforms (planned)

─────────────────────────────────────
"The best time to plant a tree was 20 years ago.
 The second best time is now."`
        }
      }
    },

    /* ──────────────────── PROJECTS ──────────────────── */
    projects: {
      type: 'dir',
      children: {
        'project-01.txt': {
          type: 'file',
          render: 'project',
          content: {
            number: '01',
            title: 'Studivexa',
            description: 'An AI-powered student productivity workspace that combines study planning, task management, habit tracking, academic analytics, and personalized AI learning assistance in one application.',
            stack: [
              'React',
              'Vite',
              'Tailwind CSS',
              'Node.js',
              'Express',
              'MongoDB',
              'Google Gemini AI',
              'JWT Authentication'
            ],
            features: [
              'AI-powered task breakdown and daily study planning',
              'AI tutor chat and AI-generated flashcards and quizzes',
              'Study planner, habit tracker, and focus timer',
              'GPA and CGPA tracking and analytics',
              'Gamified productivity with XP, levels, and streaks',
              'Study notes, journal, and learning roadmap'
            ],
            status: 'Completed',
            github: 'https://github.com/codeXsidd/Studivexa',
            demo: 'https://studivexa.vercel.app/'
          }
        },

        'project-02.txt': {
          type: 'file',
          render: 'project',
          content: {
            number: '02',
            title: 'StudyMate',
            description: 'An AI-powered study companion that transforms uploaded learning documents into interactive quizzes, personalized explanations, visual concept maps, and targeted revision guidance.',
            stack: [
              'HTML5',
              'CSS3',
              'JavaScript',
              'Python',
              'FastAPI',
              'Groq API',
              'Supabase',
              'Mermaid.js'
            ],
            features: [
              'Generate quizzes from uploaded study documents',
              'Feynman technique simulator for evaluating explanations',
              'Interactive concept mind maps using Mermaid.js',
              'Text-to-speech for questions and explanations',
              'Performance dashboard and weak-area tracking',
              'Personalized revision recommendations'
            ],
            status: 'Completed',
            github: 'https://github.com/codeXsidd/studymate',
            demo: 'https://studymate-beta-six.vercel.app'
          }
        },

        'project-03.txt': {
          type: 'file',
          render: 'project',
          content: {
            number: '03',
            title: 'Contract AI',
            description: 'An AI-powered legal contract analysis platform that helps users extract and analyze contract clauses, generate summaries, identify potential risks, compare documents, and interact with contract content.',
            stack: [
              'React',
              'TypeScript',
              'Tailwind CSS',
              'Python',
              'FastAPI',
              'Supabase',
              'Grok API',
              'FAISS',
              'spaCy',
              'PyMuPDF'
            ],
            features: [
              'Upload and parse PDF and DOCX contracts',
              'AI-powered contract summaries and clause extraction',
              'Risk analysis and red-flag identification',
              'Retrieval-augmented contract question-answering',
              'Compliance checklist support',
              'Contract negotiation assistance and report generation'
            ],
            status: 'In Progress',
            github: 'https://github.com/codeXsidd/Contract-AI',
            demo: ''
          }
        },

        'project-04.txt': {
          type: 'file',
          render: 'project',
          content: {
            number: '04',
            title: 'Share Quiz',
            description: 'A lightweight web application that allows users to create customized interactive quizzes and share them through a unique link, making quizzes easy to distribute and complete.',
            stack: [
              'HTML5',
              'CSS3',
              'JavaScript'
            ],
            features: [
              'Create quizzes with custom questions',
              'Switch between quiz editor and quiz taker modes',
              'Generate shareable quiz links',
              'Instant scoring and feedback',
              'Create and complete quizzes without signup'
            ],
            status: 'Completed',
            github: 'https://github.com/codeXsidd/share-quiz',
            demo: 'https://share-quiz.vercel.app'
          }
        }
      }
    },

    /* ──────────────────── EXPERIENCE ──────────────────── */
    experience: {
      type: 'dir',
      children: {
        'experience.txt': {
          type: 'file',
          render: 'plain',
          content: `EXPERIENCE
───────────

Web Development Intern
Big Bucks Innovation Pvt Ltd
Chennai, India | June 2025 – June 2025

• Developed responsive web applications using
  HTML5, CSS3, and JavaScript, improving
  usability and cross-browser compatibility.

• Built and tested dynamic user interfaces,
  supporting application debugging and
  deployment.

• Applied Git, GitHub, Agile, and SDLC practices
  for version control, collaboration, and
  software development.

─────────────────────────────────────
Open to software development and internship
opportunities.`
        }
      }
    },

    /* ──────────────────── CERTIFICATIONS ──────────────────── */
    certifications: {
      type: 'dir',
      children: {
        'certifications.txt': {
          type: 'file',
          render: 'plain',
          content: `CERTIFICATIONS
───────────────

[PLACEHOLDER — Add your certifications here]

Example format:

  Certificate  : Web Development Fundamentals
  Provider     : [Platform, e.g. Coursera, Udemy]
  Year         : [Year]
  Credential   : [Link if available]

─────────────────────────────────────
Edit /certifications/certifications.txt to update.`
        }
      }
    },

    /* ──────────────────── RESUME ──────────────────── */
    resume: {
      type: 'dir',
      children: {
        'resume.txt': {
          type: 'file',
          render: 'plain',
          content: `RESUME
───────

My resume is available as a PDF download.

Use the following command to open/download it:

  $ run resume

Or access it directly at:
  /assets/resume.pdf

─────────────────────────────────────
Siddharth S
Developer • Student • Builder
Email : siddharth291206@gmail.com
GitHub: github.com/codeXsidd`
        }
      }
    },

    /* ──────────────────── CONTACT ──────────────────── */
    contact: {
      type: 'dir',
      children: {
        'contact.txt': {
          type: 'file',
          render: 'contact-info',
          content: {
            email: 'siddharth291206@gmail.com',
            github: 'https://github.com/codeXsidd',
            linkedin: 'https://linkedin.com/in/siddharth2006',
            phone: '+91 9790350391',
            location: 'Chennai, Tamil Nadu, India',
            note: 'Open to collaboration, internships, and interesting projects.\nUse `run contact` to send a message directly.'
          }
        }
      }
    },

    /* ──────────────────── HIDDEN ──────────────────── */
    '.hidden': {
      type: 'dir',
      hidden: true,
      children: {
        'secret.txt': {
          type: 'file',
          render: 'easter-egg',
          content: {
            title: 'SECRET FOUND',
            lines: [
              'Curiosity detected ✓',
              '',
              'You found the hidden directory.',
              'That\'s exactly the kind of mindset',
              'that makes a great developer.',
              '',
              'There is always another level.',
              '',
              'Keep building.',
              'Keep learning.',
              'Keep exploring.',
              '',
              '— Siddharth'
            ]
          }
        }
      }
    }
  }
};

/**
 * Navigate the filesystem by path array.
 * Returns the node or null if not found.
 */
function fsNavigate(pathParts) {
  let node = FILESYSTEM;
  for (const part of pathParts) {
    if (!part || part === '') continue;
    if (!node.children || !node.children[part]) return null;
    node = node.children[part];
  }
  return node;
}

/**
 * List children of a dir node.
 * By default hides hidden dirs.
 */
function fsList(node, showHidden = false) {
  if (!node || node.type !== 'dir') return [];
  return Object.entries(node.children)
    .filter(([name]) => showHidden || !name.startsWith('.'))
    .map(([name, child]) => ({ name, type: child.type, hidden: child.hidden || false }));
}

/**
 * Get all paths in filesystem for find()
 */
function fsAllPaths(node = FILESYSTEM, prefix = '') {
  const results = [];
  if (!node.children) return results;
  for (const [name, child] of Object.entries(node.children)) {
    const fullPath = prefix ? `${prefix}/${name}` : name;
    results.push({ path: fullPath, type: child.type });
    if (child.type === 'dir') {
      results.push(...fsAllPaths(child, fullPath));
    }
  }
  return results;
}
