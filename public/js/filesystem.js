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
            avatar: '/assets/profile.jpg',
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
  MySQL (relational)
  SQLite

APIs & Protocols:
  REST APIs
  JSON
  HTTP / HTTPS`
        },
        'tools.txt': {
          type: 'file',
          render: 'plain',
          content: `TOOLS & PLATFORMS
──────────────────

Version Control:
  Git
  GitHub

Development:
  VS Code
  Node.js / npm
  Postman

Platforms:
  Vercel (deployment)
  GitHub Pages

Problem Solving:
  GeeksForGeeks  — 250+ problems
  SkillRack      — 1800+ problems
  LeetCode       — 200+ problems
  HackerRank     — 80+ problems`
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
            title: 'Responsive ToDo List',
            description: 'A responsive and user-friendly To-Do List application designed to help users manage their daily tasks efficiently. Features real-time feedback, local storage persistence, and a clean Bootstrap-based UI.',
            stack: ['HTML5', 'CSS3', 'JavaScript'],
            features: [
              'Add, edit, complete, and delete items',
              'Persistent data via localStorage',
              'Keyboard shortcuts (Escape to cancel)',
              'Real-time item feedback with alerts',
              'Clean and responsive UI'
            ],
            status: 'Completed',
            github: 'https://github.com/codeXsidd/responsive-to-do-list',
            demo: 'https://responsive-to-do-list.vercel.app'
          }
        },
        'project-02.txt': {
          type: 'file',
          render: 'project',
          content: {
            number: '02',
            title: 'Share Quiz',
            description: 'A dynamic web application that lets users create, customize, and share interactive quizzes through a single shareable link. Makes quiz creation intuitive and interactive.',
            stack: ['HTML5', 'CSS3', 'JavaScript'],
            features: [
              'Create custom quizzes with multiple questions',
              'Switch between editor and taker modes',
              'Generate unique shareable links',
              'Instant scoring and feedback',
              'No signup required'
            ],
            status: 'Completed',
            github: 'https://github.com/codeXsidd/share-quiz',
            demo: 'https://share-quiz.vercel.app'
          }
        },
        'project-03.txt': {
          type: 'file',
          render: 'project',
          content: {
            number: '03',
            title: 'Notes Nests',
            description: 'A minimal, Markdown-enabled note-taking web app with autosave and local storage support. Perfect for nesting your ideas effortlessly.',
            stack: ['HTML5', 'CSS3', 'JavaScript'],
            features: [
              'Unlimited sticky notes',
              'Markdown rendering support',
              'Autosave with localStorage',
              'Smart view/edit mode toggle',
              'Minimalistic, distraction-free UI'
            ],
            status: 'Completed',
            github: 'https://github.com/codeXsidd/notes-nests',
            demo: 'https://notes-nests.vercel.app'
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

[PLACEHOLDER — No formal work experience yet]

Currently a student focusing on building
strong personal projects and competitive
programming skills.

Coding Profiles:
  GeeksForGeeks : 250+ problems solved
                  geeksforgeeks.org/user/siddharth2006
  SkillRack     : 1800+ problems solved
  LeetCode      : 200+ problems solved
                  leetcode.com/siddharth2912
  HackerRank    : 80+ problems solved
                  hackerrank.com/siddharth2006

─────────────────────────────────────
Open to internship opportunities.`
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
