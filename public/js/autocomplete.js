/**
 * autocomplete.js — TAB Autocomplete Engine
 * Requires: filesystem.js, terminal.js
 */

function handleAutocomplete(term) {
  const input = term.inputEl.value;
  const parts  = input.trimStart().split(' ');
  const popup  = term.acPopup;
  if (!popup) return;

  // If only one token → complete command name
  if (parts.length <= 1) {
    const prefix = parts[0];
    const matches = ALL_COMMANDS.filter(c => c.startsWith(prefix));
    if (matches.length === 1) {
      term.inputEl.value = matches[0] + ' ';
      popup.classList.remove('visible');
    } else if (matches.length > 1) {
      _showPopup(popup, term, matches, prefix, (m) => {
        term.inputEl.value = m + ' ';
      });
    }
    return;
  }

  const cmd  = parts[0].toLowerCase();
  const last = parts[parts.length - 1];
  const pathParts = last.split('/');
  const filePrefix = pathParts.pop();
  const dirParts   = pathParts;

  // Resolve directory to look in
  let searchNode = term.currentNode();
  for (const p of dirParts) {
    if (!p) continue;
    const next = searchNode.children?.[p];
    if (!next || next.type !== 'dir') { popup.classList.remove('visible'); return; }
    searchNode = next;
  }

  if (!searchNode || !searchNode.children) { popup.classList.remove('visible'); return; }

  // Filter children
  const candidates = Object.entries(searchNode.children)
    .filter(([name]) => name.startsWith(filePrefix))
    .filter(([name, node]) => {
      if (cmd === 'cd') return node.type === 'dir';
      return true;
    });

  if (candidates.length === 0) {
    popup.classList.remove('visible');
    return;
  }

  if (candidates.length === 1) {
    const [name, node] = candidates[0];
    const suffix = node.type === 'dir' ? '/' : '';
    const prefix = dirParts.length ? dirParts.join('/') + '/' : '';
    parts[parts.length - 1] = prefix + name + suffix;
    term.inputEl.value = parts.join(' ') + (node.type === 'file' ? '' : '');
    popup.classList.remove('visible');
    return;
  }

  // Multiple matches → show popup
  const names = candidates.map(([n, node]) => n + (node.type === 'dir' ? '/' : ''));
  _showPopup(popup, term, names, filePrefix, (m) => {
    const prefix = dirParts.length ? dirParts.join('/') + '/' : '';
    parts[parts.length - 1] = prefix + m;
    term.inputEl.value = parts.join(' ');
  });
}

function _showPopup(popup, term, items, prefix, onSelect) {
  popup.innerHTML = '';
  items.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'ac-item';
    el.innerHTML = `<span class="ac-icon">${item.endsWith('/') ? '📁' : '📄'}</span><span>${item}</span>`;
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onSelect(item);
      popup.classList.remove('visible');
      term.focus();
    });
    popup.appendChild(el);
  });
  popup.classList.add('visible');
  term.focus();
}

const ALL_COMMANDS = [
  'help', 'ls', 'cd', 'cat', 'pwd', 'whoami',
  'clear', 'history', 'find', 'run', 'man', 'exit'
];
