/**
 * commands.js — Command Implementations
 * Requires: filesystem.js, terminal.js
 */

/* ── Shared renderer helpers ──────────────────────────────────── */

function h(tag, cls, html) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html !== undefined) el.innerHTML = html;
  return el;
}

function span(cls, text) {
  const el = document.createElement('span');
  if (cls) el.className = cls;
  el.textContent = text;
  return el;
}

function renderPlain(text) {
  const pre = document.createElement('pre');
  pre.style.color = 'var(--text-1)';
  pre.style.fontSize = '12px';
  pre.style.lineHeight = '1.8';
  pre.textContent = text;
  return pre;
}

function renderProject(content) {
  const box = h('div', 'term-box');
  const hdr = h('div', 'term-box-header', `PROJECT ${content.number} — ${content.title.toUpperCase()}`);
  box.appendChild(hdr);
  const body = h('div', 'term-box-body');

  // Description
  const descRow = h('div', 'term-box-row');
  descRow.appendChild(h('div', 'term-box-key', 'DESCRIPTION'));
  descRow.appendChild(h('div', 'term-box-val', content.description));
  body.appendChild(descRow);
  body.appendChild(h('div', 'term-box-divider'));

  // Features
  if (content.features && content.features.length) {
    const featRow = h('div', 'term-box-row');
    featRow.appendChild(h('div', 'term-box-key', 'FEATURES'));
    const ul = h('div', 'term-box-val');
    ul.innerHTML = content.features.map(f => `<div style="color:var(--text-2);font-size:12px;padding:1px 0">→ ${f}</div>`).join('');
    featRow.appendChild(ul);
    body.appendChild(featRow);
    body.appendChild(h('div', 'term-box-divider'));
  }

  // Stack
  const stackRow = h('div', 'term-box-row');
  stackRow.appendChild(h('div', 'term-box-key', 'STACK'));
  const stack = h('div', 'tech-stack');
  content.stack.forEach(t => stack.appendChild(h('span', 'tech-badge', t)));
  stackRow.appendChild(stack);
  body.appendChild(stackRow);
  body.appendChild(h('div', 'term-box-divider'));

  // Status
  const statusRow = h('div', 'term-box-row');
  statusRow.appendChild(h('div', 'term-box-key', 'STATUS'));
  const st = h('div', 'term-status online', content.status);
  statusRow.appendChild(st);
  body.appendChild(statusRow);
  body.appendChild(h('div', 'term-box-divider'));

  // Links
  const linksRow = h('div', 'term-box-row');
  linksRow.appendChild(h('div', 'term-box-key', 'LINKS'));
  const actions = h('div', 'term-box-actions');
  if (content.github) {
    const a = document.createElement('a');
    a.className = 'term-link';
    a.href = content.github;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = '⌥ GitHub';
    actions.appendChild(a);
  }
  if (content.demo) {
    const a = document.createElement('a');
    a.className = 'term-link violet';
    a.href = content.demo;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = '↗ Live Demo';
    actions.appendChild(a);
  }
  linksRow.appendChild(actions);
  body.appendChild(linksRow);

  box.appendChild(body);
  return box;
}

function renderProfile(content) {
  const wrap = h('div', 'whoami-block');

  const info = h('div', 'whoami-info');

  const name = h('div', 'whoami-name', content.name);
  info.appendChild(name);

  const title = h('div', 'whoami-title', content.title);
  info.appendChild(title);

  const bio = h('div', 'whoami-bio');
  bio.style.marginTop = '8px';
  bio.innerHTML = content.bio.replace(/\n/g, '<br>');
  info.appendChild(bio);

  info.appendChild(h('div', 'term-box-divider', '').cloneNode());

  // Profile rows
  const fields = [
    ['Location', content.location],
    ['Email', content.email],
    ['GitHub', content.github],
    ['LinkedIn', content.linkedin],
    ['Phone', content.phone],
  ];

  const pSec = h('div', 'profile-section');
  pSec.style.marginTop = '12px';
  fields.forEach(([key, val]) => {
    const row = h('div', 'profile-row');
    row.appendChild(h('div', 'profile-key', key));
    if (val && (val.startsWith('http') || val.startsWith('mailto'))) {
      const a = document.createElement('a');
      a.href = val;
      a.target = '_blank';
      a.className = 'profile-val term-link';
      a.style.cssText = 'font-size:12px;padding:2px 8px;display:inline-block;';
      a.textContent = val;
      row.appendChild(a);
    } else {
      row.appendChild(h('div', 'profile-val', val || '—'));
    }
    pSec.appendChild(row);
  });
  info.appendChild(pSec);

  const statusEl = h('div', 'term-status online', `STATUS  ${content.status}`);
  statusEl.style.marginTop = '14px';
  info.appendChild(statusEl);

  wrap.appendChild(info);
  return wrap;
}

function renderContactInfo(content) {
  const box = h('div', 'term-box');
  box.appendChild(h('div', 'term-box-header', 'CONTACT'));
  const body = h('div', 'term-box-body');

  const fields = [
    ['Email', content.email, `mailto:${content.email}`],
    ['GitHub', content.github, content.github],
    ['LinkedIn', content.linkedin, content.linkedin],
    ['Phone', content.phone, null],
    ['Location', content.location, null],
  ];

  fields.forEach(([key, val, href]) => {
    const row = h('div', 'term-box-row');
    row.appendChild(h('div', 'term-box-key', key));
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.className = 'term-link';
      a.style.cssText = 'font-size:12px;padding:2px 10px;';
      a.textContent = val;
      row.appendChild(a);
    } else {
      row.appendChild(h('div', 'term-box-val', val || '—'));
    }
    body.appendChild(row);
  });

  body.appendChild(h('div', 'term-box-divider'));
  body.appendChild(h('div', '', `<span style="font-size:11px;color:var(--text-3);">${content.note.replace(/\n/g, '<br>')}</span>`));

  box.appendChild(body);
  return box;
}

function renderEasterEgg(content) {
  const box = h('div', 'easter-egg-box');
  box.appendChild(h('div', 'term-box-header', `✦ ${content.title}`));
  const body = h('div', 'term-box-body');
  content.lines.forEach(line => {
    const p = h('p', '', line || '&nbsp;');
    p.style.fontSize = '12px';
    p.style.color = line ? 'var(--text-1)' : '';
    body.appendChild(p);
  });
  box.appendChild(body);
  return box;
}

function renderFileNode(fileNode) {
  const r = fileNode.render;
  const c = fileNode.content;
  if (r === 'plain')        return renderPlain(c);
  if (r === 'project')      return renderProject(c);
  if (r === 'profile')      return renderProfile(c);
  if (r === 'contact-info') return renderContactInfo(c);

  if (r === 'easter-egg')   return renderEasterEgg(c);
  return renderPlain(typeof c === 'string' ? c : JSON.stringify(c, null, 2));
}

/* ── Command Implementations ─────────────────────────────────── */

const COMMANDS = {

  help(args, term) {
    const wrap = h('div', '');
    wrap.appendChild(h('div', 'c-dim', 'Available commands:\n').cloneNode());

    const table = h('div', 'help-table');
    const cmds = [
      ['help',          'Show available commands'],
      ['ls',            'List files and directories'],
      ['cd &lt;dir&gt;',       'Change directory'],
      ['cat &lt;file&gt;',     'Read a file'],
      ['pwd',           'Show current directory'],
      ['whoami',        'Show developer profile'],
      ['find &lt;query&gt;',   'Search the portfolio'],
      ['history',       'Show command history'],
      ['clear',         'Clear terminal (Ctrl+L)'],
      ['run &lt;action&gt;',   'Run portfolio action'],
      ['man &lt;command&gt;',  'Show command documentation'],
      ['exit',          'End terminal session'],
    ];
    cmds.forEach(([cmd, desc]) => {
      table.appendChild(h('span', 'help-cmd', cmd));
      table.appendChild(h('span', 'help-desc', desc));
    });
    wrap.appendChild(table);

    const kbd = h('div', '');
    kbd.style.marginTop = '14px';
    kbd.innerHTML = `<span class="c-dim" style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;">Keyboard</span>`;
    const kTable = h('div', 'help-table');
    kTable.style.marginTop = '6px';
    [['TAB', 'Autocomplete'], ['↑ / ↓', 'Navigate history'], ['Ctrl+L', 'Clear terminal']].forEach(([k, d]) => {
      kTable.appendChild(h('span', 'help-cmd', k));
      kTable.appendChild(h('span', 'help-desc', d));
    });
    kbd.appendChild(kTable);
    wrap.appendChild(kbd);

    const tip = h('div', 'banner info');
    tip.style.marginTop = '14px';
    tip.textContent = 'Tip: Type `run projects` for a quick overview, or `cd projects && ls` to explore.';
    wrap.appendChild(tip);

    return wrap;
  },

  ls(args, term) {
    const items = fsList(term.currentNode(), true);
    if (!items.length) {
      return h('div', 'c-dim', '(empty directory)');
    }
    const grid = h('div', 'ls-grid');
    items.forEach(item => {
      const el = h('div', `ls-item ${item.type}`);
      const perm = h('span', 'perm', item.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
      el.appendChild(perm);
      el.appendChild(document.createTextNode(item.type === 'dir' ? item.name + '/' : item.name));
      grid.appendChild(el);
    });
    return grid;
  },

  cd(args, term) {
    const target = args[0] || '';
    if (!target || target === '~') {
      term.setPath([]);
      return null;
    }
    if (target === '..') {
      if (term.path.length > 0) term.path.pop();
      term.updatePrompt();
      return null;
    }
    if (target === '/') {
      term.setPath([]);
      return null;
    }

    // Resolve path parts
    const parts = target.split('/').filter(Boolean);
    let testPath = [...term.path];
    for (const part of parts) {
      if (part === '..') {
        if (testPath.length > 0) testPath.pop();
        continue;
      }
      const node = fsNavigate([...testPath, part]);
      if (!node || node.type !== 'dir') {
        const err = h('div', 'c-error');
        err.textContent = `cd: ${target}: No such file or directory`;
        return err;
      }
      testPath.push(part);
    }
    term.setPath(testPath);
    return null;
  },

  cat(args, term) {
    if (!args[0]) {
      return h('div', 'c-error', 'cat: missing operand');
    }
    // Support path like "projects/project-01.txt"
    const parts = args[0].split('/').filter(Boolean);
    let searchPath = [...term.path];
    if (parts.length > 1) {
      // Path given relative to current
      searchPath = [...term.path, ...parts.slice(0, -1)];
    }
    const fileName = parts[parts.length - 1];

    const dirNode = fsNavigate(searchPath);
    if (!dirNode || !dirNode.children || !dirNode.children[fileName]) {
      // Try absolute
      const absNode = fsNavigate(parts);
      if (!absNode || absNode.type !== 'file') {
        const err = h('div', 'c-error');
        err.textContent = `cat: ${args[0]}: No such file or directory`;
        return err;
      }
      return renderFileNode(absNode);
    }
    const fileNode = dirNode.children[fileName];
    if (fileNode.type === 'dir') {
      return h('div', 'c-error', `cat: ${args[0]}: Is a directory`);
    }
    return renderFileNode(fileNode);
  },

  pwd(args, term) {
    const pathStr = '/home/siddharth' + (term.path.length ? '/' + term.path.join('/') : '');
    return h('div', 'c-cyan', pathStr);
  },

  whoami(args, term) {
    const profile = FILESYSTEM.children.about.children['profile.txt'];
    return renderProfile(profile.content);
  },

  clear(args, term) {
    term.clearOutput();
    return null;
  },

  history(args, term) {
    if (!term.history.length) {
      return h('div', 'c-dim', '(no history)');
    }
    const wrap = h('div', 'history-list');
    term.history.forEach((cmd, i) => {
      const row = h('div', 'history-entry');
      row.appendChild(h('span', 'history-num', String(i + 1)));
      row.appendChild(h('span', 'history-cmd', cmd));
      wrap.appendChild(row);
    });
    return wrap;
  },

  find(args, term) {
    if (!args[0]) {
      return h('div', 'c-error', 'find: missing search term');
    }
    const query = args.join(' ').toLowerCase();
    const allPaths = fsAllPaths();
    const matches = allPaths.filter(p => p.path.toLowerCase().includes(query));

    if (!matches.length) {
      return h('div', 'c-warning', `find: no matches for "${args[0]}"`);
    }

    const wrap = h('div', '');
    matches.forEach(m => {
      const el = h('div', 'find-result');
      const display = './' + m.path;
      const idx = display.toLowerCase().indexOf(query);
      if (idx !== -1) {
        el.appendChild(document.createTextNode(display.substring(0, idx)));
        el.appendChild(h('span', 'match', display.substring(idx, idx + query.length)));
        el.appendChild(document.createTextNode(display.substring(idx + query.length)));
      } else {
        el.textContent = display;
      }
      wrap.appendChild(el);
    });
    return wrap;
  },

  exit(args, term) {
    const el = h('div', 'banner warning');
    el.textContent = 'Session ended. Refresh the page to restart.';
    term.disable();
    return el;
  },

  man(args, term) {
    const cmd = args[0];
    const pages = {
      ls: {
        title: 'LS — LIST DIRECTORY',
        usage: 'ls',
        desc: 'Lists files and directories in the current location.\nDirectories are shown in cyan, files in neutral color.',
        examples: ['ls']
      },
      cd: {
        title: 'CD — CHANGE DIRECTORY',
        usage: 'cd <directory>',
        desc: 'Navigates into a directory.\nUse "cd .." to go up, "cd /" or "cd ~" for root.',
        examples: ['cd projects', 'cd ..', 'cd /']
      },
      cat: {
        title: 'CAT — READ FILE',
        usage: 'cat <file>',
        desc: 'Reads and displays the contents of a file.',
        examples: ['cat profile.txt', 'cat projects/project-01.txt']
      },
      find: {
        title: 'FIND — SEARCH PORTFOLIO',
        usage: 'find <query>',
        desc: 'Searches all files and directories in the virtual filesystem.',
        examples: ['find python', 'find project', 'find secret']
      },
      run: {
        title: 'RUN — PORTFOLIO SHORTCUTS',
        usage: 'run <action>',
        desc: 'Quick access to portfolio sections and external links.',
        examples: ['run projects', 'run resume', 'run github', 'run contact']
      },
      pwd: {
        title: 'PWD — PRINT WORKING DIRECTORY',
        usage: 'pwd',
        desc: 'Displays the current directory path.',
        examples: ['pwd']
      },
      whoami: {
        title: 'WHOAMI — DEVELOPER PROFILE',
        usage: 'whoami',
        desc: 'Displays the full developer profile.',
        examples: ['whoami']
      },
    };

    if (!cmd || !pages[cmd]) {
      const available = Object.keys(pages).join(', ');
      const err = h('div', '');
      err.innerHTML = `<span class="c-error">No manual entry for '${cmd || '?'}'</span><br><span class="c-dim" style="font-size:12px;">Available: ${available}</span>`;
      return err;
    }

    const p = pages[cmd];
    const wrap = h('div', 'man-page');
    wrap.innerHTML = `
      <div class="c-cyan bold" style="font-size:14px;margin-bottom:4px;">${p.title}</div>
      <div class="man-section">USAGE</div>
      <div class="man-code">${p.usage}</div>
      <div class="man-section">DESCRIPTION</div>
      <pre style="color:var(--text-2);font-size:12px;">${p.desc}</pre>
      <div class="man-section">EXAMPLES</div>
      ${p.examples.map(e => `<div class="man-code">$ ${e}</div>`).join('')}
    `;
    return wrap;
  },

  run(args, term) {
    const action = args[0]?.toLowerCase();
    const actionMap = {
      github: () => { window.open('https://github.com/codeXsidd', '_blank'); return h('div', 'c-success', '→ Opening GitHub...'); },
      linkedin: () => { window.open('https://linkedin.com/in/siddharth2006', '_blank'); return h('div', 'c-success', '→ Opening LinkedIn...'); },
      resume: () => { window.open('/assets/resume.pdf', '_blank'); return h('div', 'c-success', '→ Opening resume PDF...'); },
      contact: () => { term.showContactForm(); return null; },
      about: () => COMMANDS.cat(['about/profile.txt'], term),
      projects: () => {
        const wrap = h('div', '');
        const heading = h('div', 'sec-heading', 'MY PROJECTS');
        wrap.appendChild(heading);
        const grid = h('div', 'run-grid');
        const projects = FILESYSTEM.children.projects.children;
        Object.entries(projects).forEach(([fname, node]) => {
          const c = node.content;
          const card = h('div', 'run-card');
          card.appendChild(h('div', 'run-card-title', `${c.number}. ${c.title}`));
          card.appendChild(h('div', 'run-card-desc', c.stack.join(' · ')));
          card.addEventListener('click', () => {
            term.executeCommand(`cat projects/${fname}`);
          });
          grid.appendChild(card);
        });
        wrap.appendChild(grid);
        const tip = h('div', 'c-dim');
        tip.style.cssText = 'font-size:11px;margin-top:10px;';
        tip.textContent = 'Click a card or `cat projects/project-01.txt` for full details.';
        wrap.appendChild(tip);
        return wrap;
      },
      skills: () => COMMANDS.cat(['skills/programming.txt'], term),
    };

    if (!action) {
      const wrap = h('div', '');
      wrap.innerHTML = `<span class="c-dim" style="font-size:11px;">Available actions:</span>
        <div class="help-table" style="margin-top:8px;">
          <span class="help-cmd">run about</span><span class="help-desc">Show developer profile</span>
          <span class="help-cmd">run projects</span><span class="help-desc">Projects overview</span>
          <span class="help-cmd">run skills</span><span class="help-desc">Skills summary</span>
          <span class="help-cmd">run resume</span><span class="help-desc">Open resume PDF</span>
          <span class="help-cmd">run contact</span><span class="help-desc">Send a message</span>
          <span class="help-cmd">run github</span><span class="help-desc">Open GitHub profile</span>
          <span class="help-cmd">run linkedin</span><span class="help-desc">Open LinkedIn profile</span>
        </div>`;
      return wrap;
    }

    if (actionMap[action]) return actionMap[action]();

    return h('div', 'c-error', `run: unknown action '${action}'. Type 'run' to see options.`);
  }
};

function executeCommand(input, term) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1).map(a => a.replace(/^"|"$/g, ''));

  // Ctrl+L alias
  if (cmd === 'clear') return COMMANDS.clear(args, term);

  if (COMMANDS[cmd]) {
    return COMMANDS[cmd](args, term);
  }

  const err = h('div', '');
  err.innerHTML = `<span class="c-error">command not found: ${cmd}</span><br><span class="c-dim" style="font-size:12px;">Type 'help' to see available commands.</span>`;
  return err;
}
