(() => {
  'use strict';

  // Supabase browser client. Replace the key with the project's publishable
  // key from Supabase Dashboard → Project Settings → API.
  const SUPABASE_URL = 'https://zgqmuemkvrwztieybobg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__YD7w3B7cXUw3JNFpIc3Jw_07mXIZF8';
  const supabase = window.supabase?.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  // -----------------------------
  // Mobile navigation
  // -----------------------------
  const menuButton = $('#menu');
  const navigation = $('#siteNav');

  menuButton?.addEventListener('click', () => {
    const open = navigation.classList.toggle('mobileOpen');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  navigation?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navigation.classList.remove('mobileOpen');
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.setAttribute('aria-label', 'Open navigation');
    });
  });

  // -----------------------------
  // Merit badge search/filter
  // -----------------------------
  const search = $('#search');
  const badges = $$('.badge');
  const filters = $$('.filter');
  const noBadges = $('#noBadges');
  let activeFilter = 'all';

  function updateBadges() {
    const query = (search?.value || '').trim().toLowerCase();
    let visible = 0;

    badges.forEach((badge) => {
      const matchesText = badge.textContent.toLowerCase().includes(query);
      const matchesFilter = activeFilter === 'all' || badge.dataset.cat === activeFilter;
      const show = matchesText && matchesFilter;
      badge.hidden = !show;
      if (show) visible += 1;
    });

    if (noBadges) noBadges.hidden = visible !== 0;
  }

  search?.addEventListener('input', updateBadges);
  filters.forEach((button) => {
    button.addEventListener('click', () => {
      filters.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      activeFilter = button.dataset.f || 'all';
      updateBadges();
    });
  });

  // -----------------------------
  // Calendar
  // -----------------------------
  const calendarEvents = {
    '2026-09-07': { title: 'Labor Day', type: 'holiday', time: 'All day', location: 'No troop meeting', description: 'National holiday.', start: '20260907', end: '20260908' },
    '2026-10-31': { title: 'Halloween', type: 'special', time: 'All day', location: '—', description: 'Special day.', start: '20261031', end: '20261101' },
    '2026-11-11': { title: 'Veterans Day', type: 'holiday', time: 'All day', location: 'No troop meeting', description: 'National holiday.', start: '20261111', end: '20261112' },
    '2026-11-26': { title: 'Thanksgiving Day', type: 'holiday', time: 'All day', location: 'No troop meeting', description: 'National holiday.', start: '20261126', end: '20261127' },
    '2026-12-25': { title: 'Christmas Day', type: 'holiday', time: 'All day', location: 'No troop meeting', description: 'National holiday.', start: '20261225', end: '20261226' },
  };

  function eventForKey(
    key,
    year = Number(key.slice(0, 4)),
    month = Number(key.slice(5, 7)) - 1,
    day = Number(key.slice(8, 10)),
  ) {
    if (calendarEvents[key]) return calendarEvents[key];

    // Troop meeting repeats every Monday from 7:30–8:30 PM.
    const date = new Date(year, month, day);
    if (date.getDay() === 1) {
      return {
        title: 'Troop meeting',
        type: 'meeting',
        time: '7:30–8:30 PM',
        location: 'Troop Hall',
        description: 'Weekly troop meeting.',
        start: `${key.replaceAll('-', '')}T193000`,
        end: `${key.replaceAll('-', '')}T203000`,
      };
    }

    return null;
  }

  const calendarTitle = $('#calendarTitle');
  const calendarDays = $('#calendarDays');
  let selectedEventKey = '2026-09-14';
  let calendarDate = new Date(2026, 8, 1);

  const pad = (number) => String(number).padStart(2, '0');
  const keyFor = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

  function renderCalendar() {
    if (!calendarDays || !calendarTitle) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayKey = keyFor(today.getFullYear(), today.getMonth(), today.getDate());

    calendarTitle.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarDate);
    calendarDays.innerHTML = '';

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      const cell = document.createElement('span');
      cell.className = 'mutedDay';
      cell.textContent = String(previousMonthDays - i);
      cell.setAttribute('aria-hidden', 'true');
      calendarDays.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = keyFor(year, month, day);
      const event = eventForKey(key, year, month, day);
      const cell = document.createElement(event ? 'button' : 'span');
      cell.className = event ? `event ${event.type}` : '';
      if (key === todayKey) cell.classList.add('today');
      cell.innerHTML = `<strong>${day}</strong>`;

      if (event) {
        const label = document.createElement('small');
        label.textContent = event.title;
        cell.appendChild(label);
        cell.title = event.title;
        cell.setAttribute('aria-label', `${day}: ${event.title}`);
        cell.type = 'button';
        cell.addEventListener('click', () => {
          selectedEventKey = key;
          showEventDetails(key, event);
        });
      } else {
        cell.setAttribute('aria-label', String(day));
      }

      calendarDays.appendChild(cell);
    }

    const totalCells = firstDay + daysInMonth;
    const trailing = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= trailing; day += 1) {
      const cell = document.createElement('span');
      cell.className = 'mutedDay';
      cell.textContent = String(day);
      cell.setAttribute('aria-hidden', 'true');
      calendarDays.appendChild(cell);
    }
  }

  function showEventDetails(key, event) {
    const modal = $('#eventDetailsModal');
    if (!modal) return;
    $('#eventDetailsTitle').textContent = event.title;
    $('#eventDetailsDate').textContent = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date(`${key}T12:00:00`));
    $('#eventDetailsTime').textContent = event.time;
    $('#eventDetailsLocation').textContent = event.location;
    $('#eventDetailsDescription').textContent = event.description;
    modal.classList.remove('hidden');
    $('#closeEventDetails')?.focus();
  }

  $('#prevMonth')?.addEventListener('click', () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
    renderCalendar();
  });

  $('#nextMonth')?.addEventListener('click', () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    renderCalendar();
  });

  // Creates an .ics file for the selected troop event.
  $('#addCalendar')?.addEventListener('click', () => {
    const key = selectedEventKey || Object.keys(calendarEvents)[0];
    const event = eventForKey(key);
    if (!event) return;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Troop 832//Calendar//EN',
      'BEGIN:VEVENT',
      `UID:troop832-${key}@troop832.org`,
      'DTSTAMP:20260922T120000Z',
      `DTSTART:${event.start}`,
      `DTEND:${event.end}`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.location}`,
      `DESCRIPTION:${event.description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `troop-832-${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  renderCalendar();

  $('#closeEventDetails')?.addEventListener('click', () => $('#eventDetailsModal')?.classList.add('hidden'));
  $('#eventDetailsModal')?.addEventListener('click', (event) => {
    if (event.target.id === 'eventDetailsModal') event.currentTarget.classList.add('hidden');
  });

  // -----------------------------
  // Demo login
  // -----------------------------
  const modal = $('#loginModal');
  const loginButton = $('#loginBtn');
  const closeModal = $('#closeModal');
  const signIn = $('#signIn');
  const showCreateAccount = $('#showCreateAccount');
  const createAccountPanel = $('#createAccountPanel');
  const createAccount = $('#createAccount');
  const authMessage = $('#authMessage');
  const greeting = $('#userGreeting');

  function openModal() {
    modal?.classList.remove('hidden');
    $('#email')?.focus();
  }

  function authUnavailable() {
    if (authMessage) authMessage.textContent = 'The secure sign-in service is unavailable. Please try again later.';
  }

  function closeLoginModal() {
    modal?.classList.add('hidden');
  }

  function setAuthSession(session) {
    if (loginButton) loginButton.textContent = session ? 'Sign out' : 'Log in';
    if (greeting && session?.user?.email) greeting.textContent = session.user.email;
  }

  loginButton?.addEventListener('click', async () => {
    if (!supabase) {
      openModal();
      authUnavailable();
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await supabase.auth.signOut();
      setAuthSession(null);
    } else {
      openModal();
    }
  });

  closeModal?.addEventListener('click', closeLoginModal);
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeLoginModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeLoginModal();
    $('#eventDetailsModal')?.classList.add('hidden');
  });

  signIn?.addEventListener('click', async () => {
    if (!supabase) {
      authUnavailable();
      return;
    }
    const email = $('#email')?.value.trim();
    const password = $('#password')?.value;

    if (!email || !password) {
      alert('Enter your email and password.');
      return;
    }

    signIn.disabled = true;
    signIn.textContent = 'Signing in…';
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    signIn.disabled = false;
    signIn.textContent = 'Sign in';

    if (error) {
      alert(error.message);
      return;
    }

    closeLoginModal();
    setAuthSession(data.session);
  });

  showCreateAccount?.addEventListener('click', async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      if (authMessage) authMessage.textContent = 'Sign in as an SPL or ASPL before creating an account.';
      return;
    }

    const { data: userRow, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.session.user.id)
      .single();

    if (error || !['spl', 'aspl'].includes(userRow?.role)) {
      if (authMessage) authMessage.textContent = 'Only SPL and ASPL accounts can create accounts.';
      return;
    }

    createAccountPanel.hidden = !createAccountPanel.hidden;
    if (authMessage) authMessage.textContent = '';
  });

  createAccount?.addEventListener('click', async () => {
    if (!supabase) {
      authUnavailable();
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;

    const { data: userRow } = await supabase.from('users').select('role').eq('id', data.session.user.id).single();
    if (!['spl', 'aspl'].includes(userRow?.role)) {
      if (authMessage) authMessage.textContent = 'Only SPL and ASPL accounts can create accounts.';
      return;
    }

    const newEmail = $('#newAccountEmail')?.value.trim();
    const newPassword = $('#newAccountPassword')?.value;
    const newRole = $('#newAccountRole')?.value || 'scout';
    if (!newEmail || !newPassword) {
      if (authMessage) authMessage.textContent = 'Enter an email and temporary password.';
      return;
    }

    createAccount.disabled = true;
    const { error } = await supabase.functions.invoke('create-account', {
      body: { email: newEmail, password: newPassword, role: newRole },
    });
    createAccount.disabled = false;
    if (authMessage) authMessage.textContent = error ? error.message : 'Account created. Check the email inbox if confirmation is required.';
  });

  if (supabase) {
    supabase.auth.getSession().then(({ data }) => setAuthSession(data.session));
    supabase.auth.onAuthStateChange((_event, session) => setAuthSession(session));
  }
})();
